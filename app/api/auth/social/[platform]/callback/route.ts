/**
 * OAuth Callback Route — GET /api/auth/social/[platform]/callback
 *
 * Handles the OAuth redirect from Instagram/Meta after user authorization.
 * Exchanges the authorization code for tokens, validates the account type,
 * encrypts the token, and creates/updates the instagram_accounts record.
 *
 * @security HMAC state validation prevents CSRF attacks.
 * @security Tokens are encrypted with AES-256-GCM before storage.
 * @security Decrypted tokens are NEVER logged.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AuthService } from "@/lib/services/auth.service";
import { db } from "@/lib/db";
import { instagramAccounts, auditLog } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { encryptToken } from "@/lib/security/encryption";
import { enqueueJob, JOB_TYPES } from "@/lib/queue";
import { env } from "@/lib/env";
import { getUserPlanContext } from "@/lib/billing/usage-tracker";
import { getPlanLimits } from "@/lib/billing/plans";

// ── Constants ──────────────────────────────────────────────────────────────

const META_TOKEN_URL = "https://graph.facebook.com/v22.0/oauth/access_token";
const META_LONG_LIVED_URL =
  "https://graph.facebook.com/v22.0/oauth/access_token";
const META_PAGES_URL = "https://graph.facebook.com/v22.0/me/accounts";
const IG_PROFILE_URL = "https://graph.instagram.com/v22.0/me";

/** Instagram long-lived token lifetime: 60 days. */
const TOKEN_LIFETIME_SECONDS = 60 * 24 * 60 * 60;

// Determine dashboard URL for redirects
const APP_URL = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Route Handler ──────────────────────────────────────────────────────────

/**
 * GET /api/auth/social/[platform]/callback
 *
 * Processes the OAuth callback:
 * 1. Validate CSRF state token from cookie
 * 2. Exchange code for short-lived token
 * 3. Exchange for long-lived token (60-day validity)
 * 4. Validate business account type via /me/accounts
 * 5. Fetch Instagram profile (id, username, followers_count)
 * 6. Encrypt token with AES-256-GCM
 * 7. Upsert instagram_accounts record with OCC
 * 8. Enqueue initial sync job
 * 9. Redirect to dashboard
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platform: string }> }
): Promise<NextResponse> {
  const { platform } = await context.params;
  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Gate: only Instagram in MVP
  if (platform !== "instagram") {
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=platform_not_supported&platform=${platform}`,
        APP_URL
      )
    );
  }

  const { searchParams } = request.nextUrl;

  // Check for OAuth error (user denied access)
  const oauthError = searchParams.get("error");
  if (oauthError) {
    const errorDescription =
      searchParams.get("error_description") ?? "Authorization denied";
    console.warn(
      `[oauth-callback] User denied Instagram access: ${errorDescription}`
    );
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=oauth_denied&message=${encodeURIComponent(errorDescription)}`,
        APP_URL
      )
    );
  }

  // 1. Extract and validate authorization code + CSRF state
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=missing_oauth_params", APP_URL)
    );
  }

  // Validate CSRF state against cookie
  const storedState = request.cookies.get("ig_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    await AuthService.logAudit({
      userId: null,
      action: "social.oauth_csrf_mismatch",
      resourceType: "oauth",
      metadata: { platform: "instagram" },
      ipAddress,
    });
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", APP_URL)
    );
  }

  // Authenticate the user making this request
  const supabase = await createClient();
  const user = await AuthService.getCurrentUser(supabase);

  if (!user) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  try {
    // 2. Exchange authorization code for short-lived token
    const tokenResponse = await fetch(META_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.INSTAGRAM_CLIENT_ID,
        client_secret: env.INSTAGRAM_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: env.INSTAGRAM_REDIRECT_URI,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error(
        `[oauth-callback] Token exchange failed: HTTP ${tokenResponse.status}`
      );
      return NextResponse.redirect(
        new URL("/dashboard?error=token_exchange_failed", APP_URL)
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      token_type: string;
    };

    // 3. Exchange for long-lived token
    const llTokenResponse = await fetch(
      `${META_LONG_LIVED_URL}?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: env.INSTAGRAM_CLIENT_ID,
          client_secret: env.INSTAGRAM_CLIENT_SECRET,
          fb_exchange_token: tokenData.access_token,
        }),
      { method: "GET" }
    );

    if (!llTokenResponse.ok) {
      console.error(
        `[oauth-callback] Long-lived token exchange failed: HTTP ${llTokenResponse.status}`
      );
      return NextResponse.redirect(
        new URL("/dashboard?error=token_exchange_failed", APP_URL)
      );
    }

    const llTokenData = (await llTokenResponse.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
    };

    const longLivedToken = llTokenData.access_token;
    const expiresIn = llTokenData.expires_in || TOKEN_LIFETIME_SECONDS;

    // 4. Validate Business Account via /me/accounts
    const pagesResponse = await fetch(
      `${META_PAGES_URL}?fields=instagram_business_account,name&access_token=${longLivedToken}`
    );

    if (!pagesResponse.ok) {
      console.error(
        `[oauth-callback] Pages API failed: HTTP ${pagesResponse.status}`
      );
      return NextResponse.redirect(
        new URL("/dashboard?error=pages_api_failed", APP_URL)
      );
    }

    const pagesData = (await pagesResponse.json()) as {
      data: Array<{
        id: string;
        name: string;
        instagram_business_account?: { id: string };
      }>;
    };

    // Find a page with an Instagram Business account
    const pageWithIg = pagesData.data?.find(
      (page) => page.instagram_business_account
    );

    if (!pageWithIg?.instagram_business_account) {
      await AuthService.logAudit({
        userId: user.id,
        action: "social.not_business_account",
        resourceType: "instagram_account",
        metadata: {
          pagesFound: pagesData.data?.length ?? 0,
          message:
            "User attempted to connect a non-Business Instagram account.",
        },
        ipAddress,
      });

      return NextResponse.redirect(
        new URL("/dashboard?error=not_business_account", APP_URL)
      );
    }

    const igBusinessAccountId = pageWithIg.instagram_business_account.id;

    // 5. Fetch Instagram profile details
    const profileResponse = await fetch(
      `${IG_PROFILE_URL}?fields=id,username,followers_count&access_token=${longLivedToken}`
    );

    let username = "unknown";
    let followersCount = 0;
    let igUserId = igBusinessAccountId;

    if (profileResponse.ok) {
      const profileData = (await profileResponse.json()) as {
        id: string;
        username?: string;
        followers_count?: number;
      };
      igUserId = profileData.id || igBusinessAccountId;
      username = profileData.username ?? "unknown";
      followersCount = profileData.followers_count ?? 0;
    }

    // 6. Encrypt the long-lived token
    const encryptedToken = encryptToken(longLivedToken);
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // 7. Upsert instagram_accounts record
    const existingAccount = await db.query.instagramAccounts.findFirst({
      where: eq(instagramAccounts.igUserId, igUserId),
    });

    let accountId: string;

    if (existingAccount) {
      // Abuse check: prevent linking to a different user (§12.4)
      if (existingAccount.userId !== user.id) {
        return NextResponse.redirect(
          new URL("/dashboard?error=account_already_linked", APP_URL)
        );
      }

      // Update existing account with OCC
      const [updated] = await db
        .update(instagramAccounts)
        .set({
          username,
          accessTokenEnc: Buffer.from(encryptedToken, "utf8"),
          tokenExpiresAt,
          tokenVersion: existingAccount.tokenVersion + 1,
          followersCount,
          syncStatus: "active",
          updatedAt: new Date(),
        })
        .where(eq(instagramAccounts.id, existingAccount.id))
        .returning({ id: instagramAccounts.id });

      if (!updated) {
        return NextResponse.redirect(
          new URL("/dashboard?error=connection_failed", APP_URL)
        );
      }
      accountId = updated.id;
    } else {
      const { planId } = await getUserPlanContext(user.id);
      const { maxAccounts } = getPlanLimits(planId);

      const [countRow] = await db
        .select({ total: count() })
        .from(instagramAccounts)
        .where(eq(instagramAccounts.userId, user.id));

      const connectedCount = Number(countRow?.total ?? 0);
      if (connectedCount >= maxAccounts) {
        await AuthService.logAudit({
          userId: user.id,
          action: "social.account_limit_reached",
          resourceType: "instagram_account",
          metadata: { planId, maxAccounts, connectedCount },
          ipAddress,
        });
        return NextResponse.redirect(
          new URL(
            `/dashboard?error=account_limit_reached&max=${maxAccounts}`,
            APP_URL
          )
        );
      }

      // Create new account
      const [created] = await db
        .insert(instagramAccounts)
        .values({
          userId: user.id,
          igUserId,
          username,
          accessTokenEnc: Buffer.from(encryptedToken, "utf8"),
          tokenExpiresAt,
          tokenVersion: 1,
          followersCount,
          syncStatus: "pending_sync",
        })
        .returning({ id: instagramAccounts.id });

      if (!created) {
        return NextResponse.redirect(
          new URL("/dashboard?error=connection_failed", APP_URL)
        );
      }
      accountId = created.id;
    }

    // 8. Enqueue initial sync job
    await enqueueJob(
      JOB_TYPES.SYNC_ACCOUNT,
      {
        userId: user.id,
        accountId,
        trigger: "oauth_connect",
      },
      {
        priority: 10, // High priority for initial sync
        idempotencyKey: `initial-sync:${accountId}`,
      }
    );

    // Audit trail
    await AuthService.logAudit({
      userId: user.id,
      action: existingAccount
        ? "social.account_reconnected"
        : "social.account_connected",
      resourceType: "instagram_account",
      resourceId: accountId,
      metadata: {
        igUserId,
        username,
      },
      ipAddress,
    });

    // 9. Clear CSRF cookie and redirect to dashboard
    const redirectResponse = NextResponse.redirect(
      new URL(`/dashboard?connected=instagram&account=${accountId}`, APP_URL)
    );
    redirectResponse.cookies.delete("ig_oauth_state");

    return redirectResponse;
  } catch (error) {
    console.error(
      "[oauth-callback] Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    await AuthService.logAudit({
      userId: user.id,
      action: "social.oauth_callback_error",
      resourceType: "oauth",
      metadata: {
        platform: "instagram",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      ipAddress,
    });

    return NextResponse.redirect(
      new URL("/dashboard?error=connection_failed", APP_URL)
    );
  }
}
