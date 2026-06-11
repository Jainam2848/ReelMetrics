/**
 * POST /api/accounts/[id]/trends/analyze
 *
 * Enqueues an ANALYZE_TRENDS background job for the given account.
 * Returns the job id and pending status immediately.
 *
 * Rate-limited to 3 requests per 5 minutes per user to prevent
 * excessive AI credit consumption.
 */

import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { checkUsageLimit } from "@/lib/billing/usage-tracker";
import { enqueueJob, JOB_TYPES } from "@/lib/queue";

export const POST = withRateLimit(
  withAuth(async (request, context) => {
    const { id: accountId } = (await context.params) as { id: string };
    const userId = request.user.id;

    // 1. Verify account ownership
    const [account] = await db
      .select({ id: instagramAccounts.id, username: instagramAccounts.username })
      .from(instagramAccounts)
      .where(
        and(
          eq(instagramAccounts.id, accountId),
          eq(instagramAccounts.userId, userId)
        )
      )
      .limit(1);

    if (!account) {
      return apiError("RESOURCE_NOT_FOUND", "Account not found or access denied");
    }

    // 2. Preflight: check AI usage limit before enqueuing
    const limitCheck = await checkUsageLimit(userId, "ai_call");
    if (!limitCheck.allowed) {
      return apiError(
        "AI_BUDGET_EXCEEDED",
        "AI analysis budget exceeded for this period. Please upgrade your plan."
      );
    }

    // 3. Enqueue ANALYZE_TRENDS background job
    // Idempotency key prevents duplicate jobs for the same account within the same hour
    const hourBucket = Math.floor(Date.now() / (1000 * 60 * 60));
    const job = await enqueueJob(
      JOB_TYPES.ANALYZE_TRENDS,
      { userId, accountId },
      {
        idempotencyKey: `trends:${accountId}:${hourBucket}`,
        priority: 5,
      }
    );

    if (!job) {
      // Idempotency — a job was already enqueued this hour
      return apiSuccess({
        message: "A trend analysis job was already queued recently. Check back shortly.",
        status: "already_queued",
        jobId: null,
        accountId,
        username: account.username,
      });
    }

    return apiSuccess({
      message: "Trend analysis job enqueued successfully",
      status: "pending",
      jobId: job.id,
      accountId,
      username: account.username,
    });
  }),
  { max: 3, windowMs: 300000 } // 3 requests per 5 minutes
);
