/**
 * Trends API Endpoint — GET /api/accounts/[id]/trends
 *
 * Supports two modes via ?type query param:
 *  - `?type=analysis` → returns the latest cached AI trend analysis from `trend_analyses` table
 *  - (default / no type) → returns the time-series timeline array for the dashboard line chart
 *
 * POST to /api/accounts/[id]/trends/analyze to trigger a new analysis job.
 */

import { NextRequest } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts, reels } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { TrendService, TrendServiceError } from "@/lib/services/trends.service";
import { buildEngagementTimeline } from "@/lib/analytics/aggregates";

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id: accountId } = (await context.params) as { id: string };
    const url = new URL(request.url);
    const queryType = url.searchParams.get("type");
    const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days") || "30")));
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    if (queryType === "analysis") {
      try {
        const analysis = await TrendService.getLatestAnalysis(
          request.user.id,
          accountId
        );

        if (analysis) {
          return apiSuccess(analysis);
        }

        return apiSuccess({
          id: null,
          accountId,
          status: "not_generated",
          message:
            "No trend analysis has been generated yet. POST to /api/accounts/{id}/trends/analyze to run your first analysis.",
          nicheTrendScore: null,
          trendVerdict: null,
          trendPillars: [],
          soundRecommendations: [],
          hookMutations: [],
          actionableBlueprints: [],
          generatedAt: null,
        });
      } catch (error) {
        if (error instanceof TrendServiceError) {
          return apiError(error.code, error.message);
        }
        throw error;
      }
    }

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

    const posts = await db
      .select({
        timestamp: reels.timestamp,
        engagementRate: reels.engagementRate,
        skipRate: reels.skipRate,
      })
      .from(reels)
      .where(
        and(eq(reels.accountId, accountId), gte(reels.timestamp, cutoff))
      )
      .orderBy(desc(reels.timestamp));

    const timeline = buildEngagementTimeline(posts, days);

    return apiSuccess({
      hasData: timeline.length > 0,
      timeline,
    });
  })
);
