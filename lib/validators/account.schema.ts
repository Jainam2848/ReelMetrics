/**
 * Zod Validation Schemas for Social Account Management.
 *
 * Defines input validation for account connection, disconnection,
 * and sync trigger endpoints. Platform enum is restricted to 'instagram'
 * for the MVP; TikTok is deferred to Phase 11.
 */

import { z } from "zod";
import { uuidSchema } from "./common";

// ── Platform Enum ──────────────────────────────────────────────────────────

/**
 * Supported social platforms.
 * MVP: Instagram only. TikTok deferred to Post-MVP (Phase 11).
 */
export const platformSchema = z.enum(["instagram"], {
  message: "Unsupported platform. Currently supported: instagram",
});

export type Platform = z.infer<typeof platformSchema>;

// ── Route Parameter Schemas ────────────────────────────────────────────────

/** Validates the `[platform]` dynamic route segment. */
export const platformParamsSchema = z.object({
  platform: platformSchema,
});

/** Validates the `[id]` dynamic route segment for account endpoints. */
export const accountIdParamsSchema = z.object({
  id: uuidSchema,
});

// ── Request Body Schemas ───────────────────────────────────────────────────

/** POST /api/accounts — Connect a new social account. */
export const connectAccountSchema = z.object({
  platform: platformSchema,
});

/** POST /api/accounts/[id]/sync — Trigger manual sync. */
export const syncAccountSchema = z.object({
  // No body required — account ID comes from URL params.
  // This schema exists for extensibility (e.g., future `force` flag).
  force: z.boolean().optional().default(false),
});

// ── OAuth State Schema ─────────────────────────────────────────────────────

/**
 * Validates OAuth callback query parameters.
 * Used internally by the callback route handler.
 */
export const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().min(1, "State parameter is required"),
});

/**
 * Validates the OAuth error callback (user denied access).
 */
export const oauthErrorQuerySchema = z.object({
  error: z.string().optional(),
  error_reason: z.string().optional(),
  error_description: z.string().optional(),
});
