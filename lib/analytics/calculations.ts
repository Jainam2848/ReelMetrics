import { db } from "@/lib/db";
import { reels, stories, accountInsightsDaily, audienceHistory } from "@/lib/db/schema";
import { eq, and, gte, avg, sql, desc } from "drizzle-orm";

export interface PostDerivedMetrics {
  id: string;
  mediaType: string;
  timestamp: Date;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  reachRate: number;
  saveRateReach: number;
  saveRateImpressions: number;
  shareRateReach: number;
  shareRateImpressions: number;
  dataTrustLabel: string;
}

export interface StoryDerivedMetrics {
  id: string;
  timestamp: Date;
  impressions: number;
  reach: number;
  replies: number;
  exits: number;
  completionRate: number;
  dataTrustLabel: string;
}

export interface AccountRollingBaselines {
  reels: {
    avgReach: number;
    avgEngagement: number;
    avgSaves: number;
    avgShares: number;
  };
  posts: {
    avgReach: number;
    avgEngagement: number;
    avgSaves: number;
    avgShares: number;
  };
  stories: {
    avgReach: number;
    avgImpressions: number;
    avgCompletionRate: number;
  };
}

export interface FollowerGrowthMetrics {
  totalFollowers: number;
  newFollowers: number;
  growthRate: number;
}

/**
 * Calculates derived metrics for an individual post raw count values.
 */
export function calculatePostDerivedMetrics(
  post: {
    id: string;
    reach: number;
    viewsCount: number;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    savesCount: number;
    dataTrustLabel: string;
    timestamp: Date;
  },
  followersAtPublish: number
): PostDerivedMetrics {
  const reach = post.reach || 0;
  const impressions = post.viewsCount || 1;
  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const shares = post.sharesCount || 0;
  const saves = post.savesCount || 0;
  const engagements = likes + comments + saves;

  const engagementRate = parseFloat(((engagements / impressions) * 100).toFixed(4));
  const reachRate = followersAtPublish > 0 ? parseFloat(((reach / followersAtPublish) * 100).toFixed(4)) : 0;
  const saveRateReach = reach > 0 ? parseFloat(((saves / reach) * 100).toFixed(4)) : 0;
  const saveRateImpressions = parseFloat(((saves / impressions) * 100).toFixed(4));
  const shareRateReach = reach > 0 ? parseFloat(((shares / reach) * 100).toFixed(4)) : 0;
  const shareRateImpressions = parseFloat(((shares / impressions) * 100).toFixed(4));

  return {
    id: post.id,
    mediaType: "REEL",
    timestamp: post.timestamp,
    reach,
    impressions,
    likes,
    comments,
    shares,
    saves,
    engagementRate,
    reachRate,
    saveRateReach,
    saveRateImpressions,
    shareRateReach,
    shareRateImpressions,
    dataTrustLabel: post.dataTrustLabel || "Verified Source",
  };
}

/**
 * Computes format-specific baseline averages over a local rolling window of days.
 */
export async function calculateFormatBaselines(
  accountId: string,
  baselineDays: number = 30
): Promise<AccountRollingBaselines> {
  const cutoff = new Date(Date.now() - baselineDays * 24 * 60 * 60 * 1000);

  // Reels stats
  const [reelsStats] = await db
    .select({
      avgReach: avg(reels.reach),
      avgEngagement: avg(reels.engagementRate),
      avgSaves: avg(reels.savesCount),
      avgShares: avg(reels.sharesCount),
    })
    .from(reels)
    .where(and(eq(reels.accountId, accountId), gte(reels.timestamp, cutoff)));

  // Stories stats
  const [storiesStats] = await db
    .select({
      avgReach: avg(stories.reach),
      avgImpressions: avg(stories.impressions),
      avgCompletion: avg(stories.completionRate),
    })
    .from(stories)
    .where(and(eq(stories.accountId, accountId), gte(stories.timestamp, cutoff)));

  return {
    reels: {
      avgReach: reelsStats?.avgReach ? parseFloat(reelsStats.avgReach) : 0,
      avgEngagement: reelsStats?.avgEngagement ? parseFloat(reelsStats.avgEngagement) : 0,
      avgSaves: reelsStats?.avgSaves ? parseFloat(reelsStats.avgSaves) : 0,
      avgShares: reelsStats?.avgShares ? parseFloat(reelsStats.avgShares) : 0,
    },
    posts: {
      avgReach: reelsStats?.avgReach ? parseFloat(reelsStats.avgReach) : 0,
      avgEngagement: reelsStats?.avgEngagement ? parseFloat(reelsStats.avgEngagement) : 0,
      avgSaves: reelsStats?.avgSaves ? parseFloat(reelsStats.avgSaves) : 0,
      avgShares: reelsStats?.avgShares ? parseFloat(reelsStats.avgShares) : 0,
    },
    stories: {
      avgReach: storiesStats?.avgReach ? parseFloat(storiesStats.avgReach) : 0,
      avgImpressions: storiesStats?.avgImpressions ? parseFloat(storiesStats.avgImpressions) : 0,
      avgCompletionRate: storiesStats?.avgCompletion ? parseFloat(storiesStats.avgCompletion) : 0,
    },
  };
}

/**
 * Calculates follower growth metrics over a given window.
 */
export async function calculateFollowerGrowth(
  accountId: string,
  timeframeDays: number = 30
): Promise<FollowerGrowthMetrics> {
  const cutoff = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

  const history = await db.query.audienceHistory.findMany({
    where: and(
      eq(audienceHistory.accountId, accountId),
      gte(audienceHistory.timestamp, cutoff)
    ),
    orderBy: desc(audienceHistory.timestamp),
  });

  if (history.length === 0) {
    return { totalFollowers: 0, newFollowers: 0, growthRate: 0 };
  }

  const latest = history[0]!;
  const oldest = history[history.length - 1]!;

  const newFollowers = history.reduce((sum, h) => sum + h.newFollowers, 0);
  const totalFollowers = latest.totalFollowers;
  const startFollowers = oldest.totalFollowers - oldest.newFollowers;

  const growthRate = startFollowers > 0 ? parseFloat(((newFollowers / startFollowers) * 100).toFixed(4)) : 0;

  return {
    totalFollowers,
    newFollowers,
    growthRate,
  };
}
