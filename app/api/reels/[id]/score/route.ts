import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { reels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getReelScore,
  scoreReel,
  canEnqueueScoreJob,
  ScoringServiceError,
} from "@/lib/services/scoring.service";
import { enqueueJob, JOB_TYPES } from "@/lib/queue";

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id: reelId } = (await context.params) as { id: string };

    try {
      const score = await getReelScore(request.user.id, reelId);
      return apiSuccess(score);
    } catch (error) {
      if (error instanceof ScoringServiceError) {
        return apiError(error.code, error.message);
      }
      throw error;
    }
  })
);

export const POST = withRateLimit(
  withAuth(async (request, context) => {
    const { id: reelId } = (await context.params) as { id: string };

    const allowed = await canEnqueueScoreJob(request.user.id);
    if (!allowed) {
      return apiError(
        "USAGE_LIMIT_EXCEEDED",
        "Monthly usage limit reached for reel analysis and AI calls"
      );
    }

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

    try {
      let forceRefresh = false;
      try {
        const body = await request.json();
        forceRefresh = Boolean((body as { forceRefresh?: boolean }).forceRefresh);
      } catch {
        // empty body is fine for enqueue
      }

      if (forceRefresh) {
        const score = await scoreReel(request.user.id, reelId, { forceRefresh: true });
        return apiSuccess({ message: "Score refreshed", status: "completed", score });
      }

      const job = await enqueueJob(
        JOB_TYPES.SCORE_REEL,
        {
          accountId: reel.accountId,
          igMediaId: reel.igMediaId,
          userId: request.user.id,
        },
        {
          idempotencyKey: `score:${reelId}`,
          priority: 10,
        }
      );

      return apiSuccess({
        message: "Scoring job enqueued successfully",
        status: "pending",
        jobId: job?.id ?? null,
        reelId,
      });
    } catch (error) {
      if (error instanceof ScoringServiceError) {
        return apiError(error.code, error.message);
      }
      throw error;
    }
  }),
  { max: 20, windowMs: 60000 }
);
