/**
 * OAuth Initiation Route — POST /api/auth/social/[platform]
 *
 * Generates platform-specific OAuth authorization URLs.
 * MVP: Instagram only. TikTok returns PLATFORM_NOT_SUPPORTED.
 *
 * Instagram scopes: instagram_business_basic, instagram_manage_insights,
 * pages_show_list, pages_read_engagement
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiError, apiSuccess } from "@/lib/api/response";
import { env } from "@/lib/env";

// ── Instagram OAuth Configuration ──────────────────────────────────────────

const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
].join(",");

/**
 * Meta's Facebook Login dialog endpoint for Instagram Business API.
 * Uses the Facebook OAuth dialog since instagram_business_basic requires
 * Facebook Login integration.
 */
const META_AUTH_BASE = "https://www.facebook.com/v22.0/dialog/oauth";

// ── Route Handler ──────────────────────────────────────────────────────────

/**
 * POST /api/auth/social/[platform]
 *
 * Generates an OAuth authorization URL for the specified platform and returns
 * it to the client. The client is responsible for redirecting the user.
 *
 * Sets an HTTP-only cookie with a CSRF state token that is validated
 * in the callback route.
 */
export const POST = withRateLimit(
  withAuth(async (request, context) => {
    const { platform } = (await context.params) as { platform: string };

    // Gate: only Instagram is supported in MVP
    if (platform !== "instagram") {
      return apiError(
        "PLATFORM_NOT_SUPPORTED",
        `Platform "${platform}" is not supported. Currently supported: instagram. ` +
          `TikTok integration is planned for a future release.`
      );
    }

    // Generate CSRF state token
    const state = randomBytes(32).toString("hex");

    // Build Meta OAuth authorization URL
    const authUrl = new URL(META_AUTH_BASE);
    authUrl.searchParams.set("client_id", env.INSTAGRAM_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", env.INSTAGRAM_REDIRECT_URI);
    authUrl.searchParams.set("scope", INSTAGRAM_SCOPES);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);

    // Set CSRF state in an HTTP-only cookie (validated in callback)
    const response = NextResponse.json(
      {
        success: true,
        data: { authUrl: authUrl.toString() },
      },
      { status: 200 }
    );

    response.cookies.set("ig_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes — generous window for OAuth flow
      path: "/",
    });

    return response;
  })
);
