import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AuthService, UserProfile } from "@/lib/services/auth.service";
import { apiError } from "./response";
import { z } from "zod";

export interface RouteContext {
  params: Record<string, string | string[]>;
}

export type RouteHandler = (
  request: NextRequest,
  context: RouteContext
) => Promise<NextResponse> | NextResponse;

export type AuthenticatedRequest = NextRequest & { user: UserProfile };

export type AuthenticatedHandler = (
  request: AuthenticatedRequest,
  context: RouteContext
) => Promise<NextResponse> | NextResponse;

// Safe global in-memory rate-limit database mapping keys to request timestamp lists
const rateLimitStore = new Map<string, number[]>();

export interface RateLimitConfig {
  windowMs?: number; // Time frame in milliseconds
  max?: number;      // Max number of requests allowed in window
}

/**
 * Higher-Order Component that gates a route to authenticated users.
 * Extracts the user session from Supabase, updates/fetches user profiles,
 * and attaches the profile to `request.user`. Logs auth failures.
 */
export function withAuth(handler: AuthenticatedHandler): RouteHandler {
  return async (request: NextRequest, context: RouteContext) => {
    const supabase = await createClient();
    const user = await AuthService.getCurrentUser(supabase);

    if (!user) {
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      
      // Structured logging of auth failure
      await AuthService.logAudit({
        userId: null,
        action: "auth.unauthorized",
        resourceType: "auth",
        metadata: {
          path: request.nextUrl.pathname,
          message: "Access blocked by withAuth middleware.",
        },
        ipAddress,
      });

      return apiError("UNAUTHORIZED", "Authentication required to access this endpoint");
    }

    // Attach user profile to request object
    const authenticatedRequest = Object.assign(request, { user }) as AuthenticatedRequest;

    return handler(authenticatedRequest, context);
  };
}

/**
 * Higher-Order Component that validates request JSON against a Zod schema.
 * Overrides `request.json()` to return the successfully parsed data.
 */
export function withValidation<S extends z.ZodType>(
  schema: S,
  handler: RouteHandler
): RouteHandler {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      const contentType = request.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return apiError("VALIDATION_ERROR", "Content-Type must be application/json");
      }

      // Clone request to avoid body consumption errors, then parse json
      const rawBody = await request.clone().json();
      const parseResult = schema.safeParse(rawBody);

      if (!parseResult.success) {
        return apiError(
          "VALIDATION_ERROR",
          "Validation failed for incoming payload",
          parseResult.error.format()
        );
      }

      // Override request.json to supply the validated/coerced Zod payload
      const validatedRequest = Object.assign(request, {
        json: async () => parseResult.data,
      });

      return handler(validatedRequest, context);
    } catch (err) {
      return apiError(
        "VALIDATION_ERROR",
        "Failed to parse request body as valid JSON",
        err instanceof Error ? err.message : undefined
      );
    }
  };
}

/**
 * Higher-Order Component that rate limits requests per user (or per IP if anonymous).
 * Uses a memory-safe sliding window algorithm with periodic pruning to prevent leaks.
 */
export function withRateLimit(
  handler: RouteHandler,
  config?: RateLimitConfig
): RouteHandler {
  const windowMs = config?.windowMs || 60000; // 1 minute default
  const max = config?.max || 60;             // 60 requests default

  return async (request: NextRequest, context: RouteContext) => {
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown-ip";
    
    // Inspect if user profile is attached from withAuth
    const attachedUser = (request as { user?: UserProfile }).user;
    const key = attachedUser ? `user:${attachedUser.id}` : `ip:${ipAddress}`;

    const now = Date.now();
    const timestamps = rateLimitStore.get(key) || [];

    // Filter out expired timestamps
    const activeTimestamps = timestamps.filter((time) => now - time < windowMs);

    if (activeTimestamps.length >= max) {
      // Log rate limit hit
      if (attachedUser) {
        await AuthService.logAudit({
          userId: attachedUser.id,
          action: "rate_limit.exceeded",
          resourceType: "user",
          resourceId: attachedUser.id,
          metadata: { path: request.nextUrl.pathname, max, windowMs },
          ipAddress,
        });
      }

      return apiError(
        "RATE_LIMIT_EXCEEDED",
        `Too many requests. Maximum ${max} requests allowed per ${windowMs / 1000} seconds.`
      );
    }

    // Record access
    activeTimestamps.push(now);
    rateLimitStore.set(key, activeTimestamps);

    // Periodic memory safety pruning of global store
    if (rateLimitStore.size > 5000) {
      for (const [k, times] of rateLimitStore.entries()) {
        const validTimes = times.filter((time) => now - time < windowMs);
        if (validTimes.length === 0) {
          rateLimitStore.delete(k);
        } else {
          rateLimitStore.set(k, validTimes);
        }
      }
    }

    return handler(request, context);
  };
}
