# Stripe Billing & Webhooks Integration Guide

This guide provides instructions for configuring, developing, testing, and deploying the Stripe billing integration for **Trendoraa**. It covers everything from local environment setup to production transitioning and webhook architecture.

---

## 1. Stripe Environment Variables

The Stripe integration relies on several environment variables configured in your `.env` (local development) and your production hosting platform (e.g., Vercel). 

See [.env.example](file:///d:/Desktop/reel-logic-ai/.env.example) for reference:

| Variable | Description | Value format (Test) | Value format (Live) |
| :--- | :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | Stripe Secret API key. | `sk_test_...` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable API key used on the frontend. | `pk_test_...` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Signing secret used to verify webhook signatures. | `whsec_...` (from CLI) | `whsec_...` (from Dashboard) |
| `STRIPE_PRICE_CREATOR` | Price ID mapped to the **Creator** plan. | `price_...` | `price_...` |
| `STRIPE_PRICE_PRO` | Price ID mapped to the **Pro** plan. | `price_...` | `price_...` |
| `STRIPE_PRICE_AGENCY` | Price ID mapped to the **Agency** plan. | `price_...` | `price_...` |

> [!WARNING]
> Do not check your real Stripe keys into git. Use `.env` or your hosting platform's secure environment variable manager.

---

## 2. Local Development (Test Mode)

Follow these steps to run Stripe locally and verify subscription sign-ups, webhooks, and the billing portal.

### Step A: Configure Test Products and Prices
1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com).
2. Toggle the **Test Mode** switch in the top right corner.
3. Go to **Product Catalog** -> **Add Product**.
4. Create the three billing tiers defined in [plans.ts](file:///d:/Desktop/reel-logic-ai/lib/billing/plans.ts):
   * **Creator** (e.g., $19/mo recurring)
   * **Pro** (e.g., $49/mo recurring)
   * **Agency** (e.g., $149/mo recurring)
5. Copy each generated **Price ID** (starts with `price_...`) and add them to your local `.env` file:
   ```env
   STRIPE_PRICE_CREATOR=price_1Qxxxx...
   STRIPE_PRICE_PRO=price_1Qyyyy...
   STRIPE_PRICE_AGENCY=price_1Qzzzz...
   ```

### Step B: Set Up the Stripe CLI (Local Webhook Testing)
To receive webhooks on your local computer, you need the Stripe CLI.

1. **Install Stripe CLI**:
   * **macOS** (Homebrew): `brew install stripe/stripe-cli/stripe`
   * **Windows** (Scoop): `scoop bucket add stripe https://github.com/stripe/stripe-cli.git && scoop install stripe`
   * Or download the standalone binary from the [Stripe CLI Github Releases page](https://github.com/stripe/stripe-cli/releases).
2. **Log In**:
   ```bash
   stripe login
   ```
   Follow the browser prompt to authorize the CLI.
3. **Listen for Webhook Events**:
   Run the following command in a separate terminal pane to forward incoming events to your local Next.js api endpoint:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. **Configure the Webhook Secret**:
   The `stripe listen` command will output a webhook signing secret:
   ```text
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxx (e.g. whsec_abc123)
   ```
   Copy this `whsec_...` value and set it as `STRIPE_WEBHOOK_SECRET` in your local `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_abc123...
   ```

### Step C: Test Checkout & Webhooks
1. Open the local application.
2. Navigate to the upgrade pricing section and click **Subscribe** on one of the paid tiers.
3. You will be redirected to the Stripe Checkout page. Use one of [Stripe's Test Cards](https://docs.stripe.com/testing#cards) (e.g. Card: `4242 4242 4242 4242`, Expiry: Any future date, CVC: Any 3 digits) to complete the checkout.
4. Keep an eye on your Stripe CLI terminal pane. You should see successful requests forwarding to `/api/webhooks/stripe` with `200 OK` status codes.

---

## 3. Webhook Architecture & Processing Details

Trendoraa has a resilient webhook processing pipeline under [app/api/webhooks/stripe/route.ts](file:///d:/Desktop/reel-logic-ai/app/api/webhooks/stripe/route.ts).

### Size Limits & Verification
* **Payload Bound Protection**: The webhook limits requests to **1 MiB** max size to prevent memory attacks.
* **Signature Verification**: Every incoming webhook is parsed as a raw text string and verified with `stripe.webhooks.constructEvent()` against your `STRIPE_WEBHOOK_SECRET` to prevent request spoofing.

### Handled Webhook Events
We listen for and handle the following events:

1. **`checkout.session.completed`**: Dispatched when a checkout session successfully completes. It unlocks the subscription features and creates the database mapping.
2. **`customer.subscription.updated`**: Triggered when a subscription is renewed, upgraded, or downgraded. Update the database record with the new status and plan.
3. **`customer.subscription.deleted`**: Dispatched when a subscription cancels, expires, or fails collection. Drops the user tier back to `free`.
4. **`invoice.payment_succeeded`**: Re-authorizes or extends the user's active billing cycle limits.
5. **`invoice.payment_failed`**: Alerts systems to payment failures, kicking off dunning emails/notifications.

### Idempotency Protection
To prevent race conditions or processing the same webhook event twice:
* The system utilizes a database table `processedEvents`.
* When an event arrives, we run an atomic SQL query:
  ```typescript
  const [processed] = await db
    .insert(processedEvents)
    .values({ eventId: event.id })
    .onConflictDoNothing()
    .returning({ id: processedEvents.id });
  ```
* If `processed` returns empty, the event has already been handled, and we immediately return `200 OK` without re-running subscription updates.

---

## 4. Troubleshooting & Retries

### The Retry/Replay Endpoint
The app provides an admin retry endpoint under [app/api/webhooks/stripe/retry/route.ts](file:///d:/Desktop/reel-logic-ai/app/api/webhooks/stripe/retry/route.ts). 

If a webhook fails during execution due to transient network issues or database locks, it can be replayed safely:
* Endpoint: `POST /api/webhooks/stripe/retry`
* Payload: `{ eventId: "evt_..." }`
* How it works:
  1. Verifies authentication.
  2. Fetches the live event directly from Stripe's API via `stripe.events.retrieve(eventId)` to guarantee payload authenticity.
  3. Clears the idempotency lock from `processedEvents`.
  4. Dispatches the event through the standard `processStripeEvent()` handler.

---

## 5. Transitioning to Live Mode (Production)

Follow these steps when ready to deploy Trendoraa to production.

### Step A: Production Sentinel Check
The codebase includes a security sentinel check in [stripe-helpers.ts](file:///d:/Desktop/reel-logic-ai/lib/billing/stripe-helpers.ts):
```typescript
if (env.NODE_ENV === "production" && !env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
  throw new Error("[stripe] Boot Blocked: STRIPE_SECRET_KEY must be a live key (sk_live_...) in production environment.");
}
```
If you deploy your app with `NODE_ENV=production` and accidentally supply a `sk_test_...` key, the backend will fail to boot. This prevents real customers from being placed on test subscriptions.

### Step B: Create Live Products
1. Go to your Stripe Dashboard and turn **OFF** Test Mode (top right).
2. Go to **Product Catalog** -> **Add Product** and create your production versions of **Creator**, **Pro**, and **Agency**.
3. Record their production Price IDs (`price_...`).

### Step C: Configure Production Webhooks
1. In the Stripe Dashboard, go to **Developers** -> **Webhooks**.
2. Click **Add Endpoint**.
3. Configure the following fields:
   * **Endpoint URL**: `https://your-production-domain.com/api/webhooks/stripe`
   * **Select Events**: Choose only the required five:
     * `checkout.session.completed`
     * `customer.subscription.updated`
     * `customer.subscription.deleted`
     * `invoice.payment_succeeded`
     * `invoice.payment_failed`
4. Click **Add endpoint**.
5. Reveal the **Signing Secret** (`whsec_...`).

### Step D: Update Production Environment Variables
Set the following environment variables in your production hosting platform (e.g. Vercel dashboard):

```env
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (from the Live Webhook configuration page)
STRIPE_PRICE_CREATOR=price_... (from the Live Creator product)
STRIPE_PRICE_PRO=price_... (from the Live Pro product)
STRIPE_PRICE_AGENCY=price_... (from the Live Agency product)
```

Redeploy the application, and users will now be charged with real money and successfully upgraded upon checkout.

---

## 6. Updating or Adding Plan Tiers

When updating or adding a new tier:

1. **Stripe Catalog**: Create the new product and price tier in Stripe (both Test Mode and Live Mode).
2. **plans.ts**: Update the [plans.ts](file:///d:/Desktop/reel-logic-ai/lib/billing/plans.ts) configuration with the new `PlanId`, limits, and features.
3. **stripe-helpers.ts**: Update `getPriceId()` switch statement to map the new plan to its environment variable.
4. **Environment Variables**: Add the new price environment variable (e.g. `STRIPE_PRICE_ENTERPRISE`) to `.env`, `.env.example`, and your production environment.
