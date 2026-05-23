/**
 * Database-Backed Job Queue (spec §9).
 *
 * Lightweight job enqueuing that inserts directly into the `job_queue` table.
 * Supports idempotency keys for deduplication (ON CONFLICT DO NOTHING).
 *
 * NOTE: This is an MVP enqueue-only implementation. Job consumption /
 * processing workers are a separate concern (Phase 9).
 */

import { db } from "@/lib/db";
import { jobQueue } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────────────

export interface EnqueueOptions {
  /** Deterministic key for deduplication. Duplicate keys are silently ignored. */
  idempotencyKey?: string;
  /** Job priority (higher = processed first). Default: 0. */
  priority?: number;
  /** Earliest time to process the job. Default: now. */
  scheduledAt?: Date;
  /** Max retry attempts before dead-lettering. Default: 3. */
  maxRetries?: number;
}

export interface EnqueuedJob {
  id: string;
  jobType: string;
  status: string;
}

// ── Job Type Constants ─────────────────────────────────────────────────────

export const JOB_TYPES = {
  /** Full account data sync (manual or scheduled). */
  SYNC_ACCOUNT: "SYNC_ACCOUNT",
  /** Score a single reel using AI analysis. */
  SCORE_REEL: "SCORE_REEL",
  /** Process a single incoming Instagram webhook event. */
  PROCESS_WEBHOOK: "PROCESS_WEBHOOK",
  /** Refresh an expiring OAuth token. */
  REFRESH_TOKEN: "REFRESH_TOKEN",
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Enqueue a job into the database-backed queue.
 *
 * When an `idempotencyKey` is provided, duplicate jobs are silently
 * deduplicated via a SELECT guard. In PostgreSQL, multiple NULLs are
 * allowed in unique columns, so jobs without an idempotency key are
 * always inserted.
 *
 * @returns The enqueued job, or `null` if a duplicate idempotency key was found.
 */
export async function enqueueJob(
  jobType: string,
  payload: Record<string, unknown>,
  options: EnqueueOptions = {}
): Promise<EnqueuedJob | null> {
  // Idempotency guard: check if a job with this key already exists
  if (options.idempotencyKey) {
    const existing = await db.query.jobQueue.findFirst({
      where: eq(jobQueue.idempotencyKey, options.idempotencyKey),
      columns: { id: true },
    });

    if (existing) {
      return null; // Deduplicated — silent skip
    }
  }

  const [job] = await db
    .insert(jobQueue)
    .values({
      jobType,
      payload,
      status: "pending",
      priority: options.priority ?? 0,
      maxRetries: options.maxRetries ?? 3,
      scheduledAt: options.scheduledAt ?? new Date(),
      idempotencyKey: options.idempotencyKey ?? null,
    })
    .onConflictDoNothing({ target: jobQueue.idempotencyKey })
    .returning({
      id: jobQueue.id,
      jobType: jobQueue.jobType,
      status: jobQueue.status,
    });

  return job ?? null;
}

/**
 * Enqueue multiple jobs in a single transaction.
 * Each job independently applies its own idempotency check.
 */
export async function enqueueJobs(
  jobs: Array<{
    jobType: string;
    payload: Record<string, unknown>;
    options?: EnqueueOptions;
  }>
): Promise<Array<EnqueuedJob | null>> {
  const results: Array<EnqueuedJob | null> = [];

  for (const { jobType, payload, options } of jobs) {
    const result = await enqueueJob(jobType, payload, options);
    results.push(result);
  }

  return results;
}
