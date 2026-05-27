import { getCurrentPeriodUsage, checkUsageLimit } from "@/lib/billing/usage-tracker";
import { withAuth, AuthenticatedRequest } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { PlanId } from "@/lib/billing/plans";

/**
 * GET /api/billing/usage
 * Gated with Session Authentication. Retrieves current period usage and limits evaluations.
 */
async function handleGetUsage(request: AuthenticatedRequest) {
  const userId = request.user.id;

  try {
    const usage = await getCurrentPeriodUsage(userId);
    const planId = (request.user.subscription?.planId || "free") as PlanId;
    const prefetched = { usage, planId };

    // Evaluate allowance, limits and remaining counts for the three core operations
    const reelAnalysisCheck = await checkUsageLimit(userId, "reel_analysis", prefetched);
    const strategyCheck = await checkUsageLimit(userId, "strategy_generation", prefetched);
    const aiCallCheck = await checkUsageLimit(userId, "ai_call", prefetched);

    return apiSuccess({
      periodMonth: usage.periodMonth,
      usage: {
        reelsAnalyzed: usage.reelsAnalyzed,
        strategiesGen: usage.strategiesGen,
        aiCallsCount: usage.aiCallsCount,
        aiTokensUsed: usage.aiTokensUsed,
        aiCostUsd: usage.aiCostUsd,
        apiCallsCount: usage.apiCallsCount,
      },
      checks: {
        reelAnalysis: {
          used: usage.reelsAnalyzed,
          limit: reelAnalysisCheck.limit,
          remaining: reelAnalysisCheck.remaining,
          allowed: reelAnalysisCheck.allowed,
        },
        strategyGeneration: {
          used: usage.strategiesGen,
          limit: strategyCheck.limit,
          remaining: strategyCheck.remaining,
          allowed: strategyCheck.allowed,
        },
        aiCall: {
          used: usage.aiCallsCount,
          limit: aiCallCheck.limit,
          remaining: aiCallCheck.remaining,
          allowed: aiCallCheck.allowed,
        },
      },
    });
  } catch (err) {
    console.error(`[usage-api] Failed to retrieve usage statistics for user ${userId}:`, err);
    return apiError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Failed to retrieve monthly usage telemetry."
    );
  }
}

export const GET = withAuth(handleGetUsage);
