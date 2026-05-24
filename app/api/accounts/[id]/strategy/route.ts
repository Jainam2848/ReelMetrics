import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getLatestStrategy,
  canEnqueueStrategyJob,
  StrategyServiceError,
} from "@/lib/services/strategy.service";
import { enqueueJob, JOB_TYPES } from "@/lib/queue";

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id: accountId } = (await context.params) as { id: string };

    try {
      const strategy = await getLatestStrategy(request.user.id, accountId);
      if (strategy) {
        return apiSuccess(strategy);
      }

      return apiSuccess({
        id: `fallback-strat-${accountId}`,
        accountId,
        strategyType: "weekly",
        content: {
          focus: "Connect your account and sync reels to generate a data-driven strategy",
          keyInsight: "No strategy has been generated yet. POST to this endpoint to enqueue generation.",
          postingCadence: "Monday, Wednesday, Friday",
          tactics: ["Sync your Instagram account", "Score your top reels", "Generate a weekly plan"],
          contentCalendar: [],
        },
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        generatedAt: null,
      });
    } catch (error) {
      if (error instanceof StrategyServiceError) {
        return apiError(error.code, error.message);
      }
      throw error;
    }
  })
);

export const POST = withRateLimit(
  withAuth(async (request, context) => {
    const { id: accountId } = (await context.params) as { id: string };

    const allowed = await canEnqueueStrategyJob(request.user.id);
    if (!allowed) {
      return apiError(
        "USAGE_LIMIT_EXCEEDED",
        "Monthly usage limit reached for strategy generation and AI calls"
      );
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
      return apiError("RESOURCE_NOT_FOUND", "Account not found");
    }

    const job = await enqueueJob(
      JOB_TYPES.GENERATE_STRATEGY,
      {
        accountId,
        userId: request.user.id,
      },
      {
        idempotencyKey: `strategy:${accountId}`,
        priority: 5,
      }
    );

    return apiSuccess({
      message: "Strategy generation job enqueued successfully",
      status: "pending",
      jobId: job?.id ?? null,
      accountId,
    });
  }),
  { max: 5, windowMs: 300000 }
);
