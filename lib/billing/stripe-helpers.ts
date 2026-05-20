import Stripe from "stripe";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PlanId } from "./plans";

// Production Sentinel Check (§5.5 & §8.5): Enforce live key prefix validation in production.
if (env.NODE_ENV === "production" && !env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
  throw new Error("[stripe] Boot Blocked: STRIPE_SECRET_KEY must be a live key (sk_live_...) in production environment.");
}

// Instantiate Stripe client
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // Let the package fall back to the built-in default version to guarantee optimal TypeScript support
});

/**
 * Returns the Stripe Price ID mapped to a given PlanId.
 */
export function getPriceId(planId: PlanId): string {
  switch (planId) {
    case "creator":
      return env.STRIPE_PRICE_CREATOR;
    case "pro":
      return env.STRIPE_PRICE_PRO;
    case "agency":
      return env.STRIPE_PRICE_AGENCY;
    default:
      throw new Error(`Plan tier "${planId}" does not support active Stripe subscription price mapping.`);
  }
}

/**
 * Retrieves a user's Stripe Customer ID.
 * If one does not exist, it creates a new Stripe Customer and records it locally.
 */
export async function getStripeCustomerId(userId: string): Promise<string> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (sub?.stripeCustomerId) {
    return sub.stripeCustomerId;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error(`Unable to create Stripe customer: User with ID ${userId} was not found.`);
  }

  // Create Stripe Customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.fullName || undefined,
    metadata: {
      userId: user.id,
    },
  });

  if (sub) {
    await db
      .update(subscriptions)
      .set({
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id));
  } else {
    // Falls back to creating a free subscription record containing the customer ID
    await db.insert(subscriptions).values({
      userId,
      planId: "free",
      status: "active",
      stripeCustomerId: customer.id,
    });
  }

  return customer.id;
}

/**
 * Creates a Stripe Checkout Session for a specific subscription upgrade.
 * Returns the checkout redirect URL.
 */
export async function createCheckoutSession(
  userId: string,
  planId: PlanId,
  returnUrl: string
): Promise<string> {
  if (planId === "free") {
    throw new Error("Stripe checkout sessions are not applicable to the free plan.");
  }

  const customerId = await getStripeCustomerId(userId);
  const priceId = getPriceId(planId);

  const separator = returnUrl.includes("?") ? "&" : "?";
  const successUrl = `${returnUrl}${separator}checkout_status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${returnUrl}${separator}checkout_status=cancel`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planId,
    },
    subscription_data: {
      metadata: {
        userId,
        planId,
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe Checkout session initialization failed to return a valid redirection URL.");
  }

  return session.url;
}

/**
 * Creates a Stripe Customer Billing Portal Session for managing subscriptions.
 * Returns the portal redirection URL.
 */
export async function createPortalSession(userId: string, returnUrl: string): Promise<string> {
  const customerId = await getStripeCustomerId(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}
