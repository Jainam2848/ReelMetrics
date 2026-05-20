import { z } from "zod";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AuthService } from "@/lib/services/auth.service";

// Zod schema for profile update validation
const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name must be at least 1 character")
    .max(100, "Full name cannot exceed 100 characters")
    .nullable()
    .optional(),
  avatarUrl: z
    .string()
    .url("Invalid avatar URL format")
    .nullable()
    .optional(),
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user's database profile and subscription details.
 */
export const GET = withRateLimit(
  withAuth(async (request) => {
    return apiSuccess(request.user);
  })
);

/**
 * PATCH /api/auth/me
 * Updates current authenticated user's profile info (fullName, avatarUrl).
 */
export const PATCH = withRateLimit(
  withAuth(async (request) => {
    try {
      const rawBody = await request.json();
      const parseResult = updateProfileSchema.safeParse(rawBody);

      if (!parseResult.success) {
        return apiError(
          "VALIDATION_ERROR",
          "Profile update validation failed",
          parseResult.error.format()
        );
      }

      const updated = await AuthService.updateProfile(request.user.id, parseResult.data);
      if (!updated) {
        return apiError("RESOURCE_NOT_FOUND", "Profile could not be found or updated");
      }

      // Log successful update action
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
      await AuthService.logAudit({
        userId: request.user.id,
        action: "user.profile_updated",
        resourceType: "user",
        resourceId: request.user.id,
        metadata: { updatedFields: Object.keys(parseResult.data) },
        ipAddress,
      });

      return apiSuccess(updated);
    } catch (err) {
      return apiError(
        "VALIDATION_ERROR",
        "Failed to parse request body as valid JSON",
        err instanceof Error ? err.message : undefined
      );
    }
  })
);

/**
 * DELETE /api/auth/me
 * Executes transactional cascade deletion of all user data (GDPR right to erasure).
 */
export const DELETE = withRateLimit(
  withAuth(async (request) => {
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");

    try {
      await AuthService.deleteAccount(request.user.id, ipAddress);

      const response = apiSuccess({
        message: "Your user profile, connected accounts, and all associated data have been permanently deleted in compliance with GDPR.",
      });

      // Clear any session-related cookies
      const cookieStore = request.cookies;
      cookieStore.getAll().forEach((cookie) => {
        if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase")) {
          response.cookies.delete(cookie.name);
        }
      });

      return response;
    } catch (err) {
      return apiError(
        "INTERNAL_ERROR",
        "An error occurred while executing GDPR cascade account deletion",
        err instanceof Error ? err.message : undefined
      );
    }
  })
);
