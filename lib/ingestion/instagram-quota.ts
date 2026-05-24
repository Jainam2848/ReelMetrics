import { db } from "@/lib/db";
import { instagramApiHourly } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  estimateSyncApiCalls,
  getUtcHourBucket,
  IG_GRAPH_API_HOURLY_LIMIT,
  IG_GRAPH_API_QUOTA_RESERVE,
} from "./rate-limit-policy";

export interface QuotaCheckResult {
  allowed: boolean;
  hourBucket: string;
  currentCalls: number;
  estimatedCalls: number;
  remaining: number;
  limit: number;
}

export async function getAccountHourlyApiCalls(
  accountId: string,
  hourBucket = getUtcHourBucket()
): Promise<number> {
  const row = await db.query.instagramApiHourly.findFirst({
    where: and(
      eq(instagramApiHourly.accountId, accountId),
      eq(instagramApiHourly.hourBucket, hourBucket)
    ),
    columns: { callCount: true },
  });
  return row?.callCount ?? 0;
}

export async function recordAccountApiCalls(
  accountId: string,
  callCount: number,
  hourBucket = getUtcHourBucket()
): Promise<void> {
  if (callCount <= 0) return;

  await db
    .insert(instagramApiHourly)
    .values({
      accountId,
      hourBucket,
      callCount,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [instagramApiHourly.accountId, instagramApiHourly.hourBucket],
      set: {
        callCount: sql`${instagramApiHourly.callCount} + ${callCount}`,
        updatedAt: new Date(),
      },
    });
}

export async function checkInstagramQuotaForSync(
  accountId: string,
  mediaLimit?: number
): Promise<QuotaCheckResult> {
  const hourBucket = getUtcHourBucket();
  const currentCalls = await getAccountHourlyApiCalls(accountId, hourBucket);
  const estimatedCalls = estimateSyncApiCalls(mediaLimit);
  const limit = IG_GRAPH_API_HOURLY_LIMIT;
  const remaining = Math.max(0, limit - currentCalls);
  const allowed =
    currentCalls + estimatedCalls <= limit - IG_GRAPH_API_QUOTA_RESERVE;

  return {
    allowed,
    hourBucket,
    currentCalls,
    estimatedCalls,
    remaining,
    limit,
  };
}
