import { db } from "@/lib/db";
import { usageTracking, subscriptions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getPlanLimits, PlanId } from "./plans";
import type { ModelTier } from "@/lib/ai/model-router";

export type UsageField =
  | "aiCallsCount"
  | "aiTokensUsed"
  | "aiCostUsd"
  | "reelsAnalyzed"
  | "strategiesGen"
  | "apiCallsCount";

export interface UserPlanContext {
  planId: PlanId;
  modelTier: ModelTier;
}

/**
 * Resolves the user's active plan and model routing tier for AI calls.
 */
export async function getUserPlanContext(userId: string): Promise<UserPlanContext> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
  const planId = (sub?.planId || "free") as PlanId;
  const limits = getPlanLimits(planId);
  return { planId, modelTier: limits.modelTier };
}

export interface UsageRecord {
  id: string;
  userId: string;
  periodMonth: string;
  aiCallsCount: number;
  aiTokensUsed: number;
  aiCostUsd: string;
  reelsAnalyzed: number;
  strategiesGen: number;
  apiCallsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Derives the active billing period formatted as YYYY-MM for the user.
 * Looks up their Stripe subscription period start date first; if absent, falls back to the current UTC calendar month.
 */
export async function getCurrentPeriodMonth(userId: string): Promise<string> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  let targetDate = new Date();
  if (sub && sub.currentPeriodStart) {
    targetDate = new Date(sub.currentPeriodStart);
  }

  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Returns the current period's usage record.
 * Creates it on the fly with clean defaults if not found.
 */
export async function getCurrentPeriodUsage(userId: string): Promise<UsageRecord> {
  const periodMonth = await getCurrentPeriodMonth(userId);

  // We acquire a transaction advisory lock per user to serialize initialization
  // and prevent duplicate row creation or race conditions under high concurrency
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('usage_init:' || ${userId}))`);

    let record = await tx.query.usageTracking.findFirst({
      where: and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.periodMonth, periodMonth)
      ),
    });

    if (!record) {
      const [newRecord] = await tx
        .insert(usageTracking)
        .values({
          userId,
          periodMonth,
          aiCallsCount: 0,
          aiTokensUsed: 0,
          aiCostUsd: "0",
          reelsAnalyzed: 0,
          strategiesGen: 0,
          apiCallsCount: 0,
        })
        .returning();

      if (!newRecord) {
        throw new Error(`Failed to initialize usage tracking record for period: ${periodMonth}`);
      }
      record = newRecord;
    }

    return record as unknown as UsageRecord;
  });
}

/**
 * Atomically increments a usage tracking field for the current period month.
 */
export async function incrementUsage(
  userId: string,
  field: UsageField,
  amount: number = 1
): Promise<void> {
  const periodMonth = await getCurrentPeriodMonth(userId);
  
  // Guarantee the record exists first to avoid update misses
  await getCurrentPeriodUsage(userId);

  if (field === "aiCostUsd") {
    // Preserve string decimal addition atomically
    await db
      .update(usageTracking)
      .set({
        aiCostUsd: sql`${usageTracking.aiCostUsd} + ${amount.toString()}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.periodMonth, periodMonth)
        )
      );
  } else {
    // Atomic increment of integers
    await db
      .update(usageTracking)
      .set({
        [field]: sql`${usageTracking[field]} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.periodMonth, periodMonth)
        )
      );
  }
}

/**
 * Checks if a specific action is within limits.
 * Returns boolean allowance, absolute remaining balance, and plan limit.
 */
export async function checkUsageLimit(
  userId: string,
  operation: "reel_analysis" | "strategy_generation" | "ai_call"
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // Fetch active subscription
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  const planId = (sub?.planId || "free") as PlanId;
  const limits = getPlanLimits(planId);

  // Fetch usage stats
  const usage = await getCurrentPeriodUsage(userId);

  let currentUsageValue = 0;
  let limit = 0;

  switch (operation) {
    case "reel_analysis":
      currentUsageValue = usage.reelsAnalyzed;
      limit = limits.maxReelsAnalyzed;
      break;
    case "strategy_generation":
      currentUsageValue = usage.strategiesGen;
      limit = limits.maxStrategies;
      break;
    case "ai_call":
      currentUsageValue = usage.aiCallsCount;
      limit = limits.maxAiCalls;
      break;
    default:
      throw new Error(`Invalid usage checking operation: ${operation}`);
  }

  const remaining = Math.max(0, limit - currentUsageValue);
  const allowed = remaining > 0;

  return {
    allowed,
    remaining,
    limit,
  };
}

/**
 * Admin utility: Resets all tracked counters to 0 for a given user's specific billing period month.
 */
export async function resetUsageForPeriod(userId: string, periodMonth: string): Promise<void> {
  await db
    .update(usageTracking)
    .set({
      aiCallsCount: 0,
      aiTokensUsed: 0,
      aiCostUsd: "0",
      reelsAnalyzed: 0,
      strategiesGen: 0,
      apiCallsCount: 0,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.periodMonth, periodMonth)
      )
    );
}
