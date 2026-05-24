export type PlanId = "free" | "creator" | "pro" | "agency";

export interface PlanLimits {
  maxAccounts: number;
  maxReelsAnalyzed: number;
  maxStrategies: number;
  maxAiCalls: number;
  aiModel: string;
  modelTier: "standard" | "premium";
  features: string[];
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxAccounts: 1,
    maxReelsAnalyzed: 10,
    maxStrategies: 0,
    maxAiCalls: 10,
    aiModel: "Standard Routing Tier",
    modelTier: "standard",
    features: [
      "Core Analytics",
      "1 Instagram Account Connected",
      "Up to 10 Reels Scored per billing cycle",
      "10 AI calls monthly limit"
    ]
  },
  creator: {
    maxAccounts: 2,
    maxReelsAnalyzed: 50,
    maxStrategies: 4,
    maxAiCalls: 150,
    aiModel: "Standard Routing Tier",
    modelTier: "standard",
    features: [
      "Creator Tier Analytics",
      "Up to 1 Instagram Accounts Connected",
      "Up to 50 Reels Scored per billing cycle",
      "4 Weekly Strategies Generated",
      "150 AI calls monthly limit"
    ]
  },
  pro: {
    maxAccounts: 5,
    maxReelsAnalyzed: 200,
    maxStrategies: 12,
    maxAiCalls: 600,
    aiModel: "Premium Routing Tier",
    modelTier: "premium",
    features: [
      "Professional Tier Analytics",
      "Up to 5 Instagram Accounts Connected",
      "Up to 200 Reels Scored per billing cycle",
      "12 Custom Strategies Generated",
      "600 AI calls monthly limit (Advanced Models)"
    ]
  },
  agency: {
    maxAccounts: 20,
    maxReelsAnalyzed: 1000,
    maxStrategies: 40,
    maxAiCalls: 2500,
    aiModel: "Premium Routing Tier",
    modelTier: "premium",
    features: [
      "Enterprise Tier Analytics",
      "Up to 20 Instagram Accounts Connected",
      "Up to 1000 Reels Scored per billing cycle",
      "40 Client Strategies Generated",
      "2500 AI calls monthly limit (Premium Priority)"
    ]
  }
};

/**
 * Returns the limits configuration associated with a plan.
 * Falls back to 'free' limits if an unrecognized plan is provided.
 */
export function getPlanLimits(planId: PlanId): PlanLimits {
  return PLAN_LIMITS[planId] || PLAN_LIMITS.free;
}
