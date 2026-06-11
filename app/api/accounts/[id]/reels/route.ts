/**
 * Account Reels/Posts Endpoint - GET /api/accounts/[id]/reels
 *
 * Returns paginated, sorted posts that have been synced for a connected account.
 */

import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts, reels, reelScores } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { triggerSyncIfStale } from "@/lib/services/ingestion.service";

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id } = (await context.params) as { id: string };

    // Trigger auto-sync if stale (respects Meta Graph rate limits)
    await triggerSyncIfStale(request.user.id, id);

    const [account] = await db
      .select({
        id: instagramAccounts.id,
        username: instagramAccounts.username,
      })
      .from(instagramAccounts)
      .where(
        and(
          eq(instagramAccounts.id, id),
          eq(instagramAccounts.userId, request.user.id)
        )
      )
      .limit(1);

    if (!account) {
      return apiError("RESOURCE_NOT_FOUND", "Account not found or access denied");
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || "10")));
    const sort = searchParams.get("sort") || "timestamp";
    const order = searchParams.get("order") || "desc";
    const platform = searchParams.get("platform") || "all";

    const rawDbReels = await db
      .select({
        id: reels.id,
        igMediaId: reels.igMediaId,
        caption: reels.caption,
        mediaUrl: reels.mediaUrl,
        permalink: reels.permalink,
        timestamp: reels.timestamp,
        viewsCount: reels.viewsCount,
        totalViews: reels.totalViews,
        displayViews: reels.displayViews,
        metricSource: reels.metricSource,
        likesCount: reels.likesCount,
        commentsCount: reels.commentsCount,
        sharesCount: reels.sharesCount,
        savesCount: reels.savesCount,
        publicReposts: reels.publicReposts,
        skipRate: reels.skipRate,
        engagementRate: reels.engagementRate,
        overallScore: reelScores.overallScore,
      })
      .from(reels)
      .leftJoin(reelScores, eq(reels.id, reelScores.reelId))
      .where(eq(reels.accountId, id));

    const instagramPosts = rawDbReels.map((post) => {
      let engagementRate = post.engagementRate;
      if (!engagementRate || parseFloat(engagementRate.toString()) === 0) {
        const totalInteractions =
          post.likesCount + post.commentsCount + post.sharesCount + post.savesCount;
        const views = post.displayViews || post.viewsCount || 0;
        engagementRate = views > 0 ? ((totalInteractions / views) * 100).toFixed(4) : "0.0000";
      }

      return {
        ...post,
        platform: "instagram" as const,
        engagementRate: parseFloat(engagementRate.toString()),
        skipRate: post.skipRate ? parseFloat(post.skipRate.toString()) : null,
        completionRate: null,
      };
    });

    const allPosts = platform === "tiktok" ? [] : [...instagramPosts];

    allPosts.sort((a, b) => {
      let comparison = 0;
      if (sort === "timestamp") {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sort === "views_count" || sort === "display_views") {
        comparison = (a.displayViews ?? 0) - (b.displayViews ?? 0);
      } else if (sort === "engagement_rate") {
        comparison = (a.engagementRate ?? 0) - (b.engagementRate ?? 0);
      } else if (sort === "overall_score" || sort === "score") {
        comparison = (a.overallScore ?? 0) - (b.overallScore ?? 0);
      } else if (sort === "skip_rate" || sort === "completion_rate") {
        const metricA = 100 - (a.skipRate ?? 100);
        const metricB = 100 - (b.skipRate ?? 100);
        comparison = metricA - metricB;
      }

      return order === "desc" ? -comparison : comparison;
    });

    const total = allPosts.length;
    const startIndex = (page - 1) * limit;
    const paginatedPosts = allPosts.slice(startIndex, startIndex + limit);

    return apiSuccess(paginatedPosts, {
      page,
      limit,
      total,
    });
  })
);
