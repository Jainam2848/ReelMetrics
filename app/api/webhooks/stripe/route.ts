import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe-helpers";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { processedEvents } from "@/lib/db/schema";
import { BillingService } from "@/lib/services/billing.service";
import { AuthService } from "@/lib/services/auth.service";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

// Max webhook payload size: 1 MiB bounds protection (§8.5)
const MAX_WEBHOOK_BODY_BYTES = 1 * 1024 * 1024;

/**
 * Shared modular dispatcher to handle verified Stripe event payloads.
 * Accessible to both webhooks and admin manual replay endpoint.
 */
export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await BillingService.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await BillingService.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await BillingService.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_succeeded":
      await BillingService.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_failed":
      await BillingService.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      console.warn(`[stripe-webhook] Skipped unhandled event type: ${event.type}`);
  }
}

/**
 * POST app/api/webhooks/stripe
 * Stripe webhooks ingestion controller.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  // 1. Enforce payload size limit using HTTP headers if present
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10);
    if (contentLength > MAX_WEBHOOK_BODY_BYTES) {
      return NextResponse.json({ error: "Payload Too Large" }, { status: 413 });
    }
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request stream" }, { status: 400 });
  }

  // Double check actual byte size of the payload
  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: "Payload Too Large" }, { status: 413 });
  }

  // 2. Extract Stripe Signature header
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe Signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // rawBody (not parsed JSON) is crucial for accurate signature hashes
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Signature verification failed";
    console.error(`[stripe-webhook] Signature Verification Blocked: ${errorMessage}`);
    
    await AuthService.logAudit({
      userId: null,
      action: "billing.webhook_verification_failed",
      resourceType: "webhook",
      metadata: { error: errorMessage },
      ipAddress,
    });

    return NextResponse.json({ error: "Invalid signature payload" }, { status: 400 });
  }

  // 3. Enforce Strict Idempotency using a single atomic DB insert
  try {
    const [processed] = await db
      .insert(processedEvents)
      .values({
        eventId: event.id,
      })
      .onConflictDoNothing()
      .returning({ id: processedEvents.id });

    if (!processed) {
      // Event has already been completed, exit cleanly to prevent double processing
      console.log(`[stripe-webhook] Duplicate event skipped: ${event.id}`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
  } catch (dbError) {
    // If database connection falls over here, return 500 to let Stripe retry
    console.error("[stripe-webhook] Idempotency DB insertion error:", dbError);
    return NextResponse.json({ error: "Database state unavailable" }, { status: 500 });
  }

  // 4. Process Webhook Event
  try {
    await processStripeEvent(event);
    return NextResponse.json({ received: true }, { status: 200 });
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

    // Remove from processedEvents so Stripe can retry successfully
    try {
      await db
        .delete(processedEvents)
        .where(eq(processedEvents.eventId, event.id));
    } catch (cleanupError) {
      console.error(`[stripe-webhook] Failed to remove event ID ${event.id} from processedEvents:`, cleanupError);
    }

    // Return non-2xx status code to trigger Stripe retry
    return NextResponse.json(
      { error: `Internal processing error: ${errorDetails}. Retrying.` },
      { status: 500 }
    );
  }
}
