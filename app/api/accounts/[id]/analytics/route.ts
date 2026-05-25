/**
 * Analytics API Endpoint — GET /api/accounts/[id]/analytics
 *
 * Aggregates real metrics from synced reels, feed posts, active stories, and daily snapshots.
 */

import { NextRequest } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts, reels, stories, accountInsightsDaily } from "@/lib/db/schema";
import { eq, and, avg, sum, gte, desc } from "drizzle-orm";
import { buildPostingHeatmap } from "@/lib/analytics/aggregates";
import {
  calculateFormatBaselines,
  calculateFollowerGrowth,
} from "@/lib/analytics/calculations";

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id: accountId } = (await context.params) as { id: string };
    
    // Read search params
    const url = new URL(request.url);
    const days = Math.min(
      90,
      Math.max(7, Number(url.searchParams.get("days") || "30"))
    );
    const baselineDays = Math.min(
      90,
      Math.max(7, Number(url.searchParams.get("baselineDays") || "30"))
    );
    
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [account] = await db
      .select({ id: instagramAccounts.id })
      .from(instagramAccounts)
      .where(
        and(
          eq(instagramAccounts.id, accountId),
          eq(instagramAccounts.userId, request.user.id)
        )
      )
      .limit(1);

    if (!account) {
      return apiError("RESOURCE_NOT_FOUND", "Account not found or access denied");
    }

    // 1. Fetch reels/feed posts
    const [stats] = await db
      .select({
        totalDisplayViews: sum(reels.displayViews),
        totalViews: sum(reels.viewsCount),
        avgEngagement: avg(reels.engagementRate),
        avgSkipRate: avg(reels.skipRate),
      })
      .from(reels)
      .where(
        and(eq(reels.accountId, accountId), gte(reels.timestamp, cutoff))
      );

    const reelRows = await db
      .select({
        timestamp: reels.timestamp,
        engagementRate: reels.engagementRate,
        skipRate: reels.skipRate,
        reach: reels.reach,
      })
      .from(reels)
      .where(
        and(eq(reels.accountId, accountId), gte(reels.timestamp, cutoff))
      );

    // 2. Fetch stories in the window
    const storyRows = await db.query.stories.findMany({
      where: and(eq(stories.accountId, accountId), gte(stories.timestamp, cutoff)),
      orderBy: [desc(stories.timestamp)],
    });

    // 2b. Fetch daily account insights
    const dailyInsightsRows = await db.query.accountInsightsDaily.findMany({
      where: and(
        eq(accountInsightsDaily.accountId, accountId),
        gte(accountInsightsDaily.date, cutoff)
      ),
      orderBy: [desc(accountInsightsDaily.date)],
    });

    // 3. Compute dynamic rolling baselines
    const baselines = await calculateFormatBaselines(accountId, baselineDays);

    // 4. Compute follower growth metrics
    const growth = await calculateFollowerGrowth(accountId, days);

    // 5. Aggregate metrics
    const totalViews = stats?.totalDisplayViews
      ? parseInt(stats.totalDisplayViews, 10)
      : stats?.totalViews
        ? parseInt(stats.totalViews, 10)
        : 0;

    const avgER = stats?.avgEngagement
      ? parseFloat(parseFloat(stats.avgEngagement).toFixed(2))
      : null;

    const avgSkip = stats?.avgSkipRate
      ? parseFloat(parseFloat(stats.avgSkipRate).toFixed(1))
      : null;

    const avgHookRetention =
      avgSkip !== null ? parseFloat((100 - avgSkip).toFixed(1)) : null;

    const hasData = totalViews > 0 || reelRows.length > 0 || storyRows.length > 0 || dailyInsightsRows.length > 0;

    return apiSuccess({
      accountId,
      hasData,
      summary: {
        totalViews,
        avgEngagementRate: avgER,
        avgHookRetention,
        avgWatchThrough: null,
      },
      baselines,
      growth,
      stories: storyRows,
      dailyInsights: dailyInsightsRows,
      heatmap: buildPostingHeatmap(reelRows),
    });
  })
);
