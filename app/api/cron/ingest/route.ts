import { withCronSecret } from "@/lib/api/middleware";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts } from "@/lib/db/schema";
import { enqueueJob, JOB_TYPES } from "@/lib/queue";
import {
  CRON_ACCOUNT_STAGGER_MS,
  getUtcHourBucket,
  SYNC_LOCK_STALE_MS,
} from "@/lib/ingestion/rate-limit-policy";
import { and, ne, or, isNull, lt, notInArray } from "drizzle-orm";

const STALE_SYNC_HOURS = 6;

/**
 * Enqueues stale account syncs with staggered start times.
 * Processing is handled by /api/queue/process or the CLI worker — not inline here.
 */
export const POST = withCronSecret(async () => {
  const staleCutoff = new Date(Date.now() - STALE_SYNC_HOURS * 60 * 60 * 1000);
  const hourBucket = getUtcHourBucket();
  const staleLockCutoff = new Date(Date.now() - SYNC_LOCK_STALE_MS);

  const accounts = await db
    .select({
      id: instagramAccounts.id,
      userId: instagramAccounts.userId,
    })
    .from(instagramAccounts)
    .where(
      and(
        ne(instagramAccounts.syncStatus, "disconnected"),
        notInArray(instagramAccounts.syncStatus, ["rate_limited"]),
        or(
          isNull(instagramAccounts.syncStatus),
          ne(instagramAccounts.syncStatus, "syncing"),
          lt(instagramAccounts.updatedAt, staleLockCutoff)
        ),
        or(
          isNull(instagramAccounts.lastSyncedAt),
          lt(instagramAccounts.lastSyncedAt, staleCutoff)
        )
      )
    );

  let enqueued = 0;
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]!;
    const scheduledAt = new Date(Date.now() + i * CRON_ACCOUNT_STAGGER_MS);

    const job = await enqueueJob(
      JOB_TYPES.SYNC_ACCOUNT,
      {
        userId: account.userId,
        accountId: account.id,
        skipCooldown: true,
        trigger: "scheduled",
      },
      {
        idempotencyKey: `sync:scheduled:${account.id}:${hourBucket}`,
        priority: 3,
        scheduledAt,
      }
    );
    if (job) enqueued++;
  }

  return apiSuccess({
    accountsEligible: accounts.length,
    jobsEnqueued: enqueued,
    message:
      "Sync jobs enqueued with staggered schedule. Run /api/queue/process or the worker daemon to execute.",
  });
});
