# Meta Developer & Instagram API Integration Guide

This guide provides step-by-step instructions for creating a Meta Developer account, setting up a Meta App, configuring the Instagram Graph API (OAuth & Webhooks), and testing the integration locally for **Trendoraa**.

---

## 1. Instagram Environment Variables

The Instagram integration relies on several environment variables configured in your `.env` (local development) and your production hosting platform. 

See [.env.example](file:///d:/Desktop/reel-logic-ai/.env.example) for reference:

| Variable | Description | Value format (Local) | Source |
| :--- | :--- | :--- | :--- |
| `INSTAGRAM_CLIENT_ID` | Your Meta App ID. | `123456789012345` | Meta App Dashboard (Header or Basic Settings) |
| `INSTAGRAM_CLIENT_SECRET` | Your Meta App Secret. | Hexadecimal string | Meta App Dashboard (Settings > Basic) |
| `INSTAGRAM_REDIRECT_URI` | The OAuth callback URL authorized by Meta. | `http://localhost:3000/api/auth/social/instagram/callback` | Configured under Instagram Product Settings |
| `INSTAGRAM_VERIFY_TOKEN` | Secure, random token shared with Meta for webhook challenge verification. | Hexadecimal string | Custom generated (e.g. via crypto CLI) |
| `INSTAGRAM_APP_SECRET` | The same Meta App Secret used to verify webhook signatures. | Hexadecimal string | Meta App Dashboard (Settings > Basic) |

> [!WARNING]
> Never commit actual secrets to git. Always use `.env` locally and your cloud provider's environment variable settings in production.

---

## 2. Prerequisites & Accounts

Before beginning, ensure you have the following assets ready:

1. **Personal Facebook Account**: Required to register as a developer.
2. **Instagram Professional Account**: The Instagram Graph API **does not** support standard personal profiles. You must switch your profile to either a **Business** or **Creator** account (free to do within the Instagram App settings).
3. **Facebook Page**: You must own or manage a Facebook Page.
4. **Account Linkage**: Link your Instagram Professional account to your Facebook Page:
   * Go to your Facebook Page > **Settings** > **Linked Accounts** > **Instagram**.
   * Click **Connect Account** and follow the prompts.

---

## 3. Detailed Setup Instructions

Follow these steps to establish your integration.

### Step A: Register as a Meta Developer
1. Navigate to the [Meta for Developers Portal](https://developers.facebook.com/).
2. Log in with your Facebook account credentials.
3. Click **Get Started** in the top-right corner if you are registering for the first time.
4. Follow the setup flow: verify your developer email and phone number, and accept the platform policies.

### Step B: Create a Meta App
1. Go to your [My Apps Dashboard](https://developers.facebook.com/apps/).
2. Click **Create App** in the upper right.
3. Select **Other** as the app category (to ensure all products are available) and click **Next**.
4. Select **Business** or **Consumer** as your app type (Business is recommended if you plan to access professional pages and publish content; Consumer is standard for general read permissions). Click **Next**.
5. Input your app information:
   * **App Display Name**: (e.g., `Trendoraa Local`)
   * **App Contact Email**: Your development or support email.
6. Click **Create app** and re-authenticate if requested.

### Step C: Retrieve Credentials & Populate `.env`
1. From the left sidebar of your App Dashboard, navigate to **App Settings** > **Basic**.
2. Locate and copy the **App ID**. Assign this to `INSTAGRAM_CLIENT_ID` in your `.env`.
3. Locate the **App Secret** field. Click **Show** (requires password confirmation) and copy it.
4. Set both `INSTAGRAM_CLIENT_SECRET` and `INSTAGRAM_APP_SECRET` to this value in your `.env`.

### Step D: Add the Instagram Product & Set Redirect URIs
1. In the left sidebar, click **Add Product** (or find it on the dashboard homepage).
2. Find the **Instagram** or **Instagram Graph API** product card and click **Set Up**.
3. Once added, navigate to **Instagram** > **Basic Display** (or **Settings** under Instagram Login in the sidebar depending on app type).
4. Add the following Redirect URLs:
   * **Valid OAuth Redirect URIs**: `http://localhost:3000/api/auth/social/instagram/callback`
   * **Deauthorize Callback URL**: `http://localhost:3000/api/auth/social/instagram/deauthorize` (or your domain equivalent)
   * **Data Deletion Request URL**: `http://localhost:3000/api/auth/social/instagram/delete`
5. Click **Save Changes**.

> [!NOTE]
> The deauthorize and data-deletion endpoints are not yet implemented in the codebase but are required entries in your Meta App configuration. Track implementation under `app/api/auth/social/[platform]/deauthorize/route.ts` and `app/api/auth/social/[platform]/delete/route.ts`. Until they exist, Meta may flag the app during App Review.

---

## 4. Webhooks Configuration

To receive real-time updates (such as skip rates, video comments, or view counts), you need to establish webhooks.

1. Under the **Products** list in the left sidebar, click **Webhooks** (or add it via "Add Product").
2. In the object dropdown menu, select **Instagram**. Click **Subscribe to this object**.
3. Generate a secure `INSTAGRAM_VERIFY_TOKEN` locally. For example, run this in your terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```
4. Copy the generated hex string and set `INSTAGRAM_VERIFY_TOKEN=your_token` in your local `.env`.
5. In the Meta popup:
   * **Callback URL**: `https://your-domain.com/api/webhooks/instagram` (Must use HTTPS. For local testing, see the Tunneling section below).
   * **Verify Token**: Paste the exact token generated in Step 3.
6. Click **Verify and Save**. Meta will dispatch a challenge request to your endpoint. Once verified, subscribe to the required webhook fields (e.g., `comments`, `story_insights`, `mentions`).

---

## 5. Local Tunneling for Webhooks (Optional)
Meta requires a public **HTTPS** endpoint to verify webhooks. Since local development runs on `http://localhost:3000`, you can use a tunneling utility like **ngrok** or **localtunnel** to expose it.

1. **Install ngrok** (or equivalent):
   ```bash
   npm install -g ngrok
   ```
2. **Start the tunnel**:
   ```bash
   ngrok http 3000
   ```
3. Copy the secure forwarding URL (e.g., `https://xxxx-xx-xx.ngrok-free.app`).
4. Update your webhook callback URL in the Meta Dashboard to:
   ```text
   https://xxxx-xx-xx.ngrok-free.app/api/webhooks/instagram
   ```
5. Leave the tunnel running while testing webhooks locally.

---

## 6. Testing & Adding Roles (Development Mode)

While your app is in **Development Mode**, only accounts associated with your app can authenticate via OAuth.

1. Navigate to **App Roles** > **Roles** (or **Roles > Roles** depending on dashboard style) in the left sidebar.
2. Scroll to the **Instagram Testers** section and click **Add Instagram Testers**.
3. Input the Instagram handle of your test profile and click **Submit**.
4. Log into that test Instagram account on a desktop browser.
5. Visit the [Instagram Manage Access Portal](https://www.instagram.com/accounts/manage_access/).
6. Go to the **Tester Invites** tab and click **Accept** on the pending invite from your app.

Your test account can now log into Trendoraa successfully using the OAuth callback flow!

---

## 7. Transitioning to Live Mode (Production)

Once you are ready to launch Trendoraa to real customers:

1. **Submit for App Review**: 
   * Navigate to **App Review** > **Permissions and Features**.
   * Submit requests for permissions such as `instagram_basic`, `instagram_manage_insights`, and `instagram_manage_comments` depending on your requirements.
   * You will need to provide a screencast video showing how these permissions are used within the application.
2. **Toggle App Mode**:
   * Once approved, toggle the switch at the top of your Meta App Dashboard from **Development** to **Live**.
3. **Update Production Environment Variables**:
   * Set your live credentials in your hosting platform (Vercel, AWS, etc.).
   * Ensure `INSTAGRAM_REDIRECT_URI` is set to your production callback URL (e.g., `https://trendoraa.com/api/auth/social/instagram/callback`).

---

## 8. Fallback: Sandbox Demo Account

Not every user can complete the live Instagram OAuth flow on day one. Common blockers include:

* Their Instagram profile is a **personal account** (the Graph API rejects personal profiles with `INSTAGRAM_NOT_BUSINESS_ACCOUNT`).
* They do **not own or manage a Facebook Page** to link the Instagram Professional account to.
* The Trendoraa Meta App is still in **Development Mode** and the user is not on the tester allowlist.
* App Review for `instagram_basic` / `instagram_manage_insights` is still pending.

To keep these users productive while real OAuth access is unblocked, Trendoraa exposes a **sandbox demo account** backed by the pre-seeded `alice_reels` profile (with mock Reels, scores, and a generated strategy).

### Triggering the Sandbox Demo

The dashboard's OAuth error banner and the empty-state onboarding flow both offer a "Use sandbox demo" fallback CTA. Under the hood, the client issues:

```http
POST /api/accounts/demo
```

The endpoint (`app/api/accounts/demo/route.ts`) is authenticated. It:

1. Locates the pre-seeded `alice_reels` Instagram account row (created by `lib/db/seed.ts`).
2. Re-parents that account — plus its related `strategies` rows — to the calling `userId`.
3. If the seed has not been run (or the row was deleted), it falls back to inserting a fresh `alice_reels` account plus two mock Reels so the dashboard always renders meaningful data.

### When to Recommend It

* During QA and demos before the Meta App is approved.
* As a graceful fallback when real OAuth fails — the dashboard OAuth error banner links straight to this flow.
* For internal walkthroughs that should not depend on a live Instagram account.

> [!NOTE]
> The sandbox demo is intended for development and onboarding. Once a user successfully connects a real Instagram Professional account, treat the demo account as throwaway data and avoid mixing demo metrics with real ingestion.
