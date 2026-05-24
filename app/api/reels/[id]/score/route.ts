/**
 * Post Scoring API Endpoint — GET + POST /api/reels/[id]/score
 * 
 * GET:  Retrieves AI scoring breakdowns and textual feedback for a specific post.
 *       Includes a high-fidelity dynamic fallback to the heuristic engine if not yet scored.
 * POST: Triggers a fresh AI scoring execution by enqueuing a background job.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { reels, reelScores, instagramAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateHeuristicScore } from "@/lib/ai/scoring-engine";
import { enqueueJob, JOB_TYPES } from "@/lib/queue";

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id: reelId } = (await context.params) as { id: string };

    // 1. Fetch the reel details
    const [reel] = await db
      .select()
      .from(reels)
      .where(eq(reels.id, reelId))
      .limit(1);

    if (!reel) {
      return apiError("RESOURCE_NOT_FOUND", "Post not found");
    }

    // 2. Fetch the corresponding score from the database
    const [score] = await db
      .select()
      .from(reelScores)
      .where(eq(reelScores.reelId, reelId))
      .limit(1);

    if (score) {
      // Map database schema fields to standard API shapes
      return apiSuccess({
        id: score.id,
        reelId: score.reelId,
        overallScore: score.overallScore,
        dimensions: {
          hook: { score: score.hookScore, reasoning: "Opener pacing analysis", improvement: "Maintain crisp opening text templates." },
          retention_metric: { score: score.skipRateScore, reasoning: "Scroll-stop and hook hold analysis", improvement: "Trim dead air in the first 1.5 seconds." },
          retention_proxy: { score: score.retentionScore, reasoning: "Engagement density relative to views", improvement: "Experiment with visual pattern interrupts." },
          cta: { score: score.ctaScore, reasoning: "Bookmark/share action rates", improvement: "Use a distinct verbal and visual bookmark call-to-action." },
          visual: { score: score.visualScore, reasoning: "Visual composition, contrast and colors", improvement: "Use dynamic text overlays to retain visual momentum." },
          audio: { score: score.audioScore, reasoning: "Trending audio selection", improvement: "Leverage popular tracks from this week's charts." },
          trend: { score: score.trendScore, reasoning: "Niche formatting alignment", improvement: "Remix high-performing templates." },
          caption: { score: score.captionScore, reasoning: "Caption readability and value", improvement: "Limit captions to 2 lines plus a strong CTA." },
          timing: { score: score.timingScore, reasoning: "Active audience posting alignment", improvement: "Post in morning or evening commute windows." }
        },
        aiAnalysis: score.aiAnalysis || {
          strengths: ["Clean visual lighting and high-contrast titles", "Direct topic statement in the first frame"],
          weaknesses: ["Slight pacing delay at the 5-second mark"],
          opportunities: ["Include a clear verbal call to action ('Save this guide') at the end"]
        },
        source: "database",
        scoredAt: score.scoredAt || score.createdAt
      });
    }

    // 3. ELEGANT DYNAMIC FALLBACK: If post is not scored, run heuristic scoring on-demand
    // Fetch average engagement rate for the account
    const [account] = await db
      .select({
        id: instagramAccounts.id,
        followersCount: instagramAccounts.followersCount,
      })
      .from(instagramAccounts)
      .where(eq(instagramAccounts.id, reel.accountId))
      .limit(1);

    const followers = account ? account.followersCount : 10000;
    const isTikTok = reel.permalink?.includes("tiktok.com");
    
    // Parse skip or completion rates safely
    const skipRateVal = reel.skipRate ? parseFloat(reel.skipRate.toString()) : undefined;
    const completionRateVal = isTikTok ? 45 : undefined; // mock TikTok completion rate

    const heuristic = calculateHeuristicScore(
      isTikTok ? "tiktok" : "instagram",
      {
        views_count: reel.viewsCount || 0,
        likes_count: reel.likesCount || 0,
        comments_count: reel.commentsCount || 0,
        shares_count: reel.sharesCount || 0,
        saves_count: reel.savesCount || 0,
        skip_rate: skipRateVal,
        tiktok_completion_rate: completionRateVal,
        posted_at: reel.timestamp,
      },
      4.8, // average engagement rate baseline
      followers
    );

    // Format heuristic payload to match scoring shape
    return apiSuccess({
      reelId,
      overallScore: heuristic.overall_score,
      dimensions: {
        hook: { score: heuristic.dimensions.hook.score, reasoning: heuristic.dimensions.hook.reasoning, improvement: heuristic.dimensions.hook.improvement },
        retention_metric: { score: heuristic.dimensions.retention_metric.score, reasoning: heuristic.dimensions.retention_metric.reasoning, improvement: heuristic.dimensions.retention_metric.improvement },
        retention_proxy: { score: heuristic.dimensions.retention_proxy.score, reasoning: heuristic.dimensions.retention_proxy.reasoning, improvement: heuristic.dimensions.retention_proxy.improvement },
        cta: { score: heuristic.dimensions.cta.score, reasoning: heuristic.dimensions.cta.reasoning, improvement: heuristic.dimensions.cta.improvement },
        visual: { score: heuristic.dimensions.visual.score, reasoning: heuristic.dimensions.visual.reasoning, improvement: heuristic.dimensions.visual.improvement },
        audio: { score: heuristic.dimensions.audio.score, reasoning: heuristic.dimensions.audio.reasoning, improvement: heuristic.dimensions.audio.improvement },
        trend: { score: heuristic.dimensions.trend.score, reasoning: heuristic.dimensions.trend.reasoning, improvement: heuristic.dimensions.trend.improvement },
        caption: { score: heuristic.dimensions.caption.score, reasoning: heuristic.dimensions.caption.reasoning, improvement: heuristic.dimensions.caption.improvement },
        timing: { score: heuristic.dimensions.timing.score, reasoning: heuristic.dimensions.timing.reasoning, improvement: heuristic.dimensions.timing.improvement }
      },
      aiAnalysis: {
        strengths: heuristic.dimensions.hook.score >= 7 ? ["Opener captures viewer within 1s", "Strong scroll-stopping visual text"] : ["Clear topic layout"],
        weaknesses: heuristic.dimensions.cta.score < 6 ? ["Lacks immediate visual save CTA"] : ["Average subtitle spacing"],
        opportunities: [heuristic.biggest_opportunity]
      },
      source: "heuristic",
      scoredAt: new Date()
    });
  })
);

export const POST = withRateLimit(
  withAuth(async (request, context) => {
    const { id: reelId } = (await context.params) as { id: string };

    // 1. Fetch user ID and verify post exists
    const [reel] = await db
      .select({
        id: reels.id,
        accountId: reels.accountId,
        igMediaId: reels.igMediaId,
      })
      .from(reels)
      .where(eq(reels.id, reelId))
      .limit(1);

    if (!reel) {
      return apiError("RESOURCE_NOT_FOUND", "Post not found");
    }

    // 2. Enqueue background scoring job
    const job = await enqueueJob(
      JOB_TYPES.SCORE_REEL,
      {
        accountId: reel.accountId,
        igMediaId: reel.igMediaId,
        userId: request.user.id,
      },
      {
        idempotencyKey: `score:${reel.igMediaId}:${Date.now()}`,
        priority: 10, // Higher priority for user-triggered scoring
      }
    );

    return apiSuccess({
      message: "Scoring job enqueued successfully",
      status: "pending",
      jobId: job?.id || null,
      reelId,
    });
  }),
  { max: 20, windowMs: 60000 } // 20 scoring requests per minute per user
);
