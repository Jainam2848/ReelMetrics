/**
 * Account Reels/Posts Endpoint — GET /api/accounts/[id]/reels
 * 
 * Returns paginated, sorted posts for a connected account.
 * Supports cross-platform queries (Instagram vs TikTok) with mock stubs for TikTok.
 */

import { NextRequest } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts, reels, reelScores } from "@/lib/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id } = (await context.params) as { id: string };

    // 1. Verify account ownership
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

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || "10")));
    const sort = searchParams.get("sort") || "timestamp";
    const order = searchParams.get("order") || "desc";
    const platform = searchParams.get("platform") || "all";

    // 3. Fetch real database reels (Instagram platform)
    let query = db
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

    // Execute query
    const rawDbReels = await query;

    // Normalize and add platform key
    const instagramPosts = rawDbReels.map((post) => {
      // Robust division-by-zero protection for engagement rate
      let engagementRate = post.engagementRate;
      if (!engagementRate || parseFloat(engagementRate.toString()) === 0) {
        const totalInteractions = post.likesCount + post.commentsCount + post.sharesCount + post.savesCount;
        const views = post.displayViews || post.viewsCount || 0;
        engagementRate = views > 0 ? ((totalInteractions / views) * 100).toFixed(4) : "0.0000";
      }

      return {
        ...post,
        platform: "instagram" as const,
        engagementRate: parseFloat(engagementRate.toString()),
        skipRate: post.skipRate ? parseFloat(post.skipRate.toString()) : null,
        completionRate: null, // Instagram reels use skip rate
      };
    });

    // 4. Synthesize high-fidelity mock TikTok posts if requested
    const mockTikTokPosts = [
      {
        id: `mock-tt-1-${id}`,
        igMediaId: `tt_media_1_${id}`,
        caption: "3 productivity hacks I wish I knew at 20 🧠⏱️ #productivity #lifehacks",
        mediaUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe",
        permalink: "https://www.tiktok.com/@creator/video/1",
        timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
        viewsCount: 32000,
        totalViews: 32000,
        displayViews: 32000,
        metricSource: "unified_views",
        likesCount: 3800,
        commentsCount: 120,
        sharesCount: 310,
        savesCount: 180,
        publicReposts: 15,
        skipRate: null,
        completionRate: 64.6, // TikTok uses completion rate
        engagementRate: 13.78,
        overallScore: 89,
        platform: "tiktok" as const,
      },
      {
        id: `mock-tt-2-${id}`,
        igMediaId: `tt_media_2_${id}`,
        caption: "Scaling our SaaS to $10k MRR in 30 days! 🚀📈 #saas #startup",
        mediaUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
        permalink: "https://www.tiktok.com/@creator/video/2",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        viewsCount: 150000,
        totalViews: 150000,
        displayViews: 150000,
        metricSource: "unified_views",
        likesCount: 18500,
        commentsCount: 650,
        sharesCount: 1200,
        savesCount: 950,
        publicReposts: 82,
        skipRate: null,
        completionRate: 81.1, // High completion
        engagementRate: 14.2,
        overallScore: 95,
        platform: "tiktok" as const,
      },
      {
        id: `mock-tt-3-${id}`,
        igMediaId: `tt_media_3_${id}`,
        caption: "Is Remote Work dying? 🌍💼 #remotework #career",
        mediaUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
        permalink: "https://www.tiktok.com/@creator/video/3",
        timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000),
        viewsCount: 95000,
        totalViews: 95000,
        displayViews: 95000,
        metricSource: "unified_views",
        likesCount: 11200,
        commentsCount: 420,
        sharesCount: 880,
        savesCount: 650,
        publicReposts: 41,
        skipRate: null,
        completionRate: 77.9,
        engagementRate: 13.84,
        overallScore: 92,
        platform: "tiktok" as const,
      }
    ];

    // Combine posts based on active filter
    let allPosts = [];
    if (platform === "instagram") {
      allPosts = instagramPosts;
    } else if (platform === "tiktok") {
      allPosts = mockTikTokPosts;
    } else {
      allPosts = [...instagramPosts, ...mockTikTokPosts];
    }

    // 5. Apply Sorting
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
        // Reframe comparison for moat index
        const metricA = a.platform === "tiktok" ? a.completionRate : (100 - (a.skipRate ?? 100));
        const metricB = b.platform === "tiktok" ? b.completionRate : (100 - (b.skipRate ?? 100));
        comparison = (metricA ?? 0) - (metricB ?? 0);
      }

      return order === "desc" ? -comparison : comparison;
    });

    // 6. Apply Pagination
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
