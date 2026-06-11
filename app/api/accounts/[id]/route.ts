/**
 * Single Account Route — GET + DELETE /api/accounts/[id]
 *
 * GET:    Fetch details of a single connected Instagram account.
 * DELETE: Disconnect an account (GDPR-compliant — deletes tokens, keeps history).
 */

import { NextRequest } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts, auditLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AuthService } from "@/lib/services/auth.service";

// ── GET: Single Account Details ────────────────────────────────────────────

/**
 * GET /api/accounts/[id]
 *
 * Returns details for a single Instagram account owned by the authenticated user.
 * Sensitive fields (accessTokenEnc) are excluded from the response.
 */
export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id } = (await context.params) as { id: string };

    const account = await db
      .select({
        id: instagramAccounts.id,
        igUserId: instagramAccounts.igUserId,
        username: instagramAccounts.username,
        followersCount: instagramAccounts.followersCount,
        lastSyncedAt: instagramAccounts.lastSyncedAt,
        syncStatus: instagramAccounts.syncStatus,
        tokenExpiresAt: instagramAccounts.tokenExpiresAt,
        createdAt: instagramAccounts.createdAt,
        updatedAt: instagramAccounts.updatedAt,
      })
      .from(instagramAccounts)
      .where(
        and(
          eq(instagramAccounts.id, id),
          eq(instagramAccounts.userId, request.user.id)
        )
      )
      .limit(1);

    if (account.length === 0) {
      return apiError("RESOURCE_NOT_FOUND", "Account not found");
    }

    return apiSuccess(account[0]);
  })
);

// ── DELETE: Disconnect Account ─────────────────────────────────────────────

/**
 * DELETE /api/accounts/[id]
 *
 * Disconnects an Instagram account by:
 * 1. Nullifying the encrypted access token (GDPR: delete sensitive credentials)
 * 2. Setting sync_status to 'disconnected'
 * 3. Keeping historical reels data (user can still view past analytics)
 * 4. Logging the disconnection to the audit trail
 *
 * Note: Full data deletion (including reels history) is handled by
 * the DELETE /api/auth/me route (GDPR right to erasure), which cascade
 * deletes the user and all associated records.
 */
export const DELETE = withRateLimit(
  withAuth(async (request, context) => {
    const { id } = (await context.params) as { id: string };
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Verify ownership
    const [existing] = await db
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

    if (!existing) {
      return apiError("RESOURCE_NOT_FOUND", "Account not found");
    }

    // If it's a Sandbox Demo account (alice_reels), purge it completely!
    if (existing.username === "alice_reels") {
      await db.delete(instagramAccounts).where(eq(instagramAccounts.id, id));

      await AuthService.logAudit({
        userId: request.user.id,
        action: "social.account_deleted",
        resourceType: "instagram_account",
        resourceId: id,
        metadata: {
          username: existing.username,
          message: "Sandbox Demo account fully purged.",
        },
        ipAddress,
      });

      return apiSuccess({
        message: "Sandbox Demo disconnected and purged successfully.",
        accountId: id,
      });
    }

    // Disconnect: nullify token, keep history (regular accounts)
    await db
      .update(instagramAccounts)
      .set({
        accessTokenEnc: null,
        syncStatus: "disconnected",
        updatedAt: new Date(),
      })
      .where(eq(instagramAccounts.id, id));

    // Audit trail
    await AuthService.logAudit({
      userId: request.user.id,
      action: "social.account_disconnected",
      resourceType: "instagram_account",
      resourceId: id,
      metadata: {
        username: existing.username,
        dataRetained: true,
        message:
          "Token deleted, historical data retained. Full deletion via DELETE /api/auth/me.",
      },
      ipAddress,
    });

    return apiSuccess({
      message: "Account disconnected. Historical data has been retained.",
      accountId: id,
    });
  })
);

// ── PATCH: Update Account Properties (Niche & Goal) ─────────────────────────

/**
 * PATCH /api/accounts/[id]
 *
 * Updates an Instagram account's niche and growth goals.
 */
export const PATCH = withRateLimit(
  withAuth(async (request, context) => {
    const { id } = (await context.params) as { id: string };

    let body: { niche?: string; goal?: string } = {};
    try {
      body = await request.json().catch(() => ({}));
    } catch {
      return apiError("VALIDATION_ERROR", "Malformed or missing body");
    }

    const { niche, goal } = body;

    // Verify ownership
    const [existing] = await db
      .select({
        id: instagramAccounts.id,
      })
      .from(instagramAccounts)
      .where(
        and(
          eq(instagramAccounts.id, id),
          eq(instagramAccounts.userId, request.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return apiError("RESOURCE_NOT_FOUND", "Account not found");
    }

    // Build update object
    const updateFields: any = {
      updatedAt: new Date(),
    };
    if (niche !== undefined) updateFields.niche = niche;
    if (goal !== undefined) updateFields.goal = goal;

    await db
      .update(instagramAccounts)
      .set(updateFields)
      .where(eq(instagramAccounts.id, id));

    return apiSuccess({
      message: "Account properties updated successfully",
      niche,
      goal,
    });
  })
);
