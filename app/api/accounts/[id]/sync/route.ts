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
import {
  syncAccount,
  SyncError,
} from "@/lib/services/ingestion.service";

// ── POST: Trigger Manual Sync ──────────────────────────────────────────────

/**
 * POST /api/accounts/[id]/sync
 *
 * Triggers a manual sync for the specified Instagram account.
 * The ingestion service handles:
 * - Ownership verification (user must own the account)
 * - 5-minute cooldown enforcement
 * - Token refresh if needed
 * - Data fetching, normalization, and upsert
 * - AI scoring job enqueuing
 *
 * Returns the sync result with counts of posts processed/created/updated.
 */
export const POST = withRateLimit(
  withAuth(async (request, context) => {
    const { id } = (await context.params) as { id: string };

    try {
      const result = await syncAccount(request.user.id, id);

      return apiSuccess({
        message: "Sync completed successfully",
        ...result,
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

          default:
            return apiError("INTERNAL_ERROR", error.message);
        }
      }

      console.error(
        `[sync-route] Unexpected error syncing account ${id}:`,
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
