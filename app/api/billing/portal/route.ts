import { createPortalSession } from "@/lib/billing/stripe-helpers";
import { withAuth, withValidation, AuthenticatedRequest, RouteHandler } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

const portalSchema = z.object({
  returnUrl: z.string().url(),
});

/**
 * POST /api/billing/portal
 * Gated with Session Authentication. Initializes customer billing portal session.
 */
async function handlePortal(request: AuthenticatedRequest) {
  const userId = request.user.id;

  let body: z.infer<typeof portalSchema>;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Failed to retrieve parsed parameters.");
  }

  const { returnUrl } = body;

  try {
    const portalUrl = await createPortalSession(userId, returnUrl);
    return apiSuccess({ portalUrl });
  } catch (err) {
    console.error(`[portal-api] Portal session creation failed for user ${userId}:`, err);
    return apiError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Failed to initialize Stripe billing portal session."
    );
  }
}

export const POST = withAuth(
  withValidation(portalSchema, handlePortal as unknown as RouteHandler)
);
