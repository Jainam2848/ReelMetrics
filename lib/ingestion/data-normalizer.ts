/**
 * Instagram Data Normalizer (spec §6.5).
 *
 * Transforms raw Instagram Graph API responses into the normalized `reels`
 * database schema format. Uses `views` (not deprecated `plays`) for all
 * engagement calculations per spec §6.6.
 *
 * Key design decisions:
 * - engagement_rate uses `views_count` as denominator, returns NULL if 0
 * - skip_rate mapped to NULL when missing (prevents DB schema errors)
 * - metric_source set to 'unified_views' for all new ingestion
 * - weighted_engagement includes public_reposts with configurable weight
 */

import type {
  RawInstagramPost,
  RawInstagramInsights,
  RawInstagramPostWithInsights,
} from "./post-fetcher";

// ── Output Types ───────────────────────────────────────────────────────────

/**
 * Normalized post data matching the `reels` table columns.
 * Uses Partial because not all fields are present on every sync.
 */
export interface NormalizedPost {
  igMediaId: string;
  caption: string | null;
  mediaUrl: string | null;
  permalink: string | null;
  timestamp: Date;
  viewsCount: number;
  totalViews: number;
  displayViews: number;
  metricSource: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  publicReposts: number;
  skipRate: string | null; // decimal stored as string for Drizzle
  reach: number;
  engagementRate: string | null; // decimal stored as string for Drizzle
  fetchedAt: Date;
}

/**
 * Metrics shape used for engagement calculations.
 */
interface EngagementMetrics {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  viewsCount: number;
  publicReposts: number;
}

// ── Weighted Engagement Coefficients ───────────────────────────────────────

/**
 * Engagement weight coefficients per spec §6.5.
 * These weights reflect the relative value of each interaction type
 * for content performance scoring.
 */
const ENGAGEMENT_WEIGHTS = {
  likes: 1.0,
  comments: 3.0,
  shares: 5.0,
  saves: 4.0,
  publicReposts: 6.0, // Highest weight — user actively redistributes content
} as const;

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Normalizes a raw Instagram post and its insights into the `reels` DB format.
 *
 * Handles:
 * - Missing insights by defaulting numeric fields to 0
 * - Nullable skip_rate explicitly mapped to null when undefined
 * - metric_source set to 'unified_views' (not legacy 'plays')
 * - Engagement rate calculation with division-by-zero guard
 *
 * @param rawPost  Raw post object from the Graph API media endpoint.
 * @param rawInsights  Raw insights parsed from the per-post insights endpoint.
 * @returns Normalized post data ready for DB upsert.
 */
export function normalizeInstagramPost(
  rawPost: RawInstagramPost,
  rawInsights: RawInstagramInsights
): NormalizedPost {
  const viewsCount = rawInsights.views ?? 0;
  const totalViews = rawInsights.total_views ?? viewsCount;
  const likesCount = rawInsights.likes ?? 0;
  const commentsCount = rawInsights.comments ?? 0;
  const sharesCount = rawInsights.shares ?? 0;
  const savesCount = rawInsights.saved ?? 0;
  const publicReposts = rawInsights.public_reposts ?? 0;
  const reach = rawInsights.reach ?? 0;

  // Explicitly map missing skip_rate to null to prevent DB schema errors.
  // Nullable value allows fallback default mapping during AI scoring.
  const skipRate =
    rawInsights.reels_skip_rate !== undefined && rawInsights.reels_skip_rate !== null
      ? rawInsights.reels_skip_rate.toFixed(2)
      : null;

  const metrics: EngagementMetrics = {
    likesCount,
    commentsCount,
    sharesCount,
    savesCount,
    viewsCount,
    publicReposts,
  };

  const engagementRate = calculateEngagementRate(metrics);

  return {
    igMediaId: rawPost.id,
    caption: rawPost.caption ?? null,
    mediaUrl: rawPost.media_url ?? null,
    permalink: rawPost.permalink ?? null,
    timestamp: new Date(rawPost.timestamp),
    viewsCount,
    totalViews,
    displayViews: viewsCount, // display_views mirrors views for unified metric
    metricSource: "unified_views",
    likesCount,
    commentsCount,
    sharesCount,
    savesCount,
    publicReposts,
    skipRate,
    reach,
    engagementRate,
    fetchedAt: new Date(),
  };
}

/**
 * Batch-normalizes an array of raw posts with insights.
 */
export function normalizeInstagramPosts(
  postsWithInsights: RawInstagramPostWithInsights[]
): NormalizedPost[] {
  return postsWithInsights.map(({ post, insights }) =>
    normalizeInstagramPost(post, insights)
  );
}

// ── Engagement Calculations ────────────────────────────────────────────────

/**
 * Calculates standard engagement rate (spec §6.5).
 *
 * Formula: (likes + comments + shares + saves) / views_count
 *
 * CRITICAL: Uses views_count, NOT plays_count (deprecated per §6.6).
 * Returns NULL when views_count is 0 to avoid division-by-zero.
 * This NULL propagates to the DB as an explicit nullable decimal.
 *
 * @returns Engagement rate as a decimal string (e.g. "0.0542"), or null.
 */
export function calculateEngagementRate(
  metrics: EngagementMetrics
): string | null {
  if (metrics.viewsCount === 0) {
    return null;
  }

  const totalEngagement =
    metrics.likesCount +
    metrics.commentsCount +
    metrics.sharesCount +
    metrics.savesCount;

  const rate = totalEngagement / metrics.viewsCount;
  return rate.toFixed(4);
}

/**
 * Calculates weighted engagement score (spec §6.5).
 *
 * Each interaction type is multiplied by its weight coefficient to produce
 * a composite score that values high-intent actions (shares, reposts, saves)
 * more heavily than passive actions (likes).
 *
 * Includes `public_reposts` as a first-class metric with the highest weight.
 *
 * @returns Weighted engagement score as a decimal string, or null if views is 0.
 */
export function calculateWeightedEngagement(
  metrics: EngagementMetrics
): string | null {
  if (metrics.viewsCount === 0) {
    return null;
  }

  const weightedSum =
    metrics.likesCount * ENGAGEMENT_WEIGHTS.likes +
    metrics.commentsCount * ENGAGEMENT_WEIGHTS.comments +
    metrics.sharesCount * ENGAGEMENT_WEIGHTS.shares +
    metrics.savesCount * ENGAGEMENT_WEIGHTS.saves +
    metrics.publicReposts * ENGAGEMENT_WEIGHTS.publicReposts;

  const rate = weightedSum / metrics.viewsCount;
  return rate.toFixed(4);
}
