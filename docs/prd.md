# Product Requirements Document (PRD) — Reel Logic AI

**Document Version:** 1.0.0  
**Status:** Validated & Approved  
**Author:** Senior Product Manager  

---

## 1. Executive Summary & Problem Statements

Reel Logic AI is an AI-powered Instagram strategy platform that automates the analysis of Instagram Reels, scores them across key visual and structural dimensions, and outputs personalized content calendars. By shifting the creator workflow from intuition-driven guessing to highly tailored, data-backed execution, the platform establishes a high-margin business model with an exceptionally low operational footprint.

### 1.1 Core Problem Statements (Spec §1.2)

1. **Blind Posting:** Instagram creators and brands publish Reels with no systematic understanding of *why* specific videos perform exceptionally well while others fail. Native analytics aggregate passive views but hide critical user retention and drop-off markers.
2. **Strategy Paralysis:** The creator ecosystem is filled with generic, uncontextualized growth advice that ignores individual account niches. Creators lack a clear, personalized, and actionable posting playbook tailored to their own performance history.
3. **Severe Time Sink:** The process of manually exporting, tracking, and analyzing video performance across dozens of Reels in spreadsheets is structurally unsustainable for solo creators and social media teams.

---

## 2. Target Audience & Customer Segmentation (Spec §1.4)

The platform targets three high-value customer segments, focusing on users who rely heavily on video content for audience acquisition and brand equity:

| Segment | Description | Target Willingness to Pay |
|:---|:---|:---|
| **Primary** | **Instagram Creators:** Independent creators (10K–500K followers) actively posting Reels who need fast, data-backed advice to sustain full-time organic traffic. | $29.00 – $99.00 / month |
| **Secondary** | **Social Media Managers (SMMs):** Professionals handling 3 to 10 distinct client brand accounts who need automated, white-label PDF reporting and multi-account strategy dashboards. | $99.00 – $299.00 / month |
| **Tertiary** | **Direct-to-Consumer (D2C) Brands:** Growing e-commerce brands utilizing Reels as a core acquisition channel to scale conversion rates, direct traffic, and product sales. | $149.00 – $499.00 / month |

---

## 3. Product Tier & Feature Matrix (Spec §1.6)

The platform operates on a tiered monthly subscription model structured around database size limits, account seats, and specialized AI outputs:

| Feature Area | Free ($0/mo) | Creator ($29/mo) | Pro ($79/mo) | Agency ($199/mo) |
|:---|:---|:---|:---|:---|
| **Connected Accounts** | Max 1 account | Max 1 account | Max 3 accounts | Max 10 accounts |
| **Ingested History** | Last 10 Reels | Unlimited historical Reels | Unlimited historical Reels | Unlimited historical Reels |
| **Data Sync Frequency** | Manual trigger | Hourly scheduled background sync | Hourly scheduled background sync | Priority hourly scheduled sync |
| **AI Scoring Engine** | None | 9-Dimension AI analysis (GPT-4o-mini) | 9-Dimension AI analysis (GPT-4o-mini) | Priority 9-Dimension AI (GPT-4o) |
| **Content Strategy** | Basic metrics | Weekly strategy generation | Advanced strategy + calendar | Custom white-label strategy briefs |
| **Trend Detection** | None | None | 3-Account competitive trends | 10-Account cross-brand trends |
| **Collaborative Seats** | 1 Admin seat | 1 Creator seat | 2 Team seats | 5 Agency team seats |

---

## 4. Instagram API v22.0+ Constraints & Rate Limits (Spec §6.4 & §6.6)

Integration with the Meta Graph API is subject to structural limits. All database designs and worker schedules conform to these constraints:

### 4.1 Rate Limits & Pre-Flight Controls
* **Quota Allocation:** 200 API calls per hour per authorized user account.
* **Pre-Flight Guard:** Before initiating an API fetch request, the background worker checks the remaining hourly quota. The worker aborts the operation if the remaining quota falls below 10 calls, preserving a core buffer for administrative actions.
* **Backoff Strategy:** Rate-limiting triggers an automatic exponential backoff. The system waits 1 minute for the first retry, increments the delay dynamically to a maximum of 15 minutes, and terminates the task after 5 failed retries.

### 4.2 Webhook Deduplication
Instagram webhooks occasionally push duplicate events due to network retries. To maintain database integrity:
* The system computes a unique queue key using the format: `webhook:${mediaId}:${changeField}:${hashOrTimestamp}`.
* The backend runs an `INSERT INTO job_queue ON CONFLICT DO NOTHING` statement, rejecting identical events before executing a sync task.

---

## 5. API Deprecation & Migration Notice (Spec §6.6)

The platform complies fully with the Meta Graph API v22.0+ deprecation cycle initiated on April 21, 2025:

### 5.1 Deprecated Metrics
* **`plays`**: Completely deprecated for all media created after July 2, 2024. Replaced by the unified `views` metric.
* **`impressions`**: Consolidated directly into the unified `views` metric.
* **`ig_reels_aggregated_all_plays_count`**: Deprecated. Replaced by `total_views` to capture cross-platform exposure.
* **`clips_replays_count`**: Removed from the API with no direct replacement.

### 5.2 Newly Available Metrics
* **`views` (Standard):** The unified metric combining total plays and screen displays.
* **`total_views` (Aggregated):** Combines views across Instagram, Facebook crossposts, and promoted campaigns.
* **`reels_skip_rate` (Unique Differentiator):** **The percentage of viewers who scroll past the video within the first 3 seconds.**
  * *Nullable Metric Rule:* Instagram returns `null` for new Reels or those with under 5 views. The database schema accommodates `null`. UI components display `"N/A"` for null values, and the scoring calculations fall back to a median baseline of `50.0%` for missing entries.
* **`public_reposts` (Aggregated):** Video reshared to a user profile grid (excluding stories and private DMs). Acts as a premium signal for algorithmic weight.

---

## 6. MVP User Stories (Strict Verification)

All user stories are structured, testable, and completely free of ambiguous terms (`should`, `maybe`, `might`, `could`).

### 6.1 Authentication & Onboarding

#### Story 1: Instagram Account Connection
As a Creator, I want to authenticate via Supabase Auth and link my Instagram Professional account so that the system is authorized to ingest my Reels data.
* **Acceptance Criterion 1:** Clicking the Facebook OAuth button launches the Meta permission window and successfully returns a valid, long-lived access token upon user authorization.
* **Acceptance Criterion 2:** The backend checks the linked account type immediately after token retrieval, aborts registration if the account is a Personal profile, and returns an `INSTAGRAM_NOT_BUSINESS_ACCOUNT` error code.

#### Story 2: User Sign-Up Verification
As a Creator, I want to receive a transaction verification email upon signing up so that I can securely activate my account and prevent bot registration.
* **Acceptance Criterion 1:** A successful user sign-up inserts a pending user record in the database and automatically queues a `SEND_EMAIL` job in the background table.
* **Acceptance Criterion 2:** The system blocks login access until the user clicks the unique verification link sent to their email.

---

### 6.2 Data Ingestion & Synchronization

#### Story 3: Automated Reels Data Ingestion
As a Creator, I want the system to automatically fetch my Reels media data and basic metrics every 6 hours so that my dashboard stays up to date without manual action.
* **Acceptance Criterion 1:** The background worker runs a fetch to `GET /me/media` every 6 hours, filtering for `media_type = VIDEO` and successfully inserting new media items into the database.
* **Acceptance Criterion 2:** The worker performs a database upsert on existing `ig_media_id` records, updating `like_count` and `comments_count` while preventing row duplication.

#### Story 4: Deep Insights Harvesting
As a Creator, I want the system to fetch deep Reels insights including views and reels_skip_rate so that I can see performance analytics.
* **Acceptance Criterion 1:** The ingestion pipeline queries the Instagram Graph API `insights` endpoint for every media item, pulling `views`, `total_views`, `reels_skip_rate`, and `public_reposts`.
* **Acceptance Criterion 2:** If the API returns a null value for `reels_skip_rate`, the normalization system writes a literal `null` to the database and allows the row insertion to finish successfully.

#### Story 5: Manual Sync Request
As a Creator, I want to trigger a manual sync of my Instagram data with a 5-minute cooldown so that I can see the latest metrics without hitting API rate limits.
* **Acceptance Criterion 1:** When the user clicks the "Sync Now" button, the frontend disables the button and displays a countdown timer representing the 5-minute cooldown period.
* **Acceptance Criterion 2:** The backend database evaluates the last manual sync timestamp for the requesting account and returns a `429 Too Many Requests` error if a manual sync request occurs within the 5-minute threshold.

---

### 6.3 AI Scoring & Analysis

#### Story 6: Multi-Dimension AI Reel Analysis
As a Creator, I want the AI scoring engine to analyze my Reel across 9 dimensions so that I know why it performed well or poorly.
* **Acceptance Criterion 1:** The system invokes the OpenAI model with raw video metadata, receiving a JSON payload containing exact integer scores from 1 to 10 for hook, skip_rate, retention, cta, visual, audio, trend, caption, and timing.
* **Acceptance Criterion 2:** The backend parses the JSON response using a strict Zod schema, validating that all 9 integer fields are populated, and writes the validated object to the `reels_analysis` database table.

#### Story 7: Heuristic Fallback Scoring
As a Creator, I want the system to fall back to a data-driven heuristic score if the AI service is unavailable so that my dashboard never breaks.
* **Acceptance Criterion 1:** When the OpenAI API call fails or the user monthly budget cap is reached, the system executes the fallback calculation and sets the analysis `source` column to `"heuristic"`.
* **Acceptance Criterion 2:** If the account has no historical Reels to compute an average engagement rate, the fallback engine uses a baseline of `2.0%` for engagement and `50.0%` for skip rate to complete the calculation successfully.

---

### 6.4 Content Strategy & Calendars

#### Story 8: Weekly Strategy Brief Generation
As a Creator, I want to receive a weekly content strategy based on my historical performance so that I can implement actionable advice on my next posts.
* **Acceptance Criterion 1:** The strategy system compiles all metrics from the last 7 days, evaluates the top-performing formats, and saves a weekly strategy record in the `strategies` table.
* **Acceptance Criterion 2:** The user dashboard displays the latest weekly strategy showing a text summary, an identified primary strength, and a clear improvement recommendation.

#### Story 9: Trend Detection Insights
As a Pro User, I want to access a monthly trend detection report so that I can align my content with current high-performing patterns.
* **Acceptance Criterion 1:** The system aggregates metrics from the user's historical Reels and isolates formatting trends, listing hook types that yield a skip rate under 30%.
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
As a Creator, I want to export all my personal data and Instagram metrics in a structured JSON file so that I can control my data portability.
* **Acceptance Criterion 1:** Sending a GET request to `/api/auth/me/data-export` returns a `200 OK` status and triggers the download of a structured JSON file containing all user data, connected accounts, and ingested metric logs.
* **Acceptance Criterion 2:** The export process retrieves and compiles data from `users`, `subscriptions`, `instagram_accounts`, and `strategies` tables within 5 seconds of the initial request.

#### Story 13: GDPR Account Purge
As a Creator, I want to delete my account and purge all my personal data from the system so that my privacy is respected.
* **Acceptance Criterion 1:** Triggering account deletion from the Settings page executes a cascading database delete that permanently deletes the user's records from `subscriptions`, `instagram_accounts`, `strategies`, and `usage_tracking` tables.
* **Acceptance Criterion 2:** The deletion process updates all matching `user_id` values inside the security `audit_log` table to `NULL`, retaining anonymous historical action lines for compliance.

---

### 6.7 Infrastructure & Admin Operations

#### Story 14: Automated Queue Heartbeat Monitoring
As a System, I want to track background worker heartbeats so that hung tasks are automatically identified and re-enqueued.
* **Acceptance Criterion 1:** The database worker writes a timestamp update to `last_heartbeat_at` in the `job_queue` every 30 seconds while processing a task.
* **Acceptance Criterion 2:** A scheduled job searches the database for tasks in `processing` status with a `last_heartbeat_at` older than 5 minutes, resets their status to `pending`, and increments the retry count.

#### Story 15: Budget-Based AI Circuit Breaker
As a System, I want to enforce monthly budget caps on LLM usage per user so that we prevent malicious usage and run-away cloud costs.
* **Acceptance Criterion 1:** Before executing any OpenAI API call, the backend queries the user's monthly cost inside the database and blocks the request if the total exceeds the tier cap ($5.00 for Creator, $20.00 for Pro, $60.00 for Agency).
* **Acceptance Criterion 2:** When a budget cap is hit, the system automatically redirects the user's requests to the heuristic fallback engine and inserts a cost warning in their notifications feed.

---

## 7. Non-Functional Requirements

### 7.1 Performance Budgets
* **Page Load Times:** Standard dashboard pages must load and render interactive elements in under 1.5 seconds.
* **Database Execution Timeouts:** A statement execution timeout of 10 seconds is enforced on all database queries at the connection level.
* **AI Engine Execution Cap:** AI calls to OpenAI models must complete within a strict 15-second execution limit, failing gracefully to heuristic fallback on timeout.

### 7.2 Security & Compliance
* **Data Encryption:** All retrieved Instagram access tokens must be encrypted at rest using AES-256-GCM. Decryption keys must support multi-version SOC2-compliant rotation using environment configurations.
* **Row-Level Security (RLS):** Every user-facing database table must have RLS active. System policies must be audited automatically on every migration by simulating cross-tenant requests in `scripts/test-rls.ts`.
* **Logging Sanitization:** All console logs and crash report traces must be scrubbed of credentials, Stripe secrets, and Instagram tokens using regex redaction before hitting external logs.

### 7.3 Availability & Resilience
* **Uptime Target:** Hosting infrastructure must maintain a blended uptime rating of 99.9%.
* **Graceful Degradation:** The application must utilize data-driven fallback scoring when external APIs (Meta Graph API or OpenAI API) experience service outages, keeping dashboards functional.
* **Queue Resilience:** The PostgreSQL queue must isolate task execution, enforcing a limit of 3 automated retries per job before escalating to a halted state for manual admin review.
