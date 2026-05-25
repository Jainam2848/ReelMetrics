import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/billing/stripe-helpers";
import { PlanId } from "@/lib/billing/plans";
import { AuthService } from "./auth.service";
import { env } from "@/lib/env";
import Stripe from "stripe";

export interface DbSubscription {
  id: string;
  userId: string;
  planId: PlanId;
  stripeSubId: string | null;
  stripeCustomerId: string | null;
  status: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at: number | null;
  metadata: Record<string, string> | null;
  items: {
    data: Array<{
      price: {
        id: string;
      };
    }>;
  };
}

export interface StripeInvoice {
  id: string;
  customer: string | null;
  subscription: string | null;
  amount_due?: number;
  amount_paid?: number;
  attempt_count?: number;
}

/**
 * Service class handling core billing business logic and webhook event synchronization.
 * 
 * STRICT COMPLIANCE NOTE (§18 RULE 3): This module NEVER imports from AI, Queue, or Ingestion.
 */
export class BillingService {
  /**
   * Fetches a user's subscription details.
   * If a subscription record does not exist, inserts a free plan subscription dynamically to avoid errors.
   */
  static async getSubscription(userId: string): Promise<DbSubscription> {
    let sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    if (!sub) {
      const [newSub] = await db
        .insert(subscriptions)
        .values({
          userId,
          planId: "free",
          status: "active",
        })
        .returning();

      if (!newSub) {
        throw new Error(`Failed to initialize default free subscription for User ID: ${userId}`);
      }
      sub = newSub;
    }

    return sub as unknown as DbSubscription;
  }

  /**
   * Webhook handler: Processes Checkout Session completion.
   * Leverages "Server Validation" pattern (§8.2) to retrieve the genuine subscription payload
   * directly from Stripe to prevent potential request tampering.
   */
  static async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const stripeSubId = session.subscription as string;
    const stripeCustomerId = session.customer as string;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId as PlanId;

    if (!stripeSubId) {
      throw new Error("[billing] Stripe checkout completed session does not contain a subscription reference ID.");
    }

    // Server-side validation check: Retrieve fresh subscription directly from Stripe API
    const stripeSub = (await stripe.subscriptions.retrieve(stripeSubId)) as unknown as StripeSubscription;

    const resolvedUserId = userId || stripeSub.metadata?.userId;
    const resolvedPlanId = planId || (stripeSub.metadata?.planId as PlanId) || "free";

    if (!resolvedUserId) {
      throw new Error(`[billing] Checkout Event mapping failure: User ID not found in metadata for Customer ${stripeCustomerId}`);
    }

    await db.transaction(async (tx) => {
      // Lock the user's subscription record during billing webhook transactions to prevent concurrency race conditions
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('sub_lock:' || ${resolvedUserId}))`);

      const existing = await tx.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, resolvedUserId),
      });

      const updateValues = {
        planId: resolvedPlanId,
        stripeSubId,
        stripeCustomerId,
        status: stripeSub.status,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAt: stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000) : null,
        updatedAt: new Date(),
      };

      if (existing) {
        await tx
          .update(subscriptions)
          .set(updateValues)
          .where(eq(subscriptions.id, existing.id));
      } else {
        await tx.insert(subscriptions).values({
          userId: resolvedUserId,
          ...updateValues,
        });
      }

      // Log audit trail
      await AuthService.logAudit({
        userId: resolvedUserId,
        action: "billing.checkout_completed",
        resourceType: "subscription",
        resourceId: existing?.id || null,
        metadata: {
          stripeSubId,
          planId: resolvedPlanId,
          status: stripeSub.status,
          invoiceId: session.invoice as string || undefined,
        },
      });
    });
  }

  /**
   * Webhook handler: Handles subscription changes (e.g. upgrades, downgrades).
   */
  static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const sub = subscription as unknown as StripeSubscription;
    const stripeSubId = sub.id;
    const stripeCustomerId = sub.customer as string;
    const userId = sub.metadata?.userId;

    let planId: PlanId = "free";
    const priceId = sub.items.data[0]?.price.id;

    if (priceId) {
      if (priceId === env.STRIPE_PRICE_CREATOR) planId = "creator";
      else if (priceId === env.STRIPE_PRICE_PRO) planId = "pro";
      else if (priceId === env.STRIPE_PRICE_AGENCY) planId = "agency";
    }

    if (planId === "free" && sub.metadata?.planId) {
      planId = sub.metadata.planId as PlanId;
    }

    // Resolve userId mapping by checking DB records first if metadata is missing
    let targetUserId = userId;
    if (!targetUserId) {
      const subRecord = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeCustomerId, stripeCustomerId),
      });
      targetUserId = subRecord?.userId;
    }

    if (!targetUserId) {
      throw new Error(`[billing] Subscription update mapping failure: Customer ID ${stripeCustomerId} has no active User ID association.`);
    }

    await db.transaction(async (tx) => {
      // Lock the user's subscription record during billing webhook transactions to prevent concurrency race conditions
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('sub_lock:' || ${targetUserId}))`);

      const existing = await tx.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, targetUserId),
      });

      const updateValues = {
        planId,
        stripeSubId,
        stripeCustomerId,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
        updatedAt: new Date(),
      };

      if (existing) {
        await tx
          .update(subscriptions)
          .set(updateValues)
          .where(eq(subscriptions.id, existing.id));
      } else {
        await tx.insert(subscriptions).values({
          userId: targetUserId!,
          ...updateValues,
        });
      }

      await AuthService.logAudit({
        userId: targetUserId!,
        action: "billing.subscription_updated",
        resourceType: "subscription",
        resourceId: existing?.id || null,
        metadata: {
          stripeSubId,
          planId,
          status: subscription.status,
        },
      });
    });
  }

  /**
   * Webhook handler: Automatically handles cancellation by downgrading customer back to the Free plan tier.
   */
  static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const stripeCustomerId = subscription.customer as string;

    const subRecord = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeCustomerId, stripeCustomerId),
    });

    if (!subRecord) {
      throw new Error(`[billing] Subscription deletion mapping failure: No record found for Customer ID ${stripeCustomerId}`);
    }

    const targetUserId = subRecord.userId;

    await db.transaction(async (tx) => {
      // Lock the user's subscription record during billing webhook transactions to prevent concurrency race conditions
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('sub_lock:' || ${targetUserId}))`);

      await tx
        .update(subscriptions)
        .set({
          planId: "free",
          status: "canceled",
          stripeSubId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAt: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subRecord.id));

      await AuthService.logAudit({
        userId: targetUserId,
        action: "billing.subscription_deleted",
        resourceType: "subscription",
        resourceId: subRecord.id,
        metadata: {
          stripeSubId: subscription.id,
          previousPlanId: subRecord.planId,
        },
      });
    });
  }

  /**
   * Webhook handler: Updates status to "past_due" on local subscription and logs the failure to audit_log.
   */
  static async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const inv = invoice as unknown as StripeInvoice;
    const stripeCustomerId = inv.customer as string;
    const stripeSubId = inv.subscription;

    if (!stripeCustomerId) return;

    const subRecord = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeCustomerId, stripeCustomerId),
    });

    const userId = subRecord?.userId || null;

    if (subRecord && stripeSubId) {
      await db
        .update(subscriptions)
        .set({
          status: "past_due",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subRecord.id));
    }

    await AuthService.logAudit({
      userId,
      action: "billing.invoice_payment_failed",
      resourceType: "invoice",
      metadata: {
        invoiceId: inv.id,
        amountDue: inv.amount_due,
        stripeSubId,
        stripeCustomerId,
        attemptCount: inv.attempt_count,
      },
    });
  }

  /**
   * Webhook handler: Re-asserts subscription status to "active" upon successful payment.
   */
  static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const inv = invoice as unknown as StripeInvoice;
    const stripeCustomerId = inv.customer as string;
    const stripeSubId = inv.subscription;

    if (!stripeCustomerId) return;

    const subRecord = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeCustomerId, stripeCustomerId),
    });

    const userId = subRecord?.userId || null;

    if (subRecord && stripeSubId) {
      await db
        .update(subscriptions)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subRecord.id));
    }

    await AuthService.logAudit({
      userId,
      action: "billing.invoice_payment_succeeded",
      resourceType: "invoice",
      metadata: {
        invoiceId: inv.id,
        amountPaid: inv.amount_paid,
        stripeSubId,
        stripeCustomerId,
      },
    });
  }
}
