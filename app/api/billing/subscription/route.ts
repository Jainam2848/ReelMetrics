import { BillingService } from "@/lib/services/billing.service";
import { getPlanLimits, PlanId } from "@/lib/billing/plans";
import { withAuth, AuthenticatedRequest } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/billing/subscription
 * Gated with Session Authentication. Retrieves subscription details and limits.
 */
async function handleGetSubscription(request: AuthenticatedRequest) {
  const userId = request.user.id;

  try {
    const sub = await BillingService.getSubscription(userId);
    const planLimits = getPlanLimits(sub.planId as PlanId);

    return apiSuccess({
      subscription: {
        id: sub.id,
        planId: sub.planId,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAt: sub.cancelAt,
        stripeSubId: sub.stripeSubId,
      },
      limits: planLimits,
    });
  } catch (err) {
    console.error(`[subscription-api] Failed to retrieve subscription for user ${userId}:`, err);
    return apiError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Failed to retrieve active subscription details."
    );
  }
}

export const GET = withAuth(handleGetSubscription);
