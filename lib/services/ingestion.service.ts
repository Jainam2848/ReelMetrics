/**
 * Ingestion Orchestrator Service (spec §6).
 *
 * Coordinates the full Instagram data sync flow:
 * 1. Verify account ownership and cooldown
 * 2. Token health check / refresh
 * 3. Fetch posts from Instagram Graph API
 * 4. Normalize and upsert into database
 * 5. Enqueue AI scoring jobs for new/updated posts
 * 6. Update sync metadata and usage tracking
 *
 * @security Access tokens are decrypted only for API calls and never logged.
 */

import { db } from "@/lib/db";
import {
  instagramAccounts,
  reels,
  usageTracking,
  auditLog,
} from "@/lib/db/schema";
import { eq, and, or, ne, lt, sql } from "drizzle-orm";
import { decryptToken } from "@/lib/security/encryption";
import {
  shouldRefresh,
  refreshToken,
  handleInvalidToken,
} from "./token-manager";
import type { SocialAccount } from "./token-manager";
import { fetchInstagramPosts } from "@/lib/ingestion/post-fetcher";
import {
  InstagramTokenInvalidError,
  InstagramRateLimitError,
} from "@/lib/ingestion/post-fetcher";
import { normalizeInstagramPosts } from "@/lib/ingestion/data-normalizer";
import { enqueueJob, JOB_TYPES } from "@/lib/queue";
import {
  checkInstagramQuotaForSync,
  recordAccountApiCalls,
} from "@/lib/ingestion/instagram-quota";
import {
  IG_RATE_LIMIT_COOLDOWN_MS,
  SYNC_LOCK_STALE_MS,
} from "@/lib/ingestion/rate-limit-policy";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SyncResult {
  accountId: string;
  postsProcessed: number;
  postsCreated: number;
  postsUpdated: number;
  scoringJobsEnqueued: number;
  syncedAt: Date;
}

// ── Constants ──────────────────────────────────────────────────────────────

/**
 * Minimum interval between manual syncs: 5 minutes (spec §6).
 * Prevents rapid API requests that could exhaust Instagram rate limits.
 */
const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

export interface SyncAccountOptions {
  skipCooldown?: boolean;
  trigger?: "manual" | "scheduled" | "webhook";
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Orchestrates a full Instagram data sync for a user's connected account.
 *
 * Flow:
 * 1. Fetch account and verify ownership (userId must match)
 * 2. Enforce 5-minute manual sync cooldown
 * 3. Check/refresh token if nearing expiry
 * 4. Decrypt token and fetch posts from Instagram Graph API
 * 5. Normalize raw data to DB schema
 * 6. Upsert posts with ON CONFLICT deduplication
 * 7. Enqueue SCORE_REEL jobs for new/updated posts
 * 8. Update last_synced_at and sync_status
 * 9. Track API call usage
 *
 * @throws SYNC_COOLDOWN_ACTIVE — if synced within the last 5 minutes.
 * @throws RESOURCE_NOT_FOUND — if account doesn't exist or ownership mismatch.
 */
export async function syncAccount(
  userId: string,
  accountId: string,
  options: SyncAccountOptions = {}
): Promise<SyncResult> {
  // 1. Fetch account and verify ownership
  const account = await db.query.instagramAccounts.findFirst({
    where: and(
      eq(instagramAccounts.id, accountId),
      eq(instagramAccounts.userId, userId)
    ),
  });

  if (!account) {
    throw new SyncError(
      "RESOURCE_NOT_FOUND",
      `Account ${accountId} not found or not owned by user.`
    );
  }

  // 2. Enforce 5-minute cooldown (manual sync only)
  if (!options.skipCooldown && account.lastSyncedAt) {
    const timeSinceLastSync = Date.now() - account.lastSyncedAt.getTime();
    if (timeSinceLastSync < SYNC_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil(
        (SYNC_COOLDOWN_MS - timeSinceLastSync) / 1000
      );
      throw new SyncError(
        "SYNC_COOLDOWN_ACTIVE",
        `Sync cooldown active. Please wait ${remainingSeconds} seconds.`
      );
    }
  }

  // 2b. Respect platform rate-limit cooldown (all triggers)
  if (account.syncStatus === "rate_limited" && account.updatedAt) {
    const sinceRateLimit = Date.now() - account.updatedAt.getTime();
    if (sinceRateLimit < IG_RATE_LIMIT_COOLDOWN_MS) {
      const waitMinutes = Math.ceil(
        (IG_RATE_LIMIT_COOLDOWN_MS - sinceRateLimit) / 60_000
      );
      throw new SyncError(
        "IG_RATE_LIMITED",
        `Instagram rate limit cooldown active. Retry in ~${waitMinutes} minutes.`
      );
    }
  }

  // 2c. Pre-flight hourly Graph API quota (per Instagram account)
  const quota = await checkInstagramQuotaForSync(accountId);
  if (!quota.allowed) {
    throw new SyncError(
      "IG_QUOTA_EXHAUSTED",
      `Hourly Instagram API quota nearly exhausted (${quota.currentCalls}/${quota.limit} used; need ~${quota.estimatedCalls} calls).`
    );
  }

  // 3. Token must exist before claiming the sync lock (avoids stuck "syncing" status)
  if (!account.accessTokenEnc) {
    throw new SyncError(
      "IG_TOKEN_INVALID",
      "No access token available. Please reconnect your Instagram account."
    );
  }

  const socialAccount: SocialAccount = {
    id: account.id,
    userId: account.userId,
    igUserId: account.igUserId,
    username: account.username,
    accessTokenEnc: account.accessTokenEnc,
    tokenExpiresAt: account.tokenExpiresAt,
    tokenVersion: account.tokenVersion,
    followersCount: account.followersCount,
    lastSyncedAt: account.lastSyncedAt,
    syncStatus: account.syncStatus,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };

  // 2d. Per-account sync mutex (prevents overlapping full syncs)
  const lockAcquired = await tryAcquireSyncLock(accountId);
  if (!lockAcquired) {
    throw new SyncError(
      "SYNC_IN_PROGRESS",
      "Another sync is already in progress for this account."
    );
  }

  try {
  if (shouldRefresh(socialAccount)) {
    try {
      await refreshToken(socialAccount);
      // Re-fetch account to get the updated encrypted token
      const refreshed = await db.query.instagramAccounts.findFirst({
        where: eq(instagramAccounts.id, accountId),
      });
      if (refreshed?.accessTokenEnc) {
        socialAccount.accessTokenEnc = refreshed.accessTokenEnc;
      }
    } catch (refreshError) {
      console.error(
        `[ingestion] Token refresh failed for account ${accountId}:`,
        refreshError instanceof Error ? refreshError.message : "Unknown error"
      );
      // Continue with current token — it may still be valid
    }
  }

  let syncResult: SyncResult;

  try {
    // 4. Decrypt token and fetch posts
    const accessToken = decryptToken(
      socialAccount.accessTokenEnc!.toString("utf8")
    );

    const rawPosts = await fetchInstagramPosts(
      accessToken,
      socialAccount.igUserId
    );

    // 5. Normalize
    const normalizedPosts = normalizeInstagramPosts(rawPosts);

    // 6. Upsert into database with deduplication
    let postsCreated = 0;
    let postsUpdated = 0;
    const newMediaIds = new Set<string>();

    for (const post of normalizedPosts) {
      const [upserted] = await db
        .insert(reels)
        .values({
          accountId,
          igMediaId: post.igMediaId,
          caption: post.caption,
          mediaUrl: post.mediaUrl,
          permalink: post.permalink,
          timestamp: post.timestamp,
          viewsCount: post.viewsCount,
          totalViews: post.totalViews,
          displayViews: post.displayViews,
          metricSource: post.metricSource,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          sharesCount: post.sharesCount,
          savesCount: post.savesCount,
          publicReposts: post.publicReposts,
          skipRate: post.skipRate,
          reach: post.reach,
          engagementRate: post.engagementRate,
          fetchedAt: post.fetchedAt,
        })
        .onConflictDoUpdate({
          target: reels.igMediaId,
          set: {
            viewsCount: sql`EXCLUDED.views_count`,
            totalViews: sql`EXCLUDED.total_views`,
            displayViews: sql`EXCLUDED.display_views`,
            likesCount: sql`EXCLUDED.likes_count`,
            commentsCount: sql`EXCLUDED.comments_count`,
            sharesCount: sql`EXCLUDED.shares_count`,
            savesCount: sql`EXCLUDED.saves_count`,
            publicReposts: sql`EXCLUDED.public_reposts`,
            skipRate: sql`EXCLUDED.skip_rate`,
            reach: sql`EXCLUDED.reach`,
            engagementRate: sql`EXCLUDED.engagement_rate`,
            fetchedAt: sql`EXCLUDED.fetched_at`,
            updatedAt: sql`NOW()`,
          },
        })
        .returning({
          id: reels.id,
          createdAt: reels.createdAt,
          updatedAt: reels.updatedAt,
        });

      if (upserted) {
        // Heuristic: if createdAt ≈ updatedAt (within 1 second), it's a new record
        const isNew =
          Math.abs(
            upserted.createdAt.getTime() - upserted.updatedAt.getTime()
          ) < 1000;
        if (isNew) {
          postsCreated++;
          newMediaIds.add(post.igMediaId);
        } else {
          postsUpdated++;
        }
      }
    }

    // 7. Enqueue AI scoring jobs for newly created reels only (avoid queue floods)
    let scoringJobsEnqueued = 0;
    for (const igMediaId of newMediaIds) {
      const enqueued = await enqueueJob(
        JOB_TYPES.SCORE_REEL,
        {
          accountId,
          igMediaId,
          userId,
        },
        {
          idempotencyKey: `score:${igMediaId}`,
          priority: 0,
        }
      );
      if (enqueued) {
        scoringJobsEnqueued++;
      }
    }

    const syncedAt = new Date();

    // 8. Update last_synced_at and sync_status
    await db
      .update(instagramAccounts)
      .set({
        lastSyncedAt: syncedAt,
        syncStatus: "active",
        updatedAt: syncedAt,
      })
      .where(eq(instagramAccounts.id, accountId));

    const apiCallsUsed = rawPosts.length + 1;
    await recordAccountApiCalls(accountId, apiCallsUsed);
    await trackApiUsage(userId, apiCallsUsed);

    syncResult = {
      accountId,
      postsProcessed: normalizedPosts.length,
      postsCreated,
      postsUpdated,
      scoringJobsEnqueued,
      syncedAt,
    };

    // Audit trail
    await db.insert(auditLog).values({
      userId,
      action: "social.sync_completed",
      resourceType: "instagram_account",
      resourceId: accountId,
      metadata: {
        postsProcessed: syncResult.postsProcessed,
        postsCreated: syncResult.postsCreated,
        postsUpdated: syncResult.postsUpdated,
      },
    });
  } catch (error) {
    // Handle token invalidation
    if (error instanceof InstagramTokenInvalidError) {
      await handleInvalidToken(socialAccount);
      throw new SyncError(
        "IG_TOKEN_INVALID",
        "Instagram access token is invalid. Please reconnect your account."
      );
    }

    // Handle rate limiting
    if (error instanceof InstagramRateLimitError) {
      await db
        .update(instagramAccounts)
        .set({ syncStatus: "rate_limited", updatedAt: new Date() })
        .where(eq(instagramAccounts.id, accountId));

      throw new SyncError(
        "IG_RATE_LIMITED",
        "Instagram rate limit hit. Sync will be retried automatically."
      );
    }

    // Reset sync status on unexpected errors
    await db
      .update(instagramAccounts)
      .set({ syncStatus: "error", updatedAt: new Date() })
      .where(eq(instagramAccounts.id, accountId));

    throw error;
  }

  return syncResult;
  } catch (error) {
    await revertStuckSyncLock(accountId, error);
    throw error;
  }
}

/**
 * If sync failed while status is still "syncing", restore a terminal status.
 */
async function revertStuckSyncLock(
  accountId: string,
  error: unknown
): Promise<void> {
  const row = await db.query.instagramAccounts.findFirst({
    where: eq(instagramAccounts.id, accountId),
    columns: { syncStatus: true },
  });

  if (row?.syncStatus !== "syncing") return;

  if (error instanceof SyncError) {
    if (error.code === "IG_RATE_LIMITED") {
      await db
        .update(instagramAccounts)
        .set({ syncStatus: "rate_limited", updatedAt: new Date() })
        .where(eq(instagramAccounts.id, accountId));
      return;
    }
    if (error.code === "IG_TOKEN_INVALID") {
      await db
        .update(instagramAccounts)
        .set({ syncStatus: "disconnected", updatedAt: new Date() })
        .where(eq(instagramAccounts.id, accountId));
      return;
    }
  }

  await db
    .update(instagramAccounts)
    .set({ syncStatus: "error", updatedAt: new Date() })
    .where(eq(instagramAccounts.id, accountId));
}

/**
 * Atomically claims a per-account sync lock (status = syncing).
 * Stale locks older than SYNC_LOCK_STALE_MS may be reclaimed.
 */
async function tryAcquireSyncLock(accountId: string): Promise<boolean> {
  const staleBefore = new Date(Date.now() - SYNC_LOCK_STALE_MS);
  const rows = await db
    .update(instagramAccounts)
    .set({ syncStatus: "syncing", updatedAt: new Date() })
    .where(
      and(
        eq(instagramAccounts.id, accountId),
        or(
          ne(instagramAccounts.syncStatus, "syncing"),
          lt(instagramAccounts.updatedAt, staleBefore)
        )
      )
    )
    .returning({ id: instagramAccounts.id });

  return rows.length > 0;
}

// ── Usage Tracking ─────────────────────────────────────────────────────────

/**
 * Increments the API call counter in usage_tracking for the current period.
 * Creates the period row if it doesn't exist.
 */
async function trackApiUsage(
  userId: string,
  apiCallCount: number
): Promise<void> {
  const periodMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-05"

  try {
    // Try to increment existing row first
    const [updated] = await db
      .update(usageTracking)
      .set({
        apiCallsCount: sql`${usageTracking.apiCallsCount} + ${apiCallCount}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.periodMonth, periodMonth)
        )
      )
      .returning({ id: usageTracking.id });

    if (!updated) {
      // Create new period row
      await db.insert(usageTracking).values({
        userId,
        periodMonth,
        apiCallsCount: apiCallCount,
      });
    }
  } catch (error) {
    // Non-critical: don't fail the sync over usage tracking
    console.error("[ingestion] Failed to track API usage:", error);
  }
}

// ── Error Class ────────────────────────────────────────────────────────────

export class SyncError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "SyncError";
  }
}
