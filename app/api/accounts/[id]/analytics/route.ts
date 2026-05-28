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
  calculatePostDerivedMetrics,
  calculateFormatBaselines,
  calculateFollowerGrowth,
} from "@/lib/analytics/calculations";
import { triggerSyncIfStale } from "@/lib/services/ingestion.service";

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id: accountId } = (await context.params) as { id: string };
    
    // Trigger auto-sync if stale (respects Meta Graph rate limits)
    await triggerSyncIfStale(request.user.id, accountId);
    
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
      .select({
        id: instagramAccounts.id,
        followersCount: instagramAccounts.followersCount,
      })
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
        id: reels.id,
        caption: reels.caption,
        timestamp: reels.timestamp,
        viewsCount: reels.viewsCount,
        displayViews: reels.displayViews,
        likesCount: reels.likesCount,
        commentsCount: reels.commentsCount,
        sharesCount: reels.sharesCount,
        savesCount: reels.savesCount,
        engagementRate: reels.engagementRate,
        skipRate: reels.skipRate,
        reach: reels.reach,
        dataTrustLabel: reels.dataTrustLabel,
      })
      .from(reels)
      .where(
        and(eq(reels.accountId, accountId), gte(reels.timestamp, cutoff))
      )
      .orderBy(desc(reels.timestamp));

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
    const content = reelRows.map((post) => {
      const displayViews = post.displayViews || post.viewsCount || 0;
      const derived = calculatePostDerivedMetrics(
        {
          id: post.id,
          reach: post.reach,
          viewsCount: displayViews,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          sharesCount: post.sharesCount,
          savesCount: post.savesCount,
          dataTrustLabel: post.dataTrustLabel,
          timestamp: post.timestamp,
        },
        account.followersCount
      );

      return {
        ...derived,
        caption: post.caption,
        views: displayViews,
        hookRetention:
          post.skipRate != null
            ? parseFloat((100 - Number(post.skipRate)).toFixed(1))
            : null,
      };
    });

    const contentTimelineMap = new Map<
      string,
      {
        dateValue: number;
        date: string;
        Reach: number;
        Views: number;
        Intent: number;
        Engagements: number;
      }
    >();

    for (const post of content) {
      const d = new Date(post.timestamp);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString();
      const existing =
        contentTimelineMap.get(key) ??
        {
          dateValue: d.getTime(),
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          Reach: 0,
          Views: 0,
          Intent: 0,
          Engagements: 0,
        };

      existing.Reach += post.reach;
      existing.Views += post.views;
      existing.Intent += post.saves + post.shares;
      existing.Engagements += post.likes + post.comments + post.saves + post.shares;
      contentTimelineMap.set(key, existing);
    }

    const contentTimeline = Array.from(contentTimelineMap.values())
      .sort((a, b) => a.dateValue - b.dateValue)
      .map(({ dateValue, ...point }) => point);

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
      content,
      contentTimeline,
      heatmap: buildPostingHeatmap(reelRows),
    });
  })
);
