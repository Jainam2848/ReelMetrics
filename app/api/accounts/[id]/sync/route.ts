/**
 * Manual Sync Trigger — POST /api/accounts/[id]/sync
 *
 * Triggers an on-demand data sync for a connected Instagram account.
 * Enforces the 5-minute cooldown between manual syncs to prevent
 * rapid API requests that could exhaust Instagram rate limits.
 */

import { NextRequest } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { SyncError } from "@/lib/services/ingestion.service";
import { db } from "@/lib/db";
import { instagramAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { enqueueJob, JOB_TYPES } from "@/lib/queue";

// ── POST: Trigger Manual Sync ──────────────────────────────────────────────

/**
 * POST /api/accounts/[id]/sync
 *
 * Triggers a manual sync for the specified Instagram account.
 * Delegates the processing to the database-backed job queue.
 *
 * Pre-flight validation (ownership, cooldown, rate-limit check) is done inline:
 * - Ownership verification (user must own the account)
 * - 5-minute cooldown enforcement
 * - Platform rate-limit cooldown check
 *
 * Returns the enqueued job details and "pending" status.
 */
export const POST = withRateLimit(
  withAuth(async (request, context) => {
    const { id } = (await context.params) as { id: string };
    const userId = request.user.id;

    try {
      // 1. Fetch account and verify ownership
      const account = await db.query.instagramAccounts.findFirst({
        where: and(
          eq(instagramAccounts.id, id),
          eq(instagramAccounts.userId, userId)
        ),
      });

      if (!account) {
        throw new SyncError(
          "RESOURCE_NOT_FOUND",
          `Account ${id} not found or not owned by user.`
        );
      }

      // 2. Enforce 5-minute manual sync cooldown
      const SYNC_COOLDOWN_MS = 5 * 60 * 1000;
      if (account.lastSyncedAt) {
        const timeSinceLastSync = Date.now() - account.lastSyncedAt.getTime();
        if (timeSinceLastSync < SYNC_COOLDOWN_MS) {
          const remainingSeconds = Math.ceil(
            (SYNC_COOLDOWN_MS - timeSinceLastSync) / 1000
          );
          throw new SyncError(
            "SYNC_COOLDOWN_ACTIVE",
            `Sync cooldown active. Please wait ${remainingSeconds} seconds.`
          );
        }
      }

      // 3. Respect platform rate-limit cooldown
      const IG_RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000; // 15 mins
      if (account.syncStatus === "rate_limited" && account.updatedAt) {
        const sinceRateLimit = Date.now() - account.updatedAt.getTime();
        if (sinceRateLimit < IG_RATE_LIMIT_COOLDOWN_MS) {
          const waitMinutes = Math.ceil(
            (IG_RATE_LIMIT_COOLDOWN_MS - sinceRateLimit) / 60_000
          );
          throw new SyncError(
            "IG_RATE_LIMITED",
            `Instagram rate limit cooldown active. Retry in ~${waitMinutes} minutes.`
          );
        }
      }

      // 4. Enqueue SYNC_ACCOUNT job with high priority (10)
      const job = await enqueueJob(
        JOB_TYPES.SYNC_ACCOUNT,
        {
          userId,
          accountId: id,
          skipCooldown: true, // Cooldown has already been verified at enqueue time!
          trigger: "manual",
        },
        {
          priority: 10, // high priority for manual trigger
          idempotencyKey: `sync:manual:${id}:${Date.now()}`,
        }
      );

      if (!job) {
        throw new SyncError(
          "SYNC_IN_PROGRESS",
          "Another sync is already in progress for this account."
        );
      }

      // 5. Update syncStatus to pending_sync so frontends know it's in the queue
      await db
        .update(instagramAccounts)
        .set({
          syncStatus: "pending_sync",
          updatedAt: new Date(),
        })
        .where(eq(instagramAccounts.id, id));

      return apiSuccess({
        message: "Sync enqueued successfully",
        jobId: job.id,
        status: "pending",
      });
    } catch (error) {
      if (error instanceof SyncError) {
        // Map SyncError codes to API error codes
        switch (error.code) {
          case "SYNC_COOLDOWN_ACTIVE":
            return apiError("SYNC_COOLDOWN_ACTIVE", error.message);

          case "RESOURCE_NOT_FOUND":
            return apiError("RESOURCE_NOT_FOUND", error.message);

          case "IG_TOKEN_INVALID":
            return apiError("IG_TOKEN_INVALID", error.message);

          case "IG_RATE_LIMITED":
            return apiError("IG_RATE_LIMITED", error.message);

          case "IG_QUOTA_EXHAUSTED":
            return apiError("IG_QUOTA_EXHAUSTED", error.message);

          case "SYNC_IN_PROGRESS":
            return apiError("SYNC_IN_PROGRESS", error.message);

          default:
            return apiError("INTERNAL_ERROR", error.message);
        }
      }

      console.error(
        `[sync-route] Unexpected error enqueuing sync for account ${id}:`,
        error instanceof Error ? error.message : "Unknown error"
      );

      return apiError(
        "INTERNAL_ERROR",
        "An unexpected error occurred during sync"
      );
    }
  }),
  { max: 10, windowMs: 300_000 } // Stricter rate limit: 10 syncs per 5 minutes
);
