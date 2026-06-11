/**
 * Content Momentum Score API Endpoint — GET /api/accounts/[id]/momentum
 *
 * Calculates a rolling momentum signal comparing the last 7 days vs the prior 7 days.
 * Employs a robust, in-memory cache keyed by accountId and validated against the last synced timestamp.
 */

import { NextRequest } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { TrendService } from "@/lib/services/trends.service";

interface CacheEntry {
  timestamp: number;
  lastSyncedAt: number;
  data: any;
}

// Global in-memory cache map
const momentumCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour

export const GET = withRateLimit(
  withAuth(async (request, context) => {
    const { id: accountId } = (await context.params) as { id: string };
    const userId = request.user.id;

    // 1. Verify account ownership and fetch sync state
    const [account] = await db
      .select({
        id: instagramAccounts.id,
        lastSyncedAt: instagramAccounts.lastSyncedAt,
      })
      .from(instagramAccounts)
      .where(
        and(
          eq(instagramAccounts.id, accountId),
          eq(instagramAccounts.userId, userId)
        )
      )
      .limit(1);

    if (!account) {
      return apiError("RESOURCE_NOT_FOUND", "Account not found or access denied");
    }

    const currentSyncTime = account.lastSyncedAt
      ? new Date(account.lastSyncedAt).getTime()
      : 0;

    // 2. Resolve cached record if valid (TTL and Sync-status check)
    const cached = momentumCache.get(accountId);
    const now = Date.now();

    if (
      cached &&
      now - cached.timestamp < CACHE_TTL_MS &&
      cached.lastSyncedAt === currentSyncTime
    ) {
      console.log(`[momentum-cache] HIT for account ${accountId}`);
      return apiSuccess(cached.data);
    }

    console.log(
      `[momentum-cache] MISS/STALE for account ${accountId} (lastSync: ${currentSyncTime}). Computing...`
    );

    // 3. Compute new metrics and AI interpretation
    try {
      const scoreData = await TrendService.getContentMomentumScore(userId, accountId);
      
      // Update cache
      momentumCache.set(accountId, {
        timestamp: now,
        lastSyncedAt: currentSyncTime,
        data: scoreData,
      });

      return apiSuccess(scoreData);
    } catch (error: any) {
      console.error("[momentum-route] Failed to compile momentum score:", error);
      return apiError(
        error.code || "INTERNAL_SERVER_ERROR",
        error.message || "An unexpected error occurred."
      );
    }
  })
);
