/**
 * Analytics API Endpoint — GET /api/accounts/[id]/analytics
 *
 * Aggregates real metrics from synced reels only (no synthetic heatmaps or categories).
 */

import { NextRequest } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts, reels } from "@/lib/db/schema";
import { eq, and, avg, sum, gte } from "drizzle-orm";
import { buildPostingHeatmap } from "@/lib/analytics/aggregates";

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id: accountId } = (await context.params) as { id: string };
    const days = Math.min(
      90,
      Math.max(7, Number(request.nextUrl.searchParams.get("days") || "30"))
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
      })
      .from(reels)
      .where(
        and(eq(reels.accountId, accountId), gte(reels.timestamp, cutoff))
      );

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

    const hasData = totalViews > 0 && reelRows.length > 0;

    return apiSuccess({
      accountId,
      hasData,
      summary: {
        totalViews,
        avgEngagementRate: avgER,
        avgHookRetention,
        avgWatchThrough: null,
      },
      contentTypes: [],
      heatmap: buildPostingHeatmap(reelRows),
    });
  })
);
