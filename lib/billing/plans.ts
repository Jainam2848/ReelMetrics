export type PlanId = "free" | "creator" | "pro" | "agency";

export interface PlanLimits {
  maxAccounts: number;
  maxReelsAnalyzed: number;
  maxStrategies: number;
  maxAiCalls: number;
  aiModel: string;
  features: string[];
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxAccounts: 1,
    maxReelsAnalyzed: 10,
    maxStrategies: 0,
    maxAiCalls: 10,
    aiModel: "gpt-4o-mini",
    features: [
      "Core Analytics",
      "1 Instagram Account Connected",
      "Up to 10 Reels Scored per billing cycle",
      "10 AI calls monthly limit"
    ]
  },
  creator: {
    maxAccounts: 1,
    maxReelsAnalyzed: 100,
    maxStrategies: 4,
    maxAiCalls: 150,
    aiModel: "gpt-4o-mini",
    features: [
      "Creator Tier Analytics",
      "1 Instagram Account Connected",
      "Up to 100 Reels Scored per billing cycle",
      "4 Weekly Strategies Generated",
      "150 AI calls monthly limit"
    ]
  },
  pro: {
    maxAccounts: 3,
    maxReelsAnalyzed: 500,
    maxStrategies: 12,
    maxAiCalls: 600,
    aiModel: "gpt-4o",
    features: [
      "Professional Tier Analytics",
      "Up to 3 Instagram Accounts Connected",
      "Up to 500 Reels Scored per billing cycle",
      "12 Custom Strategies Generated",
      "600 AI calls monthly limit (Advanced Models)"
    ]
  },
  agency: {
    maxAccounts: 10,
    maxReelsAnalyzed: 2000,
    maxStrategies: 40,
    maxAiCalls: 2500,
    aiModel: "gpt-4o",
    features: [
      "Enterprise Tier Analytics",
      "Up to 10 Instagram Accounts Connected",
      "Up to 2000 Reels Scored per billing cycle",
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
