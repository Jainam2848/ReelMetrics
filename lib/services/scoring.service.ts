import { db } from "@/lib/db";
import { reels, reelScores, instagramAccounts } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  calculateHeuristicScore,
  PostScoreSchema,
} from "@/lib/ai/scoring-engine";
import { buildScoringPrompt } from "@/lib/ai/prompt-builder";
import { callLLMPure } from "@/lib/ai/llm-client";
import { isAnyLlmProviderConfigured, selectModel } from "@/lib/ai/model-router";
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
  };

  const [saved] = await db
    .insert(reelScores)
    .values({
      reelId,
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
    })
    .onConflictDoUpdate({
      target: reelScores.reelId,
      set: {
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
        updatedAt: new Date(),
      },
    })
    .returning();

  return saved;
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

  if (canUseLlm) {
    const { modelTier } = await getUserPlanContext(userId);
    const model = selectModel("scoring", modelTier, reel.timestamp);

    if (model) {
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
      });

      const llmResult = await callLLMPure({
        prompt,
        outputSchema: PostScoreSchema,
        model: model.model,
      });

      if (llmResult.success) {
        await incrementUsage(userId, "reelsAnalyzed");
        await incrementUsage(userId, "aiCallsCount");
        await incrementUsage(userId, "aiTokensUsed", llmResult.tokensUsed);
        await incrementUsage(userId, "aiCostUsd", llmResult.costUsd);

        return {
          score: llmResult.data,
          source: "ai",
          modelVersion: llmResult.modelId,
          tokensUsed: llmResult.tokensUsed,
          costUsd: llmResult.costUsd.toFixed(6),
        };
      }
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
    },
    baselines.avgEngagementRate,
    account.followersCount
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
export async function getReelScore(userId: string, reelId: string): Promise<ScoreApiResponse> {
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

  return scoreReel(userId, reelId);
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
