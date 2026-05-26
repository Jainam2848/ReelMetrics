/**
 * Accounts Collection Route — GET + POST /api/accounts
 *
 * GET:  List the authenticated user's connected social accounts.
 * POST: Initiate connection of a new social account (redirects to OAuth).
 */

import { NextRequest } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { connectAccountSchema } from "@/lib/validators/account.schema";

// ── GET: List Connected Accounts ───────────────────────────────────────────

/**
 * GET /api/accounts
 *
 * Returns all Instagram accounts connected by the authenticated user.
 * Sensitive fields (accessTokenEnc) are excluded from the response.
 */
export const GET = withRateLimit(
  withAuth(async (request) => {
    const accounts = await db
      .select({
        id: instagramAccounts.id,
        igUserId: instagramAccounts.igUserId,
        username: instagramAccounts.username,
        followersCount: instagramAccounts.followersCount,
        lastSyncedAt: instagramAccounts.lastSyncedAt,
        syncStatus: instagramAccounts.syncStatus,
        tokenExpiresAt: instagramAccounts.tokenExpiresAt,
        niche: instagramAccounts.niche,
        goal: instagramAccounts.goal,
        createdAt: instagramAccounts.createdAt,
        updatedAt: instagramAccounts.updatedAt,
      })
      .from(instagramAccounts)
      .where(eq(instagramAccounts.userId, request.user.id));

    return apiSuccess(accounts);
  })
);

// ── POST: Connect New Account ──────────────────────────────────────────────

/**
 * POST /api/accounts
 *
 * Validates the platform and returns the OAuth initiation URL.
 * The client is responsible for redirecting the user to begin the OAuth flow.
 *
 * Body: { platform: "instagram" }
 */
export const POST = withRateLimit(
  withAuth(async (request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("VALIDATION_ERROR", "Invalid JSON body");
    }

    const result = connectAccountSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid platform",
        result.error.format()
      );
    }

    const { platform } = result.data;

    // Gate: only Instagram in MVP
    if (platform !== "instagram") {
      return apiError(
        "PLATFORM_NOT_SUPPORTED",
        `Platform "${platform}" is not supported yet.`
      );
    }

    // Redirect client to the OAuth initiation endpoint
    return apiSuccess({
      redirectTo: `/api/auth/social/${platform}`,
      method: "POST",
      platform,
    });
  })
);
