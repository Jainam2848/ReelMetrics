# Product Requirements Document (PRD) — Trendoraa

**Document Version:** 1.0.0  
**Status:** Validated & Approved  
**Author:** Senior Product Manager  

---

## 1. Executive Summary & Problem Statements

Trendoraa is an AI-powered cross-platform strategy platform that automates the analysis of Instagram Reels and TikTok Videos, scores them across key visual and structural dimensions, and outputs personalized content calendars. By shifting the creator workflow from intuition-driven guessing to highly tailored, data-backed execution, the platform establishes a high-margin business model with an exceptionally low operational footprint.

### 📅 Staged Rollout Timeline
To optimize development velocity and establish immediate product-market validation, Trendoraa follows a strict two-stage launch strategy:
1. **Phase 1: Instagram MVP Launch (Initial Rollout)**: Launch exclusively with Instagram Professional account connection, Reel ingestion, 9-dimension hook scoring, AI strategies, and Stripe billing. The goal is to rapidly deploy a high-value core product, validate unit economics, and acquire the first paying subscribers.
2. **Phase 2: TikTok Post-MVP Expansion**: Once the Instagram MVP is launched and has acquired active paying users, the platform will implement the TikTok Display API integration, including 24-hour token rotation pipelines, sequential ingestion queue routines, TikTok-specific metrics, and cross-platform dashboard filters.


### 1.1 Core Problem Statements (Spec §1.2)

1. **Blind Posting:** Short-form video creators and brands publish Instagram Reels and TikTok Videos with no systematic understanding of *why* specific videos perform exceptionally well while others fail. Native analytics aggregate passive views but hide critical user retention and drop-off markers.
2. **Strategy Paralysis:** The creator ecosystem is filled with generic, uncontextualized growth advice that ignores platform differences and individual account niches. Creators lack a clear, personalized, and actionable cross-platform posting playbook.
3. **Severe Time Sink:** The process of manually exporting, tracking, and analyzing video performance across multiple platforms (Instagram and TikTok) in spreadsheets is structurally unsustainable for solo creators and social media teams.

---## 2. Target Audience & Customer Segmentation (Spec §1.4)

The platform targets three high-value customer segments, focusing on users who rely heavily on video content across both Instagram Reels and TikTok Videos for audience acquisition and brand equity:

| Segment | Description | Target Willingness to Pay |
|:---|:---|:---|
| **Primary** | **Creators & Influencers:** Independent creators (10K–500K followers) actively posting Reels and TikToks who need fast, data-backed cross-platform advice to sustain organic traffic. | $39.00 – $99.00 / month |
| **Secondary** | **Social Media Managers (SMMs):** Professionals handling 3 to 10 distinct client brand accounts across multiple platforms who need automated, white-label PDF reporting and multi-account strategy dashboards. | $99.00 – $299.00 / month |
| **Tertiary** | **Direct-to-Consumer (D2C) Brands:** Growing e-commerce brands utilizing Reels and TikToks as core acquisition channels to scale conversion rates, direct traffic, and product sales. | $149.00 – $499.00 / month |

---

## 3. Product Tier & Feature Matrix (Spec §1.6)

The platform operates on a tiered monthly subscription model structured around database size limits, account seats, monthly AI post analysis caps, and specialized AI outputs. It is strictly cost-optimized to safeguard profit margins (>90% Gross Margin):

| Feature Area | Free ($0/mo) | Creator ($39/mo) | Pro ($89/mo) | Agency ($249/mo) |
|:---|:---|:---|:---|:---|
| **Connected Accounts** | Max 1 (IG or TikTok) | Max 2 (e.g. 1 IG + 1 TikTok) | Max 6 (e.g. 3 IG + 3 TikTok) | Max 20 (up to 10 clients) |
| **Ingested History** | Last 10 posts | Unlimited history | Unlimited history | Unlimited history |
| **Data Sync Frequency** | Manual trigger | Hourly background sync | Hourly background sync | Priority background sync |
| **Monthly AI Analysis Limit** | 0 posts | **50 posts / month** | **200 posts / month** | **800 posts / month** |
| **Monthly LLM Budget Cap** | $0.00 | **$8.00** | **$25.00** | **$75.00** |
| **AI Scoring Engine** | None | 9-Dimension AI (GPT-4o-mini) | 9-Dimension AI (GPT-4o-mini) | Priority 9-Dimension AI (GPT-4o) |
| **Content Strategy** | Basic metrics | Weekly strategy generation | Advanced strategy + calendar | Custom white-label strategy briefs |
| **Trend Detection** | None | None | 3-Account competitive trends | 10-Account cross-brand trends |
| **Collaborative Seats** | 1 Admin seat | 1 Creator seat | 2 Team seats | 5 Agency team seats |

---

## 4. API Integration Constraints & Rate Limits

Integration with external social platforms is subject to structural limits. All database designs and worker schedules conform to these constraints:

### 4.1 Meta Graph API v22.0+ (Instagram Reels)
* **Quota Allocation:** 200 API calls per hour per authorized user account.
* **Pre-Flight Guard:** Before initiating an API fetch request, the background worker checks the remaining hourly quota. The worker aborts the operation if the remaining quota falls below 10 calls, preserving a core buffer for administrative actions.
* **Backoff Strategy:** Rate-limiting triggers an automatic exponential backoff. The system waits 1 minute for the first retry, increments the delay dynamically to a maximum of 15 minutes, and terminates the task after 5 failed retries.
* **Webhook Deduplication:** Instagram webhooks occasionally push duplicate events due to network retries. The system computes a unique queue key using the format: `webhook:${mediaId}:${changeField}:${hashOrTimestamp}`. The backend runs an `INSERT INTO job_queue ON CONFLICT DO NOTHING` statement, rejecting identical events before executing a sync task.

### 4.2 TikTok Display API v2+
* **Quota & Rate Limits:** 10,000 requests per day per client key.
* **Authentication Constraints:** Unlike Meta Graph API which provides long-lived access tokens that refresh silently, the TikTok Display API issues an access token with a strict 24-hour lifespan. It also issues a long-lived `refresh_token` with a 1-year lifespan.
* **Token Refresh Cycle:** A daily background job queries all TikTok connections, checks if their access tokens expire within the next 4 hours, and performs a refresh POST call to the TikTok OAuth exchange endpoint. If the refresh fails due to user revocation, the social account is flagged as `disconnected`, and the user is sent an email notification to re-authenticate.
* **Sequential Polling:** TikTok does not natively support real-time webhook video triggers. To prevent hitting platform rate limits, the Skip Locked background worker runs synchronization tasks sequentially using a FIFO queue.

---

## 5. API Deprecation & Platform Specifics (Spec §6.6)

The platform isolates platform-specific API differences at the ingestion level while storing metrics in a normalized schema.

### 5.1 Instagram-Specific Metrics
* **`ig_skip_rate` (Unique hook metric):** The percentage of viewers who scroll past the Reel within the first 3 seconds. Nullable if under 5 views. Fallback scoring baseline: `50.0%` for missing entries.
* **`ig_public_reposts`:** The count of public grid reposts (excluding direct messages and private story shares).
* **Deprecated Metrics:** `plays`, `impressions`, `ig_reels_aggregated_all_plays_count`, and `clips_replays_count` are fully deprecated or removed. The system maps all older media to `views`.

### 5.2 TikTok-Specific Metrics
* **`tiktok_completion_rate` (Unique retention metric):** The percentage of viewers who watch the video from start to finish. Nullable. Fallback scoring baseline: `30.0%` for missing entries.
* **`tiktok_saves_count`:** The count of bookmarks/saves. Since saves are not exposed natively in some TikTok Display API versions, this metric is nullable. Fallback engine calculates heuristic engagement by ignoring saves if null.

---

## 6. MVP User Stories (Strict Verification)

All user stories are structured, testable, and completely free of ambiguous terms (`should`, `maybe`, `might`, `could`).

### 6.1 Authentication & Onboarding

#### Story 1: Multi-Platform Social Account Connection
As a Creator, I want to authenticate via Supabase Auth and link either my Instagram Professional account or my TikTok Creator/Business profile so that the system is authorized to ingest my content data.
* **Acceptance Criterion 1:** Clicking the Facebook OAuth button launches the Meta permission window, returns a valid, long-lived access token, validates that the account type is Professional (rejecting personal profiles with `INSTAGRAM_NOT_BUSINESS_ACCOUNT`), and writes it to `social_accounts` with platform `"instagram"`.
* **Acceptance Criterion 2:** Clicking the TikTok OAuth button launches the TikTok permission window, returns a short-lived `access_token` and a long-lived `refresh_token`, and writes both to `social_accounts` with platform `"tiktok"` and encrypted tokens using AES-256-GCM.

#### Story 2: User Sign-Up Verification
As a Creator, I want to receive a transaction verification email upon signing up so that I can securely activate my account and prevent bot registration.
* **Acceptance Criterion 1:** A successful user sign-up inserts a pending user record in the database and automatically queues a `SEND_EMAIL` job in the background table.
* **Acceptance Criterion 2:** The system blocks login access until the user clicks the unique verification link sent to their email.

---

### 6.2 Data Ingestion & Synchronization

#### Story 3: Staged Social Ingestion Pipelines
As a Creator, I want the system to automatically sync my connected account posts every 6 hours so that my dashboard analytics remain up to date.
* **Acceptance Criterion 1:** For Instagram, the background worker fetches `GET /me/media` every 6 hours, upserting Reels data into the `posts` table (mapping platform as `"instagram"`).
* **Acceptance Criterion 2:** For TikTok, the background worker pulls from `/v2/video/list/` using the active access token, performing database upserts on `platform_media_id` matching platform `"tiktok"`, avoiding any record duplication.

#### Story 4: Deep Insights Harvesting
As a Creator, I want the system to harvest deep insights specific to each platform so that I can understand metric-level performance.
* **Acceptance Criterion 1:** The Instagram pipeline queries `insights`, mapping `views`, `total_views`, `ig_skip_rate`, and `ig_public_reposts` to the `posts` table.
* **Acceptance Criterion 2:** The TikTok pipeline queries `/v2/video/list/` fields, mapping views, likes, shares, comments, `tiktok_completion_rate`, and `tiktok_saves_count`. Null values write literal `null` without crashing the ingestion process.

#### Story 5: Manual Sync with Cross-Platform Cooldown
As a Creator, I want to trigger a manual sync of my social data with a 5-minute cooldown so that I see the latest metrics without hitting API limits.
* **Acceptance Criterion 1:** When the user clicks "Sync Now", the frontend disables the button and renders a countdown timer representing the 5-minute cooldown period.
* **Acceptance Criterion 2:** The backend database evaluates the last manual sync timestamp for the requesting social account, and returns a `429 Too Many Requests` error if a manual sync request occurs within the 5-minute threshold.

---

### 6.3 AI Scoring & Analysis

#### Story 6: Cross-Platform Multi-Dimension AI Post Analysis
As a Creator, I want the AI engine to analyze my Instagram Reels or TikTok Videos across 9 dimensions so that I know why they performed well or poorly.
* **Acceptance Criterion 1:** The system invokes the LLM API passing the post's platform indicator, title, script/description, and metrics, receiving a JSON payload containing exact integer scores from 1 to 10 for hook, retention, cta, visual, audio, trend, caption, and timing.
* **Acceptance Criterion 2:** The backend validates the JSON response using a Zod schema and writes the validated record to `post_scores` linked to `posts` table.

#### Story 7: Heuristic Fallback Scoring
As a Creator, I want the system to fall back to a data-driven heuristic score if the AI service is unavailable so that my dashboard never breaks.
* **Acceptance Criterion 1:** When the LLM API call fails or the user hits their monthly budget or AI analysis cap, the system calculates the heuristic score and sets `source` to `"heuristic"`.
* **Acceptance Criterion 2:** If the account has no historical posts to compute baseline averages, the fallback engine uses `2.0%` for engagement rate, `50.0%` for skip rate (Instagram), and `30.0%` for completion rate (TikTok) to finish the calculation.

---

### 6.4 Content Strategy & Calendars

#### Story 8: Weekly Cross-Platform Strategy Brief Generation
As a Creator, I want to receive a weekly content strategy based on my historical performance across both platforms so that I can implement actionable advice on my next posts.
* **Acceptance Criterion 1:** The strategy system compiles all metrics from the last 7 days for all active accounts, evaluates the top-performing formats per platform, and saves a weekly strategy record in the `strategies` table.
* **Acceptance Criterion 2:** The user dashboard displays the latest weekly strategy showing a text summary, identified platform-specific strengths, and clear improvement recommendations.

#### Story 9: Trend Detection Insights
As a Pro User, I want to access a monthly trend detection report so that I can align my content with current high-performing patterns.
* **Acceptance Criterion 1:** The system aggregates metrics from the user's historical posts and isolates formatting trends, listing hook types that yield high retention or low skip rates.
* **Acceptance Criterion 2:** The Trend page renders a list showing at least 3 concrete trend insights backed by exact media references from their profile.

---

### 6.5 Financials & Subscription Management

#### Story 10: Paid Plan Checkout redirection
As a Creator, I want to subscribe to a paid tier via Stripe Checkout so that I can unlock unlimited history and AI analysis features.
* **Acceptance Criterion 1:** Clicking "Upgrade" redirects the user's browser session to a Stripe Checkout URL pre-populated with their unique customer metadata and correct subscription pricing ID.
* **Acceptance Criterion 2:** Following payment confirmation, the system redirects the user back to the application dashboard and displays a payment success banner.

#### Story 11: Stripe Webhook Synchronization
As a System, I want to process Stripe payment webhooks asynchronously so that the database subscription records match Stripe's status immediately.
* **Acceptance Criterion 1:** The webhook endpoint verifies the Stripe payload signature using the `stripe-webhook-secret` key before processing any event.
* **Acceptance Criterion 2:** Upon receiving a verified `customer.subscription.updated` event, the system updates the database user subscription record to active status.

---

### 6.6 User Privacy & Compliance (GDPR)

#### Story 12: GDPR Data Export Portability
As a Creator, I want to export all my personal data and cross-platform social metrics in a structured JSON file so that I can control my data portability.
* **Acceptance Criterion 1:** Sending a GET request to `/api/auth/me/data-export` returns a `200 OK` status and triggers the download of a structured JSON file containing all user data, connected accounts, and ingested metric logs.
* **Acceptance Criterion 2:** The export process retrieves and compiles data from `users`, `subscriptions`, `social_accounts`, `posts`, `post_scores`, and `strategies` tables within 5 seconds of the initial request.

#### Story 13: Cascade Account Purge
As a Creator, I want to delete my account and purge all my personal and social data from the system so that my privacy is respected.
* **Acceptance Criterion 1:** Triggering account deletion executes a cascading database delete that permanently deletes the user's records from `social_accounts`, `posts`, `post_scores`, `strategies`, and `usage_tracking` tables.
* **Acceptance Criterion 2:** The deletion process updates all matching `user_id` values inside the security `audit_log` table to `NULL`, retaining anonymous historical action lines for compliance.

---

### 6.7 Infrastructure & Admin Operations

#### Story 14: Automated Queue Heartbeat Monitoring
As a System, I want to track background worker heartbeats so that hung tasks are automatically identified and re-enqueued.
* **Acceptance Criterion 1:** The database worker writes a timestamp update to `last_heartbeat_at` in the `job_queue` every 30 seconds while processing a task.
* **Acceptance Criterion 2:** A scheduled job searches the database for tasks in `processing` status with a `last_heartbeat_at` older than 5 minutes, resets their status to `pending`, and increments the retry count.

#### Story 15: Budget-Based & Cap AI Circuit Breaker
As a System, I want to enforce monthly budget caps and monthly AI post analysis caps per user so that we prevent malicious usage and run-away cloud costs.
* **Acceptance Criterion 1:** Before executing any LLM API call for scoring, the backend queries the user's active billing period and checks if their monthly AI analysis count exceeds their plan limit (50 for Creator, 200 for Pro, 800 for Agency) OR if their cost exceeds the budget cap ($8.00 for Creator, $25.00 for Pro, $75.00 for Agency).
* **Acceptance Criterion 2:** When either the post count limit or cost budget cap is hit, the system automatically redirects the user's requests to the heuristic fallback engine and inserts a cost warning in their notifications feed.

---

## 7. Non-Functional Requirements

### 7.1 Performance Budgets
* **Page Load Times:** Standard dashboard pages must load and render interactive elements in under 1.5 seconds.
* **Database Execution Timeouts:** A statement execution timeout of 10 seconds is enforced on all database queries at the connection level.
* **AI Engine Execution Cap:** AI calls to external models must complete within a strict 15-second execution limit, failing gracefully to heuristic fallback on timeout.

### 7.2 Security & Compliance
* **Data Encryption:** All retrieved social account access and refresh tokens must be encrypted at rest using AES-256-GCM. Decryption keys must support multi-version SOC2-compliant rotation using environment configurations.
* **Row-Level Security (RLS):** Every user-facing database table must have RLS active. System policies must be audited automatically on every migration by simulating cross-tenant requests in `scripts/test-rls.ts`.
* **Logging Sanitization:** All console logs and crash report traces must be scrubbed of credentials, Stripe secrets, and social tokens using regex redaction before hitting external logs.

### 7.3 Availability & Resilience
* **Uptime Target:** Hosting infrastructure must maintain a blended uptime rating of 99.9%.
* **Graceful Degradation:** The application must utilize data-driven fallback scoring when external APIs (Meta, TikTok, or OpenAI/Gemini APIs) experience service outages, keeping dashboards functional.
* **Queue Resilience:** The PostgreSQL queue must isolate task execution, enforcing a limit of 3 automated retries per job before escalating to a halted state for manual admin review.
