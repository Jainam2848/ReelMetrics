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
      "Core Algorithmic Metrics",
      "Single Creator Profile Integration",
      "10 High-Fidelity Reel Hook & Retention Scoring Runs / Cycle",
      "10 Priority API Processing Calls / Month"
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
      "Growth Tier Analytical Suite",
      "Dual-Profile Meta API Synchronization",
      "50 High-Fidelity Reel Hook & Retention Scoring Runs / Cycle",
      "4 Proprietary Creator Growth Strategies / Week",
      "150 Priority API Processing Calls / Month"
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
      "Scale Tier Clinical Analytics Suite",
      "Multi-Profile Meta API Sync (Up to 5 Accounts)",
      "200 High-Fidelity Reel Hook & Retention Scoring Runs / Cycle",
      "12 Custom Strategy Blueprints / Month",
      "600 Priority API Processing Calls (Advanced Multi-Modal)"
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
      "Enterprise Operations Hub",
      "High-Frequency Ingestion (Up to 20 Accounts)",
      "1000 High-Fidelity Reel Hook & Retention Scoring Runs / Cycle",
      "40 Custom Client Strategy Blueprints / Month",
      "2500 Priority API Processing Calls (Premium Priority)"
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
