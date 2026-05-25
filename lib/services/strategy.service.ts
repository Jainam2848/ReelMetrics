import { db } from "@/lib/db";
import { reels, reelScores, strategies, instagramAccounts } from "@/lib/db/schema";
import { eq, and, gte, desc, inArray } from "drizzle-orm";
import { buildStrategyPrompt } from "@/lib/ai/prompt-builder";
import { StrategyOutputSchema, type StrategyOutput } from "@/lib/ai/strategy-schema";
import { callLLMPure } from "@/lib/ai/llm-client";
import { isAnyLlmProviderConfigured, selectModel } from "@/lib/ai/model-router";
import { computeTimeDecayFactor } from "@/lib/ai/scoring-engine";
import {
  checkUsageLimit,
  getUserPlanContext,
  incrementUsage,
} from "@/lib/billing/usage-tracker";
import type { ErrorCode } from "@/lib/api/response";

export class StrategyServiceError extends Error {
  constructor(
    public code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = "StrategyServiceError";
  }
}

const DIMENSION_KEYS = [
  "hook",
  "retention_metric",
  "retention_proxy",
  "cta",
  "visual",
  "audio",
  "trend",
  "caption",
  "timing",
] as const;

function mapStrategyToContent(output: StrategyOutput, source: "ai" | "heuristic") {
  return {
    focus: output.content_pillars.map((p) => p.theme).join(", "),
    keyInsight: output.key_insight,
    postingCadence: output.content_calendar
      .map((c) => `${c.day} at ${c.time}`)
      .join("; "),
    tactics: output.content_pillars.map((p) => p.rationale),
    contentCalendar: output.content_calendar.map((c) => ({
      day: c.day,
      time: c.time,
      contentType: c.content_type,
      topic: c.topic,
      hookSuggestion: c.hook_suggestion,
      audio: c.audio_suggestion,
      estEngagement: c.estimated_engagement,
      captionDirection: c.caption_direction,
      hashtags: c.hashtags,
      reasoning: c.reasoning,
    })),
    summary: output.summary,
    source,
  };
}

function buildHeuristicStrategy(
  accountReels: Array<{
    caption: string | null;
    engagementRate: string | null;
    viewsCount: number;
    skipRate: string | null;
    timestamp: Date;
  }>,
  scores: Array<{
    hookScore: number | null;
    skipRateScore: number | null;
    retentionScore: number | null;
    ctaScore: number | null;
    visualScore: number | null;
    audioScore: number | null;
    trendScore: number | null;
    captionScore: number | null;
    timingScore: number | null;
  }>
): StrategyOutput {
  const sorted = [...accountReels].sort((a, b) => {
    const erA = a.engagementRate ? parseFloat(a.engagementRate) : 0;
    const erB = b.engagementRate ? parseFloat(b.engagementRate) : 0;
    return erB - erA;
  });

  const best = sorted[0];
  const worst = sorted[sorted.length - 1] ?? best;
  const avgEr =
    sorted.reduce((sum, r) => sum + (r.engagementRate ? parseFloat(r.engagementRate) : 0), 0) /
    Math.max(sorted.length, 1);

  const dimAvgs = DIMENSION_KEYS.map((key) => {
    const fieldMap: Record<(typeof DIMENSION_KEYS)[number], keyof (typeof scores)[0]> = {
      hook: "hookScore",
      retention_metric: "skipRateScore",
      retention_proxy: "retentionScore",
      cta: "ctaScore",
      visual: "visualScore",
      audio: "audioScore",
      trend: "trendScore",
      caption: "captionScore",
      timing: "timingScore",
    };
    const field = fieldMap[key];
    const values = scores.map((s) => s[field] ?? 0);
    const avg = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
    return { key, avg };
  });

  dimAvgs.sort((a, b) => b.avg - a.avg);
  const strongest = dimAvgs[0] ?? { key: "hook", avg: 5 };
  const weakest = dimAvgs[dimAvgs.length - 1] ?? { key: "hook", avg: 5 };

  return {
    summary: `Based on ${sorted.length} recent reels (avg ER ${avgEr.toFixed(1)}%), focus on ${strongest.key.replace("_", " ")} while improving ${weakest.key.replace("_", " ")}.`,
    key_insight: best
      ? `Your top reel (${(best.engagementRate ? parseFloat(best.engagementRate) : 0).toFixed(1)}% ER) outperformed the account average. Replicate its hook pattern and posting window.`
      : "Publish consistently for 2 weeks to unlock data-driven strategy recommendations.",
    content_pillars: [
      {
        theme: "High-performing formats",
        percentage: 50,
        rationale: `Double down on themes from your best reel: "${(best?.caption ?? "Educational tips").slice(0, 80)}..."`,
      },
      {
        theme: "Retention optimization",
        percentage: 30,
        rationale: `Improve ${weakest.key.replace("_", " ")} — currently your weakest dimension at ${weakest.avg.toFixed(1)}/10.`,
      },
      {
        theme: "Consistent cadence",
        percentage: 20,
        rationale: "Post 3x per week in your best-performing time windows.",
      },
    ],
    content_calendar: [
      {
        day: "Monday",
        time: "9:00 AM",
        content_type: "Educational Tip",
        topic: best?.caption?.slice(0, 60) || "Quick tip in your niche",
        hook_suggestion: "Open with a bold claim in the first second",
        caption_direction: "2-line caption + save CTA",
        audio_suggestion: "Trending niche audio",
        hashtags: ["#reels", "#tips"],
        estimated_engagement: "high",
        reasoning: "Mirrors your highest ER content pattern",
      },
      {
        day: "Wednesday",
        time: "12:00 PM",
        content_type: "How-To",
        topic: "Step-by-step walkthrough",
        hook_suggestion: "Show the end result first, then explain how",
        caption_direction: "Numbered steps in caption",
        audio_suggestion: "Upbeat instrumental",
        hashtags: ["#howto"],
        estimated_engagement: "medium",
        reasoning: "Mid-week educational content balances reach and saves",
      },
      {
        day: "Friday",
        time: "5:00 PM",
        content_type: "Behind-the-Scenes",
        topic: worst?.caption?.slice(0, 60) || "Personal story or BTS",
        hook_suggestion: "Start mid-action — no static intro",
        caption_direction: "Story-driven caption with question CTA",
        audio_suggestion: "Chill lo-fi",
        hashtags: ["#bts"],
        estimated_engagement: "medium",
        reasoning: "Reframe underperforming topics with stronger hooks",
      },
    ],
  };
}

async function loadAccountReelsWithScores(accountId: string, since: Date) {
  const accountReels = await db
    .select()
    .from(reels)
    .where(and(eq(reels.accountId, accountId), gte(reels.timestamp, since)))
    .orderBy(desc(reels.timestamp));

  if (accountReels.length === 0) {
    return { accountReels, scores: [] as typeof reelScores.$inferSelect[] };
  }

  const scores = await db
    .select()
    .from(reelScores)
    .where(inArray(reelScores.reelId, accountReels.map((r) => r.id)));

  return { accountReels, scores };
}

function aggregateForPrompt(
  accountReels: typeof reels.$inferSelect[],
  scores: typeof reelScores.$inferSelect[]
) {
  const ers = accountReels.map((r) =>
    r.engagementRate ? parseFloat(r.engagementRate) : 0
  );
  const avgEngagement = ers.reduce((a, b) => a + b, 0) / Math.max(ers.length, 1);
  const sorted = [...accountReels].sort(
    (a, b) =>
      (b.engagementRate ? parseFloat(b.engagementRate) : 0) -
      (a.engagementRate ? parseFloat(a.engagementRate) : 0)
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1] ?? best;

  const dimAvgs = DIMENSION_KEYS.map((key) => {
    const fieldMap: Record<(typeof DIMENSION_KEYS)[number], keyof typeof reelScores.$inferSelect> = {
      hook: "hookScore",
      retention_metric: "skipRateScore",
      retention_proxy: "retentionScore",
      cta: "ctaScore",
      visual: "visualScore",
      audio: "audioScore",
      trend: "trendScore",
      caption: "captionScore",
      timing: "timingScore",
    };
    const field = fieldMap[key];
    const values = scores.map((s) => (s[field] as number | null) ?? 0);
    const avg = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
    return { key, avg };
  });
  dimAvgs.sort((a, b) => b.avg - a.avg);

  const skipRates = accountReels
    .filter((r) => r.skipRate)
    .map((r) => parseFloat(r.skipRate!.toString()));
  const avgSkipRate =
    skipRates.reduce((a, b) => a + b, 0) / Math.max(skipRates.length, 1);

  const avgViews =
    accountReels.reduce((sum, r) => sum + r.viewsCount, 0) / Math.max(accountReels.length, 1);

  const decayFactors = accountReels
    .slice(0, 5)
    .map((r) => computeTimeDecayFactor(r.timestamp).toFixed(2))
    .join(", ");

  return {
    avgEngagement,
    best,
    worst,
    strongest: dimAvgs[0] ?? { key: "hook", avg: 5 },
    weakest: dimAvgs[dimAvgs.length - 1] ?? { key: "hook", avg: 5 },
    avgSkipRate,
    avgViews,
    decayFactors,
  };
}

export async function generateStrategy(userId: string, accountId: string) {
  const [account] = await db
    .select()
    .from(instagramAccounts)
    .where(and(eq(instagramAccounts.id, accountId), eq(instagramAccounts.userId, userId)))
    .limit(1);

  if (!account) {
    throw new StrategyServiceError("RESOURCE_NOT_FOUND", "Account not found or access denied");
  }

  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const periodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const { accountReels, scores } = await loadAccountReelsWithScores(accountId, periodStart);

  const agg = aggregateForPrompt(accountReels, scores);

  const strategyCap = await checkUsageLimit(userId, "strategy_generation");
  const aiCallCap = await checkUsageLimit(userId, "ai_call");
  const canUseLlm =
    strategyCap.allowed &&
    aiCallCap.allowed &&
    isAnyLlmProviderConfigured();

  let output: StrategyOutput;
  let source: "ai" | "heuristic" = "heuristic";
  let modelVersion = "heuristic-v1";
  let tokensUsed = 0;
  let costUsd = "0.000000";

  if (canUseLlm) {
    const { modelTier } = await getUserPlanContext(userId);
    const model = selectModel("strategy", modelTier);

    if (model) {
      const prompt = buildStrategyPrompt({
        platform: "instagram",
        postsCount: accountReels.length,
        avgEngagement: agg.avgEngagement,
        bestPostCaption: agg.best?.caption ?? "",
        bestEr: agg.best?.engagementRate ? parseFloat(agg.best.engagementRate) : 0,
        worstPostCaption: agg.worst?.caption ?? "",
        worstEr: agg.worst?.engagementRate ? parseFloat(agg.worst.engagementRate) : 0,
        avgViews: agg.avgViews,
        avgSkipRate: agg.avgSkipRate,
        topThemes: "Educational, how-to, niche tips",
        strongestDim: agg.strongest.key,
        strongestAvg: agg.strongest.avg,
        weakestDim: agg.weakest.key,
        weakestAvg: agg.weakest.avg,
        postingWindows: "Weekday 9 AM, Wed 12 PM, Fri 5 PM",
        timeDecayFactors: agg.decayFactors || "1.0",
        strategyType: "weekly",
        periodStart: periodStart.toISOString().slice(0, 10),
        periodEnd: periodEnd.toISOString().slice(0, 10),
      });

      const llmResult = await callLLMPure({
        prompt,
        outputSchema: StrategyOutputSchema,
        model: model.model,
      });

      if (llmResult.success) {
        output = llmResult.data;
        source = "ai";
        modelVersion = llmResult.modelId;
        tokensUsed = llmResult.tokensUsed;
        costUsd = llmResult.costUsd.toFixed(6);

        await incrementUsage(userId, "strategiesGen");
        await incrementUsage(userId, "aiCallsCount");
        await incrementUsage(userId, "aiTokensUsed", llmResult.tokensUsed);
        await incrementUsage(userId, "aiCostUsd", llmResult.costUsd);
      } else {
        output = buildHeuristicStrategy(accountReels, scores);
      }
    } else {
      output = buildHeuristicStrategy(accountReels, scores);
    }
  } else {
    output = buildHeuristicStrategy(accountReels, scores);
  }

  const content = mapStrategyToContent(output, source);

  const [saved] = await db
    .insert(strategies)
    .values({
      userId,
      accountId,
      strategyType: "weekly",
      content,
      periodStart,
      periodEnd,
      modelVersion,
      tokensUsed,
      costUsd,
      generatedAt: new Date(),
    })
    .returning();

  return saved;
}

export async function getLatestStrategy(userId: string, accountId: string) {
  const [account] = await db
    .select({ id: instagramAccounts.id })
    .from(instagramAccounts)
    .where(and(eq(instagramAccounts.id, accountId), eq(instagramAccounts.userId, userId)))
    .limit(1);

  if (!account) {
    throw new StrategyServiceError("RESOURCE_NOT_FOUND", "Account not found or access denied");
  }

  const [strategy] = await db
    .select()
    .from(strategies)
    .where(eq(strategies.accountId, accountId))
    .orderBy(desc(strategies.generatedAt))
    .limit(1);

  return strategy ?? null;
}

export async function canEnqueueStrategyJob(userId: string): Promise<boolean> {
  const strategyCap = await checkUsageLimit(userId, "strategy_generation");
  const aiCap = await checkUsageLimit(userId, "ai_call");
  return strategyCap.remaining > 0 || aiCap.remaining > 0;
}
