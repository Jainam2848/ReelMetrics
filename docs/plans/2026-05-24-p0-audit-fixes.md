# P0 Audit Fixes Implementation Plan

> **Status: ✅ FULLY SHIPPED** — All 5 tasks completed as of 2026-05-25. See git history for individual commit references.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address 5 critical P0 issues identified in the audit covering strategy UI, billing checkout, webhook idempotency, asynchronous sync triggering, and missing Row-Level Security.

**Architecture:** Refactor synchronous blocking flows to background workers via the job queue, align payload schemas between frontend UI and REST APIs, adjust Stripe webhook logic to guarantee database consistency and retry mechanism on failures, and enforce PostgreSQL RLS policies for hourly call tracking.

**Tech Stack:** Next.js App Router, Tailwind CSS, Stripe API, PostgreSQL, Supabase, Drizzle ORM.

---

### Task 1: Align Strategy UI with API (contentCalendar Property)

**Files:**
- Modify: `app/(dashboard)/strategy/page.tsx:75-76`

**Step 1: Write the failing test**
Create a manual check or verify by inspecting the typescript interfaces that UI expects `contentCalendar` instead of `calendar`.
```typescript
// app/(dashboard)/strategy/page.tsx
const calendarItems = content?.contentCalendar || [];
```

**Step 2: Run verification**
Run: `npx tsc --noEmit`
Expected: Passes without type errors.

**Step 3: Implement minimal change**
Modify `app/(dashboard)/strategy/page.tsx` line 75:
```typescript
const calendarItems = content?.contentCalendar || [];
```

**Step 4: Run verification**
Run: `npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**
```bash
git add app/\(dashboard\)/strategy/page.tsx
git commit -m "fix(strategy): read contentCalendar property to align with API"
```

---

### Task 2: Align Billing Checkout Frontend and API

**Files:**
- Modify: `app/(dashboard)/billing/page.tsx:57-67`

**Step 1: Write the frontend checkout payload update**
Verify that the payload contains `returnUrl` and the response is read from `data?.data?.checkoutUrl`.

**Step 2: Implement minimal change**
Update the `handleCheckout` function in `app/(dashboard)/billing/page.tsx`:
```typescript
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          planId, 
          returnUrl: window.location.origin + "/billing" 
        }),
      });
      const data = await res.json();

      if (data?.success && data?.data?.checkoutUrl) {
        window.location.assign(data.data.checkoutUrl);
        return;
      }
```

**Step 3: Verify build compiles**
Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**
```bash
git add app/\(dashboard\)/billing/page.tsx
git commit -m "fix(billing): send returnUrl and read checkoutUrl in billing page"
```

---

### Task 3: Stripe Webhook Idempotency & Failure Handling

**Files:**
- Modify: `app/api/webhooks/stripe/route.ts`

**Step 1: Catch processing failures, delete from processedEvents, and return 500**
Import `eq` from `"drizzle-orm"` in `app/api/webhooks/stripe/route.ts`.
In the `catch (processingError)` block of `app/api/webhooks/stripe/route.ts`, delete the `eventId` from the `processedEvents` database table so that Stripe retries are processed, and return a 500 status code response instead of 200.

**Step 2: Implement minimal change**
Modify `app/api/webhooks/stripe/route.ts` imports and the `catch` block:
```typescript
// Import eq
import { eq } from "drizzle-orm";

// In the catch block:
  } catch (processingError) {
    const errorDetails = processingError instanceof Error ? processingError.message : "Unknown error";
    console.error(`[stripe-webhook] Failed processing event ${event.id}:`, processingError);

    // GDPR & compliance audit trail update for operational tracking
    await AuthService.logAudit({
      userId: null,
      action: "billing.webhook_processing_failed",
      resourceType: "webhook",
      resourceId: null,
      metadata: {
        eventId: event.id,
        eventType: event.type,
        error: errorDetails,
      },
      ipAddress,
    });

    // Clear event from idempotency log so it can be retried by Stripe
    try {
      await db.delete(processedEvents).where(eq(processedEvents.eventId, event.id));
    } catch (dbError) {
      console.error(`[stripe-webhook] Failed to delete failed event from idempotency log:`, dbError);
    }

    // Return 500 so Stripe knows to retry
    return NextResponse.json(
      { error: "Internal processing error. Retrying..." },
      { status: 500 }
    );
  }
```

**Step 3: Verify build compiles**
Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**
```bash
git add app/api/webhooks/stripe/route.ts
git commit -m "fix(webhook): return 500 and clear idempotency key on webhook handler failure"
```

---

### Task 4: Make Manual Sync Route Asynchronous via Job Queue

**Files:**
- Modify: `app/api/accounts/[id]/sync/route.ts`

**Step 1: Replace inline sync logic with job enqueuing**
Modify `app/api/accounts/[id]/sync/route.ts` to enqueue the sync job using `enqueueJob` instead of awaiting `syncAccount` synchronously.
Enforce account ownership verification and manual sync 5-minute cooldown before enqueuing.
Return 202 Accepted status with the job details.

**Step 2: Implement minimal change**
Update `app/api/accounts/[id]/sync/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRateLimit } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { instagramAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { enqueueJob, JOB_TYPES } from "@/lib/queue";

export const POST = withRateLimit(
  withAuth(async (request, context) => {
    const { id } = (await context.params) as { id: string };
    const userId = request.user.id;

    try {
      // 1. Verify account exists and is owned by the user
      const account = await db.query.instagramAccounts.findFirst({
        where: and(
          eq(instagramAccounts.id, id),
          eq(instagramAccounts.userId, userId)
        ),
      });

      if (!account) {
        return apiError("RESOURCE_NOT_FOUND", "Connected Instagram account not found.");
      }

      // 2. Enforce 5-minute cooldown between manual syncs
      const COOLDOWN_MS = 5 * 60 * 1000;
      if (account.lastSyncedAt) {
        const timeSinceLastSync = Date.now() - new Date(account.lastSyncedAt).getTime();
        if (timeSinceLastSync < COOLDOWN_MS) {
          return apiError(
            "SYNC_COOLDOWN_ACTIVE",
            "Sync cooldown active. Please wait 5 minutes between manual syncs."
          );
        }
      }

      // 3. Mark sync status as pending
      await db
        .update(instagramAccounts)
        .set({ syncStatus: "pending", updatedAt: new Date() })
        .where(eq(instagramAccounts.id, id));

      // 4. Enqueue Sync Account Job asynchronously
      const timestampMs = Date.now();
      const idempotencyKey = `sync:manual:${id}:${timestampMs}`;
      const job = await enqueueJob(
        JOB_TYPES.SYNC_ACCOUNT,
        { userId, accountId: id, trigger: "manual" },
        { idempotencyKey, priority: 10 } // Higher priority for manual trigger
      );

      if (!job) {
        return apiError("SYNC_IN_PROGRESS", "A sync job is already scheduled for this account.");
      }

      // 5. Return 202 Accepted containing the job ID
      return apiSuccess({
        message: "Sync task successfully enqueued in background",
        jobId: job.id,
        status: job.status,
      });
    } catch (error) {
      console.error(
        `[sync-route] Unexpected error enqueuing sync for account ${id}:`,
        error instanceof Error ? error.message : "Unknown error"
      );
      return apiError("INTERNAL_ERROR", "An unexpected error occurred during sync enqueuing.");
    }
  }),
  { max: 10, windowMs: 300_000 }
);
```

**Step 3: Verify build compiles**
Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**
```bash
git add app/api/accounts/\[id\]/sync/route.ts
git commit -m "feat(sync): make manual sync asynchronous by enqueuing to job queue"
```

---

### Task 5: Enable Row-Level Security on instagram_api_hourly

**Files:**
- Create: `lib/db/migrations/0002_instagram_api_hourly_rls.sql`
- Modify: `scripts/test-rls.ts`

**Step 1: Write SQL migration enabling RLS and policies on instagram_api_hourly**
Create migration file `lib/db/migrations/0002_instagram_api_hourly_rls.sql`:
```sql
ALTER TABLE "instagram_api_hourly" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own hourly api usage" ON "instagram_api_hourly" 
  FOR SELECT 
  USING (
    account_id IN (
      SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to insert own hourly api usage" ON "instagram_api_hourly" 
  FOR INSERT 
  WITH CHECK (
    account_id IN (
      SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to update own hourly api usage" ON "instagram_api_hourly" 
  FOR UPDATE 
  USING (
    account_id IN (
      SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to delete own hourly api usage" ON "instagram_api_hourly" 
  FOR DELETE 
  USING (
    account_id IN (
      SELECT id FROM instagram_accounts WHERE user_id = auth.uid()
    )
  );
```

**Step 2: Add RLS validation test cases**
Open `scripts/test-rls.ts` and add tests in Case 1 (Alice), Case 2 (Bob), and Case 3 (Anon) verifying read restrictions on `instagramApiHourly`.

**Step 3: Execute migrations & run tests**
Apply migration locally, then run the validation script:
Run: `npx tsx scripts/test-rls.ts`
Expected: Passes successfully with 0 failures.

**Step 4: Commit**
```bash
git add lib/db/migrations/0002_instagram_api_hourly_rls.sql scripts/test-rls.ts
git commit -m "security(db): enable RLS and add policies on instagram_api_hourly"
```
