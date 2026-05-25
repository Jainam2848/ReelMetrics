import { db } from "@/lib/db";
import { trendAnalyses, instagramAccounts, reels, nicheTrendsFeed } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateTrendsAnalysis, getHeuristicTrendFallback } from "@/lib/ai/trend-generator";
import { checkUsageLimit, incrementUsage, getUserPlanContext } from "@/lib/billing/usage-tracker";
import { selectModel } from "@/lib/ai/model-router";
import { callLLMPure } from "@/lib/ai/llm-client";
import { z } from "zod";
import { type ErrorCode } from "@/lib/api/response";

export class TrendServiceError extends Error {
  constructor(
    public code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = "TrendServiceError";
  }
}

export class TrendService {
  /**
   * Fetches latest cached Trend Analysis for an Instagram account.
   */
  static async getLatestAnalysis(userId: string, accountId: string) {
    const account = await db.query.instagramAccounts.findFirst({
      where: and(
        eq(instagramAccounts.id, accountId),
        eq(instagramAccounts.userId, userId)
      ),
    });

    if (!account) {
      throw new TrendServiceError("RESOURCE_NOT_FOUND", "Account not found or access denied.");
    }

    return await db.query.trendAnalyses.findFirst({
      where: and(
        eq(trendAnalyses.accountId, accountId),
        eq(trendAnalyses.userId, userId)
      ),
      orderBy: desc(trendAnalyses.generatedAt),
    });
  }

  /**
   * Daily Cron Ingestor: Refreshes the global niche trends feed table keeping costs extremely low.
   * Runs a single call for all users once per day to scout newest platform trends.
   */
  static async refreshGlobalTrendsFeed() {
    const niches = ["tech", "comedy", "finance", "education", "lifestyle", "fashion", "fitness"];
    const selection = selectModel("analysis", "standard");
    
    for (const niche of niches) {
      try {
        let trendSignals = "";
        
        if (selection) {
          // Query cheap model to fetch latest trends for this niche
          const prompt = `Identify top 3 surging hashtags, top 2 trending audio clips, and 1 viral content format on Instagram Reels for creators in the "${niche}" niche. Return them as a clean, brief bulleted list.`;
          
          const response = await callLLMPure({
            prompt,
            outputSchema: z.object({ trends: z.string() }),
            model: selection.model,
            temperature: 0.5,
            maxTokens: 500,
          });
          
          if (response.success) {
            trendSignals = response.data.trends;
          }
        }
        
        if (!trendSignals) {
          // Graceful fallback to rich structured mock trends
          const fallbackObj = getHeuristicTrendFallback(niche);
          trendSignals = fallbackObj.trend_pillars.map(p => `[Trend] ${p.trend_name} - ${p.niche_relevance}`).join("\n");
        }

        // UPSERT into niche_trends_feed
        await db
          .insert(nicheTrendsFeed)
          .values({
            niche,
            trendSignals,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: nicheTrendsFeed.niche,
            set: {
              trendSignals,
              updatedAt: new Date(),
            },
          });
      } catch (err: any) {
        console.error(`[trends-service] Failed to refresh trends feed for niche ${niche}:`, err.message);
      }
    }
  }

  /**
   * Generates a fresh AI Trend Analysis. Runs synchronous preflight checks, then triggers.
   */
  static async runAnalysis(userId: string, accountId: string) {
    // 1. Verify account exists and user owns it
    const account = await db.query.instagramAccounts.findFirst({
      where: and(
        eq(instagramAccounts.id, accountId),
        eq(instagramAccounts.userId, userId)
      ),
    });

    if (!account) {
      throw new TrendServiceError("RESOURCE_NOT_FOUND", "Connected account not found or access denied.");
    }

    // 2. Enforce credits and usage checks
    const limitCheck = await checkUsageLimit(userId, "ai_call");
    if (!limitCheck.allowed) {
      throw new TrendServiceError("AI_BUDGET_EXCEEDED", "AI daily/monthly budget limit reached. Please upgrade.");
    }

    // 3. Compile Creator Profile Stats from past Reels
    const userReels = await db.query.reels.findMany({
      where: eq(reels.accountId, accountId),
      orderBy: desc(reels.timestamp),
      limit: 10,
    });

    const avgEngagementRate = userReels.length > 0
      ? userReels.reduce((sum, r) => sum + parseFloat(r.engagementRate?.toString() || "0"), 0) / userReels.length
      : 4.5;

    const avgSkipRate = userReels.length > 0
      ? userReels.reduce((sum, r) => sum + parseFloat(r.skipRate?.toString() || "28"), 0) / userReels.length
      : 28.0;

    // 4. Ingest cached trend signals matching account's niche
    // Note: instagramAccounts has no niche/goal columns — we default sensibly.
    // A future migration can add these columns when per-account niche configuration is needed.
    const accountNiche = "tech"; // default niche; extend schema to store per-account niche later
    const accountGoal = "audience retention"; // default goal

    const trendsFeed = await db.query.nicheTrendsFeed.findFirst({
      where: eq(nicheTrendsFeed.niche, accountNiche),
    });

    let ingestedTrendSignals = trendsFeed?.trendSignals;
    if (!ingestedTrendSignals) {
      const fallbackObj = getHeuristicTrendFallback(accountNiche);
      ingestedTrendSignals = fallbackObj.trend_pillars.map(p => `[Trend] ${p.trend_name} - ${p.niche_relevance}`).join("\n");
    }

    // 5. Creator's recent content theme context
    const recentContentHistory = userReels.length > 0
      ? userReels.map((r, index) => `${index + 1}. Caption: "${r.caption?.substring(0, 80)}" | ER: ${r.engagementRate}% | Skip Rate: ${r.skipRate}%`).join("\n")
      : "No recent post history found. Seeding first trend run.";

    const planContext = await getUserPlanContext(userId);

    // 6. Invoke pure AI Trend generator
    const aiResult = await generateTrendsAnalysis({
      username: account.username,
      niche: accountNiche,
      goal: accountGoal,
      avgEngagementRate,
      avgSkipRate,
      avgCompletionRate: 30.0, // Default baseline for IG
      ingestedTrendSignals,
      recentContentHistory,
      modelTier: planContext.modelTier,
    });

    if (!aiResult.success) {
      throw new Error(aiResult.error || "Trend generation failure");
    }

    // 7. Increment credits usage atomically
    if (aiResult.source === "ai") {
      await incrementUsage(userId, "aiCallsCount", 1);
      if (aiResult.tokensUsed > 0) {
        await incrementUsage(userId, "aiTokensUsed", aiResult.tokensUsed);
      }
      if (aiResult.costUsd > 0) {
        await incrementUsage(userId, "aiCostUsd", aiResult.costUsd);
      }
    }

    // 8. Cache & Save trend analysis results to database
    const [savedRecord] = await db
      .insert(trendAnalyses)
      .values({
        userId,
        accountId,
        nicheTrendScore: aiResult.data.niche_trend_score,
        trendVerdict: aiResult.data.trend_verdict,
        trendPillars: aiResult.data.trend_pillars,
        soundRecommendations: aiResult.data.sound_recommendations,
        hookMutations: aiResult.data.hook_mutations,
        actionableBlueprints: aiResult.data.actionable_blueprints,
        modelVersion: aiResult.modelId,
        tokensUsed: aiResult.tokensUsed,
        costUsd: aiResult.costUsd.toString(),
        source: aiResult.source,
        generatedAt: new Date(),
      })
      .returning();

    return savedRecord;
  }
}
