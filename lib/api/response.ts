import { NextResponse } from "next/server";

/**
 * Standard registry mapping error codes to HTTP statuses and generic user messages (spec §5.4).
 */
export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: { status: 401, message: "Authentication required" },
  FORBIDDEN: { status: 403, message: "Insufficient permissions" },
  TOKEN_EXPIRED: { status: 401, message: "Instagram token expired, please reconnect" },

  // Validation
  VALIDATION_ERROR: { status: 400, message: "Invalid input" },
  RESOURCE_NOT_FOUND: { status: 404, message: "Resource not found" },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: { status: 429, message: "Too many requests" },
  PLAN_LIMIT_EXCEEDED: { status: 403, message: "Plan limit exceeded" },

  // Billing
  NO_ACTIVE_SUBSCRIPTION: { status: 403, message: "Active subscription required" },
  PAYMENT_FAILED: { status: 402, message: "Payment failed" },

  // Instagram
  IG_API_ERROR: { status: 502, message: "Instagram API error" },
  IG_RATE_LIMITED: { status: 429, message: "Instagram rate limit hit, retry later" },
  IG_QUOTA_EXHAUSTED: { status: 429, message: "Instagram hourly API quota exhausted — sync deferred" },
  SYNC_IN_PROGRESS: { status: 409, message: "A sync is already running for this account" },
  IG_TOKEN_INVALID: { status: 401, message: "Instagram connection lost" },

  // AI
  AI_BUDGET_EXCEEDED: { status: 403, message: "AI analysis budget exceeded for this period" },
  AI_SERVICE_UNAVAILABLE: { status: 503, message: "AI service temporarily unavailable" },
  USAGE_LIMIT_EXCEEDED: { status: 429, message: "Monthly usage limit reached for this feature" },
  SCORE_REFRESH_COOLDOWN: { status: 429, message: "Score was refreshed recently — try again in one hour" },

  // Abuse Safeguards (§12.4)
  ACCOUNT_ALREADY_LINKED: { status: 409, message: "This Instagram Business Account is already linked to another user profile" },

  // Sync
  SYNC_COOLDOWN_ACTIVE: { status: 429, message: "Sync cooldown active — please wait 5 minutes between syncs" },
  STALE_TOKEN_VERSION: { status: 409, message: "Token was updated by another process — please retry" },

  // Platform
  PLATFORM_NOT_SUPPORTED: { status: 400, message: "Platform not supported in this version" },
  INSTAGRAM_NOT_BUSINESS_ACCOUNT: { status: 400, message: "Only Instagram Business or Creator accounts are supported" },

  // System
  INTERNAL_ERROR: { status: 500, message: "Internal server error" },
  SERVICE_UNAVAILABLE: { status: 503, message: "Service temporarily unavailable" },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export interface PageMeta {
  page?: number;
  limit?: number;
  total?: number;
}

/**
 * Interface representing a standard successful API response (spec §5.1).
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

/**
 * Interface representing a standard failed API response (spec §5.1).
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

/**
 * Creates a standard JSON successful response.
 */
export function apiSuccess<T>(data: T, meta?: PageMeta): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status: 200 }
  );
}

/**
 * Creates a standard JSON error response mapped to standard status codes.
 */
export function apiError(
  code: ErrorCode,
  message?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const definition = ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
  const status = definition.status;

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: message || definition.message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}
