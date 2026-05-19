# Reel Logic AI — Self-Executing AI Build System (SEABS)

## Complete Founder Specification v1.0

> **Classification:** Founder-Grade • VC-Ready • Production Architecture
>
> **Author:** Solo Founder Build Spec — generated for autonomous AI-assisted construction
>
> **Last Updated:** 2025-05-19
>
> **Status:** ACTIVE — CANONICAL SOURCE OF TRUTH

---

## Document Purpose

This document is the **single source of truth** for building Reel Logic AI. It is not a prompt collection. It is not a feature list. It is a **deterministic software construction specification** designed to be consumed by AI agents, human engineers, and investors.

**What it covers:**

| Dimension | Section |
|---|---|
| Product vision & market positioning | §1 |
| System architecture & execution engine | §2 |
| Phase execution model & state machine | §3 |
| Database schema & data model | §4 |
| Backend API & business logic | §5 |
| Instagram data ingestion pipeline | §6 |
| AI/LLM engine & strategy generation | §7 |
| Billing & monetization (Stripe) | §8 |
| Queue engine & worker system | §9 |
| Frontend UI/UX specification | §10 |
| Security model | §11 |
| FinOps & cost control | §12 |
| Observability & telemetry | §13 |
| Deployment & CI/CD | §14 |
| Failure state engine | §15 |
| Validation engine | §16 |
| Repair engine | §17 |
| Global engineering rules | §18 |
| Agent boundaries & roles | §19 |
| Investor-ready metrics | §20 |
| Instagram strategy logic | §21 |

---

# TABLE OF CONTENTS

- [§1 — PRODUCT VISION & MARKET POSITIONING](#1--product-vision--market-positioning)
- [§2 — SYSTEM ARCHITECTURE (EXECUTION ENGINE)](#2--system-architecture-execution-engine)
- [§3 — PHASE EXECUTION MODEL & STATE MACHINE](#3--phase-execution-model--state-machine)
- [§4 — DATABASE SCHEMA & DATA MODEL](#4--database-schema--data-model)
- [§5 — BACKEND API & BUSINESS LOGIC](#5--backend-api--business-logic)
- [§6 — INSTAGRAM DATA INGESTION PIPELINE](#6--instagram-data-ingestion-pipeline)
- [§7 — AI/LLM ENGINE & STRATEGY GENERATION](#7--aillm-engine--strategy-generation)
- [§8 — BILLING & MONETIZATION](#8--billing--monetization)
- [§9 — QUEUE ENGINE & WORKER SYSTEM](#9--queue-engine--worker-system)
- [§10 — FRONTEND UI/UX SPECIFICATION](#10--frontend-uiux-specification)
- [§11 — SECURITY MODEL](#11--security-model)
- [§12 — FINOPS & COST CONTROL](#12--finops--cost-control)
- [§13 — OBSERVABILITY & TELEMETRY](#13--observability--telemetry)
- [§14 — DEPLOYMENT & CI/CD](#14--deployment--cicd)
- [§15 — FAILURE STATE ENGINE](#15--failure-state-engine)
- [§16 — VALIDATION ENGINE](#16--validation-engine)
- [§17 — REPAIR ENGINE](#17--repair-engine)
- [§18 — GLOBAL ENGINEERING RULES](#18--global-engineering-rules)
- [§19 — AGENT BOUNDARIES & ROLES](#19--agent-boundaries--roles)
- [§20 — INVESTOR-READY METRICS & UNIT ECONOMICS](#20--investor-ready-metrics--unit-economics)
- [§21 — INSTAGRAM STRATEGY LOGIC (THE PRODUCT BRAIN)](#21--instagram-strategy-logic-the-product-brain)

---

# §1 — PRODUCT VISION & MARKET POSITIONING

## 1.1 One-Line Pitch

> **Reel Logic AI** is an AI-powered Instagram strategy platform that analyzes your Reels performance, scores every piece of content, and generates personalized posting strategies — turning guesswork into data-driven growth.

## 1.2 Problem Statement

Instagram creators and brands face three critical problems:

1. **Blind posting** — No understanding of *why* certain Reels perform and others don't
2. **Strategy paralysis** — Too much generic advice, no personalized action plan
3. **Time sink** — Manual analysis of metrics across dozens of Reels is unsustainable

## 1.3 Solution

Reel Logic AI solves this by:

| Capability | How |
|---|---|
| **Automated ingestion** | Pulls all Reels data via Instagram Graph API v22.0+ on schedule |
| **AI-powered scoring** | LLM analyzes each Reel across 9 dimensions (hook, skip rate, retention, CTA, etc.) |
| **Skip rate intelligence** | Surfaces Instagram's `reels_skip_rate` — the % of viewers who scroll past within 3 seconds — a signal **no competitor exposes** |
| **Strategy generation** | Produces weekly/monthly content calendars with timing, format, and topic recommendations |
| **Trend detection** | Identifies what's working *for this specific account* vs. generic trends |
| **Actionable dashboards** | Clean UI showing scores, trends, and next-best-actions |

## 1.4 Target User

| Segment | Description | Willingness to Pay |
|---|---|---|
| **Primary** | Instagram creators (10K–500K followers) actively posting Reels | $29–99/mo |
| **Secondary** | Social media managers handling 3–10 accounts | $99–299/mo |
| **Tertiary** | D2C brands using Reels for organic growth | $149–499/mo |

## 1.5 Competitive Positioning

```
                    High AI Intelligence
                         ▲
                         │
            Reel Logic AI │  (Target Position)
                     ★    │
                         │
   ┌─────────────────────┼─────────────────────┐
   │                     │                     │
   │  Metricool          │           Sprout    │
   │  Later              │           Social    │
   │                     │                     │
Low Specialization ──────┼────── High Breadth
   │                     │                     │
   │  Free tools         │         Hootsuite   │
   │  IG native          │                     │
   │                     │                     │
   └─────────────────────┼─────────────────────┘
                         │
                    Low AI Intelligence
```

**Key differentiator:** Deep Reels-specific AI analysis with **skip rate intelligence** — the only platform surfacing Instagram's `reels_skip_rate` metric for hook optimization. Not a generic scheduling tool.

## 1.6 Business Model

| Tier | Price | Features |
|---|---|---|
| **Free** | $0/mo | 1 account, last 10 Reels, basic metrics |
| **Creator** | $29/mo | 1 account, unlimited history, AI scoring, weekly strategy |
| **Pro** | $79/mo | 3 accounts, advanced strategy, trend detection, content calendar |
| **Agency** | $199/mo | 10 accounts, team access, white-label reports, priority AI |

## 1.7 VC Metrics That Matter

| Metric | Target at Seed | Target at Series A |
|---|---|---|
| MRR | $15K | $100K+ |
| User count | 500 paid | 3,000 paid |
| Churn | <8% monthly | <5% monthly |
| LTV:CAC | >3:1 | >4:1 |
| Gross margin | >65% | >75% |
| NDR | >100% | >110% |

---

# §2 — SYSTEM ARCHITECTURE (EXECUTION ENGINE)

## 2.1 High-Level Architecture

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

## 2.2 Technology Stack (Locked — No Substitutions)

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) | SSR, RSC, API routes in one framework |
| **UI Library** | shadcn/ui + Tailwind CSS v4 | Premium feel, customizable, accessible |
| **Backend** | Next.js API Routes + Server Actions | Collocated, type-safe, no separate server |
| **Database** | Supabase (PostgreSQL 15+) | RLS, Auth, Realtime, Storage — all-in-one |
| **ORM** | Drizzle ORM | Type-safe, SQL-first, lightweight |
| **Auth** | Supabase Auth (GoTrue) | OAuth2 for Instagram, session management |
| **Queue** | PostgreSQL SKIP LOCKED (custom) | No Redis/Kafka dependency, single-DB simplicity |
| **AI/LLM** | OpenAI GPT-4o-mini (primary), GPT-4o (premium) | Best cost-performance ratio |
| **Payments** | Stripe (Subscriptions + Checkout) | Industry standard, webhook-driven |
| **Email** | Resend | Developer-first transactional email |
| **Hosting** | Vercel (frontend) + Supabase (backend) | Zero-ops, auto-scaling |
| **Monitoring** | Sentry + custom telemetry | Error tracking + business metrics |
| **CI/CD** | GitHub Actions | Standard, free for open-source |

> **⚠️ HARD CONSTRAINT:** No Redis, no Kafka, no RabbitMQ, no separate microservices. Everything runs on PostgreSQL + Vercel + Supabase. Solo founder = minimal operational surface.

### Supabase Local Development Standard
For local development, a local Supabase instance is the mandatory standard. Developers MUST use the Supabase CLI (`supabase init` and `supabase start`) with Docker to run the database, authentication, and storage services locally.
- **Local PostgreSQL Connection Port:** `54322`
- **Local Database URL:** `postgresql://postgres:postgres@localhost:54322/postgres`
- **Migration Policy:** All migrations are generated locally (`npx drizzle-kit generate`) and run against the local Supabase instance (`supabase migration new` and `npx drizzle-kit migrate` or `supabase db reset`) before push.

## 2.3 SEABS Runtime Components

```
SEABS Runtime
│
├── Phase Controller ─────── Ordered state machine; no phase skipping
│
├── Agent Executor ───────── LLM wrapper with structured output enforcement
│
├── Validator Engine ─────── Rules + AST + Schema checks per phase
│   ├── Structural Validator (schema match, import guard)
│   ├── Runtime Simulator (mock execution, payload simulation)
│   ├── Contract Validator (API shape, RLS, idempotency)
│   └── Failure Injector (timeout, malformed data, constraint violation)
│
├── Repair Engine ────────── Auto-fix with bounded retries (max 3)
│
├── Sandbox Runtime ──────── Isolated code execution for validation
│
├── Dependency Guard ─────── Import whitelist + architecture boundary enforcement
│
├── Telemetry Logger ─────── Structured JSON logs, full traceability
│
└── Human Escalation Gate ── HALT + notify when repair fails
```

## 2.4 Execution Loop (Core Runtime)

```
FOR each PHASE in ordered_pipeline:

    EXECUTE agent_prompt(phase.prompt, phase.agent_role)

    artifacts = COLLECT agent_output

    FOR each validator in phase.validation_suite:
        result = RUN validator(artifacts)

        IF result.status === FAIL:
            BREAK to repair

    IF all_validators_pass:
        COMMIT phase_state(artifacts)
        TRANSITION to next_phase
        CONTINUE

    // --- REPAIR PATH ---
    FOR attempt in 1..3:
        diagnosis = ANALYZE failure_logs
        patch = GENERATE minimal_fix(diagnosis)
        patched_artifacts = APPLY patch(artifacts)

        IF RUN all_validators(patched_artifacts) === PASS:
            COMMIT phase_state(patched_artifacts)
            TRANSITION to next_phase
            BREAK

    IF still_failing:
        EMIT escalation_event
        SET system_state = HALTED
        NOTIFY human(failure_context)
        EXIT pipeline
```

## 2.5 Database Connection Sizing and Math

To prevent connection starvation in serverless environments, database pool sizing MUST be configured according to strict mathematical limits. Direct connections to PostgreSQL without an intermediate pooler (e.g. PgBouncer/Supabase Supavisor) are highly discouraged. When using direct connections, the connection pool limit MUST satisfy:

$$\text{Max Connections} = (\text{Vercel Max Serverless Concurrency} \times \text{Direct Pool Size}) + (\text{Workers} \times \text{Worker Concurrency}) + \text{PgBouncer Reserve}$$

Where:
- **`Vercel Max Serverless Concurrency`**: The maximum concurrent serverless function instances allowed (default Vercel hobby/pro tier cap is 100).
- **`Direct Pool Size`**: Connection pool size allocated per serverless function container instance (must be set to `1` in serverless to prevent rapid connection exhaustion).
- **`Workers`**: The number of background worker server processes running concurrently.
- **`Worker Concurrency`**: The number of concurrent job executions processed by each worker process (default is `5`).
- **`PgBouncer Reserve`**: Connections reserved for administrative commands, migrations, and database monitoring (minimum `10`).

### Connection Safeguard Rules:
1. **Connection Timeouts**: All database connections MUST configure a strict connection timeout limit of **5 seconds** (`connect_timeout=5`).
2. **Statement Execution Timeouts**: To prevent slow queries from locking the database indefinitely, a query execution statement timeout of **10 seconds** (`statement_timeout=10000`) MUST be enforced at the connection level.
3. **Transaction Timeouts**: Idle in transaction timeouts MUST be capped at **15 seconds** (`idle_in_transaction_session_timeout=15000`) to automatically terminate hanging client locks.

---

# §3 — PHASE EXECUTION MODEL & STATE MACHINE

## 3.1 System State Machine

```
                    ┌─────────────────┐
                    │      INIT       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  PRD_VALIDATED   │ ← Product requirements locked
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ ARCH_LOCKED     │ ← Architecture decisions frozen
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ DATABASE_READY  │ ← Schema migrated, RLS active
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ BACKEND_READY   │ ← APIs operational, auth working
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ BILLING_READY   │ ← Stripe integrated, plans active
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ INGESTION_READY │ ← Instagram data pipeline working
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  QUEUE_READY    │ ← Workers running, DLQ active
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   AI_READY      │ ← LLM scoring + strategy working
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ FRONTEND_READY  │ ← UI complete, UX validated
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ OBSERVABILITY   │ ← Logging, alerting, health checks
                    │    _READY       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   DEPLOYED      │ ← Production live
                    └─────────────────┘
```

## 3.2 Phase Schema Definition

Every phase MUST conform to this structure:

```typescript
interface Phase {
  id: string;                    // e.g., "PHASE_DATABASE"
  name: string;                  // Human-readable name
  order: number;                 // Execution order (no gaps)
  agent_role: AgentRole;         // Which agent executes
  prompt: string;                // Execution instructions
  input_artifacts: string[];     // Required inputs from prior phases
  output_artifacts: Artifact[];  // Expected outputs
  validation_suite: Validator[]; // Must-pass checks
  rollback_point: string;        // Git tag or state snapshot
  success_state: SystemState;    // State after successful completion
  timeout_seconds: number;       // Max execution time
  max_repair_attempts: number;   // Default: 3
}

interface Artifact {
  name: string;           // e.g., "schema.sql"
  type: ArtifactType;     // "code" | "config" | "schema" | "test" | "doc"
  path: string;           // Relative file path
  validation_schema?: object; // JSON Schema for config artifacts
}

type AgentRole =
  | "backend-engineer"
  | "ai-engineer"
  | "frontend-engineer"
  | "devops-engineer"
  | "security-engineer";

type SystemState =
  | "INIT"
  | "PRD_VALIDATED"
  | "ARCH_LOCKED"
  | "DATABASE_READY"
  | "BACKEND_READY"
  | "BILLING_READY"
  | "INGESTION_READY"
  | "QUEUE_READY"
  | "AI_READY"
  | "FRONTEND_READY"
  | "OBSERVABILITY_READY"
  | "DEPLOYED";
```

## 3.3 Complete Phase Registry

### PHASE 1: PRD Validation

```yaml
id: PHASE_PRD
order: 1
agent: product-manager
outputs:
  - prd.md (validated product requirements)
  - user-stories.md
  - acceptance-criteria.md
validation:
  - all user stories have acceptance criteria
  - no ambiguous requirements ("should", "maybe", "might")
  - pricing tiers defined with feature matrix
  - API rate limits documented
success_state: PRD_VALIDATED
```

### PHASE 2: Architecture Lock

```yaml
id: PHASE_ARCHITECTURE
order: 2
agent: backend-engineer
inputs:
  - prd.md
outputs:
  - architecture.md
  - tech-stack.lock (immutable)
  - directory-structure.md
  - dependency-manifest.json
validation:
  - no forbidden dependencies (Redis, Kafka, RabbitMQ)
  - all external APIs have fallback paths
  - cost estimate per 1K users documented
  - data flow diagram covers all user actions
success_state: ARCH_LOCKED
```

### PHASE 3: Database

```yaml
id: PHASE_DATABASE
order: 3
agent: backend-engineer
inputs:
  - architecture.md
  - prd.md
outputs:
  - migrations/*.sql
  - schema.ts (Drizzle schema)
  - seed.sql
  - rls-policies.sql
validation:
  - every table has RLS policy
  - every table has created_at, updated_at
  - every FK has ON DELETE behavior defined
  - no TEXT columns without length consideration
  - tenant_id (user_id) on every user-facing table
  - indexes on all FK columns and query patterns
success_state: DATABASE_READY
```

### PHASE 4: Backend API

```yaml
id: PHASE_BACKEND
order: 4
agent: backend-engineer
inputs:
  - schema.ts
  - prd.md
outputs:
  - app/api/**/*.ts (all API routes)
  - lib/services/*.ts (business logic)
  - lib/validators/*.ts (Zod schemas)
  - middleware.ts
validation:
  - every endpoint has Zod input validation
  - every endpoint has error handling (try/catch → typed error response)
  - every endpoint checks auth (except public routes)
  - every endpoint returns consistent response shape
  - no business logic in API route handlers (delegated to services)
success_state: BACKEND_READY
```

### PHASE 5: Billing (Stripe)

```yaml
id: PHASE_BILLING
order: 5
agent: backend-engineer
inputs:
  - schema.ts
  - prd.md (pricing tiers)
outputs:
  - lib/services/billing.service.ts
  - app/api/webhooks/stripe/route.ts
  - lib/billing/plans.ts
  - lib/billing/usage-tracker.ts
validation:
  - webhook signature verification implemented
  - all Stripe events handled
```

# §4 — DATABASE SCHEMA & DATA MODEL

## 4.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│     users        │       │  subscriptions    │       │   plans          │
│─────────────────│       │──────────────────│       │─────────────────│
│ id (PK, UUID)   │◄──┐  │ id (PK, UUID)    │       │ id (PK, text)   │
│ email            │   │  │ user_id (FK, C)* │──────►│ name             │
│ full_name        │   │  │ plan_id (FK)     │       │ price_monthly    │
│ avatar_url       │   │  │ stripe_sub_id    │       │ max_accounts     │
│ created_at       │   │  │ status           │       │ max_reels        │
│ updated_at       │   │  │ current_period_*  │       │ ai_tier          │
└────────┬────────┘   │  │ cancel_at         │       │ features (JSONB) │
         │            │  └──────────────────┘       └─────────────────┘
         │            │
         │            │  ┌──────────────────┐
         │            │  │ instagram_accounts│
         │            └──│──────────────────│
         │               │ id (PK, UUID)    │
         │               │ user_id (FK, C)* │
         │               │ ig_user_id       │
         │               │ username          │
         │               │ access_token_enc │ ← AES-256-GCM encrypted
         │               │ token_expires_at │
         │               │ token_version    │ ← default 1 (Optimistic Concurrency)
         │               │ followers_count  │
         │               │ last_synced_at   │
         │               │ sync_status      │
         │               └────────┬─────────┘
         │                        │
         │                        │
         │               ┌────────▼─────────┐       ┌─────────────────┐
         │               │     reels         │       │  reel_scores     │
         │               │──────────────────│       │─────────────────│
         │               │ id (PK, UUID)    │──────►│ id (PK, UUID)   │
         │               │ account_id(FK,C)*│       │ reel_id (FK, C)*│
         │               │ ig_media_id      │       │ overall_score    │
         │               │ caption           │       │ hook_score       │
         │               │ media_url         │       │ skip_rate_score  │
         │               │ permalink         │       │ retention_score  │
         │               │ timestamp         │       │ cta_score        │
         │               │ views_count       │ ← replaces plays (deprecated Apr 2025)
         │               │ total_views       │ ← aggregated across IG + FB crosspost
         │               │ display_views     │ ← Normalized view field
         │               │ metric_source     │ ← 'legacy_plays' | 'unified_views'
         │               │ likes_count       │       │ visual_score     │
         │               │ comments_count    │       │ audio_score      │
         │               │ shares_count      │       │ trend_score      │
         │               │ saves_count       │       │ caption_score    │
         │               │ public_reposts    │       │ reach            │
         │               │ skip_rate         │       │ engagement_rate  │
         │               │ fetched_at        │       │ timing_score     │
         │               └──────────────────┘       │ ai_analysis      │ ← JSONB
         │                                          │ model_version    │
         │                                          │ tokens_used      │
         │                                          │ cost_usd         │
         │                                          │ scored_at        │
         │                                          └─────────────────┘
         │
         │               ┌──────────────────┐
         │               │   strategies      │
         │               │──────────────────│
         └──────────────►│ id (PK, UUID)    │
                         │ user_id (FK, C)* │
                         │ account_id(FK,C)*│
                         │ strategy_type    │ ← "weekly" | "monthly" | "campaign"
                         │ content          │ ← JSONB (structured strategy)
                         │ period_start     │
                         │ period_end       │
                         │ model_version    │
                         │ tokens_used      │
                         │ cost_usd         │
                         │ generated_at     │
                         └──────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   job_queue       │       │   usage_tracking  │       │ processed_events │
│──────────────────│       │──────────────────│       │──────────────────│
│ id (PK, UUID)    │       │ id (PK, UUID)    │       │ id (PK, UUID)    │
│ job_type          │       │ user_id (FK, C)* │       │ event_id (UNIQUE)│
│ payload (JSONB)  │       │ period_month     │       │ processed_at     │
│ status           │       │ ai_calls_count   │       │ created_at       │
│ priority         │       │ ai_tokens_used   │       │ updated_at       │
│ max_retries      │       │ ai_cost_usd      │       └──────────────────┘
│ retry_count      │       │ reels_analyzed   │
│ locked_at        │       │ strategies_gen   │       *Note: (C) indicates FK
│ locked_by        │       │ api_calls_count  │        configured with ON
│ last_heartbeat_at│       │ updated_at       │        DELETE CASCADE logic
│ scheduled_at     │       └──────────────────┘        for GDPR compliance.
│ completed_at     │
│ failed_at        │       ┌──────────────────┐
│ error_message    │       │   audit_log       │
│ dead_letter      │       │──────────────────│
│ idempotency_key  │       │ id (PK, UUID)    │
│ created_at       │       │ user_id (FK, S)* │ ← (S) indicates FK
└──────────────────┘       │ action            │   configured with ON
                           │ resource_type     │   DELETE SET NULL logic
                           │ resource_id       │
                           │ metadata (JSONB)  │
                           │ ip_address        │
                           │ created_at        │
                           └──────────────────┘
```

## 4.2 Critical Schema Rules

### Every table MUST have:

```sql
-- Standard columns on every user-facing table
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
```

### Automatic `updated_at` trigger:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table:
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON <table_name>
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### Row Level Security (RLS) — MANDATORY on every table:

```sql
-- Example: users can only see their own data
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reels"
    ON reels FOR SELECT
    USING (
        account_id IN (
            SELECT id FROM instagram_accounts
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own reels"
    ON reels FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT id FROM instagram_accounts
            WHERE user_id = auth.uid()
        )
    );
```

> **⚠️ SECURITY RULE:** RLS is mandatory on every user-facing table. All policies must be validated using `scripts/test-rls.ts` which simulates anonymous, cross-tenant, and owner database requests. See §11.6 for details.

### GDPR Deletion & Cascade Rules:
To ensure perfect GDPR compliance and prevent orphan database rows, foreign keys MUST adhere to strict deletion rules:
- **`ON DELETE CASCADE`**: Applied to all direct user data tables linked to a user account.
  - `subscriptions.user_id` REFERENCES `users(id) ON DELETE CASCADE`
  - `instagram_accounts.user_id` REFERENCES `users(id) ON DELETE CASCADE`
  - `strategies.user_id` REFERENCES `users(id) ON DELETE CASCADE`
  - `usage_tracking.user_id` REFERENCES `users(id) ON DELETE CASCADE`
  - `reels.account_id` REFERENCES `instagram_accounts(id) ON DELETE CASCADE`
  - `reel_scores.reel_id` REFERENCES `reels(id) ON DELETE CASCADE`
- **`ON DELETE SET NULL`**: Applied to historical immutable audit logs to protect user identity while preserving audit trails for compliance.
  - `audit_log.user_id` REFERENCES `users(id) ON DELETE SET NULL`

### Webhook Event Idempotency Schema:
```sql
-- Stripe and general webhook event logging table
CREATE TABLE processed_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id      TEXT NOT NULL UNIQUE, -- e.g. stripe event ID or hashed webhook payload details
    processed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for processed_events (service-role only, anonymous block)
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;
```

### Index Strategy:

```sql
-- Foreign keys (always indexed)
CREATE INDEX idx_reels_account_id ON reels(account_id);
CREATE INDEX idx_reel_scores_reel_id ON reel_scores(reel_id);
CREATE INDEX idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_strategies_user_id ON strategies(user_id);

-- Query patterns & performance
CREATE INDEX idx_reels_timestamp ON reels(account_id, timestamp DESC);
CREATE INDEX idx_job_queue_pending ON job_queue(status, scheduled_at)
    WHERE status = 'pending';
CREATE INDEX idx_job_queue_locked ON job_queue(locked_at)
    WHERE status = 'processing';
CREATE INDEX idx_job_queue_heartbeat ON job_queue(last_heartbeat_at)
    WHERE status = 'processing'; -- Claim liveness recovery check
CREATE INDEX idx_usage_tracking_period ON usage_tracking(user_id, period_month);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at); -- GDPR export speed

-- Uniqueness constraints
CREATE UNIQUE INDEX idx_reels_ig_media_id ON reels(ig_media_id);
CREATE UNIQUE INDEX idx_ig_accounts_ig_user_id ON instagram_accounts(ig_user_id);
CREATE UNIQUE INDEX idx_job_queue_idempotency ON job_queue(idempotency_key)
    WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX idx_processed_events_id ON processed_events(event_id);
```

## 4.3 Encryption Schema for Tokens

```sql
-- Token storage uses AES-256-GCM via pgcrypto
-- Encryption key stored in environment variable, NEVER in database

-- Column type: BYTEA (encrypted blob)
ALTER TABLE instagram_accounts
    ALTER COLUMN access_token_enc TYPE BYTEA;

-- Application-level encryption (TypeScript):
-- encrypt: aes256gcm.encrypt(token, process.env.TOKEN_ENCRYPTION_KEY)
-- decrypt: aes256gcm.decrypt(encrypted, process.env.TOKEN_ENCRYPTION_KEY)
```

## 4.4 Advanced Concurrency, Normalization, & RLS Policies

### 4.4.1 Optimistic Concurrency Control & Token Lifecycle
To prevent race conditions during token rotation, the `instagram_accounts` table enforces **Optimistic Concurrency Control (OCC)**:
- **`token_version` (INTEGER, default 1)**: Incremented on every successful write. Update statements must assert:
  ```sql
  UPDATE instagram_accounts 
  SET access_token_enc = $1, token_expires_at = $2, token_version = token_version + 1, updated_at = now()
  WHERE id = $3 AND token_version = $4;
  ```
  If 0 rows are updated, the transaction must rollback and abort due to a concurrent update conflict.
- **Pessimistic Ingestion Locking**: Daily background token refreshes and account sync operations must acquire a standard PostgreSQL transaction-level advisory lock to block concurrent cron trigger processes:
  ```sql
  SELECT pg_try_advisory_xact_lock(hashtext('token_refresh:' || id::text)) FROM instagram_accounts WHERE id = $1;
  ```

### 4.4.2 View Normalization & Engagement Rate Calculation
With the deprecation of `plays_count` and introduction of `views_count` (April 2025 API update), the system normalizes metrics on the `reels` table:
- **`display_views` (INTEGER)**: Represents the active view metric to show users. Map to `views_count` (primary) or fall back to legacy `plays_count` if `views_count` is absent.
- **`metric_source` (VARCHAR/ENUM)**: Set to `'legacy_plays'` or `'unified_views'` depending on which API version supplied the data.
- **Safe Engagement Rate (ER) Equation**: To prevent division-by-zero database crashes, the database and API services must compute engagement rate using a conditional check (returning `NULL` instead of failing if views are zero):
  $$\text{Engagement Rate} = \begin{cases} \text{NULL} & \text{if display\_views} = 0 \\ \frac{\text{likes} + \text{comments} + \text{shares} + \text{saves}}{\text{display\_views}} \times 100 & \text{otherwise} \end{cases}$$
  In SQL/Drizzle queries, always write:
  ```sql
  SELECT case when display_views = 0 then NULL else ((likes_count + comments_count + shares_count + saves_count)::numeric / display_views) * 100 end as engagement_rate;
  ```

### 4.4.3 Job Queue Heartbeat & Recovery Schema
To support high-throughput concurrency and prevent stuck or zombie jobs when workers crash mid-execution:
- **`last_heartbeat_at` (TIMESTAMPTZ, default now())**: Updated by the worker process every 30 seconds during job processing.
- **Zombie Recovery**: Jobs are claimed if they are `pending`, or if they are `processing` but `last_heartbeat_at` has stalled for more than 90 seconds (indicating worker death):
  ```sql
  WHERE status = 'pending' OR (status = 'processing' AND last_heartbeat_at < now() - interval '90 seconds')
  ```

---

# §5 — BACKEND API & BUSINESS LOGIC

## 5.1 API Response Contract (Universal)

Every API endpoint MUST return this exact shape:

```typescript
// Success response
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Error response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;        // Machine-readable: "RATE_LIMIT_EXCEEDED"
    message: string;     // Human-readable: "You've exceeded your plan's API limit"
    details?: unknown;   // Additional context
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

## 5.2 API Route Map

```
Authentication & User:
  POST   /api/auth/instagram          → Initiate Instagram OAuth
  GET    /api/auth/instagram/callback  → OAuth callback handler
  GET    /api/auth/me                  → Current user profile
  PATCH  /api/auth/me                  → Update profile
  DELETE /api/auth/me                  → Delete account (GDPR)

Instagram Accounts:
  GET    /api/accounts                 → List connected accounts
  POST   /api/accounts                 → Connect new account
  DELETE /api/accounts/:id             → Disconnect account
  POST   /api/accounts/:id/sync       → Trigger manual sync

Reels:
  GET    /api/accounts/:id/reels       → List reels (paginated)
  GET    /api/reels/:id                → Single reel with scores
  POST   /api/reels/:id/score         → Trigger AI scoring
  GET    /api/reels/:id/score         → Get scoring result

Strategy:
  GET    /api/accounts/:id/strategy    → Get current strategy
  POST   /api/accounts/:id/strategy    → Generate new strategy
  GET    /api/strategies/:id           → Get specific strategy

Analytics:
  GET    /api/accounts/:id/analytics   → Aggregated analytics
  GET    /api/accounts/:id/trends      → Trend analysis

Billing:
  GET    /api/billing/subscription     → Current subscription
  POST   /api/billing/checkout         → Create Stripe checkout session
  POST   /api/billing/portal           → Create Stripe portal session
  GET    /api/billing/usage            → Current period usage

Webhooks (no auth — signature verified):
  POST   /api/webhooks/stripe          → Stripe events
  POST   /api/webhooks/instagram       → Instagram webhook events

System:
  GET    /api/health                   → Health check (public)
  GET    /api/health/deep              → Deep health check (internal)
```

## 5.3 Service Layer Architecture

```
API Route Handler (thin — validation + delegation only)
       │
       ▼
Service Layer (all business logic lives here)
       │
       ├── auth.service.ts
       ├── account.service.ts
       ├── reel.service.ts
       ├── scoring.service.ts
       ├── strategy.service.ts
       ├── billing.service.ts
       ├── ingestion.service.ts
       ├── analytics.service.ts
       └── usage.service.ts
       │
       ▼
Data Access Layer (Drizzle ORM queries)
       │
       ▼
PostgreSQL (Supabase)
```

### Example: API Route Handler Pattern

```typescript
// app/api/accounts/[id]/reels/route.ts

import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { reelService } from "@/lib/services/reel.service";
import { apiResponse, apiError } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware";
import { withRateLimit } from "@/lib/api/rate-limit";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["timestamp", "engagement_rate", "views_count", "skip_rate"]).default("timestamp"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const GET = withAuth(
  withRateLimit(async (req: NextRequest, { params, user }) => {
    try {
      const { id: accountId } = params;
      const query = querySchema.parse(
        Object.fromEntries(req.nextUrl.searchParams)
      );

      // Service handles ownership check + data fetch
      const result = await reelService.listReels(user.id, accountId, query);

      return apiResponse(result.data, {
        page: query.page,
        limit: query.limit,
        total: result.total,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return apiError("VALIDATION_ERROR", "Invalid query parameters", error.errors);
      }
      throw error; // Let global error handler catch
    }
  })
);
```

## 5.4 Error Code Registry

```typescript
const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: { status: 401, message: "Authentication required" },
  FORBIDDEN: { status: 403, message: "Insufficient permissions" },
  TOKEN_EXPIRED: { status: 401, message: "Instagram token expired, please reconnect" },

  // Validation
  VALIDATION_ERROR: { status: 400, message: "Invalid input" },
  RESOURCE_NOT_FOUND: { status: 404, message: "Resource not found" },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: { status: 429, message: "Too many requests" },
  PLAN_LIMIT_EXCEEDED: { status: 403, message: "Plan limit exceeded" },

  // Billing
  NO_ACTIVE_SUBSCRIPTION: { status: 403, message: "Active subscription required" },
  PAYMENT_FAILED: { status: 402, message: "Payment failed" },

  // Instagram
  IG_API_ERROR: { status: 502, message: "Instagram API error" },
  IG_RATE_LIMITED: { status: 429, message: "Instagram rate limit hit, retry later" },
  IG_TOKEN_INVALID: { status: 401, message: "Instagram connection lost" },

  // AI
  AI_BUDGET_EXCEEDED: { status: 403, message: "AI analysis budget exceeded for this period" },
  AI_SERVICE_UNAVAILABLE: { status: 503, message: "AI service temporarily unavailable" },

  // System
  INTERNAL_ERROR: { status: 500, message: "Internal server error" },
  SERVICE_UNAVAILABLE: { status: 503, message: "Service temporarily unavailable" },
} as const;
```

## 5.5 Startup-Level Environment Sentinel Validation

To prevent runtime failures due to missing environment variables, the application MUST validate all required variables at boot time using a Zod-based sentinel module (`lib/env.ts`).

### Sentinel Implementation (`lib/env.ts`)
```typescript
import { z } from "zod";

const envSchema = z.zodObject({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  INSTAGRAM_CLIENT_ID: z.string().min(1),
  INSTAGRAM_CLIENT_SECRET: z.string().min(1),
  INSTAGRAM_APP_SECRET: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(16),
  TOKEN_ENCRYPTION_KEY: z.string().length(64), // AES-256 hex key
});

export const env = envSchema.parse(process.env);
```

Any import of `lib/env.ts` will automatically trigger schema validation. The application entry point (e.g. Next.js layout or instrumentation hook) MUST import this file so that missing variables cause a crash-fast boot failure rather than silent runtime errors.

---

# §6 — INSTAGRAM DATA INGESTION PIPELINE

## 6.1 OAuth2 Flow

```
User clicks "Connect Instagram"
        │
        ▼
┌─────────────────────────────┐
│ 1. Redirect to Instagram    │
│    OAuth authorization URL  │
│    with scopes:             │
│    - instagram_business_basic│     ← replaces instagram_basic
│    - instagram_manage_insights│
│    - pages_show_list        │
│    - pages_read_engagement  │
└────────────┬────────────────┘
             │
        User authorizes
             │
             ▼
┌─────────────────────────────┐
│ 2. Callback receives code   │
│    Exchange for short-lived  │
│    token (1 hour)           │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 3. Exchange for long-lived   │
│    token (60 days)          │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 3.5. Verify Business/Creator │
│      Call /me/accounts      │
│      Check instagram_business│
│      Abort & revoke if personal│
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 3.8. Encrypt with AES-256-GCM│
│      Store in DB            │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 4. Queue initial data sync   │
│    Fetch all Reels + metrics │
└─────────────────────────────┘
```

### 6.1.1 Instagram Business/Creator Account Validation

Because Instagram Graph API insights (`reels_skip_rate`, `public_reposts`, and general Reels metrics) are strictly available only for **Instagram Business** or **Instagram Creator** accounts, the system MUST enforce strict validation during the OAuth authentication flow callback. 

Immediately after exchanging the short-lived token for the long-lived page token:
1. **Query Facebook Graph API Accounts Node:**
   ```http
   GET /me/accounts?fields=instagram_business_account,name&access_token={long_lived_token}
   ```
2. **Enforce Account Type Constraints:**
   - Iterate through the returned Facebook Pages list.
   - Verify if any Facebook Page has a connected `instagram_business_account` object.
   - If `instagram_business_account` is **missing**, or if it represents a personal profile that has not been converted to a Creator or Business profile, the system **MUST abort the login flow**.
3. **Aborting and Cleanup:**
   - Revoke the authorized token immediately to maintain cleanliness.
   - Do NOT create a record in `instagram_accounts`.
   - Return a clear, user-friendly error code: `INSTAGRAM_NOT_BUSINESS_ACCOUNT`.

## 6.2 Token Lifecycle Management

```typescript
// Token refresh strategy — runs daily via cron job

interface TokenManager {
  // Check token expiry (refresh 7 days before expiry)
  shouldRefresh(account: InstagramAccount): boolean;

  // Refresh long-lived token (returns new 60-day token)
  refreshToken(account: InstagramAccount): Promise<string>;

  // Encrypt token before storage
  encryptToken(plainToken: string): string;

  // Decrypt token for API calls
  decryptToken(encryptedToken: string): string;

  // Handle token invalidation (user revoked access)
  handleInvalidToken(account: InstagramAccount): Promise<void>;
}

// Refresh schedule:
// - Token valid for 60 days
// - Refresh attempted at day 53 (7-day buffer)
// - If refresh fails, retry daily
// - If still failing at day 58, alert user via email + in-app notification
// - If expired, mark account as "disconnected", require re-auth
```

### Secure Cron Refresh Endpoint (`POST /api/cron/token-refresh`)
The token refresh cron job runs daily via a secure, time-bounded serverless endpoint.
- **Trigger:** Scheduled via Vercel Cron in `vercel.json` (triggering daily).
- **Security:** Requires an `Authorization: Bearer CRON_SECRET` header check to prevent unauthorized execution.
- **Local Simulation:** Developers can manually run and test this via curl:
  ```bash
  curl -X POST http://localhost:3000/api/cron/token-refresh -H "Authorization: Bearer CRON_SECRET_LOCAL"
  ```
- **Execution Limits:** Must complete within 15 seconds. If there are many tokens to refresh, it handles them sequentially or schedules sub-tasks to avoid timeout limits.



## 6.3 Data Sync Pipeline

```
                    ┌──────────────┐
                    │ Sync Trigger  │
                    │              │
                    │ • Scheduled  │ ← Every 6 hours
                    │ • Manual     │ ← User clicks "Sync"
                    │ • Webhook    │ ← Instagram push event
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Rate Limit   │
                    │ Check        │
                    │              │
                    │ 200 calls/hr │
                    │ per user     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────────────┐
                    │ Fetch Reels           │
                    │                       │
                    │ GET /{user-id}/media   │
                    │ ?fields=id,caption,    │
                    │  media_type,timestamp, │
                    │  permalink,media_url,  │
                    │  like_count,           │
                    │  comments_count        │
                    │                       │
                    │ Filter: media_type     │
                    │         = VIDEO        │
                    └──────┬───────────────┘
                           │
                    ┌──────▼───────────────┐
                    │ Fetch Insights        │
                    │ (per Reel)            │
                    │                       │
                    │ GET /{media-id}/       │
                    │  insights?metric=      │
                    │  views,reach,          │  ← views replaces plays (deprecated Apr 2025)
                    │  total_views,          │  ← aggregated IG + FB crosspost views
                    │  saved,shares,         │
                    │  total_interactions,   │
                    │  reels_skip_rate       │  ← NEW: % viewers who scrolled past in <3s
                    └──────┬───────────────┘
                           │
                    ┌──────▼───────────────┐
                    │ Normalize & Upsert    │
                    │                       │
                    │ • Deduplicate by      │
                    │   ig_media_id         │
                    │ • Calculate           │
                    │   engagement_rate     │
                    │ • Update if exists    │
                    │ • Insert if new       │
                    └──────┬───────────────┘
                           │
                    ┌──────▼───────────────┐
                    │ Queue Scoring Jobs    │
                    │                       │
                    │ For each new/updated  │
                    │ Reel → enqueue        │
                    │ AI_SCORE job          │
                    └──────────────────────┘
```

### Scheduled Ingestion Cron Endpoint (`POST /api/cron/ingest`)
The scheduled data sync is managed via a secure, time-bounded hourly serverless cron endpoint.
- **Trigger:** Scheduled via Vercel Cron in `vercel.json` (triggering hourly).
- **Security:** Requires an `Authorization: Bearer CRON_SECRET` header check to prevent unauthorized execution.
- **Action:** Instead of running the full sync in-request (which risks Vercel execution timeouts), this endpoint queries all connected accounts, checks their last sync timestamp, and enqueues a `SYNC_ACCOUNT` job for each account into the Skip Locked queue engine. The queue worker then processes each sync asynchronously.
- **Local Simulation:**
  ```bash
  curl -X POST http://localhost:3000/api/cron/ingest -H "Authorization: Bearer CRON_SECRET_LOCAL"
  ```

## 6.4 Instagram API Rate Limit Handling

```typescript
interface RateLimitStrategy {
  // Per-app limits
  appLimit: 200;         // calls per hour per user
  windowMs: 3_600_000;   // 1 hour

  // Handling strategy
  onRateLimit: {
    action: "exponential_backoff";
    initialDelay: 60_000;   // 1 minute
    maxDelay: 900_000;      // 15 minutes
    maxRetries: 5;
  };

  // Pre-flight check
  beforeCall: {
    checkRemainingQuota: true;
    abortIfUnder: 10;       // Reserve 10 calls for critical ops
  };
}
```

## 6.5 Engagement Rate Calculation

> **⚠️ API DEPRECATION (April 21, 2025):** `plays` and `impressions` are deprecated for media created after July 2, 2024. Use `views` (unified metric counting plays + screen displays) and `total_views` (aggregated across IG + FB crosspost + promoted). See §6.6 for full migration details.

```typescript
// Standard engagement rate formula for Reels (updated for views API)
function calculateEngagementRate(reel: {
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  views_count: number;   // ← replaces plays_count (deprecated Apr 2025)
}): number {
  const totalEngagements =
    reel.likes_count +
    reel.comments_count +
    reel.shares_count +
    reel.saves_count;

  if (reel.views_count === 0) return 0;

  return (totalEngagements / reel.views_count) * 100;
}

// Weighted engagement (saves + shares + reposts worth more)
function calculateWeightedEngagement(reel: ReelMetrics): number {
  const weighted =
    reel.likes_count * 1.0 +
    reel.comments_count * 2.0 +
    reel.shares_count * 3.0 +         // Highest signal
    reel.saves_count * 2.5 +          // Second highest
    reel.public_reposts * 3.5;        // NEW: strongest signal (public reshare)

  if (reel.views_count === 0) return 0;

  return (weighted / reel.views_count) * 100;
}

// Skip rate analysis — UNIQUE to Reel Logic AI
// Lower skip rate = stronger hook
function analyzeSkipRate(reel: {
  skip_rate: number;     // 0-100 (% who scrolled past in <3 seconds)
  views_count: number;
}): {
  hookStrength: "excellent" | "good" | "average" | "weak" | "critical";
  estimatedRetainedViewers: number;
  recommendation: string;
} {
  const retained = Math.round(reel.views_count * (1 - reel.skip_rate / 100));

  if (reel.skip_rate <= 15) {
    return {
      hookStrength: "excellent",
      estimatedRetainedViewers: retained,
      recommendation: "Your hook is exceptional — keep this opening style.",
    };
  } else if (reel.skip_rate <= 30) {
    return {
      hookStrength: "good",
      estimatedRetainedViewers: retained,
      recommendation: "Strong hook. Test a bolder visual in the first frame for improvement.",
    };
  } else if (reel.skip_rate <= 50) {
    return {
      hookStrength: "average",
      estimatedRetainedViewers: retained,
      recommendation: "Half your viewers leave in 3 seconds. Lead with your punchline or a pattern interrupt.",
    };
  } else if (reel.skip_rate <= 70) {
    return {
      hookStrength: "weak",
      estimatedRetainedViewers: retained,
      recommendation: "Most viewers skip immediately. Try: bold text overlay, unexpected visual, or direct address to camera.",
    };
  } else {
    return {
      hookStrength: "critical",
      estimatedRetainedViewers: retained,
      recommendation: "CRITICAL: 70%+ skip rate. Your opening must change completely. Study your top-performing Reel hooks.",
    };
  }
}
```

## 6.6 Instagram API Migration Notice (April 2025)

> **This section is critical for implementation correctness.**

### Deprecated Metrics (as of April 21, 2025)

The following metrics are **deprecated** for media created after July 2, 2024:

| Deprecated Metric | Replacement | Notes |
|---|---|---|
| `plays` | `views` | Unified: counts plays + screen displays |
| `impressions` | `views` | Consolidated into single metric |
| `ig_reels_aggregated_all_plays_count` | `total_views` | Aggregated across IG + FB crosspost |
| `clips_replays_count` | *(removed)* | No direct replacement |

### New Metrics Available (v22.0+)

| Metric | Type | Description | Competitive Value |
|---|---|---|---|
| `views` | Standard | Consolidated plays + screen displays | Baseline |
| `total_views` | Aggregated | Views across IG, FB crosspost, promoted | Useful for cross-platform analysis |
| `total_likes` / `total_like_count` | Aggregated | Likes across all surfaces | |
| `total_comments` / `total_comments_count` | Aggregated | Comments across all surfaces | |
| `reels_skip_rate` | New | **% of viewers who scrolled past within 3 seconds** | **🏆 KEY DIFFERENTIATOR — no competitor surfaces this** |
| `public_reposts` | New | Reposts to user profiles (excludes Story/DM shares) | Stronger signal than shares |
| `crossposted_views` / `facebook_views` | New | Breakdown for FB-crossposted Reels | |

### Implementation Rules

```typescript
// RULE: Always check media creation date before selecting metric field
function getViewMetric(reel: { ig_media_id: string; timestamp: string }): string {
  const createdAt = new Date(reel.timestamp);
  const deprecationCutoff = new Date("2024-07-02");

  if (createdAt >= deprecationCutoff) {
    return "views";  // New unified metric
  } else {
    return "plays";  // Legacy metric still available for older media
  }
}

// RULE: Request both metrics during transition period for data completeness
const INSIGHTS_FIELDS_V22 = [
  "views",              // Primary (replaces plays)
  "total_views",        // Aggregated cross-platform
  "reach",
  "saved",
  "shares",
  "total_interactions",
  "reels_skip_rate",    // 🏆 Unique competitive advantage
  "public_reposts",     // NEW: stronger than shares
].join(",");

// RULE: Store both views and skip_rate — they're the core data moat

// RULE: Handle Nullable reels_skip_rate:
// Since Instagram may omit reels_skip_rate for new Reels or those with very low view counts (<5 views),
// the database column and normalization schema MUST accept NULL. UI components must display "N/A"
// when skip rate is null, and AI scoring / fallback heuristics must gracefully map null to a
// median 50.0% baseline during computation (while keeping it NULL in the database).
```

### Required API Version

```
Minimum: v22.0
Endpoint: GET /{media-id}/insights?metric={INSIGHTS_FIELDS_V22}
Auth: Long-lived token with instagram_manage_insights scope
```

### Webhook Events Reference

| Webhook Field | Trigger | Notes |
|---|---|---|
| `story_insights` | Story expires | Metrics with counts <5 returned as `-1` |
| `comments` | New comment on media | Real-time |
| `mentions` | Account @mentioned | In comment or caption |
| `feed` | New media posts | From connected accounts |

### Meta App Developer Sandbox & App Review Guidelines

During development, the Instagram Graph API MUST be accessed within the **Meta Developer Portal Sandbox** since the app is not yet public.
1. **Developer Sandbox Scope:**
   - Developers MUST use Meta **Test Users** and **Sandbox Business Accounts** to test OAuth logins, token flows, and Graph API queries.
   - Standard Instagram accounts cannot authorize with the app until they are added as developers or testers inside the Meta developer dashboard, or until App Review is approved.
2. **App Review Scopes:**
   - Formal App Review approval is required before public launch to request the following production scopes for end-users:
     - `instagram_business_basic` (to list connected business accounts, fetch media list, and read profile metadata).
     - `instagram_manage_insights` (to read detailed analytics, view counts, public reposts, and reels skip rates).
3. **Local Development Tunnels:**
   - Instagram webhooks require an HTTPS URL. For local developer testing, use a local tunneling service (e.g. `ngrok` or `localtunnel` exposing local port `3000`) and register the tunnel's secure endpoint (`https://<subdomain>.ngrok-free.app/api/webhooks/instagram`) in the Meta Webhooks dashboard.

## 6.7 Instagram Webhook Batch Splitting & Queue Handlers

To safeguard Vercel serverless functions against maximum execution limits and payload size ceilings (4.5MB payload constraint), incoming Instagram webhook payloads MUST be parsed and enqueued immediately as lightweight job tickets with zero inline processing.

### Batch Splitting Specifications:
1. **Zero Processing in Webhook Thread**: The incoming HTTP request webhook thread MUST only verify the payload signature (`HMAC-SHA256`) and validate the basic payload format. It MUST NOT make any Graph API queries, database writes for Reels, or LLM calls in-flight.
2. **Immediate Enqueueing**: Parse the event list inside the webhook payload (which can bundle up to 100 media change items) and split the batch into **individual database queue entries** immediately using the `PROCESS_WEBHOOK` job type.
3. **HTTP 200 Return Gate**: The webhook receiver endpoint MUST return an `HTTP 200 OK` status back to Meta under a strict **3.0-second timeout window** to prevent webhook re-delivery triggers and server congestion.
4. **Asynchronous Worker Handling**: The background worker process subsequently claims each `PROCESS_WEBHOOK` job, resolves the specific media metrics by calling the Instagram Graph API asynchronously, updates the Reels table, and schedules scoring downstream.

### Webhook Idempotency & Duplicate Prevention:
Because Meta may retry webhook requests or send duplicate notifications for the same event, the webhook enqueuer MUST derive a deterministic idempotency key for each queued `PROCESS_WEBHOOK` job.
1. **Derivation Rule**: The idempotency key MUST be constructed as:
   `webhook:${mediaId}:${changeField}:${hashOrTimestamp}`
   - `mediaId`: The unique ID of the media object (e.g., `entry[0].changes[0].value.media_id`).
   - `changeField`: The specific field that changed (e.g., `entry[0].changes[0].field`).
   - `hashOrTimestamp`: A SHA-256 hash of the specific change event payload, or the event's raw timestamp (e.g., `entry[0].time`).
2. **Conflict Handling**: When enqueuing, the database driver MUST use `ON CONFLICT (idempotency_key) DO NOTHING`. This guarantees that if duplicate webhooks are delivered concurrently or sequentially, only the first job is enqueued and processed, saving API credits and worker resources.

---

# §7 — AI/LLM ENGINE & STRATEGY GENERATION

## 7.1 Architecture Principle

> The AI module is a **pure function**: it takes data in, returns structured analysis out. It NEVER writes to the database directly. It NEVER makes API calls to external services. All side effects are handled by the calling service.

```
┌─────────────────────────────────────────┐
│           AI ENGINE BOUNDARY            │
│                                         │
│  INPUT                  OUTPUT          │
│  ├── reel data          ├── scores      │
│  ├── account history    ├── analysis    │
│  ├── trend context      ├── strategy    │
│  └── user preferences   └── calendar    │
│                                         │
│  INTERNAL                               │
│  ├── prompt templates                   │
│  ├── output parsers (Zod)               │
│  ├── cost calculator                    │
│  └── fallback generator                 │
│                                         │
│  ⛔ NO DB WRITES                        │
│  ⛔ NO EXTERNAL API CALLS              │
│  ⛔ NO STATE MUTATIONS                 │
└─────────────────────────────────────────┘
```

## 7.2 Reel Scoring System

### Scoring Dimensions (9 axes, 1–10 each)

> **Updated for April 2025 API changes:** Skip Rate is now a first-class scoring dimension powered by Instagram's native `reels_skip_rate` metric. This is a **key competitive moat** — no other analytics platform surfaces skip rate data for content optimization.

| Dimension | Weight | What It Measures | Data Source |
|---|---|---|---|
| **Hook Score** | 12% | First 1–3 seconds grab attention | Caption + engagement pattern analysis |
| **Skip Rate Score** | 13% | **% of viewers who scrolled past within 3 seconds** | `reels_skip_rate` (native IG metric) |
| **Retention Signal** | 12% | Views-to-engagement ratio (proxy for watch-through) | `views` + total engagement |
| **CTA Effectiveness** | 10% | Caption drives action (save, share, repost) | `saves` + `shares` + `public_reposts` |
| **Visual Quality** | 10% | Production value, framing, consistency | AI analysis of caption/context |
| **Audio Strategy** | 10% | Trending audio, original audio, voice-over quality | Caption + timing context |
| **Trend Alignment** | 13% | Content matches current platform trends | Engagement vs. account baseline |
| **Caption Quality** | 8% | Copywriting, hashtags, keyword usage | Caption text analysis |
| **Timing Score** | 12% | Posted at optimal time for this account's audience | `timestamp` vs. historical peaks |

### Scoring Prompt Template

```typescript
const REEL_SCORING_PROMPT = `
You are an expert Instagram Reels analyst. Score this Reel across 9 dimensions.

## Reel Data
- Caption: {caption}
- Posted: {timestamp}
- Views: {views_count}              (replaces deprecated "plays")
- Total Views: {total_views}         (aggregated across IG + FB crosspost)
- Skip Rate: {skip_rate}%            (% who scrolled past within 3 seconds)
- Likes: {likes_count}
- Comments: {comments_count}
- Shares: {shares_count}
- Public Reposts: {public_reposts}   (reposts to user profiles)
- Saves: {saves_count}
- Reach: {reach}
- Engagement Rate: {engagement_rate}%

## Account Context
- Account: @{username}
- Followers: {followers_count}
- Average engagement rate: {avg_engagement_rate}%
- Average skip rate: {avg_skip_rate}%
- Top performing content themes: {top_themes}
- Typical posting time: {typical_posting_time}

## Scoring Instructions
Score each dimension from 1-10 with specific reasoning.
Compare against this account's own historical performance, not global benchmarks.
The skip_rate metric is CRITICAL — it directly measures hook effectiveness.
A skip rate of <20% is excellent, 20-40% is good, 40-60% is average, >60% is poor.

Return ONLY valid JSON matching this exact schema:
{
  "overall_score": <number 1-100>,
  "dimensions": {
    "hook": { "score": <1-10>, "reasoning": "<string>", "improvement": "<string>" },
    "skip_rate": { "score": <1-10>, "reasoning": "<string>", "improvement": "<string>" },
    "retention": { "score": <1-10>, "reasoning": "<string>", "improvement": "<string>" },
    "cta": { "score": <1-10>, "reasoning": "<string>", "improvement": "<string>" },
    "visual": { "score": <1-10>, "reasoning": "<string>", "improvement": "<string>" },
    "audio": { "score": <1-10>, "reasoning": "<string>", "improvement": "<string>" },
    "trend": { "score": <1-10>, "reasoning": "<string>", "improvement": "<string>" },
    "caption": { "score": <1-10>, "reasoning": "<string>", "improvement": "<string>" },
    "timing": { "score": <1-10>, "reasoning": "<string>", "improvement": "<string>" }
  },
  "skip_rate_analysis": {
    "hook_strength": "excellent|good|average|weak|critical",
    "estimated_retained_viewers": <number>,
    "first_3_seconds_verdict": "<string>"
  },
  "top_strength": "<string>",
  "biggest_opportunity": "<string>",
  "one_line_summary": "<string>"
}
`;
```

### Output Validation Schema

```typescript
const ReelScoreSchema = z.object({
  overall_score: z.number().min(1).max(100),
  dimensions: z.object({
    hook: dimensionSchema,
    skip_rate: dimensionSchema,    // NEW: powered by reels_skip_rate
    retention: dimensionSchema,
    cta: dimensionSchema,
    visual: dimensionSchema,
    audio: dimensionSchema,
    trend: dimensionSchema,
    caption: dimensionSchema,
    timing: dimensionSchema,
  }),
  skip_rate_analysis: z.object({
    hook_strength: z.enum(["excellent", "good", "average", "weak", "critical"]),
    estimated_retained_viewers: z.number().int().min(0),
    first_3_seconds_verdict: z.string().min(10).max(200),
  }),
  top_strength: z.string().min(10).max(200),
  biggest_opportunity: z.string().min(10).max(200),
  one_line_summary: z.string().min(10).max(150),
});

const dimensionSchema = z.object({
  score: z.number().int().min(1).max(10),
  reasoning: z.string().min(10).max(300),
  improvement: z.string().min(10).max(300),
});
```

## 7.3 Strategy Generation System

### Strategy Types

| Type | Trigger | Content |
|---|---|---|
| **Weekly Plan** | Every Monday (auto) | 5–7 content ideas with timing |
| **Monthly Review** | 1st of month (auto) | Performance summary + next month plan |
| **Campaign Plan** | User-requested | Goal-oriented content series |
| **Recovery Plan** | Engagement drops >20% | Emergency adjustments |

### Strategy Prompt Template

```typescript
const STRATEGY_PROMPT = `
You are a top-tier Instagram growth strategist. Generate a personalized content
strategy based on this account's real performance data.

## Account Performance (Last 30 Days)
- Total Reels posted: {reels_count}
- Average engagement rate: {avg_engagement}%
- Best performing Reel: {best_reel_caption} (ER: {best_er}%)
- Worst performing Reel: {worst_reel_caption} (ER: {worst_er}%)
- Average views: {avg_views}               (replaces deprecated "plays")
- Average skip rate: {avg_skip_rate}%       (% scrolled past in <3s)
- Follower growth: {follower_delta} ({follower_growth_pct}%)

## Top 3 Content Themes (by engagement)
{top_themes}

## Scoring Patterns
- Strongest dimension: {strongest_dim} (avg: {strongest_avg}/10)
- Weakest dimension: {weakest_dim} (avg: {weakest_avg}/10)

## Optimal Posting Windows (by historical engagement)
{posting_windows}

## Strategy Request
Type: {strategy_type} (weekly/monthly/campaign)
Period: {period_start} to {period_end}

Generate a strategy with ONLY valid JSON matching this schema:
{
  "summary": "<2-3 sentence strategy overview>",
  "key_insight": "<most important finding from the data>",
  "content_pillars": [
    { "theme": "<string>", "percentage": <number>, "rationale": "<string>" }
  ],
  "content_calendar": [
    {
      "day": "<YYYY-MM-DD>",
      "time": "<HH:MM>",
      "content_type": "educational|entertaining|inspirational|promotional|trending",
      "topic": "<specific topic>",
      "hook_suggestion": "<first 3 seconds idea>",
      "caption_direction": "<caption approach>",
      "audio_suggestion": "<trending audio or voice-over>",
      "hashtags": ["<tag1>", "<tag2>", ...],
      "estimated_engagement": "<low|medium|high>",
      "reasoning": "<why this content at this time>"
    }
## 7.4 LLM Call Wrapper (Pure Function Boundary)

Every LLM call goes through this pure wrapper. It has **zero database dependencies** and **zero side effects**. It is completely side-effect-free: all user budget checks, token usage tracking, and database commits MUST be performed by the calling service (e.g. `ingestion.service.ts` or custom route handlers) *before* and *after* invoking this wrapper.

```typescript
// Pure LLM interface wrapper - zero database side-effects
async function callLLMPure<T>(params: {
  prompt: string;
  outputSchema: z.ZodSchema<T>;
  model?: "gpt-4o-mini" | "gpt-4o";
  maxTokens?: number;
}): Promise<{
  success: true;
  data: T;
  tokensUsed: number;
  costUsd: number;
  latencyMs: number;
} | {
  success: false;
  error: string;
}> {
  const { prompt, outputSchema, model = "gpt-4o-mini" } = params;
  const startTime = Date.now();
  let rawResponse: string;
  let usage: any;

  try {
    const completion = await withTimeout(
      openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: params.maxTokens ?? 2000,
        temperature: 0.3,
      }),
      30_000 // 30 second timeout
    );
    rawResponse = completion.choices[0].message.content || "";
    usage = completion.usage;
  } catch (error: any) {
    console.error("LLM call failed:", error);
    return { success: false, error: error?.message || "Unknown OpenAI error" };
  }

  try {
    const json = JSON.parse(rawResponse);
    const parsed = outputSchema.parse(json);
    const actualCost = calculateActualCost(rawResponse, model);
    return {
      success: true,
      data: parsed,
      tokensUsed: usage?.total_tokens || 0,
      costUsd: actualCost,
      latencyMs: Date.now() - startTime,
    };
  } catch (parseError: any) {
    console.error("LLM output parsing or schema validation failed:", parseError);
    return { success: false, error: "AI output schema validation error" };
  }
}
```

## 7.5 Heuristic Fallback & Outage Engine

If `callLLMPure` fails (OpenAI outage, network failure) or user monthly budget checks fail, the system MUST return a **lightweight data-driven heuristic fallback score** rather than rendering empty dashboards. The result MUST be explicitly labeled as `source: "heuristic"` to preserve trust.

```typescript
interface HeuristicScoreResult {
  overall_score: number;
  dimensions: {
    hook: HeuristicDimension;
    skip_rate: HeuristicDimension;
    retention: HeuristicDimension;
    cta: HeuristicDimension;
    visual: HeuristicDimension;
    audio: HeuristicDimension;
    trend: HeuristicDimension;
    caption: HeuristicDimension;
    timing: HeuristicDimension;
  };
  skip_rate_analysis: {
    hook_strength: "excellent" | "good" | "average" | "weak" | "critical";
    estimated_retained_viewers: number;
    first_3_seconds_verdict: string;
  };
  top_strength: string;
  biggest_opportunity: string;
  one_line_summary: string;
  source: "heuristic";
}

interface HeuristicDimension {
  score: number;
  reasoning: string;
  improvement: string;
}

function calculateHeuristicScore(
  reelMetrics: {
    views_count: number;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    saves_count: number;
    public_reposts: number;
    skip_rate: number; // 0 to 100
  },
  avgEngagementRate: number
): HeuristicScoreResult {
  const { views_count, likes_count, comments_count, shares_count, saves_count, public_reposts, skip_rate } = reelMetrics;

  // Enforce defaults if account lacks historical engagement data (e.g. new accounts)
  const safeAvgER = (avgEngagementRate === undefined || avgEngagementRate === null || avgEngagementRate <= 0 || isNaN(avgEngagementRate)) 
    ? 2.0 
    : avgEngagementRate;

  // 1. Safe Hook & Skip Rate Scores
  const rawSkipRate = (skip_rate === undefined || skip_rate === null || isNaN(skip_rate)) ? 50 : skip_rate; // default to 50% average if missing
  const hookScore = Math.max(1, Math.min(10, Math.round(10 - (rawSkipRate / 10))));
  const skipRateScore = hookScore;

  let hookStrength: "excellent" | "good" | "average" | "weak" | "critical" = "average";
  let first3sVerdict = "The first 3 seconds are average. Hook retention is moderate.";
  if (rawSkipRate < 20) {
    hookStrength = "excellent";
    first3sVerdict = "Outstanding! The hook successfully grabbed almost all viewers.";
  } else if (rawSkipRate < 40) {
    hookStrength = "good";
    first3sVerdict = "Good hook retention. Most viewers continue watching past 3 seconds.";
  } else if (rawSkipRate > 60) {
    hookStrength = "critical";
    first3sVerdict = "Critical drop-off in the first 3 seconds. The hook needs a complete overhaul.";
  } else if (rawSkipRate > 50) {
    hookStrength = "weak";
    first3sVerdict = "Weak attention grab. Try adding stronger visual text hooks.";
  }

  // 2. Safe Retention Score (Engagement ratio proxy)
  const totalEngagements = likes_count + comments_count + shares_count + saves_count + public_reposts;
  const rawER = views_count > 0 ? (totalEngagements / views_count) * 100 : 0;
  const erRatio = safeAvgER > 0 ? rawER / safeAvgER : 1;
  const retentionScore = Math.max(1, Math.min(10, Math.round(erRatio * 5)));

  // 3. CTA Effectiveness (Shares + Saves + Public Reposts weight)
  const ctaWeight = (saves_count * 2) + (shares_count * 3) + (public_reposts * 4);
  const ctaFactor = views_count > 0 ? (ctaWeight / views_count) * 1000 : 0;
  const ctaScore = Math.max(1, Math.min(10, Math.round(Math.min(10, ctaFactor))));

  // 4. Default Heuristic Scores for visual/audio/caption/timing
  const visualScore = 5;
  const audioScore = 5;
  const captionLength = 50; // mock length
  const captionScore = likes_count > comments_count ? 6 : 5;
  const timingScore = 6;
  const trendScore = rawER > safeAvgER ? 7 : 5;

  // 5. Overall Weighted Heuristic Score (1-100)
  const overallScore = Math.round(
    (hookScore * 0.15) +
    (skipRateScore * 0.15) +
    (retentionScore * 0.15) +
    (ctaScore * 0.15) +
    (visualScore * 0.08) +
    (audioScore * 0.08) +
    (trendScore * 0.12) +
    (captionScore * 0.06) +
    (timingScore * 0.06)
  ) * 10;

  return {
    overall_score: Math.max(10, Math.min(100, overallScore)),
    dimensions: {
      hook: { score: hookScore, reasoning: `Calculated from a skip rate of ${rawSkipRate}%.`, improvement: "Use high-contrast text overlay in the first 3 seconds." },
      skip_rate: { score: skipRateScore, reasoning: `A skip rate of ${rawSkipRate}% was recorded.`, improvement: "Shorten hook duration to 1.5 seconds." },
      retention: { score: retentionScore, reasoning: `Engagement rate is ${rawER.toFixed(2)}% vs baseline ${avgEngagementRate}%.`, improvement: "Increase video pacing in the middle." },
      cta: { score: ctaScore, reasoning: `Saves: ${saves_count}, Shares: ${shares_count}, Reposts: ${public_reposts}.`, improvement: "Add an explicit 'Save this for later' call to action." },
      visual: { score: visualScore, reasoning: "Baseline visual score mapped from performance metrics.", improvement: "Enhance color contrast and lighting quality." },
      audio: { score: audioScore, reasoning: "Standard audio score placeholder.", improvement: "Experiment with trending audios aligned with hook timing." },
      trend: { score: trendScore, reasoning: "Engagement ratio suggests average trend alignment.", improvement: "Create content responding to active creator templates." },
      caption: { score: captionScore, reasoning: "Caption readability and structure score.", improvement: "Break text into paragraphs and include 3-5 keywords." },
      timing: { score: timingScore, reasoning: "Time-of-day posting optimization index.", improvement: "Shift posting time 1 hour earlier to match audience peaks." }
    },
    skip_rate_analysis: {
      hook_strength: hookStrength,
      estimated_retained_viewers: Math.round(views_count * (1 - rawSkipRate / 100)),
      first_3_seconds_verdict: first3sVerdict
    },
    top_strength: rawSkipRate < 30 ? "Hook Retention & Scroll-Stopping Ability" : "Consistent Engagement Signal",
    biggest_opportunity: rawSkipRate > 50 ? "Overhauling Hook Timing & Visual Overlay" : "Improving Saves & CTA Effectiveness",
    one_line_summary: `Heuristic assessment computed from view count of ${views_count} and skip rate of ${rawSkipRate}%.`,
    source: "heuristic"
  };
}
```

## 7.6 Stale-While-Revalidate Caching Model for Reels Scoring

To optimize API usage and provide instantaneous page loads, Reel scoring MUST enforce a **Stale-While-Revalidate (SWR)** caching model:
1. **Reel Cache Expiry**: Scored Reels are cached in the `reel_scores` table. A cached score remains valid for **24 hours**.
2. **Read Request (SWR)**:
   - When a client queries a Reel score, the system checks the `scored_at` column.
   - If the score exists and is less than 24 hours old, it is returned **immediately** (instant response).
   - If the score exists but is older than 24 hours (stale), the system **immediately returns the stale score** to the client, but asynchronously triggers a background queue job (`SCORE_REEL`) to revalidate and update the score in the background.
3. **Explicit Force-Refresh & Cooldown**:
   - Users can trigger an explicit "Force Recalculate" request.
   - To prevent denial-of-service billing attacks, a strict **1-hour cooldown limit** is enforced per Reel.
   - If the user requests a force-refresh within the 1-hour cooldown window, the API immediately rejects the request with a `429 Too Many Requests` error and a header specifying `Retry-After`.

## 7.7 Prompt Consistency & Quality Gate
All LLM prompts (scoring, strategy, trends) are subject to automated verification checks to prevent regression, drifting, or unexpected formatting errors. The AI engine must ensure that outputs match the defined schemas with extremely low variance. See [§16.2 AI Prompt Evaluation Framework](file:///d:/Desktop/reel-logic-ai/reel-logic-ai-seabs-spec.md#L3461) for the detailed verification test suite implementation in `scripts/test-prompts.ts`.

---

# §8 — BILLING & MONETIZATION

## 8.1 Stripe Integration Architecture

```
┌─────────────────────────────────────────────┐
│                BILLING FLOW                  │
│                                             │
│   User selects plan                          │
│         │                                   │
│         ▼                                   │
│   Create Stripe Checkout Session             │
│         │                                   │
│         ▼                                   │
│   Redirect to Stripe Checkout                │
│         │                                   │
│         ▼                                   │
│   Stripe processes payment                   │
│         │                                   │
│         ▼                                   │
│   Stripe sends webhook ──────────────────┐  │
│                                          │  │
│         ┌────────────────────────────────┐│  │
│         │   Webhook Handler              ││  │
│         │                                ││  │
│         │   1. Verify signature          ││  │
│         │   2. Parse event type          ││  │
│         │   3. Update subscription DB    ││  │
│         │   4. Adjust plan limits        ││  │
│         │   5. Send confirmation email   ││  │
│         └────────────────────────────────┘│  │
│                                          │  │
└──────────────────────────────────────────┘  │
                                              │
                                              │
```

## 8.2 Stripe Event Handling Matrix

| Event | Action |
|---|---|
| `checkout.session.completed` | Create subscription record, activate plan |
| `customer.subscription.updated` | Update plan, adjust limits |
| `customer.subscription.deleted` | Downgrade to free, clear limits |
| `invoice.payment_succeeded` | Mark period as paid, reset usage counters |
| `invoice.payment_failed` | Send warning email, grace period (3 days) |
| `customer.subscription.trial_will_end` | Send trial ending email (3 days before) |

## 8.3 Plan Enforcement Logic

```typescript
interface PlanLimits {
  maxAccounts: number;
  maxReelsAnalyzed: number;     // per month
  maxStrategies: number;         // per month
  maxAiCalls: number;            // per month
  aiModel: "gpt-4o-mini" | "gpt-4o";
  features: {
    trendDetection: boolean;
    contentCalendar: boolean;
    teamAccess: boolean;
    whiteLabel: boolean;
    priorityAi: boolean;
  };
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxAccounts: 1,
    maxReelsAnalyzed: 10,
    maxStrategies: 0,
    maxAiCalls: 10,
    aiModel: "gpt-4o-mini",
    features: {
      trendDetection: false,
      contentCalendar: false,
      teamAccess: false,
      whiteLabel: false,
      priorityAi: false,
    },
  },
  creator: {
    maxAccounts: 1,
    maxReelsAnalyzed: 100,
    maxStrategies: 4,
    maxAiCalls: 150,
    aiModel: "gpt-4o-mini",
    features: {
      trendDetection: false,
      contentCalendar: true,
      teamAccess: false,
      whiteLabel: false,
      priorityAi: false,
    },
  },
  pro: {
    maxAccounts: 3,
    maxReelsAnalyzed: 500,
    maxStrategies: 12,
    maxAiCalls: 600,
    aiModel: "gpt-4o",
    features: {
      trendDetection: true,
      contentCalendar: true,
      teamAccess: false,
      whiteLabel: false,
      priorityAi: false,
    },
  },
  agency: {
    maxAccounts: 10,
    maxReelsAnalyzed: 2000,
    maxStrategies: 40,
    maxAiCalls: 2500,
    aiModel: "gpt-4o",
    features: {
      trendDetection: true,
      contentCalendar: true,
      teamAccess: true,
      whiteLabel: true,
      priorityAi: true,
    },
  },
};
```

## 8.4 Usage Metering

```typescript
// Check before every billable operation
async function checkUsageLimit(
  userId: string,
  operation: "reel_analysis" | "strategy_generation" | "ai_call"
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const subscription = await getActiveSubscription(userId);
  const usage = await getCurrentPeriodUsage(userId);
  const limits = PLAN_LIMITS[subscription.planId];

  const fieldMap = {
    reel_analysis: { used: usage.reelsAnalyzed, limit: limits.maxReelsAnalyzed },
    strategy_generation: { used: usage.strategiesGen, limit: limits.maxStrategies },
    ai_call: { used: usage.aiCallsCount, limit: limits.maxAiCalls },
  };

  const { used, limit } = fieldMap[operation];

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
  };
}
```

## 8.5 Webhook Security & Production Key Guards

### 8.5.1 Production Live Key Guard
To prevent accidental test-mode transactions in production or database drift from mock operations, Stripe initialization MUST validate the key prefix on startup:
```typescript
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (process.env.NODE_ENV === "production") {
  if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_live_")) {
    throw new Error("CRITICAL FAILURE: Stripe key must be a live key (sk_live_...) in production environment.");
  }
}
```

### 8.5.2 Local Webhook Tunneling (`stripe listen`)
Webhooks cannot hit `localhost:3000` directly. For local development, engineers must download the Stripe CLI and run a secure webhook forwarder:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
This generates a local webhook signing secret starting with `whsec_` which must be stored in `.env.local` as `STRIPE_WEBHOOK_SECRET` for signature verification to succeed locally.

### 8.5.3 Webhook Handler Implementation
```typescript
// MANDATORY: Verify Stripe webhook signatures
async function handleStripeWebhook(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Process event idempotently using an ATOMIC query executed BEFORE beginning execution.
  // This guarantees transaction safety and prevents race conditions from concurrent webhook retries.
  // SQL Statement: INSERT INTO processed_events (event_id, processed_at) VALUES ($1, now()) ON CONFLICT DO NOTHING RETURNING id;
  const isInserted = await markEventProcessedAtomed(event.id);
  if (!isInserted) {
    console.log(`[Stripe Webhook] Event ${event.id} already processing or processed. Aborting to prevent duplicates.`);
    return new NextResponse("Already processed", { status: 200 });
  }

  try {
    await processStripeEvent(event);
    // Mark as completed
    await updateEventStatus(event.id, "completed");
  } catch (err) {
    console.error("Webhook processing failed:", err);
    await updateEventStatus(event.id, "failed");
    // Return 200 anyway to prevent Stripe from retrying endlessly
    // Log error for manual investigation
    await logWebhookFailure(event, err);
  }

  return new NextResponse("OK", { status: 200 });
}

// Stripe Webhook Manual Retry Admin Endpoint
// POST /api/webhooks/stripe/retry
// Only accessible to administrators (role = "admin") to re-play failed events manually.
async function handleManualRetry(req: NextRequest): Promise<NextResponse> {
  const { eventId } = await req.json();

  // Find the event in the processed_events table and delete it to reset idempotency
  await db.delete(processedEvents).where(eq(processedEvents.eventId, eventId));

  // Fetch event payload from Stripe
  const event = await stripe.events.retrieve(eventId);

  // Re-process the event payload
  await processStripeEvent(event);

  // Mark the event as processed again
  await markEventProcessedAtom(event.id);

  return new NextResponse("Event re-processed successfully", { status: 200 });
}
```

---

# §9 — QUEUE ENGINE & WORKER SYSTEM

## 9.1 Architecture: PostgreSQL-Based Queue

> **No Redis. No Kafka. No RabbitMQ.** The queue runs on PostgreSQL using `FOR UPDATE SKIP LOCKED` — the same database, zero additional infrastructure.

```
┌─────────────────────────────────────────────────────┐
│                    QUEUE ENGINE                      │
│                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌────────┐│
│  │ Job Producer  │    │ Job Consumer  │    │  DLQ   ││
│  │              │    │ (Worker)      │    │        ││
│  │ • API routes  │───►│ • Poll loop   │───►│ Failed ││
│  │ • Cron jobs   │    │ • SKIP LOCKED │    │ jobs   ││
│  │ • Webhooks    │    │ • Retry logic │    │ review ││
│  └──────────────┘    └──────────────┘    └────────┘│
│                                                     │
│  Job Types:                                         │
│  ├── SYNC_ACCOUNT    (Instagram data fetch)         │
│  ├── SCORE_REEL      (AI scoring)                   │
│  ├── GENERATE_STRATEGY (AI strategy)                │
│  ├── REFRESH_TOKEN   (Token rotation)               │
│  ├── SEND_EMAIL      (Transactional email)          │
│  └── PROCESS_WEBHOOK (Stripe/IG event)              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 9.2 Job Queue Table & Worker SQL

```sql
-- Concurrency-safe job claim query supporting serverless-friendly lock expiry
WITH next_job AS (
    SELECT id
    FROM job_queue
    WHERE (status = 'pending' AND scheduled_at <= now())
       OR (status = 'processing' AND locked_at < now() - interval '5 minutes')
    ORDER BY priority DESC, scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
)
UPDATE job_queue
SET
    status = 'processing',
    locked_at = now(),
    locked_by = $1  -- worker_id
FROM next_job
WHERE job_queue.id = next_job.id
RETURNING job_queue.*;
```

## 9.3 Serverless Bounded Worker Implementation (Time-Bounded Batch Execution)

To run efficiently in serverless environments (like Vercel) without standard long-lived Node daemon loops, the queue worker operates as a time-bounded serverless batch runner function. The runner is triggered via a secure webhook API endpoint (`POST /api/queue/process`) or Vercel Crons.

### 9.3.1 Architectural Bounded Execution Principles
- **Vercel Timeout Prevention:** Next.js serverless functions have strict execution timeout limits (typically 15s to 60s). The worker tracks its execution duration and exits cleanly after **15 seconds** to prevent abrupt execution termination, which would leave orphaned locks in the database.
- **Zombie Lock Recovery:** Claimed jobs have a 5-minute lock expiration. If a worker crashes or is timed out by Vercel, the claiming query automatically makes the job available for reprocessing after 5 minutes of inactivity (`locked_at < now() - interval '5 minutes'`).
- **Promise-Based Concurrent Processing:** The worker processes a batch of jobs using a concurrent promise queue with a limit (e.g., 3 concurrent jobs).

### 9.3.2 Serverless Webhook Handler Endpoint (`app/api/queue/process/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { hostname } from "os";

export async function POST(req: NextRequest) {
  // 1. Authorize Cron trigger
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const startTime = Date.now();
  const workerId = `serverless-worker-${hostname()}-${process.pid}`;
  const batchRunner = new ServerlessQueueWorker(workerId, startTime);

  try {
    const processedCount = await batchRunner.processBatch();
    return NextResponse.json({
      status: "success",
      workerId,
      processedJobsCount: processedCount,
      durationMs: Date.now() - startTime
    });
  } catch (error: any) {
    console.error(`[Serverless Worker ${workerId}] Fatal execution error:`, error);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}

class ServerlessQueueWorker {
  private workerId: string;
  private startTime: number;
  private maxDurationMs = 15_000; // 15 seconds max execution
  private concurrencyLimit = 3;
  private activeJobsCount = 0;
  private handlers: Map<JobType, JobHandler> = new Map();

  constructor(workerId: string, startTime: number) {
    this.workerId = workerId;
    this.startTime = startTime;
    
    // Register job handlers here
    // this.handlers.set("SYNC_ACCOUNT", syncAccountHandler);
  }

  async processBatch(): Promise<number> {
    console.log(`[Worker ${this.workerId}] Starting serverless batch execution...`);
    let jobsProcessed = 0;

    // Loop until we reach the 15-second execution limit
    while (Date.now() - this.startTime < this.maxDurationMs) {
      if (this.activeJobsCount >= this.concurrencyLimit) {
        // Yield briefly to let active promises complete
        await sleep(100);
        continue;
      }

      // Check remaining execution time
      const elapsed = Date.now() - this.startTime;
      if (this.maxDurationMs - elapsed < 2000) {
        console.log(`[Worker ${this.workerId}] Nearing 15s execution threshold (${elapsed}ms elapsed). Stopping new claims.`);
        break;
      }

      const job = await this.claimJob();
      if (!job) {
        console.log(`[Worker ${this.workerId}] Job queue empty. Exiting batch.`);
        break;
      }

      this.activeJobsCount++;
      jobsProcessed++;
      
      // Async non-blocking execution in our promise pool
      this.runJobAsynchronously(job);
    }

    // Wait for any remaining active jobs in this batch to resolve before exiting
    while (this.activeJobsCount > 0) {
      await sleep(100);
    }

    console.log(`[Worker ${this.workerId}] Batch finished. Processed ${jobsProcessed} jobs.`);
    return jobsProcessed;
  }

  private async runJobAsynchronously(job: Job): Promise<void> {
    try {
      await this.processJob(job);
    } catch (error: any) {
      console.error(`[Worker ${this.workerId}] Job ${job.id} failed:`, error);
    } finally {
      this.activeJobsCount--;
    }
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.job_type);
    if (!handler) {
      await this.failJob(job, `No handler registered for job type: ${job.job_type}`);
      return;
    }

    try {
      // Execute within a strict per-job timeout limit (e.g. 10s)
      await withTimeout(handler(job.payload), 10_000);
      await this.completeJob(job);
    } catch (error: any) {
      if (job.retry_count < job.max_retries) {
        await this.retryJob(job, error);
      } else {
        await this.deadLetterJob(job, error);
      }
    }
  }

  private async claimJob(): Promise<Job | null> {
    // Executes the SQL Claim query in §9.2
    return db.transaction(async (tx) => {
      // Claim job with SKIP LOCKED
    });
  }

  private async completeJob(job: Job): Promise<void> {
    await db.update(jobQueue)
      .set({ status: "completed", locked_at: null, locked_by: null })
      .where(eq(jobQueue.id, job.id));
  }

  private async failJob(job: Job, reason: string): Promise<void> {
    await db.update(jobQueue)
      .set({ status: "failed", error_message: reason, locked_at: null, locked_by: null })
      .where(eq(jobQueue.id, job.id));
  }

  private async retryJob(job: Job, error: Error): Promise<void> {
    const backoff = Math.min(1000 * Math.pow(2, job.retry_count), 60_000); // 1 minute max backoff
    await db.update(jobQueue)
      .set({
        status: "pending",
        retry_count: job.retry_count + 1,
        scheduled_at: new Date(Date.now() + backoff),
        locked_at: null,
        locked_by: null,
        error_message: error.message,
      })
      .where(eq(jobQueue.id, job.id));
  }

  private async deadLetterJob(job: Job, error: Error): Promise<void> {
    await db.update(jobQueue)
      .set({
        status: "dead_letter",
        failed_at: new Date(),
        error_message: error.message,
        dead_letter: true,
        locked_at: null,
        locked_by: null
      })
      .where(eq(jobQueue.id, job.id));

    await emitAlert("JOB_DEAD_LETTERED", {
      jobId: job.id,
      jobType: job.job_type,
      error: error.message
    });
  }
}
```
```

## 9.4 Queue Migration Seam (SQS / BullMQ Adapter)

To ensure the local PostgreSQL queue engine can be drop-in replaced with zero impact on application business logic when scaling past 500 jobs/second, the queue enforces a strict **Adapter Pattern** with clean boundaries.

### Queue Adapter Interface

```typescript
export interface QueueJob<T = any> {
  id: string;
  type: string;
  payload: T;
  priority: number;
}

export interface IQueueEngine {
  // Push a new job into the queue
  enqueue<T = any>(
    type: string,
    payload: T,
    options?: { priority?: number; delayMs?: number; idempotencyKey?: string }
  ): Promise<string | null>;

  // Cancel a scheduled job
  cancel(jobId: string): Promise<boolean>;

  // Return queue metrics
  getMetrics(): Promise<{ pending: number; processing: number; failed: number }>;
}
```

By coding all services to this `IQueueEngine` interface, replacing PostgreSQL with **BullMQ (Redis)** or **AWS SQS** only requires providing a new implementation class of `IQueueEngine` and binding it via Dependency Injection (DI) in the service container.


## 9.5 Idempotency Enforcement

```typescript
// Every job that creates side effects MUST use idempotency keys
async function enqueueJob(params: {
  type: JobType;
  payload: Record<string, unknown>;
  idempotencyKey: string;         // REQUIRED
  priority?: number;              // 0 (low) – 10 (critical)
  scheduledAt?: Date;
  maxRetries?: number;
}): Promise<string | null> {
  // Check for duplicate
  const existing = await db.select()
    .from(jobQueue)
    .where(eq(jobQueue.idempotency_key, params.idempotencyKey))
    .limit(1);

  if (existing.length > 0) {
    // Already queued — no-op
    return null;
  }

  const [job] = await db.insert(jobQueue)
    .values({
      job_type: params.type,
      payload: params.payload,
      idempotency_key: params.idempotencyKey,
      priority: params.priority ?? 5,
      scheduled_at: params.scheduledAt ?? new Date(),
      max_retries: params.maxRetries ?? 3,
      status: "pending",
    })
    .returning();

  return job.id;
}

// Idempotency key examples:
// SYNC_ACCOUNT_SCHEDULED: `sync:scheduled:${accountId}:${dateHour}`
// SYNC_ACCOUNT_MANUAL:    `sync:manual:${accountId}:${timestamp_ms}` (minimum 5-minute application-level throttle window)
// SCORE_REEL:             `score:${reelId}:${version}`
// STRATEGY:               `strategy:${accountId}:${periodKey}`
```

---

# §10 — FRONTEND UI/UX SPECIFICATION

## 10.1 Design System Foundation

### Color Palette

```css
:root {
  /* Brand */
  --brand-primary: #6C5CE7;       /* Purple — creativity & intelligence */
  --brand-secondary: #00B894;     /* Green — growth & success */
  --brand-accent: #FD79A8;        /* Pink — engagement & energy */

  /* Neutrals (Dark Mode First) */
  --bg-primary: #0F0F14;
  --bg-secondary: #1A1A24;
  --bg-tertiary: #252530;
  --bg-card: #1E1E2A;
  --bg-hover: #2A2A3A;

  --text-primary: #F8F8FC;
  --text-secondary: #A0A0B8;
  --text-tertiary: #6B6B80;
  --text-muted: #4A4A5C;

  /* Semantic */
  --success: #00B894;
  --warning: #FDCB6E;
  --error: #E17055;
  --info: #74B9FF;

  /* Gradients */
  --gradient-brand: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
  --gradient-success: linear-gradient(135deg, #00B894 0%, #55EFC4 100%);
  --gradient-warm: linear-gradient(135deg, #FD79A8 0%, #FDCB6E 100%);
  --gradient-card: linear-gradient(145deg, #1E1E2A 0%, #252530 100%);

  /* Glass */
  --glass-bg: rgba(30, 30, 42, 0.7);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: blur(20px);

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px rgba(108, 92, 231, 0.3);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-display: 'Outfit', 'Inter', sans-serif;
}
```

### Typography Scale

```css
/* Heading hierarchy */
.h1 { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }
.h2 { font-size: 2rem; font-weight: 600; letter-spacing: -0.015em; line-height: 1.25; }
.h3 { font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; line-height: 1.3; }
.h4 { font-size: 1.25rem; font-weight: 500; line-height: 1.4; }

/* Body */
.body-lg { font-size: 1.125rem; line-height: 1.6; }
.body-md { font-size: 1rem; line-height: 1.5; }
.body-sm { font-size: 0.875rem; line-height: 1.5; }

/* Labels */
.label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
```

## 10.2 Page Architecture

```
App Shell
├── Sidebar Navigation (collapsible)
│   ├── Dashboard (/)
│   ├── My Reels (/reels)
│   ├── Strategy (/strategy)
│   ├── Analytics (/analytics)
│   ├── Accounts (/accounts)
│   ├── Billing (/billing)
│   └── Settings (/settings)
│
├── Top Bar
│   ├── Breadcrumb
│   ├── Account Switcher (dropdown)
│   ├── Notifications bell
│   └── User avatar + dropdown
│
└── Main Content Area
    ├── Page header (title + actions)
    ├── Content (cards, tables, charts)
    └── Pagination / load more
```

## 10.3 Key Pages Specification

### Dashboard (`/`)

```
┌─────────────────────────────────────────────────────────┐
│  📊 Dashboard                                           │
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐│
│  │ Total     │ │ Avg       │ │ Avg Skip │ │ AI      ││
│  │ Views     │ │ Engagement│ │ Rate     │ │ Credits ││
│  │           │ │           │ │          │ │ Left    ││
│  │ 125.4K    │ │ 4.8%      │ │ 28% 🟢  │ │ 87/150  ││
│  │ ▲ +12.3%  │ │ ▲ +0.3%   │ │ ▼ -4.1% │ │         ││
│  └───────────┘ └───────────┘ └───────────┘ └─────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📈 Engagement Trend (30 days)                    │   │
│  │                                                   │   │
│  │     ╱╲    ╱╲                                     │   │
│  │   ╱    ╲╱    ╲  ╱╲                              │   │
│  │  ╱              ╲  ╲╱╲                          │   │
│  │ ╱                      ╲                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────┐ ┌────────────────────────┐   │
│  │ 🏆 Top Reels          │ │ 📋 This Week's Plan     │   │
│  │                      │ │                        │   │
│  │ 1. "How I grew..."  │ │ Mon: Educational Reel  │   │
│  │    Score: 92 ⬆      │ │ Wed: Trending format   │   │
│  │                      │ │ Fri: Behind-the-scenes │   │
│  │ 2. "3 Tips for..."  │ │                        │   │
│  │    Score: 87 ⬆      │ │ [View Full Strategy →] │   │
│  │                      │ │                        │   │
│  └──────────────────────┘ └────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Reel Detail (`/reels/:id`)

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Reels                                        │
│                                                         │
│  ┌─────────────────────────┐ ┌─────────────────────┐   │
│  │                         │ │ AI SCORE: 87/100     │   │
│  │    [Reel Thumbnail]     │ │ ████████████████░░░  │   │
│  │                         │ │                     │   │
│  │    ▶ Play on Instagram  │ │ Hook:      9/10     │   │
│  │                         │ │ Skip Rate: 9/10     │   │
│  │  "Caption text here..." │ │ Retention: 8/10     │   │
│  │                         │ │ CTA:       7/10     │   │
│  │  📅 May 15, 2025       │ │ Visual:    9/10     │   │
│  │  👁 45.2K views         │ │ Audio:     8/10     │   │
│  │  ⏭ 22% skip rate 🟢    │ │ Trend:     9/10     │   │
│  │  ❤️ 2.1K likes          │ │ Caption:   8/10     │   │
│  │  💬 142 comments        │ │ Timing:    9/10     │   │
│  │  🔄 89 shares           │ │                     │   │
│  │  🔖 234 saves           │ │ "Strong hook with   │   │
│  │                         │ │  trending audio      │   │
│  │  ER: 5.7% ▲            │ │  drove exceptional   │   │
│  │                         │ │  saves rate."        │   │
│  └─────────────────────────┘ └─────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 💡 AI Recommendations                            │   │
│  │                                                   │   │
│  │ ✅ Strength: Your hook captured attention in       │   │
│  │    under 1 second with a bold visual statement    │   │
│  │                                                   │   │
│  │ 🎯 Opportunity: Add a stronger CTA in the last   │   │
│  │    2 seconds — "Save this for later" increased    │   │
│  │    saves by 40% in similar top-performing Reels   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Strategy Page (`/strategy`)

```
┌─────────────────────────────────────────────────────────┐
│  📋 Content Strategy                [Generate New ▼]    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎯 This Week's Strategy (May 19–25)              │   │
│  │                                                   │   │
│  │ Key Insight: Your educational content outperforms │   │
│  │ entertainment by 2.3x. Double down on "tips"     │   │
│  │ format with trending audio.                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────┬──────────────────────────────────────────┐     │
│  │ Mon│ 📹 Educational Reel                       │     │
│  │ 9AM│ Topic: "3 mistakes killing your reach"    │     │
│  │    │ Hook: Start with the biggest mistake      │     │
│  │    │ Audio: Trending motivational track         │     │
│  │    │ Est. engagement: 🟢 High                  │     │
│  ├────┼──────────────────────────────────────────┤     │
│  │ Wed│ 📹 Trending Format                        │     │
│  │ 12P│ Topic: "[Trend name] but for [niche]"    │     │
│  │    │ Hook: Match the trend pattern exactly     │     │
│  │    │ Audio: [Specific trending audio]          │     │
│  │    │ Est. engagement: 🟡 Medium                │     │
│  ├────┼──────────────────────────────────────────┤     │
│  │ Fri│ 📹 Behind-the-scenes                     │     │
│  │ 5PM│ Topic: "What I actually do in a day"     │     │
│  │    │ Hook: "Nobody shows you this part..."    │     │
│  │    │ Audio: Chill background music             │     │
│  │    │ Est. engagement: 🟢 High                  │     │
│  └────┴──────────────────────────────────────────┘     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📊 Improvement Priorities                        │   │
│  │                                                   │   │
│  │ 1. CTA → Add "Save this" prompts (current: 6/10)│   │
│  │ 2. Timing → Shift Wed posts to 11AM (data shows │   │
│  │    18% higher reach)                             │   │
│  │ 3. Audio → Use trending sounds within 48hrs of  │   │
│  │    trending (decay curve is steep)               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 10.4 Component Library

| Component | States | Notes |
|---|---|---|
| `ScoreGauge` | Score 1–100, colored arc | Animated on mount |
| `DimensionBar` | Score 1–10, horizontal bar | 8 dimensions, color-coded |
| `MetricCard` | Value, label, delta, trend arrow | Skeleton loading state |
| `ReelCard` | Thumbnail, caption, metrics, score badge | Click to expand |
| `StrategyCard` | Day, time, topic, hook, engagement level | Drag to reorder |
| `TrendChart` | Line chart, 7/30/90 day views | Recharts + responsive |
| `UsageMeter` | Used/total, progress bar | Warning at 80%, red at 95% |
| `EmptyState` | Illustration, CTA | Different per page |
| `ErrorBoundary` | Error message, retry button | Never shows stack trace |
| `LoadingSkeleton` | Pulsing placeholder shapes | Matches content layout |

## 10.5 Animation & Interaction Spec

```typescript
// Micro-animations (Framer Motion or CSS)
const ANIMATIONS = {
  // Page transitions
  pageEnter: { opacity: [0, 1], y: [20, 0], duration: 300 },
  pageExit: { opacity: [1, 0], y: [0, -10], duration: 200 },

  // Cards
  cardHover: { scale: 1.02, shadow: "var(--shadow-lg)", duration: 200 },
  cardPress: { scale: 0.98, duration: 100 },

  // Score reveal
  scoreCount: { duration: 1200, easing: "easeOutExpo" }, // Count from 0 to score
  scoreArc: { duration: 1500, easing: "easeOutCubic" },   // Gauge fill animation

  // Notifications
  notifSlide: { x: [100, 0], opacity: [0, 1], duration: 300 },
  notifExit: { x: [0, 100], opacity: [1, 0], duration: 200 },

  // Loading
  skeletonPulse: { opacity: [0.3, 0.7, 0.3], duration: 1500, repeat: Infinity },

  // Strategy calendar
  dayStagger: { delay: (i: number) => i * 100 }, // Stagger day entries
};
```

## 10.6 Mobile Responsiveness

```
Breakpoints:
  sm:  640px   (mobile landscape)
  md:  768px   (tablet)
  lg:  1024px  (desktop)
  xl:  1280px  (large desktop)

Mobile-first rules:
  - Sidebar collapses to bottom tab bar on mobile
  - Cards stack vertically on mobile
  - Strategy calendar becomes vertical timeline on mobile
  - Score gauge shrinks but remains readable
  - Charts use simplified view on mobile
  - Touch targets minimum 44px × 44px
```

---

# §11 — SECURITY MODEL

## 11.1 Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
│                                                         │
│  Layer 1: NETWORK                                       │
│  ├── HTTPS everywhere (Vercel auto-TLS)                 │
│  ├── CORS restricted to app domain                      │
│  ├── Rate limiting (API-level + per-user)                │
│  └── CSRF protection (SameSite cookies)                 │
│                                                         │
│  Layer 2: AUTHENTICATION                                │
│  ├── Supabase Auth (GoTrue)                             │
│  ├── Instagram OAuth2 (Facebook Login)                  │
│  ├── JWT validation on every API call                   │
│  ├── Session management (httpOnly, secure cookies)      │
│  └── Token rotation (refresh tokens)                    │
│                                                         │
│  Layer 3: AUTHORIZATION                                 │
│  ├── Row Level Security (RLS) on every table            │
│  ├── Plan-based feature gates                           │
│  ├── API route-level auth middleware                    │
│  └── Resource ownership verification                    │
│                                                         │
│  Layer 4: DATA PROTECTION                               │
│  ├── AES-256-GCM encryption for Instagram tokens        │
│  ├── Encryption key rotation capability                 │
│  ├── PII minimization (store only what's needed)        │
│  ├── GDPR compliance (data export, deletion)            │
│  └── Audit logging for all sensitive operations         │
│                                                         │
│  Layer 5: WEBHOOK SECURITY                              │
│  ├── Stripe: signature verification (HMAC-SHA256)       │
│  ├── Instagram: hub.verify_token + signature            │
│  ├── Replay prevention (event ID deduplication)         │
│  └── Payload validation (Zod schemas)                   │
│                                                         │
│  Layer 6: APPLICATION                                   │
│  ├── Input validation (Zod on every endpoint)           │
│  ├── SQL injection prevention (parameterized queries)   │
│  ├── XSS prevention (React auto-escaping + CSP)         │
│  ├── Dependency auditing (npm audit, Snyk)              │
│  └── Environment variable management (no secrets in code)│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 11.2 Token Encryption Implementation

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Load encryption keys map from environment variable
// Example: TOKEN_ENCRYPTION_KEYS='{"v2":"32byteHexKey...", "v1":"32byteHexKey..."}'
const KEYS_MAP: Record<string, string> = JSON.parse(process.env.TOKEN_ENCRYPTION_KEYS || "{}");
const ACTIVE_KEY_VERSION = process.env.ACTIVE_KEY_VERSION || "v1";

export function encryptToken(plaintext: string): string {
  const activeKeyHex = KEYS_MAP[ACTIVE_KEY_VERSION];
  if (!activeKeyHex) {
    throw new Error(`Active encryption key version ${ACTIVE_KEY_VERSION} not configured.`);
  }
  const key = Buffer.from(activeKeyHex, "hex");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: keyVersion:iv:authTag:ciphertext (all hex/text)
  // Ensures seamless SOC2 zero-downtime key rotation by preserving historical keys
  return `${ACTIVE_KEY_VERSION}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptToken(encryptedString: string): string {
  const parts = encryptedString.split(":");
  
  let keyVersion = "v1"; // Legacy fallback if no version prefix
  let ivHex: string, tagHex: string, ciphertext: string;

  if (parts.length === 4) {
    [keyVersion, ivHex, tagHex, ciphertext] = parts;
  } else if (parts.length === 3) {
    [ivHex, tagHex, ciphertext] = parts;
  } else {
    throw new Error("Invalid encrypted token format.");
  }

  const keyHex = KEYS_MAP[keyVersion];
  if (!keyHex) {
    throw new Error(`Decryption key version ${keyVersion} not configured. Key rotation required.`);
  }

  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

## 11.3 Webhook Signature Verification

### Stripe

```typescript
// Already covered in §8.5 — uses stripe.webhooks.constructEvent()
```

### Instagram

```typescript
import crypto from "crypto";

function verifyInstagramWebhook(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.INSTAGRAM_APP_SECRET!)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature.replace("sha256=", "")),
    Buffer.from(expectedSignature)
  );
}
```

## 11.4 Rate Limiting Strategy

```typescript
const RATE_LIMITS = {
  // Global
  api: { windowMs: 60_000, max: 100 },        // 100 req/min per user

  // Endpoint-specific
  "/api/auth/*": { windowMs: 300_000, max: 10 },       // 10 req/5min
  "/api/*/score": { windowMs: 60_000, max: 20 },        // 20 scoring/min
  "/api/*/strategy": { windowMs: 300_000, max: 5 },     // 5 strategies/5min
  "/api/webhooks/*": { windowMs: 60_000, max: 50 },     // 50 webhooks/min
};
```

## 11.5 GDPR Compliance Checklist

| Requirement | Implementation |
|---|---|
| Right to access | `GET /api/auth/me/data-export` → generates full JSON export |
| Right to deletion | `DELETE /api/auth/me` → cascading delete of all user data |
| Data minimization | Only store: email, name, IG username, IG metrics (no DMs, no post content beyond captions) |
| Consent | OAuth scope explanation before Instagram connection |
| Data processing record | Audit log tracks all data operations |
| Breach notification | Sentry alerting + email pipeline for security events |

## 11.6 Row-Level Security Verification Protocol

All user-facing tables MUST have Row-Level Security (RLS) enabled. To ensure RLS policies are never compromised, an automated verification script (`scripts/test-rls.ts`) MUST run on every migration and schema change.

### RLS Verification Suite Design (`scripts/test-rls.ts`)
- **Anonymous Session Test:** The script attempts to read from and write to all tables without authentication. (Expected: 0 records returned, all inserts/updates fail with 401/403).
- **Cross-Tenant Session Test:** The script authenticates as `User A` and attempts to query or modify data belonging to `User B`. (Expected: 0 records returned, all modifications rejected).
- **Owner Session Test:** The script authenticates as `User A` and attempts to query or modify data belonging to `User A`. (Expected: query succeeds, modifications allowed within limit).

## 11.7 GDPR Data Export Schema

To satisfy GDPR Article 20 (Right to Data Portability), the platform MUST expose an authenticated endpoint (`GET /api/auth/me/data-export`) that compiles all historical user activity and metrics into a machine-readable JSON structure.

### Export Policy & Security Safeguards:
1. **Token/Credential Exclusion**: To prevent severe security leaks, the export payload MUST strictly exclude all access tokens, encrypted access tokens, passwords, and security keys.
2. **Synchronous/Asynchronous Bounds**: If the data size is small, compile synchronously; otherwise, enqueue a `SEND_EMAIL` export job and deliver the JSON via a secure pre-signed download URL with a 15-minute expiry window.

### JSON Schema Specification:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ReelLogicUserDataExport",
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "email": { "type": "string", "format": "email" },
        "fullName": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "email", "createdAt"]
    },
    "instagramAccounts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "igUserId": { "type": "string" },
          "username": { "type": "string" },
          "followersCount": { "type": "integer" },
          "lastSyncedAt": { "type": ["string", "null"], "format": "date-time" },
          "connectedAt": { "type": "string", "format": "date-time" }
        },
        "required": ["id", "igUserId", "username", "connectedAt"]
      }
    },
    "reels": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "igMediaId": { "type": "string" },
          "caption": { "type": ["string", "null"] },
          "permalink": { "type": "string", "format": "uri" },
          "viewsCount": { "type": "integer" },
          "displayViews": { "type": "integer" },
          "likesCount": { "type": "integer" },
          "commentsCount": { "type": "integer" },
          "sharesCount": { "type": "integer" },
          "savesCount": { "type": "integer" },
          "publicReposts": { "type": "integer" },
          "skipRate": { "type": "number" },
          "engagementRate": { "type": ["number", "null"] },
          "fetchedAt": { "type": "string", "format": "date-time" }
        },
        "required": ["id", "igMediaId", "permalink", "displayViews", "fetchedAt"]
      }
    },
    "strategies": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "periodKey": { "type": "string" },
          "strategyType": { "type": "string" },
          "status": { "type": "string" },
          "contentCalendar": { "type": "array" },
          "generatedAt": { "type": "string", "format": "date-time" }
        },
        "required": ["id", "periodKey", "strategyType", "status", "contentCalendar", "generatedAt"]
      }
    }
  },
  "required": ["user", "instagramAccounts", "reels", "strategies"]
}
```

---

# §12 — FINOPS & COST CONTROL

## 12.1 Cost Model

```
┌─────────────────────────────────────────────────────────┐
│                 COST PER USER/MONTH                      │
│                                                         │
│  Fixed Infrastructure:                                   │
│  ├── Supabase Pro:        $25/mo  (shared across users) │
│  ├── Vercel Pro:          $20/mo  (shared across users) │
│  ├── Sentry:              $26/mo  (shared across users) │
│  └── Resend:              $20/mo  (shared across users) │
│      Total fixed:         ~$91/mo                        │
│                                                         │
│  Variable (per user):                                    │
│  ├── OpenAI GPT-4o-mini:  ~$0.015/scoring call          │
│  │   (150 tokens in, 800 tokens out avg)                │
│  ├── OpenAI GPT-4o:       ~$0.08/strategy call          │
│  │   (2000 tokens in, 2000 tokens out avg)              │
│  ├── Instagram API:       $0 (free)                     │
│  └── Stripe fees:         2.9% + $0.30/transaction      │
│                                                         │
│  Per-plan cost estimate:                                │
│  ├── Free:    $0.15/user/mo  (10 AI calls)              │
│  ├── Creator: $2.25/user/mo  (150 AI calls)             │
│  ├── Pro:     $12.00/user/mo (600 AI calls + GPT-4o)    │
│  └── Agency:  $40.00/user/mo (2500 AI calls + GPT-4o)   │
│                                                         │
│  Gross Margin Targets:                                   │
│  ├── Creator ($29):  92% margin  ✅                      │
│  ├── Pro ($79):      85% margin  ✅                      │
│  └── Agency ($199):  80% margin  ✅                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 12.2 Circuit Breaker Implementation

```typescript
interface CircuitBreakerConfig {
  // Per-user monthly budget caps (in USD)
  budgetCaps: {
    free: 0.50,
    creator: 5.00,
    pro: 20.00,
    agency: 60.00,
  };

  // Global margin protection
  marginThreshold: 0.35; // 35% minimum gross margin

  // Automatic actions when breached
  actions: {
    softLimit: 0.80;  // At 80% → warn user, switch to mini model
    hardLimit: 1.00;  // At 100% → disable AI, fallback only
    globalTrip: {
      // If total platform cost exceeds revenue by this factor
      threshold: 0.65, // 65% cost-to-revenue ratio
      action: "disable_free_tier_ai",
    };
  };
}

async function budgetCheck(
  userId: string,
  operationType: string
): Promise<boolean> {
  const subscription = await getSubscription(userId);
  const usage = await getCurrentMonthUsage(userId);
  const cap = CIRCUIT_BREAKER.budgetCaps[subscription.planId];

  if (usage.totalCostUsd >= cap) {
    await logBudgetExceeded(userId, usage.totalCostUsd, cap);
    return false;
  }

  // Soft limit warning
  if (usage.totalCostUsd >= cap * CIRCUIT_BREAKER.actions.softLimit) {
    await notifyUserApproachingLimit(userId, usage.totalCostUsd, cap);
  }

  return true;
}
```

## 12.3 Cost Tracking Schema

```typescript
// Track every LLM call
interface AICostEvent {
  userId: string;
  operation: "scoring" | "strategy" | "analysis";
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  success: boolean;
  timestamp: Date;
}

// Pricing table (updated manually when OpenAI changes prices)
const MODEL_PRICING = {
  "gpt-4o-mini": {
    inputPer1K: 0.00015,
    outputPer1K: 0.0006,
  },
  "gpt-4o": {
    inputPer1K: 0.005,
    outputPer1K: 0.015,
  },
};

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  return (
    (inputTokens / 1000) * pricing.inputPer1K +
    (outputTokens / 1000) * pricing.outputPer1K
  );
}
```

## 12.4 Free-Tier Abuse Prevention Constraints

To maintain FinOps boundaries and prevent platform exploitation by bot networks or multiple throwaway accounts, the application MUST enforce three strict anti-abuse gating rules:

### Gating Policies:
1. **Verified Email Mandate**: Users on the `"free"` tier are strictly prohibited from linking an Instagram account or invoking any AI service unless their Supabase authentication record indicates a verified email (`email_confirmed_at IS NOT NULL`).
2. **Instagram Account Uniqueness**: Each unique Instagram Business Account ID (`ig_user_id`) can only be linked to **one** user profile in the database at any given time. If a user tries to connect an `ig_user_id` that is already actively linked, the connection flow MUST block and return a clear error code (`ACCOUNT_ALREADY_LINKED`).
3. **IP-Level Signup and Ingestion Throttling**: 
   - A strict rate-limit of **3 signups per IP address per day** is enforced at the authentication API layer.
   - Initial synchronization operations for free accounts are limited to the most recent **15 Reels** (compared to 100 Reels for paid tiers).

---

# §13 — OBSERVABILITY & TELEMETRY

## 13.1 Structured Logging Standard

```typescript
// Every log entry MUST follow this structure
interface LogEntry {
  timestamp: string;       // ISO 8601
  level: "debug" | "info" | "warn" | "error" | "fatal";
  service: string;         // "api" | "worker" | "ai" | "ingestion"
  traceId: string;         // Request trace ID
  userId?: string;
  action: string;          // "reel.scored" | "strategy.generated"
  duration_ms?: number;
  metadata?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

// Example log:
// {
//   "timestamp": "2025-05-19T12:00:00Z",
//   "level": "info",
//   "service": "ai",
//   "traceId": "abc-123",
//   "userId": "usr_xyz",
//   "action": "reel.scored",
//   "duration_ms": 2340,
//   "metadata": {
//     "reelId": "reel_abc",
//     "model": "gpt-4o-mini",
//     "tokensUsed": 987,
//     "costUsd": 0.012,
//     "score": 87
//   }
// }
```

## 13.2 Health Check Endpoints

### Shallow Health (`/api/health`)

```typescript
// Returns 200 if app is running
export async function GET() {
  return Response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
  });
}
```

### Deep Health (`/api/health/deep`)

```typescript
// Checks all dependencies
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkSupabaseAuth(),
    checkOpenAI(),
    checkStripe(),
    checkInstagramAPI(),
  ]);

  const results = {
    database: checks[0].status === "fulfilled" ? "ok" : "degraded",
    auth: checks[1].status === "fulfilled" ? "ok" : "degraded",
    openai: checks[2].status === "fulfilled" ? "ok" : "degraded",
    stripe: checks[3].status === "fulfilled" ? "ok" : "degraded",
    instagram: checks[4].status === "fulfilled" ? "ok" : "degraded",
  };

  const overallStatus = Object.values(results).every(s => s === "ok")
    ? "healthy"
    : "degraded";

  return Response.json({
    status: overallStatus,
    checks: results,
    timestamp: new Date().toISOString(),
    queueDepth: await getQueueDepth(),
    deadLetterCount: await getDeadLetterCount(),
  });
}
```

## 13.3 Alert Rules

| Alert | Condition | Severity | Action |
|---|---|---|---|
| LLM cost spike | >150% of daily average | Warning | Notify founder |
| Queue backup | >100 pending jobs for >10 min | Warning | Scale worker check |
| Dead letter growth | >10 dead letters in 1 hour | Critical | Investigate + manual review |
| Token refresh failure | Any token refresh fails 3x | Critical | Alert user + founder |
| API error rate | >5% 5xx in 5 minutes | Critical | Check deployment |
| Auth failures | >50 failed logins in 5 min | Security | Rate limit + investigate |
| Budget breach | Any user exceeds budget cap | Warning | Circuit breaker auto-triggers |
| API Latency Spike | Average latency > 200ms at 50 concurrent requests | Warning | Alert dev/founder, investigate database load or connection pool exhaustion |

## 13.4 Metrics Dashboard (Key Metrics)

```
Business Metrics:
  ├── MRR (Monthly Recurring Revenue)
  ├── Active users (DAU, WAU, MAU)
  ├── Churn rate (monthly)
  ├── LTV (Lifetime Value)
  ├── Feature adoption rates

Technical Metrics:
  ├── API latency (p50, p95, p99)
  ├── Error rate (by endpoint)
  ├── Queue depth (current, peak)
  ├── Worker throughput (jobs/minute)
  ├── LLM latency (per model)
  ├── LLM cost (daily, weekly, monthly)
  ├── Instagram API rate limit utilization
  ├── Database connection pool usage
  ├── Edge function cold starts

AI Metrics:
  ├── Scoring accuracy (user feedback correlation)
  ├── Strategy satisfaction (thumbs up/down)
  ├── Fallback rate (% of requests hitting fallback)
  ├── Token usage efficiency (tokens per useful output)
  ├── Model version performance comparison
```

---

# §14 — DEPLOYMENT & CI/CD

## 14.1 Environment Strategy

| Environment | Purpose | URL |
|---|---|---|
| `development` | Local development | `localhost:3000` |
| `preview` | PR preview deployments | `pr-{n}.reel-logic.vercel.app` |
| `staging` | Pre-production testing | `staging.reellogic.ai` |
| `production` | Live application | `app.reellogic.ai` |

## 14.2 Deployment Pipeline

```
Developer pushes code
        │
        ▼
┌─────────────────┐
│ GitHub Actions   │
│ CI Pipeline      │
│                 │
│ 1. Install deps │
│ 2. Type check   │  ← `tsc --noEmit`
│ 3. Lint          │  ← `eslint --max-warnings 0`
│ 4. Unit tests    │  ← `vitest run`
│ 5. Build         │  ← `next build`
│ 6. Schema check  │  ← Validate DB schema matches Drizzle
└────────┬────────┘
         │
    ┌────▼────┐
    │ PASS?   │──── NO ──► Block merge
    └────┬────┘
         │ YES
         ▼
┌─────────────────┐
│ Vercel Preview   │ ← Auto-deploy on PR
│                 │
│ • Smoke tests    │
│ • Visual review  │
│ • Lighthouse     │
└────────┬────────┘
         │
    Merge to main
         │
         ▼
┌─────────────────┐
│ Staging Deploy   │
│                 │
│ • Integration    │
│   tests         │
│ • API smoke test │
│ • Queue health   │
└────────┬────────┘
         │
    ┌────▼────┐
    │ GATES   │
    │         │
    │ ✓ 0 TypeScript errors
    │ ✓ 0 schema mismatches
    │ ✓ 0 unhandled rejections
    │ ✓ Lighthouse score > 90
    │ ✓ API response time < 500ms (p95)
    └────┬────┘
         │ ALL PASS
         ▼
┌─────────────────┐
│ Production Deploy│ ← Vercel auto-deploy on main merge
│                 │
│ • Health check   │
│ • Rollback ready │
│ • Monitor 15 min │
└─────────────────┘
```

## 14.3 Deployment Gates (Must Pass)

```yaml
gates:
  - name: "Zero TypeScript errors"
    command: "npx tsc --noEmit"
    must_pass: true

  - name: "Zero lint warnings"
    command: "npx eslint . --max-warnings 0"
    must_pass: true

  - name: "All tests pass"
    command: "npx vitest run --coverage"
    must_pass: true
    coverage_threshold: 60  # Minimum % coverage

  - name: "Build succeeds"
    command: "npx next build"
    must_pass: true

  - name: "No secrets in code"
    command: "npx secretlint '**/*'"
    must_pass: true

  - name: "Dependency audit"
    command: "npm audit --audit-level=high"
    must_pass: true

  - name: "Schema sync check"
    command: "npx drizzle-kit check"
    must_pass: true

  - name: "Bundle size check"
    max_first_load_js: "250KB"
    must_pass: false  # Warning only

  - name: "Automated DB migration"
    command: "npx drizzle-kit migrate"
    must_pass: true
    context: "Runs against production database during deploy.yml workflow after successful build, before final Vercel release"

  - name: "API Latency & Load Test Gate"
    command: "npx autocannon -c 50 -d 10 http://localhost:3000/api/health"
    must_pass: true
    target: "avg latency < 200ms"
```

## 14.4 Environment Variables

```bash
# .env.example — NEVER commit real values

# ─── Supabase ───
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=             # Server-only, never expose to client
SUPABASE_DB_URL=                        # Direct DB connection

# ─── Instagram ───
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=
INSTAGRAM_VERIFY_TOKEN=                 # Meta webhook hub verification token

# ─── OpenAI ───
OPENAI_API_KEY=
OPENAI_ORG_ID=

# ─── Stripe ───
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# ─── Email (Resend) ───
RESEND_API_KEY=

# ─── Security ───
TOKEN_ENCRYPTION_KEY=                   # 32-byte hex string for AES-256-GCM

# ─── App ───
NEXT_PUBLIC_APP_URL=
APP_VERSION=
NODE_ENV=
```

## 14.5 Supabase Backup, PITR, & Disaster Recovery Strategy

To guarantee data integrity and compliance with institutional data-loss rules, the database backup and disaster recovery processes MUST satisfy strict RPO and RTO bounds:

### Recovery Metrics:
- **Recovery Point Objective (RPO)**: **24 hours** max data loss window under standard daily backups; **2 minutes** max data loss when utilizing Supabase Point-in-Time Recovery (PITR).
- **Recovery Time Objective (RTO)**: **4 hours** max duration to restore full system operability following database cluster deletion or failure.

### Operational Backup Constraints:
1. **Automated Daily Backups**: Daily database snapshots are enabled automatically by Supabase, retained for 7 days (Hobby/Free) or 30 days (Pro/Enterprise).
2. **Point-in-Time Recovery (PITR)**: Production databases MUST have PITR enabled, writing write-ahead logs (WAL) to secure external storage (S3) continuously to enable restoration to any arbitrary millisecond within the past 30 days.
3. **Quarterly Restoration Drills**: Staged restore procedures MUST be performed by engineers on a quarterly schedule. The restore script MUST:
   - Create a temporary, isolated staging DB instance.
   - Restore the latest backup or PITR snapshot onto the staging instance.
   - Run the full RLS verification suite (`scripts/test-rls.ts`) to ensure data policies remain fully intact after restoration.

## 14.6 Vercel Serverless Optimization & Cold-Start Warmup

To maintain high responsiveness and stay within standard serverless limits, Next.js routes and serverless execution environments MUST apply these optimizations:

### Warmup and Chunks:
1. **Dynamic Route Chunking**: High-dependency dashboard graphs (e.g. using Recharts) and strategy views MUST use Next.js dynamic imports (`next/dynamic` with `ssr: false` where appropriate) to split code bundles, reducing the initial JS execution load below **250KB** per page.
2. **Path Caching and Revalidation**: Public landing pages and public analytical reports MUST utilize Incremental Static Regeneration (ISR) with a `revalidate` window (e.g. 60 seconds) to bypass database calls entirely for standard traffic.
3. **Scheduled Warmup Pings**: To prevent serverless execution environment cold-starts during core business hours, the system schedules a lightweight warmup cron (`GET /api/health` and dashboard route warmups) using Vercel Cron jobs every **5 minutes** from 08:00 to 22:00 local time.

## 14.7 Public Landing Page & Dashboard Bundle Separation

To prevent leakage of admin credentials and to guarantee lightning-fast load times for anonymous visitors, public-facing routes MUST be strictly isolated from the dashboard code bundle:

### Bundle Boundaries:
1. **No Supabase Client in Public Bundles**: Public static pages (landing page `/`, pricing `/pricing`, documentation `/docs`) MUST NOT import or initialize the Supabase client, the Drizzle schemas, or any encryption keys. They are rendered as pure, static HTML/CSS.
2. **Dependency Tree Guard**: To prevent heavy dashboard components (like Recharts and framer-motion) from bleeding into the public-facing entry points, the Next.js bundle config MUST use package-level tree-shaking and declare clean boundaries. Any shared UI components (buttons, badges) MUST reside in `components/shared/` and contain zero external database references.
3. **ESLint Build-Time Restrictions**: To programmatically enforce this boundary, a custom ESLint `no-restricted-imports` rule MUST be configured for all routes located within public paths (`app/(public)/**/*`). This rule blocks imports of `@/lib/db`, `@/lib/supabase`, or `@/lib/security/encryption` from public page paths, causing the build to fail immediately if violated.

---

# §15 — FAILURE STATE ENGINE

## 15.1 System Operational Modes

```
┌─────────────────────────────────────────────────────────┐
│                OPERATIONAL MODES                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟢 NORMAL                                        │   │
│  │ All systems operational.                          │   │
│  │ Full AI + ingestion + queue + billing active.     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟡 DEGRADED                                      │   │
│  │ Trigger: LLM service down OR budget exceeded      │   │
│  │                                                   │   │
│  │ • AI scoring → deterministic fallback             │   │
│  │ • Strategy → "temporarily unavailable" message    │   │
│  │ • Ingestion → still running (no AI needed)        │   │
│  │ • Dashboard → shows metrics only (no AI scores)   │   │
│  │ • Queue → still processing non-AI jobs            │   │
│  │ • Billing → fully operational                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟠 SAFE MODE                                     │   │
│  │ Trigger: Database errors OR queue overflow         │   │
│  │                                                   │   │
│  │ • Ingestion → paused                              │   │
│  │ • Queue → drain only (no new jobs)                │   │
│  │ • Dashboard → read-only (cached data)             │   │
│  │ • AI → disabled                                   │   │
│  │ • Billing → operational (keep revenue flowing)    │   │
│  │ • New signups → waitlisted                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔴 EMERGENCY STOP                                │   │
│  │ Trigger: Security breach OR data integrity issue   │   │
│  │                                                   │   │
│  │ • ALL writes disabled                             │   │
│  │ • ALL external API calls stopped                  │   │
│  │ • Dashboard → maintenance page                    │   │
│  │ • Only diagnostics + logs accessible              │   │
│  │ • Founder alerted immediately                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 15.2 Mode Transition Rules

```typescript
interface ModeTransition {
  from: OperationalMode;
  to: OperationalMode;
  trigger: string;
  automatic: boolean;   // Can system auto-transition?
  requiresHuman: boolean; // Needs founder approval to transition?
}

const TRANSITIONS: ModeTransition[] = [
  // Auto-degradation
  { from: "NORMAL", to: "DEGRADED", trigger: "llm_unavailable", automatic: true, requiresHuman: false },
  { from: "NORMAL", to: "DEGRADED", trigger: "budget_exceeded", automatic: true, requiresHuman: false },

  // Auto-recovery
  { from: "DEGRADED", to: "NORMAL", trigger: "llm_restored", automatic: true, requiresHuman: false },
  { from: "DEGRADED", to: "NORMAL", trigger: "budget_reset", automatic: true, requiresHuman: false },

  // Escalation (auto-enter, human-exit)
  { from: "DEGRADED", to: "SAFE_MODE", trigger: "db_errors_threshold", automatic: true, requiresHuman: true },
  { from: "NORMAL", to: "SAFE_MODE", trigger: "queue_overflow", automatic: true, requiresHuman: true },

  // Emergency (auto-enter, human-exit)
  { from: "*", to: "EMERGENCY", trigger: "security_breach", automatic: true, requiresHuman: true },
  { from: "*", to: "EMERGENCY", trigger: "data_integrity_failure", automatic: true, requiresHuman: true },

  // Recovery (always requires human)
  { from: "SAFE_MODE", to: "NORMAL", trigger: "manual_clear", automatic: false, requiresHuman: true },
  { from: "EMERGENCY", to: "NORMAL", trigger: "incident_resolved", automatic: false, requiresHuman: true },
];
```

---

# §16 — VALIDATION ENGINE

## 16.1 Validation Categories

### Structural Validation

Runs on every code artifact before it's committed:

```typescript
interface StructuralValidator {
  // Schema validation — config and data files match expected schemas
  validateSchema(artifact: Artifact, schema: JSONSchema): ValidationResult;

  // Import guard — only approved modules are imported
  validateImports(artifact: Artifact, allowlist: string[]): ValidationResult;

  // Dependency check — no forbidden packages
  validateDependencies(packageJson: PackageJson, forbidden: string[]): ValidationResult;

  // Type safety — TypeScript strict mode compliance
  validateTypes(): ValidationResult;
}

// Forbidden dependencies (HARD BLOCK)
const FORBIDDEN_DEPS = [
  "redis",
  "ioredis",
  "kafkajs",
  "amqplib",        // RabbitMQ
  "bull",           // Redis-based queue
  "bullmq",
  "mongoose",       // MongoDB
  "firebase",       // Not using Firebase
  "express",        // Using Next.js
];
```

### Runtime Simulation

Validates behavior without deploying:

```typescript
interface RuntimeSimulator {
  // Mock a worker processing a job
  simulateWorker(jobType: JobType, payload: any): Promise<SimulationResult>;

  // Simulate webhook payloads
  simulateWebhook(source: "stripe" | "instagram", event: any): Promise<SimulationResult>;

  // Simulate LLM failure
  simulateLLMFailure(): Promise<SimulationResult>;

  // Simulate rate limiting
  simulateRateLimit(endpoint: string): Promise<SimulationResult>;
}
```

### Contract Validation

Ensures system boundaries are respected:

```typescript
interface ContractValidator {
  // API response matches declared schema
  validateAPIContract(route: string, response: any, schema: ZodSchema): boolean;

  // DB writes respect RLS policies
  validateRLSCompliance(query: string, userId: string): boolean;

  // Queue jobs are idempotent (re-run produces same result)
  validateIdempotency(jobType: JobType, payload: any): Promise<boolean>;

  // No cross-boundary violations
  validateBoundaries(module: string, imports: string[]): boolean;
}
```

### Failure Injection Tests

Every phase must survive these:

```typescript
const FAILURE_INJECTION_SUITE = [
  {
    name: "API timeout",
    inject: () => mockExternalAPI({ delay: 35000 }), // 35s timeout
    expectation: "graceful_timeout_response",
  },
  {
    name: "Malformed webhook",
    inject: () => sendWebhook({ invalid: "payload" }),
    expectation: "400_with_error_details",
  },
  {
    name: "LLM invalid JSON",
    inject: () => mockLLM({ response: "not json at all" }),
    expectation: "fallback_response_used",
  },
  {
    name: "DB constraint violation",
    inject: () => insertDuplicate("reels", { ig_media_id: "existing" }),
    expectation: "conflict_handled_gracefully",
  },
  {
    name: "Token expired mid-request",
    inject: () => mockInstagramAPI({ status: 401 }),
    expectation: "token_refresh_attempted",
  },
  {
    name: "Stripe webhook replay",
    inject: () => replayWebhook("evt_already_processed"),
    expectation: "idempotent_200_response",
  },
];
```

## 16.2 AI Prompt Evaluation Framework

To prevent AI output drift, schema regressions, or excessive scoring variance across prompt adjustments or LLM model upgrades (e.g. from GPT-4o-mini to GPT-5 or equivalent), the AI engine must pass an automated validation gate using `scripts/test-prompts.ts`. This script executes a mock evaluation pipeline without incurring live production costs by feeding a deterministic set of test inputs into the prompt runner.

### 16.2.1 Mock Test Suite Setup (`scripts/test-prompts.ts`)

The evaluation script relies on 10 highly diverse mock Reel objects to stretch the limits of the prompt parsing and scoring rules:
1. **The Viral Blockbuster:** `views = 5,000,000`, `likes = 450,000`, `shares = 200,000`, `saves = 180,000`, `skip_rate = 8%`. (Tests high-end score limits).
2. **The Flatline Reel:** `views = 12`, `likes = 0`, `shares = 0`, `saves = 0`, `skip_rate = 95%`. (Tests bottom-end score bounds and fallback sanity).
3. **The Average Performer:** Matches the active tenant average: `views = 15,000`, `likes = 900`, `shares = 120`, `saves = 180`, `skip_rate = 42%`.
4. **The Text Wall:** Standard performance metrics, but contains a 2,200-character caption filled with spammy formatting, Emojis, and 30 hashtags. (Tests tokenizer context boundaries).
5. **The Quiet Achiever:** Low views (`views = 1,200`) but abnormally high saves (`saves = 850`) and low likes (`likes = 12`). (Tests dimension weighing anomalies).
6. **The Audio Magnet:** Abnormally high audio usage indicators but basic visual caption metrics. (Tests audio-heuristic processing).
7. **The Quick-Scroll (Clickbait):** High views (`views = 100,000`), low likes (`likes = 15`), but extreme skip rate (`skip_rate = 99%`). (Tests hook score degradation).
8. **The Null Value Case:** Missing optional fields (`caption = null`, `shares_count = null`). (Tests database schema nullability safety).
9. **The Input Out-of-Bounds Case:** Negative numbers or string-encoded floats in raw numbers fields (e.g., `-12 likes`, `views = -50`). (Tests parser resilience and pre-normalization).
10. **The Standard Creator:** Matches the base creator profile benchmark averages.

### 16.2.2 Verified Assertions & Evaluation Rules

The test runner asserts the following conditions on every prompt run:
- **Zod Schema Compliance:** All outputs must parse cleanly against `ReelScoreSchema` (for scoring) and `StrategySchema` (for strategy generation). Any parser throwing a Zod error immediately fails the validation gate.
- **Score Range Bounds:** Every scoring output must satisfy:
  - `1 <= overall_score <= 100`
  - `1 <= dimensions.[dimension].score <= 10`
- **Output Consistency (Variance Gate):** At low temperature (`temperature = 0.3`), identical inputs must yield consistent scores. The script runs each of the 10 mock reels through 3 consecutive iterations and asserts:
  - `Variance(overall_score) <= 5` (The difference between the max and min overall score across all 3 passes must be 5 points or less).
- **Execution Diagnostics:** Logs out average token consumption, execution latency, parsing overhead, and cost per scoring invocation.

Command to run validation suite manually:
```bash
npx tsx scripts/test-prompts.ts
```

---

# §17 — REPAIR ENGINE

## 17.1 Auto-Repair Flow

```
Validation fails
       │
       ▼
┌─────────────────────────┐
│ 1. ANALYZE failure      │
│                         │
│ • Parse error message   │
│ • Classify violation    │
│   type                  │
│ • Identify affected     │
│   artifact              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. CLASSIFY violation   │
│                         │
│ • TYPE_ERROR            │ → Fix types
│ • SCHEMA_MISMATCH       │ → Fix schema
│ • LOGIC_ERROR           │ → Restructure logic
│ • DEPENDENCY_VIOLATION  │ → Remove import
│ • BOUNDARY_VIOLATION    │ → Move code to correct module
│ • MISSING_HANDLER       │ → Add error handler
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 3. GENERATE minimal fix │
│                         │
│ • Smallest possible     │
│   change                │
│ • No refactoring        │
│ • No feature additions  │
│ • Fix the violation     │
│   ONLY                  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 4. APPLY & REVALIDATE   │
│                         │
│ • Apply patch           │
│ • Re-run all validators │
│ • If pass → commit      │
│ • If fail → retry       │
│   (max 3)               │
└────────┬────────────────┘
         │
    Still failing after 3?
         │
         ▼
┌─────────────────────────┐
│ 5. ESCALATE             │
│                         │
│ • Log full context      │
│ • Snapshot system state  │
│ • Notify founder        │
│ • HALT pipeline         │
│ • DO NOT GUESS          │
└─────────────────────────┘
```

## 17.2 Repair Constraints

```
✅ ALLOWED repairs:
  • Fix TypeScript type errors
  • Add missing Zod validation
  • Add missing error handling (try/catch)
  • Remove forbidden imports
  • Add missing RLS policies
  • Fix schema mismatches

❌ FORBIDDEN in repair:
  • Adding new features
  • Refactoring existing code
  • Changing architecture decisions
  • Adding new dependencies
  • Modifying database schema
  • Changing API contracts
```

---

# §18 — GLOBAL ENGINEERING RULES

## RULE 1 — ZERO ASSUMPTION POLICY

```
IF information is missing or ambiguous:
  → STOP execution
  → Generate clarification request with specific questions
  → DO NOT hallucinate values, configs, or behaviors
  → DO NOT proceed with "reasonable defaults" for business logic
```

## RULE 2 — NO PARTIAL OUTPUTS

Every code artifact MUST include:

```
✓ Error handling (try/catch with typed errors)
✓ Logging (structured JSON logs)
✓ Type safety (strict TypeScript, no `any`)
✓ Rollback plan (documented revert steps)
✓ Validation hooks (input validation on boundaries)
✓ Loading states (UI components)
✓ Empty states (UI components)
✓ Edge cases documented in comments
```

## RULE 3 — ISOLATION ENFORCEMENT (HARD BOUNDARIES)

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
│                                                          │
│  Rules:                                                  │
│  • Billing NEVER touches AI or Queue directly            │
│  • AI NEVER writes directly to DB tables                 │
│  • Webhooks NEVER execute business logic (they enqueue)  │
│  • Workers NEVER bypass the queue layer                  │
│  • Frontend NEVER contains business logic                │
│  • API routes NEVER contain business logic (delegate)    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## RULE 4 — FAIL SAFE OVER FAIL FAST

```typescript
// System MUST:
// 1. Degrade gracefully (never crash)
// 2. Return deterministic fallback (never undefined behavior)
// 3. Never crash frontend or API layer
// 4. Always return a valid API response shape

// Example: AI service is down
// ❌ WRONG: throw new Error("AI unavailable")
// ✅ RIGHT: return { data: null, fallback: true, message: "AI temporarily unavailable" }

// Example: Instagram API rate limited
// ❌ WRONG: throw new Error("Rate limited")
// ✅ RIGHT: schedule retry with exponential backoff, return cached data
```

## RULE 5 — COST CONTROL FIRST (FINOPS CORE)

```typescript
// ANY external API call MUST pass budget check

async function executeAICall(userId: string, operation: string) {
  // MANDATORY — never skip
  const canAfford = await budgetCheck(userId, operation);

  if (!canAfford) {
    return generateDeterministicFallback(operation);
  }

  // Proceed with actual call...
}
```

## RULE 6 — IMMUTABLE AUDIT TRAIL

```
Every mutation in the system MUST be logged:
  • WHO (user_id or system)
  • WHAT (action + resource)
  • WHEN (timestamp)
  • WHERE (IP, user agent for user actions)
  • RESULT (success/failure + details)
```

## RULE 7 — ZERO TRUST DATA POLICY

```
• Never trust client-side data — validate on server
• Never trust LLM output — parse + validate with Zod
• Never trust webhook payloads — verify signatures
• Never trust URL params — sanitize + validate
• Never trust environment — validate env vars on startup
```

---

# §19 — AGENT BOUNDARIES & ROLES

## 19.1 Agent Classification Matrix

```
┌──────────────────────────────────────────────────────────┐
│                    AGENT BOUNDARIES                       │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │ 🔧 BACKEND AGENT     │  │ 🧠 AI AGENT              │ │
│  │                      │  │                          │ │
│  │ OWNS:                │  │ OWNS:                    │ │
│  │ • Database schema    │  │ • LLM prompt templates   │ │
│  │ • API routes         │  │ • Output parsers         │ │
│  │ • Service layer      │  │ • Scoring logic          │ │
│  │ • Queue engine       │  │ • Strategy generation    │ │
│  │ • Auth/authz         │  │ • Fallback generators    │ │
│  │ • Billing logic      │  │ • Cost calculators       │ │
│  │ • Webhook handlers   │  │                          │ │
│  │                      │  │ FORBIDDEN:               │ │
│  │ FORBIDDEN:           │  │ • Direct DB writes       │ │
│  │ • LLM prompt design  │  │ • External API calls     │ │
│  │ • UI components      │  │ • Auth logic             │ │
│  │ • CI/CD config       │  │ • Queue management       │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │ 🎨 FRONTEND AGENT    │  │ ⚙️ DEVOPS AGENT          │ │
│  │                      │  │                          │ │
│  │ OWNS:                │  │ OWNS:                    │ │
│  │ • React components   │  │ • CI/CD pipelines        │ │
│  │ • Page layouts       │  │ • Deployment config      │ │
│  │ • Styling (CSS)      │  │ • Environment setup      │ │
│  │ • Client-side state  │  │ • Monitoring setup       │ │
│  │ • Animations         │  │ • Health checks          │ │
│  │ • Accessibility      │  │ • Alerting rules         │ │
│  │                      │  │                          │ │
│  │ FORBIDDEN:           │  │ FORBIDDEN:               │ │
│  │ • Business logic     │  │ • Business logic         │ │
│  │ • Direct API calls   │  │ • UI components          │ │
│  │   (use hooks/fetch)  │  │ • Feature development    │ │
│  │ • Database queries   │  │ • Database schema        │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                          │
│  ┌──────────────────────┐                                │
│  │ 🔒 SECURITY AGENT    │                                │
│  │                      │                                │
│  │ OWNS:                │                                │
│  │ • Encryption logic   │                                │
│  │ • RLS policies       │                                │
│  │ • Auth middleware     │                                │
│  │ • GDPR compliance    │                                │
│  │ • Audit logging      │                                │
│  │ • Vulnerability scan │                                │
│  │                      │                                │
│  │ FORBIDDEN:           │                                │
│  │ • Feature development│                                │
│  │ • UI changes         │                                │
│  │ • AI prompt design   │                                │
│  └──────────────────────┘                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 19.2 Cross-Agent Communication Protocol

```
Agents communicate ONLY through:
  1. Shared artifacts (files in the repo)
  2. Service layer interfaces (TypeScript types)
  3. Validated API contracts (Zod schemas)

Agents NEVER:
  • Directly modify another agent's owned files
  • Make assumptions about another agent's implementation
  • Skip validation gates between phases
```

---

# §20 — INVESTOR-READY METRICS & UNIT ECONOMICS

## 20.1 Key Metrics to Track From Day 1

```
┌──────────────────────────────────────────────────────────┐
│              INVESTOR-READY DASHBOARD                     │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ REVENUE METRICS                                      ││
│  │                                                     ││
│  │ MRR          $X,XXX    ← Track daily                ││
│  │ ARR          $XX,XXX   ← MRR × 12                   ││
│  │ MoM Growth   X%        ← Target: 15-20% pre-Series A││
│  │ Revenue/User $XX       ← ARPU                        ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ CUSTOMER METRICS                                     ││
│  │                                                     ││
│  │ Total Users   XXX      ← All registered             ││
│  │ Paid Users    XXX      ← Active subscriptions       ││
│  │ Free → Paid   X%       ← Conversion rate            ││
│  │ Monthly Churn  X%      ← Target: <8%                ││
│  │ NPS           XX       ← Survey monthly             ││
│  │ DAU/MAU       X%       ← Engagement quality         ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ UNIT ECONOMICS                                       ││
│  │                                                     ││
│  │ CAC          $XX       ← All marketing / new users  ││
│  │ LTV          $XXX      ← ARPU × avg lifetime months ││
│  │ LTV:CAC      X:1       ← Target: >3:1               ││
│  │ Payback      X months  ← CAC / monthly ARPU         ││
│  │ Gross Margin X%        ← Revenue - COGS / Revenue   ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ PRODUCT METRICS                                      ││
│  │                                                     ││
│  │ Reels Analyzed    XX,XXX  ← Total all-time          ││
│  │ Strategies Gen    X,XXX   ← Total all-time          ││
│  │ Avg Session       X min   ← Time in app             ││
│  │ Feature Adoption  X%      ← Key features used       ││
│  │ AI Satisfaction   X%      ← Thumbs up rate          ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ INFRASTRUCTURE COST                                  ││
│  │                                                     ││
│  │ Total Infra     $XX/mo    ← All hosting + services  ││
│  │ AI Cost         $XX/mo    ← OpenAI spend            ││
│  │ Cost/User       $X.XX     ← Total cost / paid users ││
│  │ COGS            $XX/mo    ← Direct costs            ││
│  │ Gross Margin    XX%       ← (Revenue-COGS)/Revenue  ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 20.2 Cohort Analysis Framework

Track monthly cohorts from signup:

| Metric | M0 | M1 | M2 | M3 | M6 | M12 |
|---|---|---|---|---|---|---|
| Retention | 100% | >60% | >50% | >45% | >35% | >25% |
| Revenue/user | $X | $X | ≥$X | ≥$X | ≥$X | ≥$X |
| Feature depth | 1 | 2 | 3 | 3+ | 4+ | 5+ |

## 20.3 Pitch Deck Data Points

When raising, lead with these:

1. **Market size** — Instagram has 2B+ MAU, 200M+ creators. Creator tools market: $20B+ by 2027.
2. **Wedge** — Reels-specific AI scoring is underserved. No competitor does deep per-Reel analysis.
3. **Traction** — X paid users, $Y MRR, Z% MoM growth, W% gross margin.
4. **Unit economics** — LTV:CAC of X:1, payback period of Y months.
5. **Moat** — Proprietary scoring model trained on thousands of real Reel performance data points.
6. **Expansion** — TikTok, YouTube Shorts, LinkedIn video (same engine, new data source).

---

# §21 — INSTAGRAM STRATEGY LOGIC (THE PRODUCT BRAIN)

## 21.1 How the Strategy Engine Actually Works

```
┌─────────────────────────────────────────────────────────┐
│              STRATEGY GENERATION PIPELINE                │
│                                                         │
│  Step 1: DATA COLLECTION                                │
│  ├── Pull last 90 days of Reels data                    │
│  ├── Aggregate per-Reel metrics                         │
│  ├── Calculate trends (engagement, reach, growth)       │
│  └── Identify posting patterns (days, times, frequency) │
│                                                         │
│  Step 2: PATTERN RECOGNITION                            │
│  ├── Top-performing content themes                      │
│  ├── Best posting times (per-account, not generic)      │
│  ├── Engagement correlation with content attributes     │
│  ├── Audience growth correlation with posting frequency │
│  └── Format preferences (educational, entertainment,    │
│      trending, personal)                                │
│                                                         │
│  Step 3: AI ANALYSIS                                    │
│  ├── Feed patterns + raw data into LLM                  │
│  ├── Generate content pillars based on what works       │
│  ├── Produce specific content ideas with hooks          │
│  ├── Recommend posting schedule based on data           │
│  └── Identify experiments to try                        │
│                                                         │
│  Step 4: STRUCTURED OUTPUT                              │
│  ├── Validate output with Zod schema                    │
│  ├── Ensure all required fields present                 │
│  ├── Calculate confidence scores                        │
│  └── Store in database                                  │
│                                                         │
│  Step 5: PRESENTATION                                   │
│  ├── Show calendar view with daily plan                 │
│  ├── Show content pillars with rationale                │
│  ├── Show improvement priorities with scores            │
│  └── Allow user feedback (thumbs up/down per item)      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 21.2 Content Pillars Framework

The strategy engine identifies 3–5 content pillars based on the account's real data:

```typescript
interface ContentPillar {
  theme: string;           // e.g., "Educational Tips"
  percentage: number;      // e.g., 40 (40% of content)
  rationale: string;       // "Your educational Reels avg 2.3x more engagement"
  examples: string[];      // ["3 mistakes...", "How I grew...", "Why you should..."]
  bestPerforming: {
    reelId: string;
    engagementRate: number;
    caption: string;
  };
}

// Example pillars for a fitness creator:
// 1. Educational Tips (40%) — "Your form correction Reels avg 5.2% ER vs 2.1% overall"
// 2. Transformation Reveals (25%) — "Before/after content drives 3x saves"
// 3. Trending Challenges (20%) — "Trending format adoption within 48hrs drives 4x reach"
// 4. Personal/BTS (15%) — "Personal stories get 2x comments but lower reach"
```

## 21.3 Optimal Posting Time Algorithm

```typescript
// Analyze historical data to find per-account optimal times

interface PostingTimeAnalysis {
  // Best times ranked by engagement rate
  optimalSlots: {
    dayOfWeek: number;  // 0 = Sunday
    hour: number;       // 0-23
    avgEngagement: number;
    sampleSize: number; // How many Reels in this slot
    confidence: "high" | "medium" | "low"; // Based on sample size
  }[];

  // Current posting pattern
  currentPattern: {
    mostCommonDay: string;
    mostCommonHour: number;
    consistency: number; // 0-1 (how regular is posting)
  };

  // Recommendations
  recommendations: {
    shiftTo: { day: string; time: string };
    expectedImprovement: string; // "~18% higher engagement"
    reasoning: string;
  }[];
}

function analyzePostingTimes(reels: Reel[]): PostingTimeAnalysis {
  // Group reels by day-of-week + hour
  const timeSlots = new Map<string, { engagements: number[]; count: number }>();

  for (const reel of reels) {
    const date = new Date(reel.timestamp);
    const key = `${date.getDay()}-${date.getHours()}`;

    if (!timeSlots.has(key)) {
      timeSlots.set(key, { engagements: [], count: 0 });
    }

    const slot = timeSlots.get(key)!;
    slot.engagements.push(reel.engagement_rate);
    slot.count++;
  }

  // Sort by average engagement, filter by sample size
  const ranked = Array.from(timeSlots.entries())
    .map(([key, data]) => ({
      dayOfWeek: parseInt(key.split("-")[0]),
      hour: parseInt(key.split("-")[1]),
      avgEngagement: average(data.engagements),
      sampleSize: data.count,
      confidence: data.count >= 5 ? "high" : data.count >= 3 ? "medium" : "low",
    }))
    .filter(slot => slot.confidence !== "low")
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  return {
    optimalSlots: ranked.slice(0, 10),
    currentPattern: analyzeCurrentPattern(reels),
    recommendations: generateTimeRecommendations(ranked),
  };
}
```

## 21.4 Trend Detection System

```typescript
// Detect account-specific trends over time

interface TrendAnalysis {
  // Overall trajectory
  overallTrend: "growing" | "stable" | "declining";
  trendSlope: number; // Positive = growing

  // Dimension trends (from AI scoring)
  dimensionTrends: {
    dimension: string;
    trend: "improving" | "stable" | "declining";
    lastMonth: number;
    thisMonth: number;
    delta: number;
  }[];

  // Content format trends
  formatTrends: {
    format: string;   // "educational" | "trending" | "personal" | etc.
    trend: "gaining" | "losing";
    evidence: string;
  }[];

  // Alerts
  alerts: {
    type: "positive" | "warning";
    message: string;
    recommendation: string;
  }[];
}

// Example alerts:
// ⚠️ "Your engagement rate dropped 15% this week. Your last 3 Reels
//     had weak hooks (avg 5/10). Focus on stronger opening 1-2 seconds."
//
// ✅ "Your saves rate increased 40% since you started adding 'Save this'
//     CTAs. Keep using this in every Reel."
```

## 21.5 Competitor-Free Differentiation Logic

Unlike generic tools, Reel Logic AI differentiates by:

| Feature | Generic Tools | Reel Logic AI |
|---|---|---|
| Analysis depth | Surface metrics | **9-dimension AI scoring** per Reel |
| **Skip rate** | **Not surfaced anywhere** | **Native `reels_skip_rate` — % who scroll past in <3s** |
| Hook optimization | Guesswork | **Data-driven hook scoring** from real skip rate data |
| Strategy | Generic tips | Personalized from YOUR data |
| Timing | "Best times" lists | YOUR audience's best times |
| Trends | Platform trends | YOUR content trends |
| Scoring | Vanity metrics | Actionable composite score |
| Feedback | None | Specific improvement per dimension |
| Reposts tracking | Not available | **`public_reposts` — strongest engagement signal** |
| Cross-platform views | Not available | `total_views` across IG + FB crosspost |

> **🏆 THE MOAT:** Instagram's `reels_skip_rate` is available in the Graph API but **no major competitor (Sprout Social, Hootsuite, Later, Metricool) surfaces this metric** in their analytics dashboards. Reel Logic AI is the first platform to make skip rate a core part of content scoring and strategy generation. This creates a clear value proposition: "See exactly how many people scroll past your Reel in under 3 seconds — and get AI-powered fixes to stop the scroll."

---

# APPENDIX A — DIRECTORY STRUCTURE

```
reel-logic-ai/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  ← Dashboard shell (sidebar + topbar)
│   │   ├── page.tsx                    ← Dashboard home
│   │   ├── reels/
│   │   │   ├── page.tsx               ← Reels list
│   │   │   └── [id]/page.tsx          ← Reel detail + scoring
│   │   ├── strategy/
│   │   │   ├── page.tsx               ← Strategy view
│   │   │   └── [id]/page.tsx          ← Specific strategy
│   │   ├── analytics/page.tsx         ← Analytics dashboard
│   │   ├── accounts/page.tsx          ← Connected accounts
│   │   ├── billing/page.tsx           ← Subscription management
│   │   └── settings/page.tsx          ← User settings
│   ├── api/
│   │   ├── auth/
│   │   │   ├── instagram/route.ts
│   │   │   ├── instagram/callback/route.ts
│   │   │   └── me/route.ts
│   │   ├── accounts/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── reels/route.ts
│   │   │       ├── sync/route.ts
│   │   │       ├── strategy/route.ts
│   │   │       ├── analytics/route.ts
│   │   │       └── trends/route.ts
│   │   ├── reels/
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── score/route.ts
│   │   ├── strategies/
│   │   │   └── [id]/route.ts
│   │   ├── billing/
│   │   │   ├── subscription/route.ts
│   │   │   ├── checkout/route.ts
│   │   │   ├── portal/route.ts
│   │   │   └── usage/route.ts
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts
│   │   │   └── instagram/route.ts
│   │   └── health/
│   │       ├── route.ts
│   │       └── deep/route.ts
│   ├── layout.tsx                     ← Root layout
│   └── page.tsx                       ← Landing page
├── components/
│   ├── ui/                            ← shadcn/ui components
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   ├── metric-card.tsx
│   │   ├── score-gauge.tsx
│   │   ├── dimension-bar.tsx
│   │   ├── reel-card.tsx
│   │   ├── strategy-card.tsx
│   │   ├── trend-chart.tsx
│   │   ├── usage-meter.tsx
│   │   ├── empty-state.tsx
│   │   └── loading-skeleton.tsx
│   └── shared/
│       ├── error-boundary.tsx
│       └── account-switcher.tsx
├── hooks/
│   ├── use-reels.ts
│   ├── use-strategy.ts
│   ├── use-analytics.ts
│   ├── use-subscription.ts
│   └── use-accounts.ts
├── lib/
│   ├── api/
│   │   ├── response.ts               ← ApiResponse helpers
│   │   ├── middleware.ts              ← withAuth, withRateLimit
│   │   └── rate-limit.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── account.service.ts
│   │   ├── reel.service.ts
│   │   ├── scoring.service.ts
│   │   ├── strategy.service.ts
│   │   ├── billing.service.ts
│   │   ├── ingestion.service.ts
│   │   ├── analytics.service.ts
│   │   └── usage.service.ts
│   ├── ai/
│   │   ├── scoring-engine.ts
│   │   ├── strategy-generator.ts
│   │   ├── output-parser.ts
│   │   ├── fallback.ts
│   │   ├── cost-calculator.ts
│   │   └── prompts/
│   │       ├── scoring.ts
│   │       ├── strategy.ts
│   │       └── analysis.ts
│   ├── queue/
│   │   ├── job-orchestrator.ts
│   │   ├── worker.ts
│   │   ├── dead-letter.ts
│   │   └── types.ts
│   ├── billing/
│   │   ├── plans.ts
│   │   ├── usage-tracker.ts
│   │   └── stripe-helpers.ts
│   ├── ingestion/
│   │   ├── reel-fetcher.ts
│   │   └── data-normalizer.ts
│   ├── security/
│   │   ├── encryption.ts             ← AES-256-GCM
│   │   ├── token-manager.ts
│   │   └── webhook-verifier.ts
│   ├── telemetry/
│   │   ├── logger.ts
│   │   ├── metrics.ts
│   │   └── health.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── db/
│   │   ├── schema.ts                 ← Drizzle schema
│   │   ├── migrations/
│   │   └── seed.ts
│   └── validators/
│       ├── reel.schema.ts
│       ├── strategy.schema.ts
│       ├── account.schema.ts
│       └── billing.schema.ts
├── public/
│   └── ...
├── .env.example
├── .env.local
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

# APPENDIX B — EXECUTION CHECKLIST

Use this checklist to track progress through the SEABS pipeline:

```markdown
## SEABS Execution Progress

### Phase 1: PRD
- [ ] Product requirements documented
- [ ] User stories with acceptance criteria
- [ ] Pricing tiers defined
- [ ] API rate limits documented

### Phase 2: Architecture
- [ ] Tech stack locked (no substitutions)
- [ ] Directory structure defined
- [ ] Data flow diagrams complete
- [ ] Dependency manifest locked

### Phase 3: Database
- [ ] Drizzle schema complete
- [ ] Migrations generated
- [ ] RLS policies on every table
- [ ] Indexes on all FK + query patterns
- [ ] Seed data created

### Phase 4: Backend API
- [ ] All API routes implemented
- [ ] Zod validation on every endpoint
- [ ] Error handling on every endpoint
- [ ] Auth middleware applied
- [ ] Service layer complete
- [ ] Consistent response shapes

### Phase 5: Billing
- [ ] Stripe Checkout integration
- [ ] Webhook handler (all events)
- [ ] Plan limits enforcement
- [ ] Usage tracking
- [ ] Customer portal integration

### Phase 6: Instagram Ingestion
- [ ] OAuth2 flow complete
- [ ] Token encryption (AES-256-GCM)
- [ ] Token refresh automation
- [ ] Data sync pipeline
- [ ] Rate limit handling
- [ ] Webhook subscription

### Phase 7: Queue Engine
- [ ] SKIP LOCKED worker
- [ ] Idempotent job processing
- [ ] Dead letter queue
- [ ] Job timeout enforcement
- [ ] Graceful shutdown

### Phase 8: AI Engine
- [ ] Scoring engine (8 dimensions)
- [ ] Strategy generator
- [ ] Output parsing + validation
- [ ] Fallback system
- [ ] Budget check (per-call)
- [ ] Cost tracking

### Phase 9: Frontend
- [ ] Dashboard page
- [ ] Reels list + detail pages
- [ ] Strategy page + calendar
- [ ] Analytics page
- [ ] Billing page
- [ ] Settings page
- [ ] Mobile responsive
- [ ] Dark mode
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

### Phase 10: Observability
- [ ] Structured logging
- [ ] Sentry integration
- [ ] Health endpoints
- [ ] Alert rules configured
- [ ] Cost monitoring

### Phase 11: Deployment
- [ ] CI pipeline (GitHub Actions)
- [ ] Staging environment
- [ ] Production deployment
- [ ] Environment variables configured
- [ ] Smoke tests passing
- [ ] Rollback tested
```

---

# APPENDIX C — SYSTEM GUARANTEES

## What This System GUARANTEES:

```
✅ No silent failures — every error is logged and either auto-recovered or escalated
✅ No schema drift — database schema validated against code on every deployment
✅ No queue duplication — idempotency keys on every job
✅ No uncontrolled LLM cost explosion — per-user budget caps + circuit breaker
✅ No cross-system coupling — strict module boundaries enforced
✅ No unvalidated deployment — gates must pass before production deploy
✅ No unencrypted tokens — AES-256-GCM for all Instagram tokens at rest
✅ No webhook forgery — signature verification on every webhook endpoint
✅ No tenant data leaks — RLS on every user-facing table
✅ Bounded failure recovery — max 3 auto-repair attempts, then escalate
```

## What This System Does NOT Guarantee:

```
⚠️ Zero bugs — impossible guarantee; instead, bugs are detected + contained
⚠️ 100% uptime — instead, graceful degradation with fallback modes
⚠️ Perfect AI output — instead, validated + fallback on failure
⚠️ Zero latency — instead, performance budgets + caching strategy
```

## The Core Philosophy:

> **Bounded failure with recovery paths** > "Move fast and break things"
>
> This system does NOT trust AI output. It does NOT trust external APIs. It does NOT trust user input.
>
> It verifies everything, contains every failure, and escalates when it can't self-heal.

---

# FINAL COMMAND TO ALL AGENTS

```
IF uncertain about ANYTHING:

    → STOP
    → LOG the uncertainty
    → REQUEST CLARIFICATION
    → DO NOT GUESS
    → DO NOT HALLUCINATE
    → DO NOT PROCEED WITHOUT VALIDATION

This is not a suggestion. This is an execution rule.
```

---

*This document is the canonical source of truth for the Reel Logic AI build system. Any conflict between this document and implementation code should be resolved in favor of this document.*

*Version: 1.0 | Classification: Founder-Grade | Status: ACTIVE*
