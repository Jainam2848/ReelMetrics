/**
 * Token Lifecycle Manager (spec §6.2).
 *
 * Manages Instagram OAuth token refresh, expiry detection, and invalidation.
 * Implements pessimistic locking (pg_advisory_xact_lock) during refresh to
 * prevent concurrent workers from issuing redundant token invalidations.
 *
 * Key constraints:
 * - Instagram long-lived tokens last 60 days; refresh at day 53 (7-day window).
 * - Token must be ≥24 hours old before refresh is allowed.
 * - Optimistic Concurrency Control (OCC) via `token_version` column.
 *
 * @security Decrypted tokens are NEVER logged or sent to error-tracking.
 */

import { db } from "@/lib/db";
import { instagramAccounts, auditLog } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { encryptToken, decryptToken } from "@/lib/security/encryption";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SocialAccount {
  id: string;
  userId: string;
  igUserId: string;
  username: string;
  accessTokenEnc: Buffer | null;
  tokenExpiresAt: Date | null;
  tokenVersion: number;
  followersCount: number;
  lastSyncedAt: Date | null;
  syncStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TokenRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

/** Refresh window: 7 days before expiry (spec §6.2). */
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Minimum token age before refresh is allowed: 24 hours (Instagram constraint). */
const MIN_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;

/** Instagram long-lived token lifetime: 60 days. */
const TOKEN_LIFETIME_MS = 60 * 24 * 60 * 60 * 1000;

const GRAPH_API_BASE = "https://graph.instagram.com";

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Determines whether an account's token needs refreshing.
 *
 * Returns true if the token expires within the 7-day refresh window.
 * Returns true if no expiry is set (defensive — assume it needs refresh).
 */
export function shouldRefresh(account: SocialAccount): boolean {
  if (!account.tokenExpiresAt) {
    return true; // No expiry recorded — refresh defensively
  }

  const now = Date.now();
  const expiresAt = account.tokenExpiresAt.getTime();
  const timeUntilExpiry = expiresAt - now;

  return timeUntilExpiry <= REFRESH_WINDOW_MS;
}

/**
 * Refreshes an Instagram long-lived token via the Meta API.
 *
 * Security controls:
 * 1. Pessimistic locking via `pg_advisory_xact_lock` prevents concurrent
 *    workers from refreshing the same token simultaneously.
 * 2. Minimum age check: rejects if token is less than 24 hours old.
 * 3. OCC: verifies `token_version` matches before applying the update.
 *
 * @param account  The social account whose token to refresh.
 * @returns The new encrypted token string stored in DB.
 * @throws On stale version (concurrent update), network failure, or API error.
 */
export async function refreshToken(account: SocialAccount): Promise<string> {
  // Guard: token must be at least 24 hours old
  if (account.tokenExpiresAt) {
    const tokenCreatedAt =
      account.tokenExpiresAt.getTime() - TOKEN_LIFETIME_MS;
    const tokenAgeMs = Date.now() - tokenCreatedAt;

    if (tokenAgeMs < MIN_TOKEN_AGE_MS) {
      throw new Error(
        `[token-manager] Token for account ${account.id} is less than 24 hours old. Refresh rejected.`
      );
    }
  }

  if (!account.accessTokenEnc) {
    throw new Error(
      `[token-manager] No encrypted token found for account ${account.id}`
    );
  }

  // Decrypt the current token for the refresh API call
  const currentToken = decryptToken(account.accessTokenEnc.toString("utf8"));

  return await db.transaction(async (tx) => {
    // 1. Acquire advisory lock scoped to this account to prevent concurrent refresh.
    //    Uses a 64-bit key space (split UUID into two 32-bit integers) to eliminate collision risks.
    const [key1, key2] = splitUuidToKeys(account.id);
    const lockResult = await tx.execute(
      sql`SELECT pg_try_advisory_xact_lock(${key1}, ${key2}) AS acquired`
    );

    const acquired = (lockResult as unknown as Array<{ acquired: boolean }>)?.[0]
      ?.acquired;
    if (!acquired) {
      throw new Error(
        `[token-manager] Could not acquire lock for account ${account.id} — another worker is refreshing.`
      );
    }

    // 2. Re-read the account inside the transaction to get the latest version
    const [freshAccount] = await tx
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.id, account.id))
      .limit(1);

    if (!freshAccount) {
      throw new Error(
        `[token-manager] Account ${account.id} not found during refresh.`
      );
    }

    // 3. OCC check: ensure no concurrent update has changed the version
    if (freshAccount.tokenVersion !== account.tokenVersion) {
      throw new Error(
        `[token-manager] Stale token version for account ${account.id}. ` +
          `Expected ${account.tokenVersion}, found ${freshAccount.tokenVersion}. ` +
          `Another process has already refreshed.`
      );
    }

    // 4. Call Meta API to refresh the long-lived token
    const refreshUrl =
      `${GRAPH_API_BASE}/refresh_access_token` +
      `?grant_type=ig_refresh_token` +
      `&access_token=${currentToken}`;

    const response = await fetch(refreshUrl);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[token-manager] Token refresh API error for account ${account.id}: HTTP ${response.status}`
      );
      // Do NOT log the error body if it might contain token data
      throw new Error(
        `[token-manager] Token refresh failed with HTTP ${response.status}`
      );
    }

    const data = (await response.json()) as TokenRefreshResponse;

    if (!data.access_token) {
      throw new Error(
        `[token-manager] Token refresh response missing access_token for account ${account.id}`
      );
    }

    // 5. Encrypt the new token before storage
    const encryptedToken = encryptToken(data.access_token);

    // 6. Calculate new expiry
    const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);

    // 7. Update with OCC guard (token_version must still match)
    const [updated] = await tx
      .update(instagramAccounts)
      .set({
        accessTokenEnc: Buffer.from(encryptedToken, "utf8"),
        tokenExpiresAt: newExpiresAt,
        tokenVersion: freshAccount.tokenVersion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(instagramAccounts.id, account.id),
          eq(instagramAccounts.tokenVersion, freshAccount.tokenVersion)
        )
      )
      .returning({ id: instagramAccounts.id });

    if (!updated) {
      throw new Error(
        `[token-manager] OCC conflict: token version changed during refresh for account ${account.id}`
      );
    }

    return encryptedToken;
  });
}

/**
 * Handles an invalidated/expired token by disconnecting the account.
 *
 * Sets sync_status to 'disconnected', clears the encrypted token,
 * and logs the event to the audit trail for operator visibility.
 */
export async function handleInvalidToken(
  account: SocialAccount
): Promise<void> {
  console.warn(
    `[token-manager] Marking account ${account.id} (${account.username}) as disconnected due to invalid token.`
  );

  await db
    .update(instagramAccounts)
    .set({
      syncStatus: "disconnected",
      accessTokenEnc: null,
      updatedAt: new Date(),
    })
    .where(eq(instagramAccounts.id, account.id));

  // Audit trail: record the disconnection event
  await db.insert(auditLog).values({
    userId: account.userId,
    action: "social.token_invalidated",
    resourceType: "instagram_account",
    resourceId: account.id,
    metadata: {
      username: account.username,
      reason: "Token expired or revoked by platform",
    },
  });
}

// ── Utilities ──────────────────────────────────────────────────────────────

/**
 * Splits a UUID string into two stable 32-bit signed integers for use in
 * a 2-key PostgreSQL advisory lock pg_try_advisory_xact_lock(key1, key2).
 *
 * This provides a 64-bit key space, mathematically eliminating the risk of
 * key collisions in practice (unlike a single 32-bit hash).
 */
function splitUuidToKeys(uuid: string): [number, number] {
  // Strip hyphens to get a 32-char hex string
  const clean = uuid.replace(/-/g, "");
  // Take first 8 chars and last 8 chars
  const part1 = clean.substring(0, 8);
  const part2 = clean.substring(24, 32);

  const key1 = parseInt(part1, 16) | 0; // Force signed 32-bit int
  const key2 = parseInt(part2, 16) | 0; // Force signed 32-bit int

  return [key1, key2];
}
