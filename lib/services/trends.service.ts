import { db } from "@/lib/db";
import { trendAnalyses, instagramAccounts, reels, nicheTrendsFeed, trendSignals } from "@/lib/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { generateTrendsAnalysis, getHeuristicTrendFallback } from "@/lib/ai/trend-generator";
import { checkUsageLimit, incrementUsage, getUserPlanContext } from "@/lib/billing/usage-tracker";
import { callLLMWithFallback } from "@/lib/ai/llm-with-fallback";
import { z } from "zod";
import { type ErrorCode } from "@/lib/api/response";
import { TrendIngestionSchema, type TrendIngestionOutput } from "@/lib/validators/trend-schema";

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
   * Daily Cron Ingestor: Refreshes the global trend_signals table using high-signal structured JSON.
   * Keeps operational FinOps costs extremely low. Runs a single call for all users once per day.
   */
  static async refreshGlobalTrendsFeed() {
    const niches = ["tech", "comedy", "finance", "education", "lifestyle", "fashion", "fitness"];
    const platform = "instagram";
    const sanitize = (name: string) => name
      .toLowerCase()
      .replace(/:/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80)
      .trim();
    const today = new Date().toISOString().slice(0, 10);

    for (const niche of niches) {
      let upsertResults: Array<{ status: 'inserted' | 'updated' | 'skipped' }> = [];
      let success = false;
      let trendData: TrendIngestionOutput | null = null;
      let modelId = "heuristic";

      try {
        // Estimated Cost per Daily Run (FinOps §12.2):
        // Input Prompt: ~1500 tokens (including detailed instructions)
        // Output JSON: ~500 tokens
        // Pricing under standard model tier (Gemini 2.5 Flash / 2.0 Flash fallback):
        // Input: 1.5 * $0.000075 = $0.0001125
        // Output: 0.5 * $0.00030 = $0.000150
        // Total Estimated Cost: ~$0.0002625 per niche per day
        const prompt = `You are a social media trend analyst. For Instagram Reels in the "${niche}" niche, identify the following based on the last 24 hours of platform activity:
- Top 5 surging hashtags with estimated reach and trend strength (1-100)
- Top 3 trending audio tracks (name, genre, estimated % lift in usage)
- 3 viral content formats with brief descriptions
- 2 emerging editing patterns (e.g., cut frequency, overlay timing)
- 3 hot topics within the niche (specific angles, not just general themes)
- A time-sensitivity score for each trend (hours until peak expected decay)

Return ONLY a valid JSON object matching this schema:
{
  "surging_hashtags": [{"tag": "string", "estimated_reach": 15000, "trend_strength": 85}],
  "trending_audios": [{"name": "audio name", "genre": "Synthwave", "surge_percentage": 120.5}],
  "viral_formats": [{"name": "POV format", "description": "POV of some situation", "example_accounts": ["@user1"]}],
  "editing_patterns": [{"description": "fast cuts every 1.8s", "effectiveness_score": 8}],
  "topic_surges": [{"topic": "LLC creation", "angle": "why freelancers need it", "estimated_engagement_lift": 3.2}],
  "time_sensitivity_hours": 36
}`;

        const response = await callLLMWithFallback({
          operation: "analysis",
          modelTier: "standard",
          prompt,
          outputSchema: TrendIngestionSchema,
          temperature: 0.3,
          maxTokens: 1500,
        });

        if (response.success) {
          trendData = response.data;
          modelId = response.modelId;
          success = true;
        } else {
          console.error(`[trends-service] LLM failed to return structured trends for niche ${niche}: ${response.error}. Triggering fallback.`);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[trends-service] Outage/Exception during trend ingestion for niche ${niche}: ${errorMsg}. Triggering fallback.`);
      }

      // --- SMART FALLBACK TRIGGER ---
      let isFallback = false;
      if (!success || !trendData) {
        try {
          const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
          const history = await db
            .select()
            .from(trendSignals)
            .where(
              and(
                eq(trendSignals.niche, niche),
                gte(trendSignals.createdAt, seventyTwoHoursAgo)
              )
            )
            .orderBy(desc(trendSignals.createdAt));

          if (history.length > 0) {
            isFallback = true;
            console.log(`[trends-service] Successfully retrieved ${history.length} recent trend signals from cache for fallback.`);
            
            // Map stale data to new signals for today
            const mappedSignals = history.map(h => {
              const uniqueName = h.dayKey.split(":")[3] || "stale-item";
              const type = h.signalType;
              const newDayKey = `${niche}:${platform}:${type}:${sanitize(uniqueName)}:${today}`;
              
              return {
                niche,
                platform,
                signalType: type,
                dayKey: newDayKey,
                signalData: {
                  ...h.signalData,
                  stale: true,
                },
                source: "fallback" as const,
              };
            });

            // Upsert fallback signals
            for (const sig of mappedSignals) {
              const [inserted] = await db
                .insert(trendSignals)
                .values({
                  niche: sig.niche,
                  platform: sig.platform,
                  signalType: sig.signalType,
                  dayKey: sig.dayKey,
                  signalData: sig.signalData,
                  source: sig.source,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                  target: trendSignals.dayKey,
                  set: {
                    signalData: sig.signalData,
                    updatedAt: new Date(),
                  },
                })
                .returning();
              
              upsertResults.push({ status: inserted ? 'inserted' : 'updated' });
            }
          } else {
            console.warn(`[trends-service] No historical trend signals found in the last 72 hours for niche ${niche}.`);
          }
        } catch (fallbackErr: unknown) {
          const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          console.error(`[trends-service] Fail-open: Fallback query failed for niche ${niche}:`, fbMsg);
        }
      }

      // --- PROCESS VALIDATED LLM RESULT ---
      if (success && trendData) {
        const timeSens = trendData.time_sensitivity_hours;
        const signalsToIngest: Array<{ type: string; name: string; data: any }> = [];

        // 1. Hashtags
        trendData.surging_hashtags.forEach(h => {
          signalsToIngest.push({
            type: "hashtag",
            name: h.tag,
            data: { tag: h.tag, estimated_reach: h.estimated_reach, trend_strength: h.trend_strength, time_sensitivity_hours: timeSens }
          });
        });

        // 2. Audios
        trendData.trending_audios.forEach(a => {
          signalsToIngest.push({
            type: "audio",
            name: a.name,
            data: { name: a.name, platform_id: a.platform_id || null, genre: a.genre, surge_percentage: a.surge_percentage, time_sensitivity_hours: timeSens }
          });
        });

        // 3. Formats
        trendData.viral_formats.forEach(f => {
          signalsToIngest.push({
            type: "format",
            name: f.name,
            data: { name: f.name, description: f.description, example_accounts: f.example_accounts || [], time_sensitivity_hours: timeSens }
          });
        });

        // 4. Editing Patterns
        trendData.editing_patterns.forEach(ep => {
          signalsToIngest.push({
            type: "editing_pattern",
            name: ep.description.slice(0, 40),
            data: { description: ep.description, effectiveness_score: ep.effectiveness_score, time_sensitivity_hours: timeSens }
          });
        });

        // 5. Topic Surges
        trendData.topic_surges.forEach(ts => {
          signalsToIngest.push({
            type: "topic",
            name: ts.topic,
            data: { topic: ts.topic, angle: ts.angle, estimated_engagement_lift: ts.estimated_engagement_lift, time_sensitivity_hours: timeSens }
          });
        });

        // Batch Upsert mapped items into trend_signals table
        for (const sig of signalsToIngest) {
          try {
            const dayKey = `${niche}:${platform}:${sig.type}:${sanitize(sig.name)}:${today}`;
            const [inserted] = await db
              .insert(trendSignals)
              .values({
                niche,
                platform,
                signalType: sig.type,
                dayKey,
                signalData: sig.data,
                source: "llm",
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: trendSignals.dayKey,
                set: {
                  signalData: sig.data,
                  updatedAt: new Date(),
                },
              })
              .returning();
            
            upsertResults.push({ status: inserted ? 'inserted' : 'updated' });
          } catch (insertErr) {
            console.error(`[trends-service] Failed to upsert signal ${sig.name} of type ${sig.type}:`, insertErr);
          }
        }
      }

      // --- BACKWARD COMPATIBILITY: POPULATE LEGACY TABLE ---
      try {
        let legacyText = "";
        if (trendData) {
          legacyText = [
            `-- HASHTAGS --\n` + trendData.surging_hashtags.map(h => `- #${h.tag} (Strength: ${h.trend_strength}/100)`).join("\n"),
            `-- AUDIOS --\n` + trendData.trending_audios.map(a => `- ${a.name} (Surge: +${a.surge_percentage}%)`).join("\n"),
            `-- FORMATS --\n` + trendData.viral_formats.map(f => `- ${f.name}: ${f.description}`).join("\n"),
          ].join("\n\n");
        } else {
          // If we had to fall back, fetch what we stored today or default to a heuristic message
          const todaysSignals = await db
            .select()
            .from(trendSignals)
            .where(
              and(
                eq(trendSignals.niche, niche),
                gte(trendSignals.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
              )
            );
          
          if (todaysSignals.length > 0) {
            legacyText = todaysSignals.map(s => `[${s.signalType.toUpperCase()}] ${s.dayKey.split(":")[3]} - stale`).join("\n");
          } else {
            const fallbackObj = getHeuristicTrendFallback(niche);
            legacyText = fallbackObj.trend_pillars.map(p => `[Trend] ${p.trend_name} - ${p.niche_relevance}`).join("\n");
          }
        }

        await db
          .insert(nicheTrendsFeed)
          .values({
            niche,
            trendSignals: legacyText,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: nicheTrendsFeed.niche,
            set: {
              trendSignals: legacyText,
              updatedAt: new Date(),
            },
          });
      } catch (legacyErr) {
        console.error(`[trends-service] Failed to sync backward compatibility for niche ${niche}:`, legacyErr);
      }

      // --- METRICS OBSERVABILITY LOGGING ---
      const total = upsertResults.length;
      const insertedCount = upsertResults.filter(r => r.status === 'inserted').length;
      const updatedCount = total - insertedCount;
      console.info(`[trends-service] Trend refresh complete:`, {
        niche,
        source: isFallback ? 'fallback' : 'llm',
        modelVersion: modelId,
        inserted: insertedCount,
        updated: updatedCount,
        total: total,
      });
    }
  }

  /**
   * Calculates the current decay-adjusted power score (0 to 1) for a trend signal.
   * Based on created_at and time_sensitivity_hours.
   */
  static getTrendPower(signal: { createdAt: Date; signalData: any }): number {
    const now = Date.now();
    const createdAtMs = new Date(signal.createdAt).getTime();
    const hoursSinceCreated = Math.max(0, (now - createdAtMs) / (1000 * 60 * 60));
    
    const signalData = (signal.signalData || {}) as Record<string, any>;
    const timeSensitivityHours = Number(signalData.time_sensitivity_hours ?? 24) || 24;
    
    const power = 1 - (hoursSinceCreated / timeSensitivityHours);
    return Math.max(0, parseFloat(power.toFixed(4)));
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
    const accountNiche = account.niche || "tech"; // default niche
    const accountGoal = account.goal || "audience retention"; // default goal

    const activeSignals = await db
      .select()
      .from(trendSignals)
      .where(eq(trendSignals.niche, accountNiche));

    const signalsWithPower = activeSignals.map(sig => ({
      ...sig,
      power: TrendService.getTrendPower(sig),
    }));

    // Filter out decayed signals (power = 0) and sort by power descending
    const validActiveSignals = signalsWithPower
      .filter(sig => sig.power > 0)
      .sort((a, b) => b.power - a.power);

    let ingestedTrendSignals = "";
    if (validActiveSignals.length > 0) {
      ingestedTrendSignals = validActiveSignals
        .map(sig => {
          const data = sig.signalData as Record<string, any>;
          let descText = "";
          if (sig.signalType === "hashtag") {
            descText = `#${data.tag} (Strength: ${data.trend_strength}/100, Reach: ${data.estimated_reach})`;
          } else if (sig.signalType === "audio") {
            descText = `Audio: "${data.name}" (${data.genre}, Surge: +${data.surge_percentage}%)`;
          } else if (sig.signalType === "format") {
            descText = `Format: "${data.name}" - ${data.description}`;
          } else if (sig.signalType === "editing_pattern") {
            descText = `Editing: ${data.description} (Effectiveness: ${data.effectiveness_score}/10)`;
          } else if (sig.signalType === "topic") {
            descText = `Topic: "${data.topic}" - Angle: "${data.angle}" (Lift: ${data.estimated_engagement_lift}x)`;
          }
          return `- [${sig.signalType.toUpperCase()}][Power: ${(sig.power * 100).toFixed(0)}%] ${descText}`;
        })
        .join("\n");
    } else {
      // Fallback if no structured active signals exist in the new table
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

  /**
   * Calculates a Content Momentum Score rolling signal by comparing the user's
   * average engagement rate, reach, and saves from the last 7 days vs the prior 7 days.
   * Outputs directional state (trending-up, stable, cooling-off), delta, averages, and
   * generates a one-line AI interpretation sentence utilizing callLLMWithFallback.
   */
  static async getContentMomentumScore(userId: string, accountId: string) {
    // 1. Verify account ownership
    const account = await db.query.instagramAccounts.findFirst({
      where: and(
        eq(instagramAccounts.id, accountId),
        eq(instagramAccounts.userId, userId)
      ),
    });

    if (!account) {
      throw new TrendServiceError("RESOURCE_NOT_FOUND", "Account not found or access denied.");
    }

    // 2. Fetch Reels in the last 14 days
    const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const userReels = await db.query.reels.findMany({
      where: and(
        eq(reels.accountId, accountId),
        gte(reels.timestamp, cutoffDate)
      ),
      orderBy: desc(reels.timestamp),
    });

    // 3. Filter into two 7-day windows
    const nowMs = Date.now();
    const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgoMs = nowMs - 14 * 24 * 60 * 60 * 1000;

    const last7DaysReels = userReels.filter(r => {
      const t = new Date(r.timestamp).getTime();
      return t >= sevenDaysAgoMs;
    });

    const prior7DaysReels = userReels.filter(r => {
      const t = new Date(r.timestamp).getTime();
      return t >= fourteenDaysAgoMs && t < sevenDaysAgoMs;
    });

    // 4. Calculate rolling averages
    const calculateAverages = (reelsList: typeof userReels) => {
      if (reelsList.length === 0) {
        return { avgEngagementRate: 0, avgReach: 0, avgSaves: 0 };
      }
      let sumER = 0;
      let sumReach = 0;
      let sumSaves = 0;

      for (const r of reelsList) {
        // Calculate engagement rate if null/0
        let er = parseFloat(r.engagementRate?.toString() || "0");
        const views = r.displayViews || r.viewsCount || 0;
        if (er === 0 && views > 0) {
          const totalInteractions = r.likesCount + r.commentsCount + r.sharesCount + r.savesCount;
          er = (totalInteractions / views) * 100;
        }
        sumER += er;
        sumReach += views;
        sumSaves += r.savesCount;
      }

      return {
        avgEngagementRate: sumER / reelsList.length,
        avgReach: sumReach / reelsList.length,
        avgSaves: sumSaves / reelsList.length,
      };
    };

    const currentAverages = calculateAverages(last7DaysReels);
    const priorAverages = calculateAverages(prior7DaysReels);

    // 5. Calculate percentage deltas
    const getPctChange = (last: number, prior: number): number => {
      if (prior === 0) return last > 0 ? 100 : 0;
      return ((last - prior) / prior) * 100;
    };

    const deltaER = getPctChange(currentAverages.avgEngagementRate, priorAverages.avgEngagementRate);
    const deltaReach = getPctChange(currentAverages.avgReach, priorAverages.avgReach);
    const deltaSaves = getPctChange(currentAverages.avgSaves, priorAverages.avgSaves);

    const compositeDelta = (deltaER + deltaReach + deltaSaves) / 3;

    // Determine state based on a 2% threshold
    let momentumState: "trending-up" | "stable" | "cooling-off" = "stable";
    if (compositeDelta > 2) {
      momentumState = "trending-up";
    } else if (compositeDelta < -2) {
      momentumState = "cooling-off";
    }

    // 6. Inline Heuristic Fallback Generator
    const getHeuristicInterpretation = (): string => {
      if (compositeDelta > 10) {
        if (deltaReach > deltaER && deltaReach > deltaSaves) {
          return "Reach is accelerating — your content is finding new audiences.";
        } else if (deltaER > deltaReach && deltaER > deltaSaves) {
          return "Engagement is surging — viewers are interacting highly with your reels.";
        }
        return "Saves and intent are building up — great work on building value!";
      } else if (compositeDelta < -10) {
        if (deltaReach < deltaER && deltaReach < deltaSaves) {
          return "Reach is cooling off — try experimenting with new hooks.";
        } else if (deltaER < deltaReach && deltaER < deltaSaves) {
          return "Engagement is dipping — focus on community interaction and questions.";
        }
        return "Saves are lagging behind views — refine your calls to action.";
      }
      return "Core metrics are holding steady — focus on consistency and schedule.";
    };

    // 7. Check budget and Call LLM
    let interpretation = "";
    let aiSource: "ai" | "heuristic" = "heuristic";
    let modelId = "heuristic";
    let tokensUsed = 0;
    let costUsd = 0;

    try {
      const limitCheck = await checkUsageLimit(userId, "ai_call");
      if (limitCheck.allowed) {
        const planContext = await getUserPlanContext(userId);
        
        const prompt = `You are a professional social media strategist. Analyze the creator's short-form video performance changes over the last 7 days compared to the prior 7 days.

Performance Comparison:
- Average Engagement Rate: ${currentAverages.avgEngagementRate.toFixed(2)}% (previously ${priorAverages.avgEngagementRate.toFixed(2)}%, delta: ${deltaER.toFixed(1)}%)
- Average Reach (Views): ${currentAverages.avgReach.toFixed(0)} (previously ${priorAverages.avgReach.toFixed(0)}, delta: ${deltaReach.toFixed(1)}%)
- Average Saves: ${currentAverages.avgSaves.toFixed(1)} (previously ${priorAverages.avgSaves.toFixed(1)}, delta: ${deltaSaves.toFixed(1)}%)

Momentum Analysis:
- Combined Momentum Delta: ${compositeDelta.toFixed(1)}%
- Classification: ${momentumState}

Based on this, write a single, punchy, concise, user-friendly interpretation sentence (maximum 12 words) analyzing this trend and advising the creator.
Focus on identifying which metric is driving the change or how to maintain momentum/recover.
Example: "Reach is accelerating — posting cadence is consistent." or "Saves are lagging behind views — refine your call to actions."
Provide the response as JSON matching the schema: { "interpretation": string }`;

        const response = await callLLMWithFallback({
          operation: "analysis",
          modelTier: planContext.modelTier,
          prompt,
          outputSchema: z.object({ interpretation: z.string() }),
          temperature: 0.3,
          maxTokens: 100,
        });

        if (response.success && response.data?.interpretation) {
          interpretation = response.data.interpretation;
          aiSource = "ai";
          modelId = response.modelId;
          tokensUsed = response.tokensUsed;
          costUsd = response.costUsd;

          // Increment usage atomically
          await incrementUsage(userId, "aiCallsCount", 1);
          if (tokensUsed > 0) {
            await incrementUsage(userId, "aiTokensUsed", tokensUsed);
          }
          if (costUsd > 0) {
            await incrementUsage(userId, "aiCostUsd", costUsd);
          }
        }
      }
    } catch (err) {
      console.error("[trends-service] Failed to generate AI momentum interpretation:", err);
    }

    if (!interpretation) {
      interpretation = getHeuristicInterpretation();
    }

    return {
      success: true,
      momentumState,
      compositeDelta: parseFloat(compositeDelta.toFixed(1)),
      interpretation,
      source: aiSource,
      modelId,
      currentAverages: {
        avgEngagementRate: parseFloat(currentAverages.avgEngagementRate.toFixed(2)),
        avgReach: parseFloat(currentAverages.avgReach.toFixed(0)),
        avgSaves: parseFloat(currentAverages.avgSaves.toFixed(1)),
      },
      priorAverages: {
        avgEngagementRate: parseFloat(priorAverages.avgEngagementRate.toFixed(2)),
        avgReach: parseFloat(priorAverages.avgReach.toFixed(0)),
        avgSaves: parseFloat(priorAverages.avgSaves.toFixed(1)),
      },
      deltas: {
        engagementRate: parseFloat(deltaER.toFixed(1)),
        reach: parseFloat(deltaReach.toFixed(1)),
        saves: parseFloat(deltaSaves.toFixed(1)),
      },
    };
  }
}
