import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/billing/stripe-helpers";
import { db } from "@/lib/db";
import { processedEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { processStripeEvent } from "../route";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AuthService } from "@/lib/services/auth.service";
import { z } from "zod";

const retrySchema = z.object({
  eventId: z.string().min(1),
});

/**
 * POST app/api/webhooks/stripe/retry
 * Manual retry endpoint restricted to system administrators (role = "admin").
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  // 1. Authenticate caller and verify Admin custom claim role in Supabase JWT app_metadata
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("UNAUTHORIZED", "Authentication required to access admin services.");
  }

  const role = user.app_metadata?.role;
  if (role !== "admin") {
    // Log unauthorized attempt to audit_log for operational security mapping
    await AuthService.logAudit({
      userId: user.id,
      action: "security.unauthorized_admin_access",
      resourceType: "admin_endpoint",
      metadata: {
        path: request.nextUrl.pathname,
        attemptedRole: role,
      },
      ipAddress,
    });

    return apiError("FORBIDDEN", "Insufficient permissions. Admin role required.");
  }

  // 2. Parse and validate payload input parameters
  let body: z.infer<typeof retrySchema>;
  try {
    const rawJson = await request.json();
    body = retrySchema.parse(rawJson);
  } catch (err) {
    return apiError(
      "VALIDATION_ERROR",
      "Missing or invalid required body parameter: eventId",
      err instanceof z.ZodError ? err.format() : undefined
    );
  }

  const { eventId } = body;

  // 3. Fetch live event details from Stripe API directly to guarantee authenticity
  let event;
  try {
    event = await stripe.events.retrieve(eventId);
  } catch (stripeErr) {
    console.error(`[stripe-retry] Event lookup failed for ID ${eventId}:`, stripeErr);
    return apiError("RESOURCE_NOT_FOUND", `Stripe event ID "${eventId}" was not found or is inaccessible.`);
  }

  // 4. Delete the event from processed_events table to clear the idempotency lock
  try {
    await db
      .delete(processedEvents)
      .where(eq(processedEvents.eventId, eventId));
  } catch (dbError) {
    console.error(`[stripe-retry] Failed to clear processed event ${eventId}:`, dbError);
    return apiError("INTERNAL_ERROR", "Failed to clear existing event idempotency lock in database.");
  }

  // 5. Re-assert atomic idempotency constraint to block simultaneous race replays
  try {
    const [processed] = await db
      .insert(processedEvents)
      .values({
        eventId: event.id,
      })
      .onConflictDoNothing()
      .returning({ id: processedEvents.id });

    if (!processed) {
      return apiError("INTERNAL_ERROR", "Stripe event replay conflict. Already locked by another worker.");
    }
  } catch (lockError) {
    console.error("[stripe-retry] Failed to re-insert processed event lock:", lockError);
    return apiError("INTERNAL_ERROR", "Failed to re-assert idempotency lock.");
  }

  // 6. Invoke processing flow with the verified event object
  try {
    await processStripeEvent(event);

    // Record success in audit_log
    await AuthService.logAudit({
      userId: user.id,
      action: "billing.webhook_replayed",
      resourceType: "webhook",
      resourceId: null,
      metadata: {
        eventId,
        eventType: event.type,
        status: "success",
      },
      ipAddress,
    });

    return apiSuccess({
      replayed: true,
      eventId,
      eventType: event.type,
    });
  } catch (replayError) {
    const errorDetails = replayError instanceof Error ? replayError.message : "Unknown error";
    console.error(`[stripe-retry] Replay execution failed for event ${eventId}:`, replayError);

    // Record replay execution failure in audit logs
    await AuthService.logAudit({
      userId: user.id,
      action: "billing.webhook_replay_failed",
      resourceType: "webhook",
      metadata: {
        eventId,
        eventType: event.type,
        error: errorDetails,
      },
      ipAddress,
    });

    return apiError("INTERNAL_ERROR", `Failed during Stripe event execution: ${errorDetails}`);
  }
}
