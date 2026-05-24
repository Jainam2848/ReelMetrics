/**
 * Instagram Graph API rate-limit policy (spec §6.4, PRD §4.1).
 * Shared by ingestion, queue processor, and cron schedulers.
 */

/** Meta Graph API: ~200 calls per hour per connected Instagram user. */
export const IG_GRAPH_API_HOURLY_LIMIT = 200;

/** Reserve headroom for token refresh and manual retries. */
export const IG_GRAPH_API_QUOTA_RESERVE = 10;

/** Stale sync lock — allow reclaim after 10 minutes. */
export const SYNC_LOCK_STALE_MS = 10 * 60 * 1000;

/** Coalesce webhook-driven syncs into one job per account per window. */
export const WEBHOOK_SYNC_DEBOUNCE_MS = 10 * 60 * 1000;

/** Do not retry sync while account is rate_limited (matches max fetch backoff). */
export const IG_RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000;

/** Delay between cron-enqueued account syncs to avoid burst traffic. */
export const CRON_ACCOUNT_STAGGER_MS = 30_000;

/** Queue retry delays after Instagram 429 / rate_limited (1m → 15m). */
export const QUEUE_IG_RATE_LIMIT_BACKOFF_MS = [
  60_000,
  120_000,
  240_000,
  480_000,
  900_000,
] as const;

/** Default media page size in post-fetcher (keep in sync). */
export const DEFAULT_SYNC_MEDIA_LIMIT = 25;

export function estimateSyncApiCalls(mediaLimit = DEFAULT_SYNC_MEDIA_LIMIT): number {
  return 1 + mediaLimit;
}

export function getUtcHourBucket(date = new Date()): string {
  return date.toISOString().slice(0, 13);
}

export function webhookDebounceBucket(now = Date.now()): string {
  return String(Math.floor(now / WEBHOOK_SYNC_DEBOUNCE_MS));
}

export function queueRetryDelayMs(
  retryCount: number,
  error: unknown
): number {
  if (isInstagramRateLimitFailure(error)) {
    const idx = Math.min(retryCount, QUEUE_IG_RATE_LIMIT_BACKOFF_MS.length - 1);
    return QUEUE_IG_RATE_LIMIT_BACKOFF_MS[idx]!;
  }

  if (
    error instanceof Error &&
    (error.name === "SyncError" || error.message.includes("IG_QUOTA_EXHAUSTED"))
  ) {
    const code = (error as { code?: string }).code;
    if (code === "IG_QUOTA_EXHAUSTED") {
      return 15 * 60 * 1000;
    }
  }

  return Math.pow(2, retryCount) * 1000;
}

export function isInstagramRateLimitFailure(error: unknown): boolean {
  if (error instanceof Error) {
    if (error.name === "InstagramRateLimitError") return true;
    if (error.name === "SyncError" && (error as { code?: string }).code === "IG_RATE_LIMITED") {
      return true;
    }
    if (error.message.includes("IG_RATE_LIMITED")) return true;
  }
  return false;
}

export function isSyncSkippedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "SyncError" &&
    (error as { code?: string }).code === "SYNC_IN_PROGRESS"
  );
}
