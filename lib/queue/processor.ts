/**
 * Shared queue processor — used by the CLI worker daemon and cron HTTP routes.
 */

import { db } from "../db";
import { jobQueue, instagramAccounts } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { syncAccount, SyncError } from "../services/ingestion.service";
import { scoreReelByMediaId } from "../services/scoring.service";
import { generateStrategy } from "../services/strategy.service";
import { TrendService } from "../services/trends.service";
import { enqueueJob, JOB_TYPES } from "./index";
import {
  isInstagramRateLimitFailure,
  isSyncSkippedError,
  queueRetryDelayMs,
  webhookDebounceBucket,
} from "../ingestion/rate-limit-policy";

export interface ProcessQueueResult {
  processed: number;
  completed: number;
  failed: number;
  skipped: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function claimNextJob(workerId: string) {
  const result = await db.execute(sql`
    WITH next_job AS (
        SELECT id
        FROM job_queue
        WHERE (status = 'pending' AND scheduled_at <= now())
           OR (status = 'processing' AND locked_at < now() - interval '5 minutes')
           OR (status = 'processing' AND last_heartbeat_at < now() - interval '90 seconds')
        ORDER BY priority DESC, scheduled_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    UPDATE job_queue
    SET 
        status = 'processing', 
        locked_at = now(), 
        locked_by = ${workerId},
        last_heartbeat_at = now(),
        retry_count = CASE WHEN status = 'processing' THEN retry_count + 1 ELSE retry_count END
    FROM next_job
    WHERE job_queue.id = next_job.id
    RETURNING job_queue.*;
  `);

  if (result.length === 0) return null;
  return result[0] as unknown as typeof jobQueue.$inferSelect;
}

async function completeJob(jobId: string) {
  await db
    .update(jobQueue)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(jobQueue.id, jobId));
}

/**
 * Route enqueued jobs to their respective service handlers.
 */
export async function executeJob(job: typeof jobQueue.$inferSelect) {
  const payload = job.payload as Record<string, unknown>;

  const heartbeatInterval = setInterval(async () => {
    try {
      await db
        .update(jobQueue)
        .set({ lastHeartbeatAt: new Date() })
        .where(eq(jobQueue.id, job.id));
    } catch {
      console.error(`[Queue Heartbeat Failed] for job ${job.id}`);
    }
  }, 30000);

  try {
    if (job.jobType === "SYNC_ACCOUNT") {
      const { userId, accountId, skipCooldown, trigger } = payload as {
        userId: string;
        accountId: string;
        skipCooldown?: boolean;
        trigger?: "manual" | "scheduled" | "webhook";
      };
      await syncAccount(userId, accountId, { skipCooldown, trigger });
    } else if (job.jobType === "SCORE_REEL") {
      const { accountId, igMediaId, userId } = payload as {
        accountId: string;
        igMediaId: string;
        userId: string;
      };
      await scoreReelByMediaId(userId, accountId, igMediaId);
    } else if (job.jobType === "GENERATE_STRATEGY") {
      const { accountId, userId } = payload as { accountId: string; userId: string };
      await generateStrategy(userId, accountId);
    } else if (job.jobType === "ANALYZE_TRENDS") {
      const { accountId, userId } = payload as { accountId: string; userId: string };
      await TrendService.runAnalysis(userId, accountId);
    } else if (job.jobType === "REFRESH_TRENDS_FEED") {
      await TrendService.refreshGlobalTrendsFeed();
    } else if (job.jobType === "PROCESS_WEBHOOK") {
      const { entryId } = payload as {
        entryId: string;
        field?: string;
        value?: unknown;
        time?: number;
      };
      const account = await db.query.instagramAccounts.findFirst({
        where: eq(instagramAccounts.igUserId, entryId),
      });

      if (!account) {
        console.warn(
          `[PROCESS_WEBHOOK] No account for ig_user_id=${entryId}; completing job.`
        );
      } else if (account.syncStatus === "rate_limited") {
        console.warn(
          `[PROCESS_WEBHOOK] Account ${account.id} is rate_limited; skipping debounced sync enqueue.`
        );
      } else {
        // Coalesce bursts into one SYNC_ACCOUNT job per debounce window
        await enqueueJob(
          JOB_TYPES.SYNC_ACCOUNT,
          {
            userId: account.userId,
            accountId: account.id,
            skipCooldown: true,
            trigger: "webhook",
          },
          {
            idempotencyKey: `sync:webhook:${account.id}:${webhookDebounceBucket()}`,
            priority: 8,
          }
        );
      }
    } else {
      console.log(`⚠️ Unhandled job type: [${job.jobType}]. Marking as completed.`);
    }

    clearInterval(heartbeatInterval);
    await completeJob(job.id);
  } catch (error) {
    clearInterval(heartbeatInterval);

    if (isSyncSkippedError(error)) {
      await completeJob(job.id);
      return;
    }

    throw error;
  }
}

async function handleJobFailure(
  job: typeof jobQueue.$inferSelect,
  error: unknown
) {
  const errorMessage = error instanceof Error ? error.message : "Unknown execution error";

  if (job.retryCount < job.maxRetries) {
    const delayMs = queueRetryDelayMs(job.retryCount, error);
    const nextSchedule = new Date(Date.now() + delayMs);

    await db
      .update(jobQueue)
      .set({
        status: "pending",
        scheduledAt: nextSchedule,
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(jobQueue.id, job.id));
  } else {
    await db
      .update(jobQueue)
      .set({
        status: "failed",
        deadLetter: true,
        failedAt: new Date(),
        errorMessage: `[Max Retries Exceeded] ${errorMessage}`,
        updatedAt: new Date(),
      })
      .where(eq(jobQueue.id, job.id));
  }
}

/**
 * Process jobs until maxRuntimeMs elapses or the queue is empty.
 */
export async function processQueueBatch(
  maxRuntimeMs: number,
  workerId = `processor-${Math.random().toString(36).substring(7)}`
): Promise<ProcessQueueResult> {
  const deadline = Date.now() + maxRuntimeMs;
  const result: ProcessQueueResult = {
    processed: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
  };

  while (Date.now() < deadline) {
    const job = await claimNextJob(workerId);
    if (!job) break;

    result.processed++;
    try {
      await executeJob(job);
      result.completed++;
    } catch (error) {
      if (isSyncSkippedError(error)) {
        result.skipped++;
        result.completed++;
        continue;
      }

      result.failed++;
      console.error(`❌ [Job ${job.id}] Execution failed:`, error);
      await handleJobFailure(job, error);

      if (isInstagramRateLimitFailure(error)) {
        console.warn(
          `[Job ${job.id}] Instagram rate limit — next retry uses minute-scale backoff.`
        );
      }
    }
  }

  return result;
}

export { sleep };
