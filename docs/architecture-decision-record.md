# Architecture Decision Record (ADR) — Reel Logic AI

**Document Version:** 1.0.0  
**Status:** Approved  
**Author:** Software Architect & Principal Engineer  

---

## 1. High-Level Architecture (Spec §2.1)

The system is designed around a unified Next.js monorepo architecture leveraging Supabase for serverless infrastructure services, combining database, authentication, and file storage into a single operational tier. The application decouples operational boundaries at the service layer, keeping execution units isolated and clean.

```
┌─────────────────────────────────────────────────────────────────┐
│                        REEL LOGIC AI                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Frontend    │  │   Backend    │  │   Worker System      │  │
│  │   (Next.js)   │  │   (Next.js   │  │   (Queue Workers)    │  │
│  │              │  │    API Routes)│  │                      │  │
│  │  • Dashboard  │  │  • REST API  │  │  • Ingestion Worker  │  │
│  │  • Strategy   │  │  • Webhooks  │  │  • AI Scoring Worker │  │
│  │  • Settings   │  │  • Auth      │  │  • Strategy Worker   │  │
│  │  • Billing    │  │  • RBAC      │  │  • Billing Worker    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    SUPABASE LAYER                        │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌────────────┐  ┌─────────────────┐  │   │
│  │  │ PostgreSQL  │  │   Auth     │  │   Storage       │  │   │
│  │  │ + RLS       │  │   (GoTrue) │  │   (S3-compat)   │  │   │
│  │  │ + pgcrypto  │  │            │  │                 │  │   │
│  │  └─────────────┘  └────────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  EXTERNAL SERVICES                       │   │
│  │                                                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │   │
│  │  │Instagram │  │  OpenAI  │  │  Stripe  │  │Resend  │ │   │
│  │  │Graph API │  │  GPT-4o  │  │  Billing │  │ Email  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack (Spec §2.2)

The core technology stack is strictly locked. No substitutions or additions are permitted. This stack was selected to achieve a high degree of developer productivity, type-safety, and operational simplicity:

| Layer | Technology | Architectural Rationale |
|:---|:---|:---|
| **Frontend Framework** | Next.js 14+ (App Router) | Enables React Server Components (RSC) to minimize client-side bundle sizes and leverages Server-Side Rendering (SSR) for instantaneous page loading. |
| **UI Styling** | shadcn/ui + Tailwind CSS v4 | Provides premium, custom-tailored CSS styling based on modern design standards with full accessibility out of the box. |
| **Backend API** | Next.js API Routes + Server Actions | Establishes a collocated, type-safe API routing framework without the overhead of deploying and configuring a separate server application. |
| **Database Engine** | Supabase (PostgreSQL 15+) | Serves as the single data warehouse, providing enterprise storage capabilities, native Row-Level Security, and cryptographic utilities. |
| **ORM Layer** | Drizzle ORM | Provides an SQL-first, lightweight, compile-time type-safe mapper. Eliminates ORM runtime overhead and maps complex database queries natively. |
| **Authentication** | Supabase Auth (GoTrue) | Manages authentication flows natively, supporting secure OAuth2 handshakes for Instagram logins and session tokens. |
| **Background Queue** | Custom PG SKIP LOCKED Queue | Eliminates the cost and operational footprint of Redis or Kafka. Provides database-native ACID-compliant job processing. |
| **AI/LLM Engines** | OpenAI GPT-4o-mini & GPT-4o | Delivers optimal token pricing, low API latency, and highly structured, parser-friendly JSON returns. |
| **Payment Gateway** | Stripe Subscriptions + Checkout | Standardizes subscription logic and billing portal generation, utilizing secure webhook signatures. |
| **Email Gateway** | Resend | transactional email delivery service with simple REST APIs, tailored for serverless execution runtimes. |
| **Deployment Platform**| Vercel (Frontend) + Supabase (DB) | Minimizes deployment surface by automating serverless function distribution, SSL management, and database replication. |
| **Error Monitoring** | Sentry + Custom Telemetry Logs | Logs production anomalies and error traces, mapping errors directly to source files while keeping user secrets redacted. |
| **CI/CD Pipeline** | GitHub Actions | Automates codebase verification, ESLint structural boundaries checks, and schema validation on every branch merge. |

---

## 3. Hard Architectural Constraints (Spec §2.2 & §9)

The platform operates under a strict **Zero-Extra-Infrastructure** constraint to eliminate serverless cold-start overhead, control operational budgets, and enable a solo-founder to easily monitor the system.

* **NO Redis / NO Memcached:** Caching is achieved natively using PostgreSQL Row Level Caching, application-level In-Memory SWR (Stale-While-Revalidate) cycles, and CDN caching headers.
* **NO Kafka / NO RabbitMQ:** Event streaming is banned. High-throughput data ingestion is structured into sequential database queues, avoiding complex multi-cluster messaging patterns.
* **NO Microservices:** All backend services run under a monolithic Next.js repository, compiled into serverless API endpoints and long-running unified worker routines.
* **PostgreSQL-Only Queue (`SKIP LOCKED`):** Background jobs are managed using a custom task queue utilizing PostgreSQL’s native concurrency features:
  * Workers pull jobs using `SELECT * FROM job_queue WHERE status = 'pending' FOR UPDATE SKIP LOCKED LIMIT 1`.
  * This query isolates workers, prevents race conditions, enforces strict ACID transactions, and prevents job duplication.
  * Eliminates the need to maintain or pay for a separate queuing cluster (e.g. Redis/BullMQ).

---

## 4. Module Boundary Map & Isolation (Spec §18 RULE 3)

The architecture establishes rigid structural walls around core logical modules. Cross-module imports are blocked at compile-time to maintain absolute service separation.

```
┌──────────────────────────────────────────────────────────┐
│                  MODULE BOUNDARY MAP                      │
│                                                          │
│  ┌──────────┐   NEVER   ┌──────────┐   NEVER   ┌──────┐│
│  │ Billing  │◄────────X──│    AI    │────────X──►│Queue ││
│  │          │    touches  │          │  writes    │      ││
│  └──────────┘            └──────────┘  to DB     └──────┘│
│       │                       │                      │    │
│       │                       │                      │    │
│       ▼                       ▼                      ▼    │
│  ┌──────────────────────────────────────────────────────┐│
│  │              SERVICE LAYER (mediator)                 ││
│  │  • Orchestrates cross-module operations               ││
│  │  • Enforces boundaries                                ││
│  │  • Handles transactions                               ││
│  └──────────────────────────────────────────────────────┘│
```

### 4.1 Boundary Rules & Import Guard Policies
1. **Billing Isolation:** The `Billing` module operates purely on Stripe webhook parsing and subscription table modifications. It never imports functions from the `AI` engine or enqueues items into the `Queue` directly.
2. **AI Module Purity:** The `AI` module is a pure execution pipeline. It receives raw parameters and returns typed values. It **never** writes directly to DB tables, and it **never** makes network requests to external APIs other than OpenAI. All database writes are mediated by the `Service` layer.
3. **Queue Ingestion Limits:** Webhook routes and API endpoints never execute heavy business or synchronization logic. They extract parameters and write a `pending` job into the queue, deferring runtime load to workers.
4. **Compile-Time Enforcement:** A custom ESLint rule inside `eslint.config.mjs` enforces imports limits. Public routes under `app/(public)/**/*` are restricted from importing `@/lib/db`, `@/lib/supabase`, or `@/lib/crypto`.
5. **Database Transaction Safety:** The `Service` mediator wraps cross-module routines in standard SQL transactions. If an AI write or webhook ingestion step fails, the transaction rolls back, preventing data corruption.

---

## 5. Cost Model & Blended FinOps Estimate (Spec §12.1)

To ensure high profitability from Day 1, the platform operates on highly optimized infrastructure costs:

### 5.1 Fixed Infrastructure Costs
* **Supabase Pro Tier:** $25.00 / month
* **Vercel Pro Team Tier:** $20.00 / month
* **Sentry Developer Tier:** $26.00 / month
* **Resend Professional Tier:** $20.00 / month
* **Total Base Fixed Cost:** **$91.00 / month**

### 5.2 Variable Cost Targets (Per-User API Costs)
* **GPT-4o-mini (Scoring):** ~$0.015 / Reel analyzed (avg. 150 input, 800 output tokens)
* **GPT-4o (Strategy):** ~$0.08 / Strategy run (avg. 2,000 input, 2,000 output tokens)
* **Stripe Fees:** 2.9% + $0.30 per customer transaction
* **Instagram Graph API:** $0.00 (Free)

### 5.3 Blended Cost Model per 1,000 Active Users
Using a standard seed-stage SaaS product user distribution, the variable and fixed costs compute as follows:

* **User Mix Assumptions (1,000 total active users):**
  * **Free Tier:** 80% (800 users) — Variable cost: $0.15/user/mo (10 AI calls/mo max using GPT-4o-mini)
  * **Creator Tier:** 15% (150 users) — Variable cost: $2.25/user/mo (150 AI calls/mo max)
  * **Pro Tier:** 4% (40 users) — Variable cost: $12.00/user/mo (600 AI calls/mo max + GPT-4o strategy)
  * **Agency Tier:** 1% (10 users) — Variable cost: $40.00/user/mo (2,500 AI calls/mo max + GPT-4o priority)

* **Monthly Cost Breakdown:**
  * **Free Tier Variable Cost:** 800 * $0.15 = $120.00 / month
  * **Creator Tier Variable Cost:** 150 * $2.25 = $337.50 / month
  * **Pro Tier Variable Cost:** 40 * $12.00 = $480.00 / month
  * **Agency Tier Variable Cost:** 10 * $40.00 = $400.00 / month
  * **Total Variable Expenses:** **$1,337.50 / month**
  * **Fixed Infrastructure Base:** **$91.00 / month**
  * **Blended Cost per 1K Users:** **$1,428.50 / month** (Approx. $1.43 / user / month average)

* **Gross Margin Metrics:**
  * **Creator Plan ($29/mo):** 92.2% Gross Margin ✅
  * **Pro Plan ($79/mo):** 84.8% Gross Margin ✅
  * **Agency Plan ($199/mo):** 79.9% Gross Margin ✅

---

## 6. External API Dependency & Fallback Strategy

The application adopts a defensive engineering mindset, treating all external integrations as unreliable dependencies:

### 6.1 Instagram Graph API (v22.0+)
* **Dependencies:** Media ingestion, comment and engagement retrieval, reels_skip_rate insights.
* **Failure Vectors:** OAuth token expirations, 429 rate limit errors (200 requests/hr ceiling), network connection drops.
* **Fallback Strategy:**
  * **Stale-While-Revalidate (SWR) DB Reads:** Ingestion logic implements SWR caching. Dashboards load cached metrics instantly from PostgreSQL while launching worker threads in the background.
  * **Rate Limit Exponential Backoff:** API calls failing due to a 429 error automatically schedule a queue retry starting with a 1-minute delay, scaling exponentially up to 15 minutes before calling an admin alert.
  * **Manual Sync Protection:** Cooldown logic blocks frontend-triggered manual synchronization requests for 5 minutes per account.

### 6.2 OpenAI API (GPT-4o / GPT-4o-mini)
* **Dependencies:** Deep text scoring, hook quality analysis, strategy generation.
* **Failure Vectors:** OpenAI API server outages, connection timeouts, monthly user LLM budget overruns.
* **Fallback Strategy:**
  * **Monthly LLM Budget Circuit Breakers:** Monthly budget caps are monitored per user account ($5.00 for Creator, $20.00 for Pro, $60.00 for Agency). If a user reaches their budget limit, further OpenAI scoring operations are blocked and routed to fallback heuristics.
  * **Heuristic Fallback Engine:** If an OpenAI request fails or budget constraints trip, the backend executes the Heuristic Fallback Engine, generating a deterministic, math-based score based on historical engagement ratios and skip-rate parameters. The response is saved in the database with the structural attribute `source: "heuristic"`.
  * **NaN Prevention Default:** If a new account lacks historical Reels views or engagement ratios, engagement defaults to `2.0%` and skip rate defaults to `50.0%` within calculations.

### 6.3 Stripe API
* **Dependencies:** Checkout portal redirection, customer subscription synchronization.
* **Failure Vectors:** Hook signature spoofing, delayed webhook events, failed invoice collections.
* **Fallback Strategy:**
  * **Atomic Event Deduplication:** Webhooks log Stripe `event_id` keys inside a unique `processed_events` table before processing, enforcing single execution via `ON CONFLICT DO NOTHING`.
  * **Stripe Retry Endpoints:** An administrative endpoint (`POST /api/webhooks/stripe/retry`) is provided to replay failed Stripe events manually using historical webhook payload logs.
  * **Billing Grace Periods:** Subscription status is persisted locally in the database. Active subscription states are given a 3-day grace period on invoice collection failure, preventing instant lockouts during bank collection drops.

### 6.4 Resend API
* **Dependencies:** Verification emails, billing change warnings, security alert logs.
* **Failure Vectors:** API downtime, recipient server rejections.
* **Fallback Strategy:**
  * **Queued Email Dispatch:** Verification emails are not dispatched inside sign-up API requests. They are saved in `job_queue` as `SEND_EMAIL` tasks.
  * **Transactional Resiliency:** A transient Resend service outage does not block system execution or user registrations; workers process queued emails asynchronously when the gateway recovers.

---

## 7. Security Model & Safeguards (Spec §11)

The system implements 6 secure defensive layers, protecting user data at rest, in transit, and during background runs.

### 7.1 Layered Security Architecture
1. **Network Layer:** All connections use HTTPS exclusively, utilizing Vercel's automated TLS configuration. API routes use CORS limits, blocking unauthorized domains, and enforce CSRF token validation.
2. **Authentication Layer:** GoTrue processes logins natively. Instagram access tokens are fetched using secure OAuth2 authorization codes, and user session cookies are protected via `httpOnly` and `SameSite` flags.
3. **Authorization Layer (RLS):** Row-Level Security is active on every single user-facing table in Supabase. Access policies enforce tenant isolation. RLS policies are validated on every migration and codebase update by running the automated simulation script (`scripts/test-rls.ts`).
4. **Data Protection Layer (Token Encryption):** Long-lived Instagram access tokens are encrypted in PostgreSQL using the AES-256-GCM algorithm. Cryptographic payloads are saved using multi-version tracking keys:
   * Format: `keyVersion:iv:authTag:ciphertext` (e.g., `v2:32byteIv:32byteTag:ciphertext`).
   * This multi-version format allows SOC2-compliant, zero-downtime key rotation by preserving historical keys in a decryption keys map variable (`TOKEN_ENCRYPTION_KEYS`).
5. **Webhook Security Layer:** Stripe webhooks verify HMAC-SHA256 headers before processing, and Instagram webhooks check `hub.verify_token` signatures to prevent payload injection.
6. **Application Security Layer:** Zod schemas validate all API payloads, preventing SQL injection via parameterized execution and securing against XSS via content escaping.

### 7.2 Log Sanitization Engine
To prevent token leakages in third-party monitoring services (Sentry/Vercel logs), all logged messages are processed through `sanitizeForLogs()` to redact secrets:

```typescript
// Central log redaction regular expressions:
const SECRET_PATTERNS = [
  { name: "stripe-live-key",       re: /\bsk_live_[A-Za-z0-9]{16,}\b/g },
  { name: "stripe-webhook-secret", re: /\bwhsec_[A-Za-z0-9]{20,}\b/g },
  { name: "stripe-publishable",    re: /\bpk_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
  { name: "instagram-access-token",re: /\bEAAC[A-Za-z0-9]{100,}\b/g }
];
```
