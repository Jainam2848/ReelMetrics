import { createCheckoutSession } from "@/lib/billing/stripe-helpers";
import { PlanId } from "@/lib/billing/plans";
import { withAuth, withValidation, AuthenticatedRequest, RouteHandler } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

const checkoutSchema = z.object({
  planId: z.enum(["creator", "pro", "agency"]),
  returnUrl: z.string().url(),
});

/**
 * POST /api/billing/checkout
 * Gated with Session Authentication. Initializes checkout session for plan upgrades.
 */
async function handleCheckout(request: AuthenticatedRequest) {
  const userId = request.user.id;
  
  let body: z.infer<typeof checkoutSchema>;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Failed to retrieve parsed parameters.");
  }

  const { planId, returnUrl } = body;

  try {
    const checkoutUrl = await createCheckoutSession(userId, planId as PlanId, returnUrl);
    return apiSuccess({ checkoutUrl });
  } catch (err) {
    console.error(`[checkout-api] Session creation failed for user ${userId}:`, err);
    return apiError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Failed to initialize Stripe checkout session."
    );
  }
}

export const POST = withAuth(
  withValidation(checkoutSchema, handleCheckout as unknown as RouteHandler)
);
