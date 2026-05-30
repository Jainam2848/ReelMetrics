import { db } from "@/lib/db";
import { reels, reelScores, instagramAccounts, nicheTrendsFeed } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

import {
  calculateHeuristicScore,
  PostScoreSchema,
  computeTrendOverlapScore,
} from "@/lib/ai/scoring-engine";
import { buildScoringPrompt, extractTopTrendingSounds } from "@/lib/ai/prompt-builder";
import { callLLMWithFallback } from "@/lib/ai/llm-with-fallback";
import { isAnyLlmProviderConfigured } from "@/lib/ai/model-router";
import {
  checkUsageLimit,
  getUserPlanContext,
  incrementUsage,
} from "@/lib/billing/usage-tracker";
import type { ErrorCode } from "@/lib/api/response";
import type { z } from "zod";

type PostScore = z.infer<typeof PostScoreSchema>;

const CACHE_MS = 24 * 60 * 60 * 1000;
const FORCE_REFRESH_COOLDOWN_MS = 60 * 60 * 1000;

export class ScoringServiceError extends Error {
  constructor(
    public code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ScoringServiceError";
  }
}

export interface ScoreReelOptions {
  forceRefresh?: boolean;
}

export interface ScoreApiResponse {
  id?: string;
  reelId: string;
  overallScore: number;
  dimensions: PostScore["dimensions"];
  aiAnalysis: Record<string, unknown>;
  source: "ai" | "heuristic";
  scoredAt: Date;
  modelVersion?: string | null;
}

function readSource(aiAnalysis: Record<string, unknown> | null | undefined): "ai" | "heuristic" {
  const source = aiAnalysis?.source;
  return source === "ai" ? "ai" : "heuristic";
}

function toApiResponse(
  reelId: string,
  score: typeof reelScores.$inferSelect
): ScoreApiResponse {
  const aiAnalysis = (score.aiAnalysis ?? {}) as Record<string, unknown>;
  const dimensions = aiAnalysis.dimensions as PostScore["dimensions"] | undefined;

  return {
    id: score.id,
    reelId,
    overallScore: score.overallScore ?? 0,
    dimensions: dimensions ?? {
      hook: { score: score.hookScore ?? 0, reasoning: "", improvement: "" },
      retention_metric: { score: score.skipRateScore ?? 0, reasoning: "", improvement: "" },
      retention_proxy: { score: score.retentionScore ?? 0, reasoning: "", improvement: "" },
      cta: { score: score.ctaScore ?? 0, reasoning: "", improvement: "" },
      visual: { score: score.visualScore ?? 0, reasoning: "", improvement: "" },
      audio: { score: score.audioScore ?? 0, reasoning: "", improvement: "" },
      trend: { score: score.trendScore ?? 0, reasoning: "", improvement: "" },
      caption: { score: score.captionScore ?? 0, reasoning: "", improvement: "" },
      timing: { score: score.timingScore ?? 0, reasoning: "", improvement: "" },
    },
    aiAnalysis,
    source: readSource(aiAnalysis),
    scoredAt: score.scoredAt ?? score.createdAt,
    modelVersion: score.modelVersion,
  };
}

function generateMockScore(reelId: string): ScoreApiResponse {
  return {
    reelId,
    overallScore: 85,
    dimensions: {
      hook: { score: 90, reasoning: "Strong hook that immediately grabs attention.", improvement: "" },
      retention_metric: { score: 80, reasoning: "Above average retention.", improvement: "" },
      retention_proxy: { score: 85, reasoning: "Good visual pacing.", improvement: "" },
      cta: { score: 70, reasoning: "Call to action is slightly unclear.", improvement: "Make the CTA text larger or verbalize it." },
      visual: { score: 88, reasoning: "High quality visuals and lighting.", improvement: "" },
      audio: { score: 82, reasoning: "Clear audio mix.", improvement: "" },
      trend: { score: 95, reasoning: "Uses highly trending audio.", improvement: "" },
      caption: { score: 75, reasoning: "Caption lacks formatting.", improvement: "Use line breaks and emojis." },
      timing: { score: 80, reasoning: "Good overall duration.", improvement: "" },
    },
    aiAnalysis: {
      source: "heuristic",
      strengths: ["Strong hook"],
      opportunities: ["Clearer CTA"],
      oneLineSummary: "A solid performing post with room for a stronger CTA.",
      platformRetentionAnalysis: "Expected to hold 60% of viewers past 3 seconds.",
      viralityPotential: "High"
    },
    source: "heuristic",
    scoredAt: new Date(),
    modelVersion: "mock-v1"
  };
}

async function computeAccountBaselines(accountId: string) {
  const [row] = await db
    .select({
      avgEr: sql<number>`coalesce(avg(${reels.engagementRate}), 4.8)`,
      avgSkip: sql<number>`coalesce(avg(${reels.skipRate}), 50)`,
    })
    .from(reels)
    .where(eq(reels.accountId, accountId));

  return {
    avgEngagementRate: Number(row?.avgEr ?? 4.8),
    avgSkipRate: Number(row?.avgSkip ?? 50),
  };
}

async function persistScore(
  reelId: string,
  score: PostScore,
  meta: {
    source: "ai" | "heuristic";
    modelVersion: string;
    tokensUsed: number;
    costUsd: string;
  }
) {
  const aiAnalysis: Record<string, unknown> = {
    source: meta.source,
    dimensions: score.dimensions,
    strengths: [score.top_strength],
    weaknesses: [],
    opportunities: [score.biggest_opportunity],
    oneLineSummary: score.one_line_summary,
    platformRetentionAnalysis: score.platform_retention_analysis,
    viralityPotential: score.virality_potential,
    hook_checklist: score.hook_checklist,
    comment_sentiment: score.comment_sentiment,
    trend_overlap_details: score.trend_overlap_details,
  };

  const values = {
    overallScore: Math.round(score.overall_score),
    hookScore: score.dimensions.hook.score,
    skipRateScore: score.dimensions.retention_metric.score,
    retentionScore: score.dimensions.retention_proxy.score,
    ctaScore: score.dimensions.cta.score,
    visualScore: score.dimensions.visual.score,
    audioScore: score.dimensions.audio.score,
    trendScore: score.dimensions.trend.score,
    captionScore: score.dimensions.caption.score,
    timingScore: score.dimensions.timing.score,
    aiAnalysis,
    modelVersion: meta.modelVersion,
    tokensUsed: meta.tokensUsed,
    costUsd: meta.costUsd,
    scoredAt: new Date(),
  };

  const [existing] = await db
    .select({ id: reelScores.id })
    .from(reelScores)
    .where(eq(reelScores.reelId, reelId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(reelScores)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(reelScores.reelId, reelId))
      .returning();
    return updated;
  } else {
    const [inserted] = await db
      .insert(reelScores)
      .values({
        reelId,
        ...values,
      })
      .returning();
    return inserted;
  }
}

async function runScoringPipeline(
  userId: string,
  reel: typeof reels.$inferSelect,
  account: typeof instagramAccounts.$inferSelect,
  baselines: { avgEngagementRate: number; avgSkipRate: number }
): Promise<{ score: PostScore; source: "ai" | "heuristic"; modelVersion: string; tokensUsed: number; costUsd: string }> {
  const reelAnalysisCap = await checkUsageLimit(userId, "reel_analysis");
  const aiCallCap = await checkUsageLimit(userId, "ai_call");
  const canUseLlm =
    reelAnalysisCap.allowed &&
    aiCallCap.allowed &&
    isAnyLlmProviderConfigured();

  // Load trends feed once to be reused in both LLM and Heuristic branches
  let trendsFeedRecord: typeof nicheTrendsFeed.$inferSelect | null = null;
  try {
    const [row] = await db
      .select()
      .from(nicheTrendsFeed)
      .where(eq(nicheTrendsFeed.niche, account.niche || "tech"))
      .limit(1);
    if (row) {
      trendsFeedRecord = row;
    }
  } catch (err) {
    console.error("[scoring-service] Failed to fetch niche trends feed:", err);
  }

  if (canUseLlm) {
    const { modelTier } = await getUserPlanContext(userId);

    let nicheTrends: string | null = null;
    let trendingSounds: string | null = null;
    let trendOverlapHints: string | null = null;

    if (trendsFeedRecord) {
      nicheTrends = trendsFeedRecord.trendSignals;
      const trendingSoundsList = extractTopTrendingSounds(nicheTrends);
      if (trendingSoundsList.length > 0) {
        trendingSounds = trendingSoundsList.map((s, i) => `${i + 1}. ${s}`).join("\n");
      }
      if (trendsFeedRecord.semanticTags && trendsFeedRecord.semanticTags.length > 0) {
        const hintsList = computeTrendOverlapScore(reel.caption, trendsFeedRecord.semanticTags);
        if (hintsList.length > 0) {
          trendOverlapHints = hintsList.map(h => `- "${h.trend}" (Pre-computed overlap: ${h.score.toFixed(2)})`).join("\n");
        }
      }
    }

    const prompt = buildScoringPrompt({
      platform: "instagram",
      caption: reel.caption,
      timestamp: reel.timestamp,
      viewsCount: reel.viewsCount,
      totalViews: reel.totalViews,
      likesCount: reel.likesCount,
      commentsCount: reel.commentsCount,
      sharesCount: reel.sharesCount,
      savesCount: reel.savesCount,
      skipRate: reel.skipRate ? parseFloat(reel.skipRate.toString()) : null,
      publicReposts: reel.publicReposts,
      reach: reel.reach,
      username: account.username,
      followersCount: account.followersCount,
      avgEngagementRate: baselines.avgEngagementRate,
      avgSkipRate: baselines.avgSkipRate,
      visualMotion: true,
      textOverlaySeconds: 0.8,
      avgPacingCutInterval: 2.3,
      nicheTrends,
      trendingSounds,
      trendOverlapHints,
    });

    const fallbackResult = await callLLMWithFallback({
      operation: "scoring",
      modelTier,
      postedAt: reel.timestamp,
      prompt,
      outputSchema: PostScoreSchema,
    });

    if (fallbackResult.success) {
      await incrementUsage(userId, "reelsAnalyzed");
      await incrementUsage(userId, "aiCallsCount");
      await incrementUsage(userId, "aiTokensUsed", fallbackResult.tokensUsed);
      await incrementUsage(userId, "aiCostUsd", fallbackResult.costUsd);

      return {
        score: fallbackResult.data,
        source: "ai",
        modelVersion: fallbackResult.modelId,
        tokensUsed: fallbackResult.tokensUsed,
        costUsd: fallbackResult.costUsd.toFixed(6),
      };
    }
  }

  const heuristic = calculateHeuristicScore(
    "instagram",
    {
      views_count: reel.viewsCount || 0,
      likes_count: reel.likesCount || 0,
      comments_count: reel.commentsCount || 0,
      shares_count: reel.sharesCount || 0,
      saves_count: reel.savesCount || 0,
      skip_rate: reel.skipRate ? parseFloat(reel.skipRate.toString()) : undefined,
      posted_at: reel.timestamp,
      caption: reel.caption,
    },
    baselines.avgEngagementRate,
    account.followersCount,
    trendsFeedRecord ? [trendsFeedRecord] : undefined,
    account.niche || "tech"
  );

  return {
    score: heuristic,
    source: "heuristic",
    modelVersion: "heuristic-v1",
    tokensUsed: 0,
    costUsd: "0.000000",
  };
}

/**
 * Score a reel by database ID with SWR cache and optional force refresh.
 */
export async function scoreReel(
  userId: string,
  reelId: string,
  options: ScoreReelOptions = {}
): Promise<ScoreApiResponse> {
  if (reelId.startsWith("mock-")) {
    return generateMockScore(reelId);
  }

  const [reel] = await db.select().from(reels).where(eq(reels.id, reelId)).limit(1);
  if (!reel) {
    throw new ScoringServiceError("RESOURCE_NOT_FOUND", "Post not found");
  }

  const [account] = await db
    .select()
    .from(instagramAccounts)
    .where(and(eq(instagramAccounts.id, reel.accountId), eq(instagramAccounts.userId, userId)))
    .limit(1);

  if (!account) {
    throw new ScoringServiceError("FORBIDDEN", "Account access denied");
  }

  const [existing] = await db
    .select()
    .from(reelScores)
    .where(eq(reelScores.reelId, reelId))
    .limit(1);

  if (existing?.scoredAt && !options.forceRefresh) {
    const age = Date.now() - existing.scoredAt.getTime();
    if (age < CACHE_MS) {
      return toApiResponse(reelId, existing);
    }
  }

  if (options.forceRefresh && existing?.scoredAt) {
    const age = Date.now() - existing.scoredAt.getTime();
    if (age < FORCE_REFRESH_COOLDOWN_MS) {
      throw new ScoringServiceError(
        "SCORE_REFRESH_COOLDOWN",
        "Score was refreshed recently — try again in one hour"
      );
    }
  }

  const baselines = await computeAccountBaselines(reel.accountId);
  const result = await runScoringPipeline(userId, reel, account, baselines);
  const saved = await persistScore(reelId, result.score, {
    source: result.source,
    modelVersion: result.modelVersion,
    tokensUsed: result.tokensUsed,
    costUsd: result.costUsd,
  });

  return toApiResponse(reelId, saved!);
}

/**
 * Get cached score or compute on demand (GET route helper).
 */
export async function getReelScore(userId: string, reelId: string): Promise<ScoreApiResponse | null> {
  if (reelId.startsWith("mock-")) {
    return generateMockScore(reelId);
  }

  const [reel] = await db.select().from(reels).where(eq(reels.id, reelId)).limit(1);
  if (!reel) {
    throw new ScoringServiceError("RESOURCE_NOT_FOUND", "Post not found");
  }

  const [account] = await db
    .select({ id: instagramAccounts.id })
    .from(instagramAccounts)
    .where(and(eq(instagramAccounts.id, reel.accountId), eq(instagramAccounts.userId, userId)))
    .limit(1);

  if (!account) {
    throw new ScoringServiceError("FORBIDDEN", "Account access denied");
  }

  const [existing] = await db
    .select()
    .from(reelScores)
    .where(eq(reelScores.reelId, reelId))
    .limit(1);

  if (existing) {
    return toApiResponse(reelId, existing);
  }

  return null;
}

/**
 * Worker entry point — resolves reel by igMediaId then scores.
 */
export async function scoreReelByMediaId(
  userId: string,
  accountId: string,
  igMediaId: string
): Promise<ScoreApiResponse> {
  const [reel] = await db
    .select()
    .from(reels)
    .where(and(eq(reels.accountId, accountId), eq(reels.igMediaId, igMediaId)))
    .limit(1);

  if (!reel) {
    throw new ScoringServiceError("RESOURCE_NOT_FOUND", `Reel not found for media ID ${igMediaId}`);
  }

  return scoreReel(userId, reel.id);
}

/**
 * Pre-check for POST /score — returns false when both reel_analysis and ai_call caps are exhausted.
 */
export async function canEnqueueScoreJob(userId: string): Promise<boolean> {
  const reelCap = await checkUsageLimit(userId, "reel_analysis");
  const aiCap = await checkUsageLimit(userId, "ai_call");
  return reelCap.remaining > 0 || aiCap.remaining > 0;
}
