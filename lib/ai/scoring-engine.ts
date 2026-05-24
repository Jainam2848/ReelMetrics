/**
 * Trendoraa — Heuristic Scoring Engine (spec §7.5, upgraded).
 *
 * Provides a zero-downtime, data-driven scoring fallback when the LLM
 * circuit-breaker trips or a user's monthly AI budget is exhausted.
 *
 * Key design decisions in this upgrade:
 * - Dimension weights EXACTLY match the AI scoring prompt (§7.2):
 *     Hook 12%, Retention Metric 13%, Retention Proxy 12%, CTA 10%,
 *     Visual 10%, Audio 10%, Trend 13%, Caption 8%, Timing 12%.
 * - Piecewise scoring functions mirror the AI prompt's qualitative
 *   benchmarks rather than using linear mappings.
 * - CTA uses logarithmic scaling instead of fixed *1000 capping.
 * - Instagram hook ≠ retention_metric (differentiated by -1 offset).
 * - New `virality_potential` field computed from engagement velocity.
 * - Actionable improvement suggestions based on metric thresholds.
 * - Overall score normalized to true 1-100 range via linear scaling.
 * - Comprehensive null/undefined/NaN/zero input validation.
 *
 * @module scoring-engine
 */

import { z } from "zod";

// ── Types ──────────────────────────────────────────────────────────────────

export type Platform = "instagram" | "tiktok";
export type ViralityPotential = "low" | "medium" | "high" | "very_high";
export type RetentionStrength = "excellent" | "good" | "average" | "weak" | "critical";

export interface PostMetricsInput {
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  public_reposts?: number;     // Instagram-specific
  skip_rate?: number;          // Instagram-specific (0 to 100)
  tiktok_completion_rate?: number; // TikTok-specific (0 to 100)
  posted_at?: Date | string;   // For time-decay calculation
  video_length?: number;       // Optional video length in seconds
  views_momentum?: number;     // Optional view velocity ratio (recent_views / avg_views)
}

export interface HeuristicDimension {
  score: number;
  reasoning: string;
  improvement: string;
}

export interface HeuristicScoreResult {
  overall_score: number;
  dimensions: {
    hook: HeuristicDimension;
    retention_metric: HeuristicDimension;
    retention_proxy: HeuristicDimension;
    cta: HeuristicDimension;
    visual: HeuristicDimension;
    audio: HeuristicDimension;
    trend: HeuristicDimension;
    caption: HeuristicDimension;
    timing: HeuristicDimension;
  };
  platform_retention_analysis: {
    strength: RetentionStrength;
    estimated_retained_viewers: number;
    verdict: string;
  };
  top_strength: string;
  biggest_opportunity: string;
  one_line_summary: string;
  virality_potential: ViralityPotential;
  source: "heuristic";
}

// ── Constants ──────────────────────────────────────────────────────────────

/**
 * EXACT dimension weights from the AI scoring prompt (§7.2).
 * Sum MUST equal 1.00 (100%). This ensures heuristic and AI scores
 * are weighted identically, preventing dashboard inconsistencies.
 */
const DIMENSION_WEIGHTS = {
  hook: 0.12,
  retention_metric: 0.13,
  retention_proxy: 0.12,
  cta: 0.10,
  visual: 0.10,
  audio: 0.10,
  trend: 0.13,
  caption: 0.08,
  timing: 0.12,
} as const;

// Compile-time weight sum assertion (development safety net)
const WEIGHT_SUM = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(WEIGHT_SUM - 1.0) > 0.001) {
  throw new Error(
    `[scoring-engine] DIMENSION_WEIGHTS must sum to 1.0, got ${WEIGHT_SUM}`
  );
}

// ── Input Validation ───────────────────────────────────────────────────────

/**
 * Safely coerce a numeric input to a valid number.
 * Returns `fallback` for null, undefined, NaN, Infinity, or negative values.
 */
function safeNum(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

/**
 * Clamp a number to the [min, max] range and round to integer.
 */
function clampScore(value: number, min: number = 1, max: number = 10): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

// ── Piecewise Scoring Functions ────────────────────────────────────────────

/**
 * Maps Instagram skip_rate to a 1-10 score using piecewise thresholds
 * that EXACTLY match the AI prompt's qualitative benchmarks:
 *   <20% → excellent (9-10)
 *   20-40% → good (6-8)
 *   40-60% → average (3-5)
 *   >60% → poor (1-2)
 *
 * Uses linear interpolation within each band for granularity.
 */
function scoreInstagramSkipRate(rawSkipRate: number, followerCount?: number): number {
  const sr = Math.max(0, Math.min(100, rawSkipRate));
  const fc = followerCount !== undefined ? followerCount : 25000; // default to moderate tier 10K-100K if not specified

  // Dynamic skip rate thresholds based on follower count
  let excelCut: number;
  let goodCut: number;
  let avgCut: number;

  if (fc < 10000) {
    excelCut = 25;
    goodCut = 45;
    avgCut = 65;
  } else if (fc < 100000) {
    excelCut = 20;
    goodCut = 40;
    avgCut = 60;
  } else if (fc < 500000) {
    excelCut = 15;
    goodCut = 35;
    avgCut = 55;
  } else {
    excelCut = 10;
    goodCut = 30;
    avgCut = 50;
  }

  if (sr < excelCut) {
    // 0% -> 10, excelCut -> 9 (linear interpolation within excellent band)
    return clampScore(10 - (sr / excelCut));
  } else if (sr < goodCut) {
    // excelCut -> 8, goodCut -> 6 (linear interpolation within good band)
    const range = goodCut - excelCut;
    return clampScore(8 - ((sr - excelCut) / range) * 2);
  } else if (sr < avgCut) {
    // goodCut -> 5, avgCut -> 3 (linear interpolation within average band)
    const range = avgCut - goodCut;
    return clampScore(5 - ((sr - goodCut) / range) * 2);
  } else {
    // avgCut -> 2, 100% -> 1 (linear interpolation within poor band)
    const range = 100 - avgCut;
    return clampScore(2 - ((sr - avgCut) / range));
  }
}

/**
 * Maps TikTok completion_rate to a 1-10 score using piecewise thresholds
 * matching the AI prompt's qualitative benchmarks:
 *   ≥40% → excellent (9-10)
 *   30-40% → good (6-8)
 *   15-30% → average (3-5)
 *   <15% → poor (1-2)
 */
function scoreTikTokCompletionRate(rawCompletionRate: number): number {
  const cr = Math.max(0, Math.min(100, rawCompletionRate));

  if (cr >= 40) {
    // 40% → 9, 60%+ → 10 (linear interpolation within excellent band)
    return clampScore(9 + ((cr - 40) / 20));
  } else if (cr >= 30) {
    // 30% → 6, 40% → 8 (linear interpolation within good band)
    return clampScore(6 + ((cr - 30) / 10) * 2);
  } else if (cr >= 15) {
    // 15% → 3, 30% → 5 (linear interpolation within average band)
    return clampScore(3 + ((cr - 15) / 15) * 2);
  } else {
    // 0% → 1, 15% → 2 (linear interpolation within poor band)
    return clampScore(1 + (cr / 15));
  }
}

/**
 * Logarithmic CTA scoring.
 *
 * Uses log-scaled percentage of high-intent actions (saves, shares, reposts)
 * relative to views to produce a 1-10 score. This avoids the old `*1000`
 * capping which caused scores to slam to 10 on moderate engagement.
 *
 * Formula: score = 2 * ln(1 + ctaPercentage * 100) clamped to [1, 10]
 *   - ctaPercentage of 0.1% → ~2
 *   - ctaPercentage of 0.5% → ~4
 *   - ctaPercentage of 2%   → ~6
 *   - ctaPercentage of 5%   → ~8
 *   - ctaPercentage of 10%+ → ~9-10
 */
function scoreCtaEffectiveness(
  savesCount: number,
  sharesCount: number,
  publicReposts: number,
  viewsCount: number
): number {
  if (viewsCount === 0) return 1;

  // ctaFactor = (saves*2 + shares*3 + reposts*4) / views * 1000
  const ctaFactor = ((savesCount * 2) + (sharesCount * 3) + (publicReposts * 4)) / viewsCount * 1000;

  // Log10 scaling to capture magnitude differences without early saturation
  const rawCTAScore = Math.log10(ctaFactor + 1) * 3;
  return clampScore(rawCTAScore);
}

/**
 * Computes engagement-ratio-based retention proxy score.
 * Compares this post's ER against the account's historical average ER.
 * A ratio of 1.0 → score 5, 2.0 → score 10, 0.5 → score 2.5.
 */
function scoreRetentionProxy(
  totalEngagements: number,
  viewsCount: number,
  avgEngagementRate: number
): number {
  if (viewsCount === 0) return 3;

  const postER = (totalEngagements / viewsCount) * 100;
  const safeAvgER = avgEngagementRate > 0 ? avgEngagementRate : 2.0;
  const ratio = postER / safeAvgER;

  return clampScore(ratio * 5);
}

/**
 * Score trend alignment by comparing post ER vs account average.
 * Posts significantly outperforming baseline score higher on trend alignment.
 */
function scoreTrendAlignment(
  totalEngagements: number,
  viewsCount: number,
  avgEngagementRate: number
): number {
  if (viewsCount === 0) return 3;

  const postER = (totalEngagements / viewsCount) * 100;
  const safeAvgER = avgEngagementRate > 0 ? avgEngagementRate : 2.0;
  const ratio = postER / safeAvgER;

  // More aggressive mapping for trend (outperformance is stronger signal)
  if (ratio >= 2.0) return 10;
  if (ratio >= 1.5) return clampScore(7 + ((ratio - 1.5) / 0.5) * 3);
  if (ratio >= 1.0) return clampScore(5 + ((ratio - 1.0) / 0.5) * 2);
  if (ratio >= 0.5) return clampScore(3 + ((ratio - 0.5) / 0.5) * 2);
  return clampScore(1 + ratio * 4);
}

/**
 * Caption quality heuristic based on available engagement signals.
 * Higher comment-to-like ratio suggests caption provokes discussion.
 */
function scoreCaptionQuality(
  likesCount: number,
  commentsCount: number
): number {
  if (likesCount === 0 && commentsCount === 0) return 4;

  const total = likesCount + commentsCount;
  const commentRatio = commentsCount / total;

  // High comment ratio indicates caption drives conversation
  if (commentRatio > 0.3) return 8;
  if (commentRatio > 0.2) return 7;
  if (commentRatio > 0.1) return 6;
  return 5;
}

// ── Virality Potential ─────────────────────────────────────────────────────

function computeViralityPotential(
  viewsCount: number,
  sharesCount: number,
  publicReposts: number,
  totalEngagements: number,
  viewsMomentum?: number
): ViralityPotential {
  if (viewsCount === 0) return "low";

  const shareRepostRate = (sharesCount + publicReposts) / viewsCount;
  const engagementRate = totalEngagements / viewsCount;

  // Share/repost rate is the strongest virality signal
  let potential: ViralityPotential;
  if (shareRepostRate >= 0.025 && engagementRate >= 0.10) {
    potential = "very_high";
  } else if (shareRepostRate >= 0.02 && engagementRate >= 0.05) {
    potential = "high";
  } else if (shareRepostRate >= 0.005 || engagementRate >= 0.03) {
    potential = "medium";
  } else {
    potential = "low";
  }

  // Bump potential if views momentum is high (e.g. trending now, velocity > 2.0)
  if (viewsMomentum !== undefined && viewsMomentum >= 2.0) {
    if (potential === "low") return "medium";
    if (potential === "medium") return "high";
    if (potential === "high") return "very_high";
  }

  return potential;
}

// ── Time Decay Factor ──────────────────────────────────────────────────────

/**
 * Computes a time-decay multiplier that emphasizes freshness of posts.
 * Returns a value between 0.5 (very old) and 1.0 (fresh/recent).
 * Used by AI prompts to weight recent posts more heavily.
 *
 * Half-life: 14 days. After 14 days, the factor is ~0.75.
 * After 30 days, ~0.60. After 60 days, ~0.50.
 */
export function computeTimeDecayFactor(postedAt: Date | string | undefined): number {
  if (!postedAt) return 0.75; // Default for unknown dates

  const postedDate = typeof postedAt === "string" ? new Date(postedAt) : postedAt;
  if (isNaN(postedDate.getTime())) return 0.75;

  const daysSincePosted = Math.max(0, (Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24));

  // Exponential decay with half-life of 14 days, floored at 0.5
  const decay = Math.exp(-0.693 * daysSincePosted / 14);
  return Math.max(0.5, Math.min(1.0, decay));
}

// ── Caption Truncation ─────────────────────────────────────────────────────

/**
 * Truncates a caption to 300 characters to stay within token budgets
 * for smaller/cheaper models (Gemini Flash, DeepSeek).
 * Appends '...' if truncated.
 */
export function truncateCaption(caption: string | null | undefined): string {
  if (!caption) return "(no caption)";
  if (caption.length <= 300) return caption;
  return caption.slice(0, 297) + "...";
}

// ── Retention Analysis Helpers ─────────────────────────────────────────────

function getRetentionStrength(
  platform: Platform,
  metricValue: number
): { strength: RetentionStrength; verdict: string } {
  if (platform === "instagram") {
    // Lower skip rate is better
    if (metricValue < 20) return { strength: "excellent", verdict: "Outstanding! The hook successfully grabbed almost all viewers." };
    if (metricValue < 40) return { strength: "good", verdict: "Good hook retention. Most viewers continue watching past 3 seconds." };
    if (metricValue < 50) return { strength: "average", verdict: "Average retention — experiment with stronger opening visual hooks." };
    if (metricValue < 60) return { strength: "weak", verdict: "Weak attention grab. Try adding bold on-screen text in the first second." };
    return { strength: "critical", verdict: "Critical drop-off in the first 3 seconds. The hook needs a complete overhaul — try a pattern interrupt." };
  } else {
    // Higher completion rate is better
    if (metricValue > 40) return { strength: "excellent", verdict: "Outstanding completion rate! A large portion of viewers watched to the end." };
    if (metricValue >= 30) return { strength: "good", verdict: "Strong retention. Audience watched key segments of the video." };
    if (metricValue >= 15) return { strength: "average", verdict: "Average completion rate. Consider trimming unnecessary filler from the middle." };
    return { strength: "critical", verdict: "High drop-off rate. Get to the point within the first 2 seconds and remove all dead air." };
  }
}

// ── Actionable Improvement Suggestions ─────────────────────────────────────

function getHookImprovement(platform: Platform, score: number): string {
  if (score >= 8) return "Strong hook — maintain the current pattern of immediate visual engagement.";
  if (score >= 5) return "Start with a bold text overlay that states the result within 0.5 seconds, and use a fast zoom transition to grab attention.";
  if (score >= 3) return "Try a pattern interrupt: start mid-action, use a question hook, or show the end result first to create curiosity.";
  return "Complete hook overhaul needed. Open with movement, a surprising statement, or a strong visual contrast in the first frame.";
}

function getRetentionImprovement(platform: Platform, score: number): string {
  if (platform === "instagram") {
    if (score >= 8) return "Excellent skip resistance — keep using the same opener format.";
    if (score >= 5) return "Shorten the intro to under 1.5 seconds. Add on-screen text summarizing the value immediately.";
    return "Skip rate is critical — eliminate any static opening frames. Start with action and dialogue from frame 1.";
  } else {
    if (score >= 8) return "Outstanding completion rate — continue with this pacing and content density.";
    if (score >= 5) return "Trim the middle section. Every second should advance the narrative or provide new information.";
    return "High drop-off detected. Cut the video length by 30%, remove all dead air, and frontload the best moment.";
  }
}

function getCtaImprovement(score: number): string {
  if (score >= 8) return "Strong CTA performance. Viewers are actively saving and sharing this content.";
  if (score >= 5) return "Add an explicit save prompt in the last 2 seconds: 'Save this for later' with a visual bookmark icon.";
  if (score >= 3) return "Ask viewers to share directly: 'Send this to someone who needs to see this.' Place the CTA both in caption and on-screen.";
  return "CTA is critically weak. Add both a verbal and visual call-to-action. Try: 'Share this with a friend who [relates to topic].'";
}

function getTrendImprovement(score: number): string {
  if (score >= 8) return "Content is strongly aligned with current trends — riding momentum well.";
  if (score >= 5) return "Try incorporating trending audio templates and viral visual formats from this week's top Reels.";
  return "Content feels disconnected from current trends. Research trending sounds, hashtags, and visual memes before your next post.";
}

// ── Main Heuristic Scoring Function ────────────────────────────────────────

/**
 * Calculates a complete heuristic score for a post when the LLM is unavailable.
 *
 * This function is the zero-downtime fallback engine. It produces output
 * IDENTICAL in shape to the AI scoring response, so the frontend renders
 * dimension breakdowns the same way regardless of scoring source.
 *
 * Improvements over the original implementation:
 * 1. Weights match AI prompt exactly (12/13/12/10/10/10/13/8/12)
 * 2. Piecewise functions aligned with AI qualitative benchmarks
 * 3. Logarithmic CTA scoring prevents artificial capping
 * 4. Instagram hook ≠ retention_metric (differentiated by -1 offset)
 * 5. Comprehensive null/undefined/NaN input safety
 * 6. True 1-100 normalization (old version maxed at ~81)
 * 7. Actionable improvement text based on metric thresholds
 * 8. New virality_potential field for user motivation
 */
export function calculateHeuristicScore(
  platform: Platform,
  postMetrics: PostMetricsInput,
  avgEngagementRate: number,
  followerCount?: number
): HeuristicScoreResult {
  // ── Input Validation ───────────────────────────────────────────────────
  const viewsCount = safeNum(postMetrics.views_count);
  const likesCount = safeNum(postMetrics.likes_count);
  const commentsCount = safeNum(postMetrics.comments_count);
  const sharesCount = safeNum(postMetrics.shares_count);
  const savesCount = safeNum(postMetrics.saves_count);
  const publicReposts = safeNum(postMetrics.public_reposts);
  const safeAvgER = safeNum(avgEngagementRate, 2.0) || 2.0;

  const totalEngagements = likesCount + commentsCount + sharesCount + savesCount + publicReposts;

  // ── 1. Retention Metric Score (platform-specific piecewise function with follower tier scaling) ──
  let retentionMetricScore: number;
  let displayMetricName: string;
  let displayMetricValue: number;

  if (platform === "instagram") {
    const rawSkipRate = safeNum(postMetrics.skip_rate, 50);
    displayMetricName = "skip rate";
    displayMetricValue = rawSkipRate;
    retentionMetricScore = scoreInstagramSkipRate(rawSkipRate, followerCount);
  } else {
    const rawCompletionRate = safeNum(postMetrics.tiktok_completion_rate, 30);
    displayMetricName = "completion rate";
    displayMetricValue = rawCompletionRate;
    retentionMetricScore = scoreTikTokCompletionRate(rawCompletionRate);
  }

  // ── 2. Hook Score (differentiated from retention_metric for IG) ───────
  let hookScore: number;
  if (platform === "instagram") {
    hookScore = clampScore(retentionMetricScore - 1);
  } else {
    const rawCR = safeNum(postMetrics.tiktok_completion_rate, 30);
    hookScore = clampScore(rawCR / 8);
  }

  // ── 3. Retention Proxy (with video length awareness) ─────────────────
  let retentionProxyScore = scoreRetentionProxy(totalEngagements, viewsCount, safeAvgER);
  if (postMetrics.video_length !== undefined && postMetrics.video_length > 0) {
    const modifier = (postMetrics.video_length / 10) - 1;
    const clampedModifier = Math.max(-2, Math.min(2, modifier));
    retentionProxyScore = clampScore(retentionProxyScore + clampedModifier);
  }

  // ── 4. CTA Effectiveness (logarithmic magnitude scaling) ─────────────
  const ctaScore = scoreCtaEffectiveness(savesCount, sharesCount, publicReposts, viewsCount);

  // ── 5. Visual Quality ─────────────────────────────────────────────────
  const visualScore = viewsCount > 0
    ? clampScore(4 + (totalEngagements / viewsCount) * 30)
    : 5;

  // ── 6. Audio Strategy ─────────────────────────────────────────────────
  const shareRate = viewsCount > 0 ? sharesCount / viewsCount : 0;
  const audioScore = clampScore(4 + shareRate * 200);

  // ── 7. Trend Alignment ────────────────────────────────────────────────
  const trendScore = scoreTrendAlignment(totalEngagements, viewsCount, safeAvgER);

  // ── 8. Caption Quality ────────────────────────────────────────────────
  const captionScore = scoreCaptionQuality(likesCount, commentsCount);

  // ── 9. Timing Score (dynamic peak active hour awareness) ─────────────
  let timingScore = 6;
  if (postMetrics.posted_at) {
    const date = typeof postMetrics.posted_at === "string" ? new Date(postMetrics.posted_at) : postMetrics.posted_at;
    if (!isNaN(date.getTime())) {
      const hour = date.getHours();
      // Peak active hours: morning commute (8-10 AM), lunch (12-2 PM), evening leisure (6-9 PM)
      if ((hour >= 8 && hour <= 10) || (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21)) {
        timingScore = 9;
      } else if (hour >= 23 || hour <= 5) {
        timingScore = 3; // Graveyard hours
      } else {
        timingScore = 7; // Standard active hours
      }
    }
  }

  // ── Overall Weighted Score & Stretch Normalization to 1-100 ──────────
  const rawWeightedSum =
    hookScore * DIMENSION_WEIGHTS.hook +
    retentionMetricScore * DIMENSION_WEIGHTS.retention_metric +
    retentionProxyScore * DIMENSION_WEIGHTS.retention_proxy +
    ctaScore * DIMENSION_WEIGHTS.cta +
    visualScore * DIMENSION_WEIGHTS.visual +
    audioScore * DIMENSION_WEIGHTS.audio +
    trendScore * DIMENSION_WEIGHTS.trend +
    captionScore * DIMENSION_WEIGHTS.caption +
    timingScore * DIMENSION_WEIGHTS.timing;

  const rawOverall = rawWeightedSum * 10;
  
  // Apply linear stretch from [10, 82] to [10, 100] to ensure users see 95-100 for outstanding content
  let overallScore: number;
  if (rawOverall > 10) {
    const stretched = ((rawOverall - 10) / (82 - 10)) * (100 - 10) + 10;
    overallScore = Math.max(1, Math.min(100, Math.round(stretched)));
  } else {
    overallScore = Math.max(1, Math.min(100, Math.round(rawOverall)));
  }

  // ── Retention Analysis ────────────────────────────────────────────────
  const { strength, verdict } = getRetentionStrength(platform, displayMetricValue);

  const estRetained = platform === "instagram"
    ? Math.round(viewsCount * (1 - displayMetricValue / 100))
    : Math.round(viewsCount * (displayMetricValue / 100));

  // ── Virality Potential (with views momentum scaling) ──────────────────
  const viralityPotential = computeViralityPotential(
    viewsCount, sharesCount, publicReposts, totalEngagements, postMetrics.views_momentum
  );

  // ── Top Strength & Biggest Opportunity ────────────────────────────────
  const dimensionScores = {
    hook: hookScore,
    retention_metric: retentionMetricScore,
    retention_proxy: retentionProxyScore,
    cta: ctaScore,
    visual: visualScore,
    audio: audioScore,
    trend: trendScore,
    caption: captionScore,
    timing: timingScore,
  };

  const dimensionLabels: Record<string, string> = {
    hook: "Hook effectiveness",
    retention_metric: platform === "instagram" ? "Skip resistance (low skip rate)" : "Completion rate retention",
    retention_proxy: "Engagement-to-views ratio",
    cta: "Call-to-action conversion",
    visual: "Visual quality",
    audio: "Audio strategy",
    trend: "Trend alignment",
    caption: "Caption copywriting",
    timing: "Posting time optimization",
  };

  const sortedDims = Object.entries(dimensionScores).sort((a, b) => b[1] - a[1]);
  const firstSorted = sortedDims[0];
  const lastSorted = sortedDims[sortedDims.length - 1];
  const topStrength = firstSorted ? (dimensionLabels[firstSorted[0]] ?? "Overall engagement") : "Overall engagement";
  const biggestOpportunity = lastSorted ? (dimensionLabels[lastSorted[0]] ?? "Content optimization") : "Content optimization";

  // ── Build Result ──────────────────────────────────────────────────────
  return {
    overall_score: overallScore,
    dimensions: {
      hook: {
        score: hookScore,
        reasoning: `Estimated hook effectiveness based on ${displayMetricName} of ${displayMetricValue.toFixed(1)}%.`,
        improvement: getHookImprovement(platform, hookScore),
      },
      retention_metric: {
        score: retentionMetricScore,
        reasoning: `Calculated from native ${displayMetricName} of ${displayMetricValue.toFixed(1)}% using piecewise benchmark mapping.`,
        improvement: getRetentionImprovement(platform, retentionMetricScore),
      },
      retention_proxy: {
        score: retentionProxyScore,
        reasoning: `Post engagement rate is ${viewsCount > 0 ? ((totalEngagements / viewsCount) * 100).toFixed(2) : "0.00"}% vs account baseline of ${safeAvgER.toFixed(2)}%.`,
        improvement: retentionProxyScore >= 7
          ? "Strong engagement density — viewers are interacting deeply with this content."
          : "Focus on creating high-retention storytelling hooks that drive comments and shares.",
      },
      cta: {
        score: ctaScore,
        reasoning: `Saves: ${savesCount}, Shares: ${sharesCount}, Reposts: ${publicReposts}. Logarithmic scaling applied.`,
        improvement: getCtaImprovement(ctaScore),
      },
      visual: {
        score: visualScore,
        reasoning: "Visual quality estimated from engagement density (high engagement suggests appealing visuals).",
        improvement: visualScore >= 7
          ? "Strong visual appeal — maintain consistent lighting and framing."
          : "Experiment with dynamic text overlays, contrasting colors, and smooth transitions between scenes.",
      },
      audio: {
        score: audioScore,
        reasoning: `Audio strategy estimated from share rate (${(shareRate * 100).toFixed(2)}%). High shares often correlate with trending audio.`,
        improvement: audioScore >= 7
          ? "Audio choice is resonating — continue using trending sounds aligned with content."
          : "Incorporate trending audio clips. Match cuts to beat drops for higher viewer retention.",
      },
      trend: {
        score: trendScore,
        reasoning: "Trend alignment measured by post performance relative to account baseline.",
        improvement: getTrendImprovement(trendScore),
      },
      caption: {
        score: captionScore,
        reasoning: `Caption quality estimated from comment-to-engagement ratio (${commentsCount} comments / ${likesCount + commentsCount} total).`,
        improvement: captionScore >= 7
          ? "Caption is driving conversation — keep using question-style or controversial hooks."
          : "Write punchy 2-line captions with a curiosity hook. Add 3 targeted hashtags and a clear CTA.",
      },
      timing: {
        score: timingScore,
        reasoning: `Timing score of ${timingScore}/10 based on posting time proximity to peak engagement windows.`,
        improvement: "Test posting at different times this week. Track which slots get the most views in the first hour.",
      },
    },
    platform_retention_analysis: {
      strength,
      estimated_retained_viewers: estRetained,
      verdict,
    },
    top_strength: topStrength,
    biggest_opportunity: biggestOpportunity,
    one_line_summary: `Heuristic evaluation computed from ${viewsCount.toLocaleString()} views and ${displayMetricName} of ${displayMetricValue.toFixed(1)}%. Virality: ${viralityPotential}.`,
    virality_potential: viralityPotential,
    source: "heuristic",
  };
}

// ── Zod Validation Schema (shared with AI output) ──────────────────────────

const dimensionSchema = z.object({
  score: z.number().int().min(1).max(10),
  reasoning: z.string().min(10).max(500),
  improvement: z.string().min(10).max(500),
});

export const PostScoreSchema = z.object({
  overall_score: z.number().min(1).max(100),
  dimensions: z.object({
    hook: dimensionSchema,
    retention_metric: dimensionSchema,
    retention_proxy: dimensionSchema,
    cta: dimensionSchema,
    visual: dimensionSchema,
    audio: dimensionSchema,
    trend: dimensionSchema,
    caption: dimensionSchema,
    timing: dimensionSchema,
  }),
  platform_retention_analysis: z.object({
    strength: z.enum(["excellent", "good", "average", "weak", "critical"]),
    estimated_retained_viewers: z.number().int().min(0),
    verdict: z.string().min(10).max(300),
  }),
  top_strength: z.string().min(5).max(200),
  biggest_opportunity: z.string().min(5).max(200),
  one_line_summary: z.string().min(10).max(250),
  virality_potential: z.enum(["low", "medium", "high", "very_high"]).optional(),
});
