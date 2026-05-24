# SEABS Phase Execution Playbook

## Trendoraa — Phase-by-Phase Development with Agent Prompts, Tests & Gates

> **Purpose:** This is the **execution playbook**. The spec tells you WHAT to build. This document tells you HOW to build it — phase by phase, with exact prompts to feed AI agents, tests to run after each phase, and gate criteria before moving forward.
>
> **Companion:** [trendoraa-seabs-spec.md](./trendoraa-seabs-spec.md) (canonical spec)
>
> **Rule:** No phase may begin until the previous phase passes ALL gate checks.
>
> **Skills:** This playbook references **installed agent skills** from your Customizations. Activate them before running each phase prompt.

---

## SKILL → PHASE MAP

These are your installed skills mapped to the phases where they add the most value. **Activate the listed skills before running the agent prompt** for that phase.

| Phase | Skills to Activate | Why |
|---|---|---|
| **0** Scaffold | `nextjs-best-practices`, `shadcn`, `tailwind-patterns`, `powershell-windows` | App Router setup, shadcn init, Tailwind v4 config, Windows-safe commands |
| **1** PRD & Arch | `ai-product`, `architect-review`, `concise-planning`, `documentation` | AI product principles, architecture review checklist, planning rigor |
| **2** Database | `database-design`, `database`, `database-optimizer`, `neon-postgres` | Schema design, indexing strategy, Supabase/Postgres patterns |
| **3** Auth & Backend | `nextjs-supabase-auth`, `api-patterns`, `backend-architect`, `senior-fullstack` | Supabase Auth + Next.js patterns, API design, service layer architecture |
| **4** Billing | `stripe-integration`, `payment-integration`, `api-patterns` | Stripe Checkout/Portal/Webhooks, idempotent payment handling |
| **5** Instagram | `secrets-management`, `gdpr-data-handling`, `security-auditor`, `constant-time-analysis` | AES-256-GCM encryption, GDPR token handling, webhook HMAC verification |
| **6** Queue | `database-optimizer`, `database`, `debugger` | SKIP LOCKED performance, index tuning, queue debugging |
| **7** AI Engine | `ai-product`, `ai-engineer`, `llm-evaluation`, `gemini-api-dev` | LLM wrapper patterns, output validation, cost tracking, fallback design |
| **8** Frontend | `frontend-design`, `react-patterns`, `shadcn`, `design-spells`, `react-component-performance`, `tailwind-patterns`, `mobile-design`, `wcag-audit-patterns`, `animejs-animation` | Premium UI, component patterns, micro-animations, accessibility, mobile-first |
| **9** Observability | `grafana-dashboards`, `analytics-tracking` | Dashboard monitoring, structured logging, alert rules |
| **10** Deploy | `vercel-deployment`, `github-actions-templates`, `github`, `deployment-pipeline-design` | Vercel config, CI/CD pipeline, secret scanning |
| **Cross-cutting** | `debugger`, `code-reviewer`, `security-auditor`, `tdd-workflow`, `webapp-testing`, `systematic-debugging` | Use after EVERY phase for validation passes |

---

## HOW TO USE THIS DOCUMENT

```
1. Start at Phase 0
2. Copy the AGENT PROMPT for the phase into your AI coding agent
3. Let the agent generate all output artifacts
4. Run every CHECK listed in the phase
5. If ALL checks pass → move to next phase
6. If ANY check fails → fix and re-run checks (max 3 attempts)
7. If still failing after 3 → STOP and troubleshoot manually
```

---

## PHASE INDEX

| Phase | Name | Agent Role | Estimated Time | State After |
|---|---|---|---|---|
| **0** | Project Scaffold | DevOps | 30 min | INIT |
| **1** | PRD & Architecture Lock | Product + Backend | 1 hr | ARCH_LOCKED |
| **2** | Database & Schema | Backend | 2 hr | DATABASE_READY |
| **3** | Auth & Core Backend | Backend | 4 hr | BACKEND_READY |
| **4** | Billing (Stripe) | Backend | 3 hr | BILLING_READY |
| **5** | Instagram Ingestion | Backend | 5 hr | INGESTION_READY |
| **6** | Queue Engine & Workers | Backend | 3 hr | QUEUE_READY |
| **7** | AI/LLM Engine | AI Engineer | 5 hr | AI_READY |
| **8** | Frontend | Frontend | 20 hr | FRONTEND_READY |
| **9** | Observability | DevOps | 3 hr | OBSERVABILITY_READY |
| **10** | Deployment & Launch | DevOps | 4 hr | DEPLOYED |

---

# PHASE 0 — PROJECT SCAFFOLD

## Goal

Create the Next.js project, install all dependencies, configure TypeScript, Tailwind, initialize a local Supabase development environment, write the Zod-based startup environment variable validator, and establish the directory structure defined in the spec.

## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `nextjs-best-practices` | App Router principles, server/client component boundaries, proper project structure |
| `shadcn` | Correct shadcn/ui initialization (new-york style, dark mode, component registry) |
| `tailwind-patterns` | Tailwind v4 CSS-first config, design token architecture |
| `powershell-windows` | Windows-safe shell commands (avoid Unix-only patterns like `cat`, `grep` — use PowerShell equivalents) |

> **How:** Read each skill's SKILL.md before running the agent prompt. The skills contain validation checks and sharp-edge warnings that prevent common mistakes.

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Choose your working directory** — Decide the parent folder where the project will live. Open a terminal in that directory.
2. **Verify Node.js version** — Run `node -v` and confirm Node.js 18+ is installed. If not, install it first.
3. **Verify npm version** — Run `npm -v` and confirm npm 9+ is installed.
4. **Install Docker Desktop** — Supabase local dev requires Docker. Run `docker info` to confirm Docker is running. If Docker is not installed or not running, install/start it first.
5. **Install Supabase CLI** — Run `npx supabase --version` to confirm the CLI is available, or install it globally with `npm install -g supabase`.
6. **Install Stripe CLI** (optional but recommended for Phase 4) — Download from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli). Verify with `stripe --version`.
7. **Read the skill SKILL.md files** — Open and read the SKILL.md for each skill listed in the "Activate Skills" table above (`nextjs-best-practices`, `shadcn`, `tailwind-patterns`, `powershell-windows`).
8. **Prepare `.env.local` values** — You don't need real API keys yet, but prepare placeholder values for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc. so the env validator can parse on first boot.
9. **Confirm Git is initialized** — Run `git --version`. After scaffold, you'll want to make your first commit.

## Agent Prompt

```
You are a senior DevOps engineer setting up a new Next.js project called "trendoraa".

TASK: Initialize the project with this exact stack:
- Next.js 14+ (App Router) with TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui (install CLI + init with "new-york" style, dark mode)
- Drizzle ORM + drizzle-kit
- Zod (validation)
- @supabase/supabase-js + @supabase/ssr
- stripe
- openai (official SDK)
- resend
- framer-motion (animations)
- recharts (charts)
- lucide-react (icons)
- date-fns (date utilities)

SUPABASE LOCAL DEV ENVIRONMENT SETUP:
- Initialize local Supabase by calling "npx supabase init"
- Configure the local Supabase configuration file (supabase/config.toml)
- Set local environment variables (SUPABASE_DB_URL, DATABASE_URL, DIRECT_URL) pointing to local postgres (typically port 54322) in a local .env.local file

ENVIRONMENT VARIABLE VALIDATION SENTINEL (lib/env.ts):
- Create a file "lib/env.ts" that defines a Zod schema containing all critical env vars:
  - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_DB_URL, DATABASE_URL (for migrations)
  - INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_REDIRECT_URI
  - TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI
  - OPENAI_API_KEY
  - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_CREATOR, STRIPE_PRICE_PRO, STRIPE_PRICE_AGENCY
  - RESEND_API_KEY
  - TOKEN_ENCRYPTION_KEYS (JSON string mapping key versions to hex keys, e.g. '{"v2":"...", "v1":"..."}')
  - ACTIVE_KEY_VERSION (string prefix indicating active encryption version, default "v1")
- Write an assertion execution at the bottom of "lib/env.ts" that triggers schema.parse(process.env) and throws a descriptive error detailing exactly which variables are missing or invalid if validation fails.
- Import this "lib/env.ts" validation module at the entry point of the application (e.g. inside "app/layout.tsx" or "next.config.ts" wrapper) to ensure the application immediately crashes on boot if critical secrets are omitted.

DIRECTORY STRUCTURE — create ALL these directories (empty index.ts files where needed):

app/
├── (auth)/login/
├── (auth)/signup/
├── (auth)/callback/
├── (dashboard)/
│   ├── posts/[id]/
│   ├── strategy/[id]/
│   ├── analytics/
│   ├── accounts/
│   ├── billing/
│   └── settings/
├── api/auth/social/[platform]/callback/
├── api/auth/me/
├── api/accounts/[id]/posts/
├── api/accounts/[id]/sync/
├── api/accounts/[id]/strategy/
├── api/accounts/[id]/analytics/
├── api/accounts/[id]/trends/
├── api/posts/[id]/score/
├── api/strategies/[id]/
├── api/billing/subscription/
├── api/billing/checkout/
├── api/billing/portal/
├── api/billing/usage/
├── api/webhooks/stripe/
├── api/webhooks/instagram/
├── api/webhooks/tiktok/
├── api/health/deep/
components/ui/
components/dashboard/
components/shared/
hooks/
lib/api/
lib/services/
lib/ai/prompts/
lib/queue/
lib/billing/
lib/ingestion/
lib/security/
lib/telemetry/
lib/supabase/
lib/db/migrations/
lib/validators/

CONFIG FILES:
- tsconfig.json with strict: true, paths: {"@/*": ["./*"]}
- .env.example with ALL env vars from the spec (no real values, plus descriptions)
- drizzle.config.ts pointing to lib/db/schema.ts
- next.config.ts with proper config
- .gitignore (include .env.local, node_modules, .next, .supabase)

RULES:
- TypeScript strict mode — no "any" types
- Do NOT install Redis, Kafka, RabbitMQ, Bull, or any queue package
- Do NOT install Express — we use Next.js API routes
- Do NOT install Mongoose or MongoDB packages
- Create a .env.example with every env var documented with comments

After scaffolding, the project must compile with "npx tsc --noEmit" with zero errors.
```

## Output Artifacts

| File | Description |
|---|---|
| `package.json` | All dependencies listed |
| `tsconfig.json` | Strict TypeScript config |
| `.env.example` | All env vars documented |
| `drizzle.config.ts` | Drizzle ORM config |
| `next.config.ts` | Next.js config |
| `lib/env.ts` | Zod environment validation sentinel |
| `supabase/config.toml` | Supabase local configuration |
| All directories | Empty structure ready for code |

## Checks & Tests

```bash
# CHECK 1: Project compiles
npx tsc --noEmit
# Expected: 0 errors

# CHECK 2: Dev server starts
npm run dev
# Expected: Server starts on localhost:3000 without errors

# CHECK 3: No forbidden dependencies
npm ls redis ioredis kafkajs amqplib bull bullmq mongoose express 2>&1
# Expected: All return "empty" or "not found"

# CHECK 4: All directories exist
# Manually verify the directory structure matches spec Appendix A

# CHECK 5: Env vars documented
cat .env.example
# Expected: Contains SUPABASE_*, INSTAGRAM_*, OPENAI_*, STRIPE_*, RESEND_*, TOKEN_ENCRYPTION_KEYS, ACTIVE_KEY_VERSION

# CHECK 6: Local Supabase environment starts
npx supabase start
# Expected: Local Docker-based Supabase stack boots up cleanly

# CHECK 7: Env validation sentinel validation works
npx tsx lib/env.ts
# Expected: Successfully parses without throwing errors if required env vars are present, or crashes with explicit schema validation logs if missing.
```

## Gate Criteria

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run dev` → server starts
- [ ] Zero forbidden dependencies
- [ ] `.env.example` has all required vars
- [ ] Directory structure matches spec
- [ ] Local Supabase stack runs (`npx supabase status` -> green)
- [ ] `lib/env.ts` successfully compiles and operates as startup validation sentinel

---

# PHASE 1 — PRD & ARCHITECTURE LOCK

## Goal

Validate the product requirements are locked and create the architecture decision record. This phase is documentation-only — no code changes.

## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `ai-product` | AI product principles: LLM output validation, cost-as-feature, fallback design, prompt versioning. Ensures the PRD reflects real AI engineering constraints, not demo-ware. |
| `architect-review` | Architecture review checklist: module boundaries, failure modes, scalability concerns |
| `concise-planning` | Clear, atomic, actionable checklist format for user stories |
| `documentation` | Documentation quality standards — README structure, technical writing |

> **Key `ai-product` rules to embed in PRD:**
> - "LLMs are probabilistic, not deterministic — design for variance"
> - "Prompts are code — version them, test them, A/B test them"
> - "Cost is a feature — measure cost per query, use smaller models where possible"
> - "Every LLM output must be validated against a Zod schema"

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Confirm Phase 0 gate passed** — All Phase 0 gate criteria checkboxes must be checked. Run `npx tsc --noEmit` one more time to confirm zero errors.
2. **Read the SEABS spec** — Open [trendoraa-seabs-spec.md](./trendoraa-seabs-spec.md) and read sections §1.2 (Problems), §1.4 (Target Users), §1.6 (Pricing Tiers), §2.1 (Architecture), §2.2 (Tech Stack), §6.6 (API Deprecations), §11 (Security), §12.1 (Cost Estimates), §18 (Module Boundaries). These are directly referenced in the agent prompt.
3. **Create the `docs/` directory** — Run `mkdir docs` if it doesn't already exist (it should from Phase 0 scaffold).
4. **Read the skill SKILL.md files** — Open and read the SKILL.md for `ai-product`, `architect-review`, `concise-planning`, `documentation`.
5. **No code changes expected** — This phase is documentation-only. Confirm you understand that no source code files will be modified.

## Agent Prompt

```
You are a senior product manager and architect reviewing the Trendoraa spec.

TASK: Create two documents:

1. FILE: docs/prd.md
   Content: A validated Product Requirements Document that includes:
   - Problem statement (3 problems from spec §1.2)
   - Target users with willingness to pay (spec §1.4)
   - Feature matrix per pricing tier (Free/Creator/Pro/Agency from spec §1.6)
   - User stories with acceptance criteria for MVP (minimum 15 stories)
   - Non-functional requirements (performance, security, availability)
   - Instagram and TikTok API constraints and rate limits (200 calls/hr/user for Instagram, 10 calls/min/user limit with 24-hr token expiry and 5-min sync cooldown for TikTok)
   - API deprecation notices (plays→views, skip_rate/reels_skip_rate from spec §6.6)

   RULES for user stories:
   - Format: "As a [user], I want to [action] so that [outcome]"
   - Every story MUST have at least 2 acceptance criteria
   - No ambiguous words: "should", "maybe", "might", "could" are BANNED
   - Every story must be testable

2. FILE: docs/architecture-decision-record.md
   Content:
   - Technology stack table (from spec §2.2) with rationale per choice
   - Architecture diagram (text-based from spec §2.1)
   - HARD CONSTRAINTS section: no Redis, no Kafka, no microservices, PostgreSQL-only queue
   - Module boundary map (Billing ↔ AI ↔ Queue isolation rules from spec §18 RULE 3)
   - Cost estimate per 1K users (from spec §12.1)
   - External API dependency list with fallback strategy for each
   - Security requirements summary (from spec §11)

Do NOT write any code. These are documentation files only.
```

## Output Artifacts

| File | Description |
|---|---|
| `docs/prd.md` | Validated PRD with user stories |
| `docs/architecture-decision-record.md` | Architecture decisions locked |

## Checks & Tests

```
# CHECK 1: PRD completeness
- Count user stories: must be ≥ 15
- Every story has ≥ 2 acceptance criteria
- No banned words ("should", "maybe", "might", "could")
- Pricing tiers match spec §1.6 exactly
- Instagram API constraints documented

# CHECK 2: ADR completeness
- Tech stack matches spec §2.2 exactly
- No forbidden tech mentioned positively
- Module boundary rules documented
- Cost estimates included
- Every external API has a fallback listed
```

## Gate Criteria

- [ ] PRD has ≥15 user stories with acceptance criteria
- [ ] Zero ambiguous language in requirements
- [ ] ADR tech stack matches spec exactly
- [ ] Module boundaries documented
- [ ] Cost estimates documented

---

# PHASE 2 — DATABASE & SCHEMA

## Goal

Create the complete Drizzle ORM schema, SQL migrations generated via drizzle-kit (preventing database-schema divergence), RLS policies, RLS integration test script, indexes, triggers, and seed data. After this phase, the database is fully operational with all tables, security policies, and test data.

## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `database-design` | Schema design principles, indexing strategy, ORM selection patterns, serverless database best practices |
| `database` | Database development workflow — SQL, migrations, optimization, data engineering |
| `database-optimizer` | Index tuning, query plan analysis, partial index patterns for queue tables |
| `neon-postgres` | Serverless Postgres patterns applicable to Supabase — connection pooling, branching strategy |

> **Key `database-design` checks to apply:**
> - Every FK has an index
> - Partial indexes on `job_queue(status, scheduled_at) WHERE status = 'pending'`
> - UNIQUE constraint on `posts(platform, platform_media_id)` for upsert deduplication
> - `updated_at` trigger on every table — not optional

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Confirm Phase 1 gate passed** — PRD has ≥15 user stories, ADR tech stack matches spec, module boundaries documented.
2. **Verify local Supabase is running** — Run `npx supabase status`. All services (db, auth, storage, etc.) must show as running. If not, run `npx supabase start` and wait for it to boot.
3. **Confirm database connection** — Verify you can connect to the local Supabase Postgres instance. Run: `psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1;"` (or use the Supabase Studio UI at http://localhost:54323).
4. **Read the SEABS spec §4** — Open the spec and read the entire §4 (Database Schema) section including §4.1 (Tables) and §4.2 (Indexes, RLS, Triggers). The agent prompt references these directly.
5. **Read the skill SKILL.md files** — Open and read the SKILL.md for `database-design`, `database`, `database-optimizer`, `neon-postgres`.
6. **Verify Drizzle is installed** — Run `npx drizzle-kit --version` to confirm drizzle-kit is available. If not, it should have been installed in Phase 0.
7. **Backup any existing data** — If you have data from previous attempts in the local DB, export it or reset with `npx supabase db reset`.

## Agent Prompt

```
You are a senior database engineer building the database layer for Trendoraa.

CONTEXT: Read the complete database schema from the SEABS spec §4. You are using:
- Supabase (PostgreSQL 15+)
- Drizzle ORM (TypeScript schema definition)
- Row Level Security (RLS) on EVERY table

TASK: Create the following files and follow this migration workflow:

MIGRATION WORKFLOW:
- Use Drizzle ORM definitions in "lib/db/schema.ts" as the sole source of truth.
- Generate migrations using "npx drizzle-kit generate" to produce SQL scripts inside "lib/db/migrations/".
- Run migrations against the local development database using "npx drizzle-kit migrate" or an in-app migration runner.
- DO NOT write custom SQL migrations from scratch for tables; let Drizzle Kit generate them to prevent database-schema divergence.

1. FILE: lib/db/schema.ts
   The complete Drizzle schema with ALL tables from spec §4.1:
   - users (id, email, full_name, avatar_url, created_at, updated_at)
   - social_accounts (id, user_id FK, platform TEXT [enum: 'instagram' | 'tiktok'], platform_user_id TEXT, username TEXT, access_token_enc BYTEA, refresh_token_enc BYTEA, token_expires_at TIMESTAMPTZ, token_version INT [default 1, for OCC], followers_count INT, last_synced_at TIMESTAMPTZ, sync_status TEXT, created_at, updated_at)
   - posts (id, account_id FK, platform TEXT, platform_media_id TEXT, caption TEXT, media_url TEXT, permalink TEXT, timestamp TIMESTAMPTZ, views_count INT, total_views INT, display_views INT, metric_source TEXT [enum: 'legacy_plays' | 'unified_views'], likes_count INT, comments_count INT, shares_count INT, saves_count INT, public_reposts INT, skip_rate NUMERIC, completion_rate NUMERIC, reach INT, engagement_rate NUMERIC, fetched_at TIMESTAMPTZ, created_at, updated_at)
   - post_scores (id, post_id FK, overall_score NUMERIC, hook_score NUMERIC, skip_rate_score NUMERIC, completion_rate_score NUMERIC, retention_score NUMERIC, cta_score NUMERIC, visual_score NUMERIC, audio_score NUMERIC, trend_score NUMERIC, caption_score NUMERIC, timing_score NUMERIC, ai_analysis JSONB, model_version TEXT, tokens_used INT, cost_usd NUMERIC, scored_at TIMESTAMPTZ, created_at, updated_at)
   - strategies (id, user_id FK, account_id FK, strategy_type TEXT, content JSONB, period_start, period_end, model_version, tokens_used, cost_usd, generated_at, created_at, updated_at)
   - subscriptions (id, user_id FK, plan_id, stripe_sub_id, stripe_customer_id, status, current_period_start, current_period_end, cancel_at, created_at, updated_at)
   - plans (id TEXT PK, name, price_monthly, max_accounts, monthly_ai_limit, ai_tier, features JSONB)
   - job_queue (id, job_type, payload JSONB, status, priority, max_retries, retry_count, locked_at, locked_by, last_heartbeat_at TIMESTAMPTZ, scheduled_at, completed_at, failed_at, error_message, dead_letter BOOLEAN, idempotency_key, created_at)
   - usage_tracking (id, user_id FK, period_month TEXT, ai_calls_count, ai_tokens_used, ai_cost_usd NUMERIC, posts_analyzed, strategies_gen, api_calls_count, updated_at)
   - audit_log (id, user_id FK, action, resource_type, resource_id, metadata JSONB, ip_address, created_at)
   - processed_events (id, event_id UNIQUE, processed_at, created_at, updated_at)

   RULES:
   - Every table: id UUID DEFAULT gen_random_uuid(), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   - Every FK referencing `users(id)` MUST use `ON DELETE CASCADE` (for subscriptions, social_accounts, strategies, usage_tracking) to prevent GDPR orphaned data, except `audit_log.user_id` which must use `ON DELETE SET NULL` to retain immutable compliance audit trails anonymously.
   - Use pgTable from drizzle-orm/pg-core
   - Export all tables and types
   - Add Drizzle relations (one-to-many, many-to-one)
   - Engagement rate calculations must handle display_views = 0 case by returning NULL.

2. FILE: lib/db/migrations/0001_initial_schema.sql (or generated sql file)
   The generated SQL migration that creates all tables, triggers, indexes, and RLS policies.
   Must include:
   - The update_updated_at() trigger function (from spec §4.2)
   - Apply trigger to EVERY table
   - ALL indexes from spec §4.2 (FK indexes, query pattern indexes, unique indexes)
     - Must include index on `job_queue(last_heartbeat_at) WHERE status = 'processing'` (`idx_job_queue_heartbeat`)
     - Must include index on `audit_log(created_at)` (`idx_audit_log_created_at`)
     - Must include unique index on `posts(platform, platform_media_id)` (`idx_posts_platform_media`)
     - Must include unique index on `social_accounts(platform, platform_user_id)` (`idx_social_accounts_platform_user`)
   - RLS enabled on EVERY table (from spec §4.2, including processed_events)
   - RLS policies using auth.uid() for user-facing tables
   - Seed data for the plans table (profitable cross-platform tiers):
     INSERT INTO plans VALUES
     ('free', 'Free', 0, 1, 10, 'gpt-4o-mini', '{"trendDetection":false,"contentCalendar":false}'),
     ('creator', 'Creator', 39, 2, 50, 'gpt-4o-mini', '{"trendDetection":false,"contentCalendar":true}'),
     ('pro', 'Pro', 89, 5, 200, 'gpt-4o', '{"trendDetection":true,"contentCalendar":true}'),
     ('agency', 'Agency', 249, 20, 1000, 'gpt-4o', '{"trendDetection":true,"contentCalendar":true,"teamAccess":true,"whiteLabel":true,"priorityAi":true}');

3. FILE: lib/db/seed.ts
   A TypeScript seed script that inserts test data:
   - 2 test users
   - 1 social account per user (e.g. 1 Instagram Business, 1 TikTok Creator)
   - 5 posts per account with realistic metrics (views, skip_rate / completion_rate, engagement)
   - 1 subscription per user (one free, one creator)
   - Usage tracking records

4. FILE: lib/db/index.ts
   Database client setup using Drizzle + Supabase connection.

5. FILE: scripts/test-rls.ts
   An automated database Row Level Security integration test script that:
   - Sets up two distinct Supabase client instances representing separate test users (using JWTs or local mocked auth contexts).
   - Simulates queries to read, update, and delete records owned by the other user.
   - Asserts that all cross-tenant database reads/writes are blocked and throw explicit security or RLS policy errors.
   - Verifies that a service-role client can successfully bypass RLS.

SECURITY RULES:
- access_token_enc column is BYTEA (encrypted at application level, not DB level)
- RLS on every table — no exceptions
- service_role key usage only in server-side code
- No raw SQL in application code — always use Drizzle ORM
```

## Output Artifacts

| File | Description |
|---|---|
| `lib/db/schema.ts` | Complete Drizzle ORM schema |
| `lib/db/migrations/` | Generated SQL migrations |
| `lib/db/seed.ts` | Test data seeder |
| `lib/db/index.ts` | Database client |
| `scripts/test-rls.ts` | RLS cross-tenant isolation testing script |

## Checks & Tests

```bash
# CHECK 1: Schema compiles
npx tsc --noEmit
# Expected: 0 errors

# CHECK 2: Drizzle generates migration successfully
npx drizzle-kit generate
# Expected: Migration file generated inside lib/db/migrations/ without errors

# CHECK 3: Migration runs against Supabase
npx drizzle-kit migrate
# Expected: All tables created successfully in local Supabase instance

# CHECK 4: RLS verification — run these SQL queries in Supabase SQL Editor:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Every table from our schema must appear

SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- EVERY row must show rowsecurity = true

SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
-- Every table must have at least one policy

# CHECK 5: Index verification
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
-- Must include all indexes from spec §4.2

# CHECK 6: Seed runs
npx tsx lib/db/seed.ts
# Expected: Seed data inserted without constraint violations

# CHECK 7: No forbidden column names
# Verify: no column called "plays_count" or "impressions" exists
# All view metrics use "views_count" and "total_views"
# skip_rate and completion_rate columns exist on posts table
# public_reposts column exists on posts table
# skip_rate_score and completion_rate_score exist on post_scores table

# CHECK 8: RLS Integration Isolation Tests
npx tsx scripts/test-rls.ts
# Expected: Runs successfully, asserting that cross-tenant read/update/delete requests are blocked and service role is unblocked
```

## Gate Criteria

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] Migration runs successfully against Supabase (using generate and migrate workflow)
- [ ] RLS enabled on ALL tables (verified via SQL query)
- [ ] Every table has at least one RLS policy
- [ ] Pre-commit lint/hook validates all new SQL migrations contains corresponding `ALTER TABLE ENABLE ROW LEVEL SECURITY` statements
- [ ] All indexes created (FK indexes + query indexes + unique indexes)
- [ ] `updated_at` trigger on every table
- [ ] Plans table seeded with 4 tiers
- [ ] Seed script runs without errors
- [ ] No deprecated column names (no `plays_count` or `impressions` without normalization)
- [ ] `token_version` column exists on `social_accounts` for OCC
- [ ] `display_views` and `metric_source` columns exist on `posts` with conditional safe engagement rate calculation
- [ ] `last_heartbeat_at` exists on `job_queue` for liveness detection
- [ ] `skip_rate`, `completion_rate`, and `public_reposts` columns exist on posts table
- [ ] RLS verification script (`scripts/test-rls.ts`) executes and passes all security assertions

---

# PHASE 3 — AUTH & CORE BACKEND

## Goal

Build the authentication system, API middleware, response helpers, rate limiting, and core service layer architecture. After this phase, users can sign up, log in, and hit authenticated API endpoints that return consistent response shapes.

## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `nextjs-supabase-auth` | **PRIMARY SKILL.** Exact patterns for Supabase client setup (browser/server/admin), middleware session refresh, OAuth callback, `getUser()` over `getSession()` for security. Follow this skill's patterns verbatim. |
| `api-patterns` | API design principles — REST response contracts, error code registry, versioning, pagination |
| `backend-architect` | Service layer architecture, module boundaries, thin route handlers |
| `senior-fullstack` | Full stack toolkit — TypeScript strict patterns, Zod validation |

> **Critical `nextjs-supabase-auth` rules:**
> - ❌ NEVER use `getSession()` for auth checks — it doesn't verify the JWT
> - ✅ ALWAYS use `getUser()` for security-critical checks
> - ✅ Use `createServerClient` from `@supabase/ssr` with cookie handling
> - ✅ Add `revalidatePath('/', 'layout')` after auth state changes
> - ✅ Middleware must refresh session on every request

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Confirm Phase 2 gate passed** — All database tables created, RLS enabled on every table, seeds run, `scripts/test-rls.ts` passes, `npx tsc --noEmit` is clean.
2. **Verify local Supabase is still running** — Run `npx supabase status` and confirm all services are green.
3. **Verify database has seed data** — Connect to the local DB and run `SELECT count(*) FROM plans;` — expected: 4 rows (free, creator, pro, agency).
4. **Read the SEABS spec §5** — Open the spec and read §5.1 (Response Contract), §5.4 (Error Codes), §11.7 (GDPR Data Export), §12.4 (Free-Tier Abuse Safeguards), §14.7 (Public Bundle Separation).
5. **Read the skill SKILL.md files** — Open and read the SKILL.md for `nextjs-supabase-auth`, `api-patterns`, `backend-architect`, `senior-fullstack`. Pay special attention to the `nextjs-supabase-auth` skill — it has critical rules about `getUser()` vs `getSession()`.
6. **Confirm `.env.local` has Supabase keys** — Run `npx supabase status` and copy the `anon key`, `service_role key`, and `API URL` into your `.env.local` file as `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_URL`.
7. **Start the dev server** — Run `npm run dev` in a separate terminal to confirm the app boots without errors before making changes.

## Agent Prompt

```
You are a senior backend engineer building the auth and core API layer for Trendoraa.

CONTEXT:
- Using Supabase Auth (GoTrue) for authentication
- Using Next.js 14+ App Router API routes
- All API responses must use the universal response contract from spec §5.1
- Every endpoint must have Zod input validation
- Every endpoint must have error handling
- Business logic lives in the service layer, NOT in route handlers

TASK: Create the following files:

1. FILE: lib/supabase/client.ts
   Browser-side Supabase client using createBrowserClient from @supabase/ssr.

2. FILE: lib/supabase/server.ts
   Server-side Supabase client using createServerClient from @supabase/ssr with cookie handling for Next.js App Router.

3. FILE: lib/supabase/admin.ts
   Admin Supabase client using service_role key. Add comment: "NEVER import this in client-side code."

4. FILE: lib/api/response.ts
   Helper functions implementing the universal response contract from spec §5.1:
   - apiSuccess<T>(data: T, meta?: PageMeta): NextResponse
   - apiError(code: keyof typeof ERROR_CODES, message?: string, details?: unknown): NextResponse
   - Export ERROR_CODES object from spec §5.4

5. FILE: lib/api/middleware.ts
   - withAuth(handler): HOC that extracts user from Supabase session, returns 401 if not authenticated
   - withRateLimit(handler, config?): HOC that rate-limits per user using in-memory store (upgrade to DB-backed later)
   - withValidation(schema, handler): HOC that validates request body against Zod schema

6. FILE: middleware.ts (Next.js root middleware)
   - Refresh Supabase session on every request
   - Protect /dashboard/* routes (redirect to /login if not authenticated)
   - Allow /api/webhooks/* without auth (signature-verified separately)
   - Allow /api/health without auth

7. FILE: app/api/auth/me/route.ts
   - GET: Return current user profile
   - PATCH: Update user profile (full_name, avatar_url)
   - DELETE: Delete user account and all associated data (GDPR compliance)

8. FILE: app/api/auth/me/data-export/route.ts
   - GET: Compile and return all historical user data in a structured machine-readable JSON format conforming strictly to spec §11.7. Credentials and access tokens MUST be completely omitted for security.

9. FILE: app/api/health/route.ts
   - GET: Return { status: "healthy", timestamp, version }

10. FREE-TIER ABUSE SAFEGUARDS:
    - In signup and connection flows, enforce the abuse prevention gating rules from spec §12.4:
      - Block social account linking/AI features for free-tier users if the email is not verified (`email_confirmed_at` is null).
      - Enforce a strict one-to-one constraint on Platform User ID (`platform_user_id`) linking per platform (fail with `ACCOUNT_ALREADY_LINKED` if linked elsewhere).
      - Enforce in-memory or DB-backed IP-level signup rate limits (max 3 per IP per day).
      - Cap free tier ingestion at a maximum of 10 posts.

11. PUBLIC BUNDLE SEPARATION BOUNDARY:
    - Enforce the separation from spec §14.7. Public pages (landing, docs, pricing) must not import Supabase clients, database connections, or schema definitions. All shared layouts must shake out heavy dashboard dependencies.
    - Programmatically enforce this boundary via a custom ESLint `no-restricted-imports` rule in `eslint.config.mjs` (or `.eslintrc.json`) applied to all routes within `app/(public)/**/*` that rejects imports of `@/lib/db`, `@/lib/supabase`, or `@/lib/security/encryption`.

12. FILE: lib/services/auth.service.ts
    Service layer for auth operations:
    - getCurrentUser(supabase): Get user from session
    - updateProfile(userId, data): Update user profile
    - deleteAccount(userId): Cascade delete all user data (accounts, posts, scores, strategies, subscriptions, usage, audit logs)

13. FILE: lib/validators/common.ts
    Common Zod schemas:
    - uuidSchema
    - paginationSchema (page, limit, sort, order)
    - dateRangeSchema (from, to)

API RESPONSE CONTRACT (spec §5.1):
Success: { success: true, data: T, meta?: { page, limit, total } }
Error: { success: false, error: { code: string, message: string, details?: unknown } }

RULES:
- ZERO use of "any" type
- Every route handler is thin — validate input, call service, return response
- Error responses use ERROR_CODES from spec §5.4
- service_role key is NEVER used in client-side code
- Log every auth failure in audit_log table
```

## Output Artifacts

| File | Description |
|---|---|
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client |
| `lib/supabase/admin.ts` | Admin client (service_role) |
| `lib/api/response.ts` | Response helpers + error codes |
| `lib/api/middleware.ts` | withAuth, withRateLimit, withValidation |
| `middleware.ts` | Next.js root middleware |
| `app/api/auth/me/route.ts` | User profile CRUD |
| `app/api/auth/me/data-export/route.ts` | GDPR User data export JSON API |
| `app/api/health/route.ts` | Health check endpoint |
| `lib/services/auth.service.ts` | Auth service layer |
| `lib/validators/common.ts` | Common Zod schemas |

## Checks & Tests

```bash
# CHECK 1: Compiles
npx tsc --noEmit
# Expected: 0 errors

# CHECK 2: Health endpoint works
curl http://localhost:3000/api/health
# Expected: { "success": true, "data": { "status": "healthy", ... } }

# CHECK 3: Auth me returns 401 without session
curl http://localhost:3000/api/auth/me
# Expected: { "success": false, "error": { "code": "UNAUTHORIZED", ... } }

# CHECK 4: Response shapes
# Verify every API response matches the contract:
# - success: true/false
# - data or error (never both)
# - error has code + message

# CHECK 5: No "any" types
npx grep -r ": any" lib/ app/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".d.ts"
# Expected: 0 results (or only in type-safe wrappers with justification comments)

# CHECK 6: Error codes match spec
# Verify ERROR_CODES object contains all codes from spec §5.4

# CHECK 7: Middleware protects dashboard
curl http://localhost:3000/dashboard
# Expected: redirect to /login (302)

# CHECK 8: Webhooks are NOT auth-protected
curl -X POST http://localhost:3000/api/webhooks/stripe -d '{}'
# Expected: NOT 401 (should be 400 for missing signature, not unauthorized)

# CHECK 9: Row-Level Security checks pass
npx tsx scripts/test-rls.ts
# Expected: All RLS verification tests execute and pass successfully.

# CHECK 10: GDPR Data Export returns 401 without session
curl http://localhost:3000/api/auth/me/data-export
# Expected: { "success": false, "error": { "code": "UNAUTHORIZED", ... } }

# CHECK 11: Free tier email verification requirement check
# Attempt to link an account with an unverified email.
# Expected: Request is blocked, returning a clear error schema.
```

## Gate Criteria

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `/api/health` returns success response shape
- [ ] `/api/auth/me` returns 401 without auth
- [ ] `/api/auth/me/data-export` endpoint returns machine-readable data export, excluding tokens/credentials
- [ ] Free tier email verification blocks and uniqueness constraints in place
- [ ] Public static routes isolated from Supabase client / heavy dependencies
- [ ] Dashboard routes redirect to login without auth
- [ ] Webhook routes don't require auth
- [ ] All response shapes match spec §5.1 contract
- [ ] Zero `any` types in new code
- [ ] ERROR_CODES matches spec §5.4
- [ ] Row-Level Security isolation tests pass (`scripts/test-rls.ts`)

---

# PHASE 4 — BILLING (STRIPE)

## Goal

Complete Stripe integration with checkout, customer portal, webhook handling, plan enforcement, and usage tracking. After this phase, users can subscribe, upgrade, downgrade, and cancel — and plan limits are enforced on every API call.

## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `stripe-integration` | Stripe payment integration — Express Checkout, webhook handling, recurring billing, refund workflows |
| `payment-integration` | Payment integration patterns — idempotency, replay prevention, webhook signature verification |
| `api-patterns` | REST API design for billing endpoints |

> **Key `stripe-integration` patterns:**
> - Raw body for signature verification (not parsed JSON)
> - Idempotent event processing (store processed event IDs)
> - Return 200 even on internal errors (prevent Stripe retries)
> - Separate webhook handler per event type for maintainability

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Confirm Phase 3 gate passed** — Auth middleware works, `/api/health` returns success, `/api/auth/me` returns 401 without session, all response shapes match spec, zero `any` types, RLS tests pass.
2. **Create a Stripe account** — Go to [dashboard.stripe.com](https://dashboard.stripe.com) and create a free account if you don't have one. Stay in **test mode**.
3. **Get Stripe test keys** — From the Stripe Dashboard → Developers → API keys, copy your `sk_test_...` (Secret Key) and `pk_test_...` (Publishable Key).
4. **Create Stripe Products and Prices** — In the Stripe Dashboard (test mode), create 3 products with recurring monthly prices:
   - Creator: $39/month → copy the `price_...` ID → set as `STRIPE_PRICE_CREATOR` in `.env.local`
   - Pro: $89/month → copy the `price_...` ID → set as `STRIPE_PRICE_PRO` in `.env.local`
   - Agency: $249/month → copy the `price_...` ID → set as `STRIPE_PRICE_AGENCY` in `.env.local`
5. **Set Stripe env vars in `.env.local`** — Add `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET` (will be set after step 6), and the 3 `STRIPE_PRICE_*` vars.
6. **Install and configure Stripe CLI** — Run `stripe login` to authenticate. Then run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` to get the webhook signing secret (`whsec_...`). Set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.
7. **Read the SEABS spec §8** — Open the spec and read §8.2 (Webhook Events), §8.3 (Plan Limits), §8.4 (Usage Tracking), §8.5 (Webhook Security).
8. **Read the skill SKILL.md files** — Open and read the SKILL.md for `stripe-integration`, `payment-integration`, `api-patterns`.
9. **Keep Stripe CLI listener running** — Leave `stripe listen --forward-to localhost:3000/api/webhooks/stripe` running in a separate terminal throughout this phase.

## Agent Prompt

```
You are a senior backend engineer building the Stripe billing integration for Trendoraa.

CONTEXT:
- Stripe Subscriptions with Checkout Sessions
- 4 plans: Free ($0), Creator ($39), Pro ($89), Agency ($249)
- Webhook-driven state management (spec §8.2)
- Usage tracking per billing period (spec §8.4)
- Plan limits enforced at API layer (spec §8.3)
- Billing module NEVER touches AI or Queue modules (spec §18 RULE 3)

PREREQUISITE: Phase 2 (database) and Phase 3 (auth + middleware) complete.

TASK: Create these files:

1. FILE: lib/billing/plans.ts
   - Export PLAN_LIMITS object from spec §8.3 (all 4 plans with maxAccounts, maxPostsAnalyzed, monthlyAiLimit, maxStrategies, aiModel, features, budgetCap)
   - Export type PlanId = "free" | "creator" | "pro" | "agency"
   - Export function getPlanLimits(planId: PlanId): PlanLimits

2. FILE: lib/billing/usage-tracker.ts
   - getCurrentPeriodUsage(userId: string): Promise<UsageRecord>
   - incrementUsage(userId: string, field: UsageField, amount?: number): Promise<void>
   - checkUsageLimit(userId: string, operation: "post_analysis" | "strategy_generation" | "ai_call"): Promise<{ allowed: boolean, remaining: number, limit: number }>
   - resetUsageForPeriod(userId: string, periodMonth: string): Promise<void>

3. FILE: lib/billing/stripe-helpers.ts
   - createCheckoutSession(userId: string, planId: PlanId, returnUrl: string): Promise<string> (returns checkout URL)
   - createPortalSession(userId: string, returnUrl: string): Promise<string> (returns portal URL)
   - getStripeCustomerId(userId: string): Promise<string> (create or retrieve)

4. FILE: lib/services/billing.service.ts
   - getSubscription(userId: string): Promise<Subscription>
   - handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void>
   - handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void>
   - handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void>
   - handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void>

5. FILE: app/api/webhooks/stripe/route.ts
   Webhook handler that:
   - Verifies Stripe signature using stripe.webhooks.constructEvent()
   - Handles ALL events from spec §8.2: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed
   - Processes events idempotently using a single atomic SQL statement to prevent race conditions and double-processing:
     `INSERT INTO processed_events (event_id, processed_at) VALUES ($1, now()) ON CONFLICT DO NOTHING RETURNING id;`
     Ensure execution occurs only if a row is successfully returned from this atomic insert.
   - Returns 200 even on processing errors (to prevent Stripe retries)
   - Logs failures to audit_log for manual investigation

5a. FILE: app/api/webhooks/stripe/retry/route.ts
    Manual retry admin endpoint:
    - POST: Only accessible to administrators (role = "admin") to re-play failed events manually. Clears the event from `processed_events` to reset idempotency, retrieves the event payload from Stripe, re-processes it via `processStripeEvent`, and re-marks it as processed.

6. FILE: app/api/billing/checkout/route.ts
   - POST: Create Stripe Checkout session, return URL

7. FILE: app/api/billing/portal/route.ts
   - POST: Create Stripe Customer Portal session, return URL

8. FILE: app/api/billing/subscription/route.ts
   - GET: Return current subscription details + plan limits

9. FILE: app/api/billing/usage/route.ts
   - GET: Return current period usage (calls made, remaining, limits)

WEBHOOK SECURITY (from spec §8.5):
- ALWAYS verify stripe.webhooks.constructEvent() before processing
- Use raw body (not parsed JSON) for signature verification
- Enforce strict idempotency: Use a single atomic SQL statement (`INSERT INTO processed_events ... ON CONFLICT DO NOTHING RETURNING id`) to guard against concurrency and replay attacks. Proceed with handling ONLY when a row is returned.
- Return 200 even on internal errors

ISOLATION RULE:
- Billing service must NOT import from lib/ai/*, lib/queue/*, or lib/ingestion/*
- Billing service CAN import from lib/db/* and lib/services/auth.service.ts
```

## Output Artifacts

| File | Description |
|---|---|
| `lib/billing/plans.ts` | Plan definitions + limits |
| `lib/billing/usage-tracker.ts` | Usage metering |
| `lib/billing/stripe-helpers.ts` | Stripe API wrappers |
| `lib/services/billing.service.ts` | Billing business logic |
| `app/api/webhooks/stripe/route.ts` | Stripe webhook handler |
| `app/api/billing/*/route.ts` | 4 billing API routes |

## Checks & Tests

```bash
# CHECK 1: Compiles
npx tsc --noEmit
# Expected: 0 errors

# CHECK 2: No forbidden imports in billing
grep -r "from.*lib/ai" lib/billing/ lib/services/billing.service.ts
grep -r "from.*lib/queue" lib/billing/ lib/services/billing.service.ts
grep -r "from.*lib/ingestion" lib/billing/ lib/services/billing.service.ts
# Expected: 0 results for all three

# CHECK 3: Webhook signature verification exists
grep -r "webhooks.constructEvent" app/api/webhooks/stripe/
# Expected: At least 1 match

# CHECK 4: All Stripe events handled
grep -r "checkout.session.completed\|customer.subscription.updated\|customer.subscription.deleted\|invoice.payment_succeeded\|invoice.payment_failed" app/api/webhooks/stripe/
# Expected: All 5 events handled

# CHECK 5: Idempotency check exists
grep -r "ON CONFLICT DO NOTHING" app/api/webhooks/stripe/
# Expected: Single atomic SQL statement used for checking/preventing replay

# CHECK 6: Plan limits match spec
# Manually verify PLAN_LIMITS matches spec §8.3 exactly:
# Free: Max 1 account (IG or TikTok), 0 AI analyses, 0 strategies, $0.00 LLM cap
# Creator: Max 2 accounts, 50 AI analyses, 4 strategies, $8.00 LLM cap
# Pro: Max 6 accounts, 200 AI analyses, 12 strategies, $25.00 LLM cap
# Agency: Max 20 accounts (up to 10 clients), 800 AI analyses, 40 strategies, $75.00 LLM cap

# CHECK 7: Usage check function exists and works
# Verify checkUsageLimit returns { allowed, remaining, limit }

# CHECK 8: Billing endpoints return correct shapes
curl http://localhost:3000/api/billing/subscription  # (with auth)
curl http://localhost:3000/api/billing/usage          # (with auth)
# Expected: Both return success response with data

# CHECK 9: Stripe webhook local forwarding check
# Verify that Stripe CLI can forward events locally:
# stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Expected: Stripe CLI successfully connects and prints "Ready! You are using Stripe API Version..."
```

## Gate Criteria

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] Billing module has ZERO imports from ai/queue/ingestion
- [ ] Stripe webhook verifies signatures
- [ ] All 5 Stripe events handled
- [ ] Idempotent event processing enforced via a single atomic SQL statement (`ON CONFLICT DO NOTHING RETURNING id`)
- [ ] Plan limits match spec exactly
- [ ] Usage tracking increments and checks work
- [ ] All 4 billing API routes return correct shapes
- [ ] Stripe secret key validation sentinel: `STRIPE_SECRET_KEY` starts with `sk_live_` when `NODE_ENV === "production"` (checked on startup in `lib/env.ts`)

---

# PHASE 5 — SOCIAL INGESTION PIPELINE (INSTAGRAM MVP ONLY)

## Goal

Build the Instagram social data ingestion pipeline for the MVP rollout: OAuth2 authorization flows for Instagram, long-lived token lifecycle management with AES-256-GCM encryption, database data sync, rate limit handling, and webhook subscriptions. (All TikTok-specific files, handlers, and endpoints are deferred to the Post-MVP Growth Stage in Phase 11).


## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `secrets-management` | Secure secrets management — environment variable handling, encryption key rotation, token storage best practices |
| `gdpr-data-handling` | GDPR-compliant data processing — consent management, data deletion on account disconnect, token purge |
| `security-auditor` | Security audit checklist — OAuth2 flow review, token encryption verification, webhook signature validation |
| `constant-time-analysis` | Detect timing-side-channel leaks — ensures HMAC webhook verification uses `timingSafeEqual`, not `===` |

> **Key security rules enforced by skills:**
> - `secrets-management`: TOKEN_ENCRYPTION_KEY must be 32 bytes, sourced from env, never hardcoded
> - `constant-time-analysis`: Webhook HMAC comparison must use `crypto.timingSafeEqual()` — string `===` leaks timing info
> - `gdpr-data-handling`: On account disconnect, encrypted tokens MUST be purged (not just soft-deleted)
> - `security-auditor`: Audit log entry for every OAuth flow completion and token refresh

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Confirm Phase 4 gate passed** — Billing module compiles, has zero imports from ai/queue/ingestion, Stripe webhook verifies signatures, all 5 events handled, idempotent processing works, plan limits match spec, all billing API routes return correct shapes.
2. **Create developer applications on both platforms**:
   - **Meta Developer Portal**: Go to [developers.facebook.com](https://developers.facebook.com) → My Apps → Create App. Add the "Instagram" product and configure Instagram Business Login.
   - **TikTok Developer Portal**: Go to [developers.tiktok.com](https://developers.tiktok.com) → My Apps → Create App. Add the "TikTok Display API" product.
3. **Configure Redirect URIs**:
   - Meta App → Instagram → Basic Display: Add `http://localhost:3000/api/auth/social/instagram/callback`
   - TikTok App → Display API → Redirect URI: Add `http://localhost:3000/api/auth/social/tiktok/callback`
4. **Configure Sandbox/Test Users**:
   - Set up Meta Test Users in Roles → Test Users with linked Instagram Business Accounts.
   - Set up TikTok Sandbox accounts under TikTok App Dashboard → Sandbox.
5. **Set Environment Variables in `.env.local`**:
   - `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET`
   - `INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/social/instagram/callback`
   - `INSTAGRAM_VERIFY_TOKEN` (random secret string for Meta webhooks verification)
   - `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`
   - `TIKTOK_REDIRECT_URI=http://localhost:3000/api/auth/social/tiktok/callback`
6. **Generate encryption keys** — Create a 32-byte hex key for token encryption. Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Set it as `TOKEN_ENCRYPTION_KEYS={"v1":"<your-hex-key>"}` and `ACTIVE_KEY_VERSION=v1` in `.env.local`.
7. **Install ngrok or localtunnel** (for webhook testing) — Run `npx ngrok http 3000` or `npx localtunnel --port 3000` to get a public HTTPS URL. You'll need this to configure the Instagram Webhook callback URL in the Meta Dashboard.
8. **Read the SEABS spec §6** — Open the spec and read the entire §6 section including §6.2 (Token Management), §6.3 (Data Fetching), §6.4 (Rate Limiting), §6.5 (Engagement Calculations), §6.6 (API Deprecations), and §6.8 (TikTok Display API Integration & Rate Limits).
9. **Read the skill SKILL.md files** — Open and read the SKILL.md for `secrets-management`, `gdpr-data-handling`, `security-auditor`, `constant-time-analysis`.

## Agent Prompt

```
You are a senior backend engineer building the social data ingestion pipeline for Trendoraa's Instagram MVP.

CONTEXT:
- Instagram Graph API v22.0+ (spec §6)
- Unified cross-platform database schema: social_accounts, posts, post_scores (spec §4) (The database schema retains the standardized cross-platform structures so that no migrations are needed later, but only Instagram accounts and posts are ingested in the MVP).
- CRITICAL (Instagram): plays and impressions are DEPRECATED. Use "views" and "total_views" (spec §6.6)
- NEW metrics (Instagram): reels_skip_rate, public_reposts (spec §6.6)
- OAuth2 with access token encryption (AES-256-GCM) at rest
- Instagram long-lived tokens (60 days) with token refresh at day 53.
- 5-minute manual sync cooldown lock stored on social_accounts.last_synced_at to prevent rapid API requests.
- Rate limits: check headers, implement exponential backoff on HTTP 429.
- Note: TikTok Display API v2 integrations, 24-hr token rotation pipelines, sequential ingestion queue routines, and TikTok metrics are explicitly DEFERRED to the Post-MVP phase (Phase 11).

PREREQUISITE: Phases 0-3 complete (project, database, auth).

TASK: Create these files:

1. FILE: lib/security/encryption.ts
   AES-256-GCM token encryption from spec §11.2:
   - encryptToken(plaintext: string): string — returns key-versioned hex outputs: `keyVersion:iv:authTag:ciphertext` where `keyVersion` matches the active key.
   - decryptToken(encryptedString: string): string — decrypts back to plaintext using the version prefix parsed from the ciphertext to dynamically map to the appropriate key in `TOKEN_ENCRYPTION_KEYS` for zero-downtime key rotation.
   - Sourced from environment: parses `TOKEN_ENCRYPTION_KEYS` JSON map and `ACTIVE_KEY_VERSION`
   - Unique random IV per encryption operation
   - NEVER log decrypted tokens

2. FILE: lib/services/token-manager.ts
   Token lifecycle management from spec §6.2:
   - shouldRefresh(account: SocialAccount): boolean:
     - For Instagram: true if token expires within 7 days.
   - refreshToken(account: SocialAccount): Promise<string> — exchanges for a new token (Meta API). Must use pessimistic transaction-level database locking (pg_try_advisory_xact_lock or row locking) on the token record during refresh to prevent concurrent workers from initiating redundant token invalidations.
   - Enforce Optimistic Concurrency Control (OCC) during token updates using `token_version` column to prevent overlapping cron and manual updates.
   - handleInvalidToken(account: SocialAccount): Promise<void> — mark account as disconnected, notify user
   - Refresh constraint: token must be >=24 hours old (Instagram) to refresh.

3. FILE: lib/ingestion/post-fetcher.ts
   Instagram API data fetcher from spec §6.3:
   - fetchInstagramPosts(accessToken, platformUserId, limit?): Promise<RawInstagramPost[]>
   - Rate limit handling: check headers, exponential backoff on HTTP 429 (1min -> 2min -> 4min -> 8min -> 15min max).

4. FILE: lib/ingestion/data-normalizer.ts
   Transform raw Instagram API data to the normalized `posts` database structure:
   - normalizeInstagramPost(rawPost, rawInsights): Partial<Post>
   - calculateEngagementRate from spec §6.5 (using views_count, NOT plays_count). Handles display_views = 0 case by returning NULL.
   - calculateWeightedEngagement (includes public_reposts)
   - Handle Nullable metrics: explicitly map missing or undefined skip_rate (Instagram) to null to prevent database schema errors, allowing fallback default mapping during scoring.

5. FILE: lib/services/ingestion.service.ts
   Main ingestion orchestrator:
   - syncAccount(userId, accountId): Promise<SyncResult> — full sync flow
   - Enforce 5-minute manual sync cooldown by checking `social_accounts.last_synced_at` and throwing `SYNC_COOLDOWN_ACTIVE` if called within 5 minutes.
   - Deduplicate by unique constraint `(platform, platform_media_id)` (upsert)
   - Queue AI scoring jobs for new/updated posts
   - Update last_synced_at on account
   - Track API calls in usage_tracking

6. FILE: app/api/auth/social/[platform]/route.ts
   - POST: Generate OAuth URL and redirect for platform ("instagram"). (TikTok redirects return PLATFORM_NOT_SUPPORTED).
   - Instagram Scopes: instagram_business_basic, instagram_manage_insights, pages_show_list, pages_read_engagement

7. FILE: app/api/auth/social/[platform]/callback/route.ts
   - GET: Handle OAuth callback for platform ("instagram").
   - Exchange code for tokens (Meta OAuth exchange).
   - Validate Account Type: Call Graph API `/me/accounts?fields=instagram_business_account,name`. If missing, abort registration and return `INSTAGRAM_NOT_BUSINESS_ACCOUNT`.
   - Encrypt token with AES-256-GCM before storage.
   - Create or update social_accounts record using OCC.
   - Queue initial sync job.

8. FILE: app/api/webhooks/instagram/route.ts
   - GET: Hub verification (hub.mode, hub.verify_token, hub.challenge) using the `INSTAGRAM_VERIFY_TOKEN` env var.
   - POST: Webhook event handling with signature verification (HMAC-SHA256 using App Secret). Executes batch-splitting on the Meta webhook payload, immediately enqueuing individual `PROCESS_WEBHOOK` jobs to the queue, returning HTTP 200 OK within 3 seconds. For each job, derive a deterministic idempotency key to prevent duplicate processing via `ON CONFLICT (idempotency_key) DO NOTHING`.

9. FILE: app/api/accounts/route.ts
   - GET: List user's connected social accounts
   - POST: Connect new account (redirects to Instagram OAuth)

10. FILE: app/api/accounts/[id]/route.ts
    - GET: Single social account details
    - DELETE: Disconnect account (delete encrypted tokens, keep historical data, cascade deletes cleanly per GDPR)

11. FILE: app/api/accounts/[id]/sync/route.ts
    - POST: Trigger manual sync (enforcing the 5-minute cooldown)

12. FILE: lib/validators/account.schema.ts
    Zod schemas for social account management.

RATE LIMITING:
- Instagram: 200 calls per hour per user.
- Exponential backoff on HTTP 429: 1min → 2min → 4min → 8min → 15min (max).

SECURITY:
- Token encryption: AES-256-GCM, unique IV per operation.
- Webhook verification: HMAC-SHA256, constant-time comparison (crypto.timingSafeEqual).
- Never log access tokens (encrypted or decrypted) or expose tokens in API responses.
```


## Output Artifacts

| File | Description |
|---|---|
| `lib/security/encryption.ts` | AES-256-GCM encrypt/decrypt |
| `lib/services/token-manager.ts` | Token lifecycle (Instagram 60-day, TikTok daily refresh) |
| `lib/ingestion/post-fetcher.ts` | Instagram Graph API & TikTok Display API fetcher |
| `lib/ingestion/data-normalizer.ts` | Data normalization |
| `lib/services/ingestion.service.ts` | Sync orchestrator (with 5min manual sync cooldown lock) |
| `app/api/auth/social/[platform]/route.ts` | OAuth initiation |
| `app/api/auth/social/[platform]/callback/route.ts` | OAuth callback |
| `app/api/webhooks/instagram/route.ts` | IG webhook handler |
| `app/api/webhooks/tiktok/route.ts` | TikTok webhook handler |
| `app/api/accounts/**` | Account CRUD and manually triggered sync routes |
| `lib/validators/account.schema.ts` | Account validation schema |

## Checks & Tests

```bash
# CHECK 1: Compiles
npx tsc --noEmit
# Expected: 0 errors

# CHECK 2: Encryption round-trip & Rotation
# Write a test: encrypt("test-token") → outputs "keyVersion:iv:authTag:ciphertext" format → decrypt(encrypted) === "test-token"
# Verify rotation: encrypt with active key, rotate active key, decrypt historical token successfully using old key mapped in TOKEN_ENCRYPTION_KEYS.

# CHECK 3: No deprecated metric names in fetcher
grep -r "plays\b" lib/ingestion/post-fetcher.ts
grep -r "impressions" lib/ingestion/post-fetcher.ts
# Expected: 0 results (or only in legacy fallback comments)

# CHECK 4: New metrics present in fetcher
grep -r "views\|skip_rate\|public_reposts\|completion_rate\|total_views" lib/ingestion/post-fetcher.ts
# Expected: All 5 present

# CHECK 5: Webhook signature verification
grep -r "timingSafeEqual\|createHmac" app/api/webhooks/ lib/security/
# Expected: At least 1 match for constant-time comparison in webhook handlers

# CHECK 6: Token never logged
grep -r "console.log.*token\|console.log.*access_token" lib/ app/
# Expected: 0 results

# CHECK 7: Engagement uses views_count (not plays_count)
grep -r "views_count" lib/ingestion/data-normalizer.ts
# Expected: At least 1 match
grep -r "plays_count" lib/ingestion/data-normalizer.ts
# Expected: 0 results (or only in legacy migration comment)

# CHECK 8: OAuth scopes correct
grep -r "instagram_business_basic" app/api/auth/social/
grep -r "video.list" app/api/auth/social/
# Expected: All scopes present

# CHECK 9: Webhook Local Tunneling configuration
# Verify local webhook endpoints can receive payloads locally:
# ngrok http 3000
# Expected: Command runs, provides a public HTTPS URL which can be set as the Webhook callback URL in developer dashboards.

# CHECK 10: Optimistic Concurrency & Pessimistic Locks
grep -r "token_version\|pg_try_advisory_xact_lock" lib/services/token-manager.ts
# Expected: OCC update check and pessimistic locking implemented for token refreshes

# CHECK 11: Webhook Batch Splitting & Response Time Limit
grep -r "PROCESS_WEBHOOK" app/api/webhooks/
# Expected: Payload batch is split and immediately enqueued, returning 200 OK within 3s

# CHECK 12: Manual Sync 5-minute Cooldown Lock
# Trigger two sync requests sequentially within 5 seconds.
# Expected: Second request fails immediately returning SYNC_COOLDOWN_ACTIVE.
```

## Gate Criteria

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] Encryption round-trip works with key-version prefix (`keyVersion:iv:authTag:ciphertext`) and supports multi-key rotation
- [ ] No deprecated metrics in API calls (`plays`, `impressions`)
- [ ] New metrics present (`views`, `skip_rate`, `completion_rate`, `public_reposts`, `total_views`)
- [ ] Webhook uses constant-time comparison for signatures on both Instagram and TikTok webhooks
- [ ] Tokens never logged
- [ ] Engagement rate uses `views_count` not `plays_count`
- [ ] OAuth scopes use `instagram_business_basic` for Instagram and `video.list` / `user.info.basic` / `user.info.stats` for TikTok
- [ ] Rate limit handling with exponential backoff implemented on both platforms
- [ ] TikTok 10 calls/minute sequential queue polling worker implemented
- [ ] 5-minute manual sync cooldown lock enforced on sync routes
- [ ] Optimistic Concurrency Control (`token_version`) and pessimistic locking (`pg_try_advisory_xact_lock` or row locking) verified for token refreshes
- [ ] Webhooks immediately split batches and enqueue individual jobs, returning HTTP 200 OK under 3 seconds
- [ ] Developer Sandbox checklists locked: Developer warnings for Meta and TikTok Sandbox / Test Accounts noted prior to App Review approval.
- [ ] Webhook routing verified to handle `ngrok`/`localtunnel` dynamic hosts for local verification.

---

# PHASE 6 — QUEUE ENGINE & WORKERS

## Goal

Build the PostgreSQL-based job queue using SKIP LOCKED, worker system, dead letter queue, and idempotency enforcement. After this phase, background jobs can be queued, processed, retried, and dead-lettered.

## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `database-optimizer` | Index tuning for queue performance — partial indexes on `status = 'pending'`, `locked_at` expiry checks |
| `database` | PostgreSQL SKIP LOCKED patterns, transaction safety, advisory locks |
| `debugger` | Queue debugging — stale lock detection, dead letter investigation, job timeout diagnostics |

> **Key `database-optimizer` patterns for queue:**
> - Partial index: `CREATE INDEX idx_job_queue_pending ON job_queue(status, scheduled_at) WHERE status = 'pending'` — dramatically speeds up job claim queries
> - `locked_at` timeout: stale lock detection at 5-minute threshold prevents zombie jobs
> - `SKIP LOCKED` ensures zero contention between concurrent workers

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Confirm Phase 5 gate passed** — Encryption round-trip works, no deprecated metrics, webhook uses constant-time comparison, tokens never logged, OAuth scopes correct, OCC and pessimistic locking verified.
2. **Verify local Supabase is still running** — Run `npx supabase status`. All services must be green.
3. **Confirm `job_queue` table exists** — Connect to the local DB and run `SELECT count(*) FROM job_queue;` — expected: 0 rows (table exists but is empty).
4. **Verify `last_heartbeat_at` column exists** — Run `SELECT column_name FROM information_schema.columns WHERE table_name = 'job_queue' AND column_name = 'last_heartbeat_at';` — expected: 1 row.
5. **Read the SEABS spec §9** — Open the spec and read the entire §9 section (Queue Engine) including §9.2 (SKIP LOCKED), §9.3 (Worker), §9.4 (Idempotency Keys, IQueueEngine interface).
6. **Read the skill SKILL.md files** — Open and read the SKILL.md for `database-optimizer`, `database`, `debugger`.
7. **Set `CRON_SECRET` in `.env.local`** — Generate a random secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Add it as `CRON_SECRET` in `.env.local`. This secures the cron and queue processing endpoints.
8. **Confirm no forbidden queue packages** — Run `npm ls redis ioredis bull bullmq amqplib kafkajs 2>&1` — all must return empty/not found.

## Agent Prompt

```
You are a senior backend engineer building a PostgreSQL-based job queue for Trendoraa.

CONTEXT:
- NO Redis, NO Kafka, NO Bull/BullMQ — PostgreSQL only (spec §2.2 HARD CONSTRAINT)
- Uses SELECT ... FOR UPDATE SKIP LOCKED for concurrent-safe job claiming (spec §9.2)
- Job types: SYNC_ACCOUNT, SCORE_POST, GENERATE_STRATEGY, REFRESH_TOKEN, SEND_EMAIL, PROCESS_WEBHOOK
- Idempotency keys prevent duplicate processing (spec §9.4)
- Dead letter queue for jobs that exceed max retries (spec §9.3)
- Exponential backoff on retries: 1s, 2s, 4s... max 5 minutes

PREREQUISITE: Phases 0-2 complete.

TASK: Create these files:

1. FILE: lib/queue/types.ts
   Type definitions & Migration Seam:
   - JobType enum: SYNC_ACCOUNT, SCORE_POST, GENERATE_STRATEGY, REFRESH_TOKEN, SEND_EMAIL, PROCESS_WEBHOOK
   - JobStatus: "pending" | "processing" | "completed" | "failed" | "dead_letter"
   - Job interface matching job_queue table schema
   - JobHandler type: (payload: Record<string, unknown>) => Promise<void>
   - EnqueueParams interface
   - Define `IQueueEngine` interface from spec §9.4:
     ```typescript
     export interface QueueJob<T = any> {
       id: string;
       type: string;
       payload: T;
       priority: number;
     }
     export interface IQueueEngine {
       enqueue<T = any>(
         type: string,
         payload: T,
         options?: { priority?: number; delayMs?: number; idempotencyKey?: string }
       ): Promise<string | null>;
       cancel(jobId: string): Promise<boolean>;
       getMetrics(): Promise<{ pending: number; processing: number; failed: number }>;
     }
     ```
     All background processing client invocations must strictly leverage this interface to permit seamless upgrades to BullMQ/SQS.

2. FILE: lib/queue/job-orchestrator.ts
   Job producer from spec §9.4:
   - enqueueJob(params: EnqueueParams): Promise<string | null>
     - Check idempotency_key for duplicates before inserting
     - Return null if duplicate found (no-op)
     - Return job ID if enqueued
   - enqueueWithDelay(params, delayMs): schedule job in the future
   - cancelJob(jobId): mark job as cancelled
   - getQueueDepth(): number of pending jobs
   - getDeadLetterCount(): number of dead-lettered jobs

3. FILE: lib/queue/worker.ts
   Serverless Job consumer from spec §9.3:
   - Replace traditional infinite loop daemon with a serverless-friendly time-bounded batch runner function:
     `processQueueBatch(maxRuntimeMs?: number): Promise<{ processed: number, succeeded: number, failed: number }>`
   - Processes jobs concurrently using a concurrency-capped promise pool (e.g., custom concurrent queue pool matching hardware limits).
   - Cleans up and exits gracefully before the specified time limit (e.g. max 15 seconds) to avoid serverless function timeouts.
   - During job processing, spawn a background heartbeat timer that updates the job's `last_heartbeat_at` timestamp every 30 seconds to signal liveness.
   - Job claim SQL: SELECT ... FOR UPDATE SKIP LOCKED with zombie-recovery claiming (from spec §9.2)
   - Process with handler based on job_type
   - On success: mark completed
   - On failure: if retry_count < max_retries → retry with exponential backoff
   - If max retries exceeded → move to dead letter
   - Job timeout: 120 seconds max per job execution
   - Worker ID: worker-serverless-{random_uuid}

4. FILE: app/api/queue/process/route.ts
   A secure POST handler triggered by crons or external triggers:
   - Verifies `Authorization: Bearer CRON_SECRET` request headers.
   - Triggers `processQueueBatch(15000)` (up to 15 seconds runtime limit) and returns execution summary.

5. FILE: app/api/cron/token-refresh/route.ts
   A secure GET route running daily to enqueue token refreshes:
   - Verifies `Authorization: Bearer CRON_SECRET` headers.
   - Queries `social_accounts` for records expiring within 7 days, and enqueues `REFRESH_TOKEN` jobs.

6. FILE: app/api/cron/ingest/route.ts
   A secure GET route running hourly to enqueue data ingestion:
   - Verifies `Authorization: Bearer CRON_SECRET` headers.
   - Enqueues `SYNC_ACCOUNT` jobs for all active connected social accounts (both Instagram and TikTok).

7. FILE: lib/queue/dead-letter.ts
   Dead letter queue management:
   - getDeadLetterJobs(limit?: number): list dead-lettered jobs
   - retryDeadLetterJob(jobId): move back to pending
   - purgeDeadLetterJobs(olderThanDays?: number): cleanup old dead letters

8. FILE: lib/queue/handlers.ts
   Job handler registry (skeleton — actual implementations come in later phases):
   - registerHandler(jobType, handler): register a handler
   - getHandler(jobType): get handler for type
   - Skeleton handlers that log "Handler not implemented yet" for each type

CONCURRENCY SAFETY:
The job claim query MUST be exactly:
```sql
WITH next_job AS (
    SELECT id
    FROM job_queue
    WHERE (status = 'pending' AND scheduled_at <= now())
       OR (status = 'processing' AND locked_at < now() - interval '5 minutes')
       OR (status = 'processing' AND last_heartbeat_at < now() - interval '90 seconds')
    ORDER BY priority DESC, scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
)
UPDATE job_queue
SET 
    status = 'processing', 
    locked_at = now(), 
    locked_by = $1,  -- worker_id
    last_heartbeat_at = now()
FROM next_job
WHERE job_queue.id = next_job.id
RETURNING job_queue.*;
```

IDEMPOTENCY KEYS (from spec §9.4):
- SYNC_ACCOUNT_SCHEDULED: sync:scheduled:{accountId}:{dateHour}
- SYNC_ACCOUNT_MANUAL: sync:manual:{accountId}:{timestamp_ms} (minimum 5-minute application-level throttle window)
- SCORE_POST: score:{postId}:{version}
- GENERATE_STRATEGY: strategy:{accountId}:{periodKey}
```

## Output Artifacts

| File | Description |
|---|---|
| `lib/queue/types.ts` | Queue type definitions |
| `lib/queue/job-orchestrator.ts` | Job producer + idempotency |
| `lib/queue/worker.ts` | Serverless-bounded SKIP LOCKED worker |
| `app/api/queue/process/route.ts` | Secure queue execution API |
| `app/api/cron/token-refresh/route.ts` | Secure daily token refresh trigger |
| `app/api/cron/ingest/route.ts` | Secure hourly sync scheduler |
| `lib/queue/dead-letter.ts` | DLQ management |
| `lib/queue/handlers.ts` | Handler registry |

## Checks & Tests

```bash
# CHECK 1: Compiles
npx tsc --noEmit
# Expected: 0 errors

# CHECK 2: No forbidden queue packages
npm ls redis ioredis bull bullmq amqplib kafkajs 2>&1
# Expected: All empty/not found

# CHECK 3: SKIP LOCKED present in worker
grep -r "SKIP LOCKED" lib/queue/
# Expected: At least 1 match

# CHECK 4: Idempotency check present
grep -r "idempotency_key\|idempoten" lib/queue/job-orchestrator.ts
# Expected: At least 1 match

# CHECK 5: Dead letter handling
grep -r "dead_letter" lib/queue/worker.ts
# Expected: At least 1 match

# CHECK 6: Serverless time-bounded checking
grep -r "maxRuntimeMs\|performance\.now\|Date\.now" lib/queue/worker.ts
# Expected: Worker checks runtime to terminate execution loop before timeout

# CHECK 7: Secure Cron & Queue endpoints verify CRON_SECRET
grep -r "CRON_SECRET\|Authorization" app/api/queue/process/ app/api/cron/
# Expected: At least 1 verification check in each API route

# CHECK 8: Single-batch claim round-trip test
# Write a script that enqueues a test job, runs processQueueBatch(5000), and completes it

# CHECK 9: Zombie Claiming & Heartbeat Verification
grep -r "last_heartbeat_at" lib/queue/
# Expected: Column updated every 30s during worker execution and checked during skip-locked claim query

# CHECK 10: IQueueEngine Interface Adherence
grep -r "interface IQueueEngine" lib/queue/types.ts
# Expected: Defined and used by other modules to access the queue (enforces migration seam)
```

## Gate Criteria

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] Zero Redis/Kafka/Bull dependencies
- [ ] SKIP LOCKED with zombie-recovery claiming (>90s heartbeats staleness) used for job claiming
- [ ] Idempotency keys prevent duplicate jobs
- [ ] Dead letter queue for exhausted retries
- [ ] Time-bounded serverless batch processing loop implemented (exits before serverless execution timeout)
- [ ] Worker spawns background heartbeat update (every 30s) during job execution
- [ ] Secure route authorization in place checking `CRON_SECRET` for all cron and queue processing API endpoints
- [ ] Job timeout enforcement (120s)
- [ ] Clean `IQueueEngine` adapter interface implemented as a drop-in replacement boundary seam

---

# PHASE 7 — AI/LLM ENGINE

## Goal

Build the AI scoring engine, strategy generator, prompt templates, output parsing, fallback system, and cost tracking. After this phase, posts (Instagram Reels and TikTok Videos) can be scored across 9 dimensions and personalized strategies can be generated.

## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `ai-product` | **PRIMARY SKILL.** Structured output with Zod validation, circuit breaker for LLM failures, cost tracking per request, prompt versioning. Every pattern in this skill applies directly. |
| `ai-engineer` | Production-ready LLM applications — advanced prompt engineering, multi-model routing, token budget management |
| `llm-evaluation` | LLM output quality evaluation — scoring rubrics, automated metrics, A/B testing prompts |
| `gemini-api-dev` | Alternative LLM provider patterns — useful if adding Gemini as a fallback model alongside OpenAI |

> **Critical `ai-product` patterns to enforce:**
> 1. **Structured output with validation** — Every LLM response parsed as JSON → validated with Zod schema → fallback if invalid
> 2. **Circuit breaker** — After 5 LLM failures, stop calling for 60 seconds → use deterministic fallback
> 3. **Cost tracking per request** — Log `userId`, `model`, `inputTokens`, `outputTokens`, `cost`, `timestamp`
> 4. **Prompt versioning** — Prompts stored in `lib/ai/prompts/` with version numbers, not inline strings
> 5. **Budget check before every call** — Never call LLM without checking if user can afford it
> 6. **Temperature 0.3** — Low temperature for consistent scoring (not creative generation)
> 7. **Timeout 30s** — LLM call timeout, then fallback
>
> **`llm-evaluation` checks to add:**
> - Define test cases for scoring prompt (known good/bad posts → expected score ranges)
> - Define test cases for strategy prompt (known account data → expected strategy shape)
> - Track scoring consistency: same post scored 3x should produce scores within ±10 range

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Confirm Phase 6 gate passed** — SKIP LOCKED with zombie-recovery works, idempotency keys prevent duplicates, dead letter queue functional, serverless batch processing loop implemented, `IQueueEngine` interface defined.
2. **Get an OpenAI API key** — Go to [platform.openai.com](https://platform.openai.com) → API Keys → Create new secret key. Copy the `sk-...` key.
3. **Add billing to OpenAI** — Ensure your OpenAI account has a payment method and sufficient credits. The prompt evaluation test script will make real API calls.
4. **Set OpenAI env vars in `.env.local`** — Add `OPENAI_API_KEY=sk-...` to your `.env.local` file.
5. **Verify queue handler skeleton exists** — Confirm `lib/queue/handlers.ts` exists and has skeleton handler registrations from Phase 6.
6. **Read the SEABS spec §7** — Open the spec and read the entire §7 section (AI/LLM Engine) including §7.2 (Scoring Dimensions — all 9 including skip_rate and completion_rate), §7.3 (Strategy Generation), §7.4 (LLM Wrapper), §7.5 (Fallback System), §7.6 (SWR Caching). Also read §12.3 (Cost Tracking) and §18 RULE 3 / §19 (Module Boundaries).
7. **Read the skill SKILL.md files** — Open and read the SKILL.md for `ai-product`, `ai-engineer`, `llm-evaluation`, `gemini-api-dev`. The `ai-product` skill is the primary skill for this phase.
8. **Estimate API costs** — The test script will score 10 mock posts with multiple passes. Estimated cost: ~$0.50–$2.00 depending on model and token usage. Confirm you're comfortable with this spend on your OpenAI account.
9. **Keep dev server running** — Ensure `npm run dev` is active in a separate terminal.

## Agent Prompt

```
You are a senior AI engineer building the LLM-powered scoring and strategy engine for Trendoraa.

CONTEXT:
- OpenAI GPT-4o-mini (primary, cost-effective) and GPT-4o (premium tier)
- 9 scoring dimensions including skip_rate_score (IG Reels) and completion_rate_score (TikTok Videos) (spec §7.2, updated for April 2025)
- Strategy generation produces structured content calendars (spec §7.3)
- Every LLM call goes through a wrapper (spec §7.4)
- AI module is a PURE FUNCTION: no DB writes, no external API calls (spec §7.1)
- Deterministic fallback when LLM fails or budget exceeded (spec §7.5) with `source: "heuristic"`
- Cost tracking and user monthly budget-checking executed strictly in the calling services (spec §7.4, §12.3)
- Stale-While-Revalidate (SWR) caching model for scores (24hr validity, async background revalidation, 1hr force-refresh cooldown) implemented at the service layer (spec §7.6)

PREREQUISITE: Phases 0-6 complete.

BOUNDARY RULE (spec §18 RULE 3, spec §19):
- AI module NEVER writes to DB directly (returns data, caller writes)
- AI module NEVER calls external APIs (receives data as input)
- AI module CAN import: Zod, OpenAI SDK, its own prompts
- AI module CANNOT import: lib/db/*, lib/services/*, lib/queue/*, lib/billing/*
- All DB usage checks, actual cost/token logs, and DB commits live in `lib/services/`

TASK: Create these files:

1. FILE: lib/ai/prompts/scoring.ts
   Export POST_SCORING_PROMPT from spec §7.2 (updated version with 9 dimensions including skip_rate for Reels and completion_rate for TikTok Videos).
   Include template variable markers: {caption}, {timestamp}, {views_count}, {skip_rate}, {completion_rate}, {likes_count}, etc.
   Export function buildScoringPrompt(postData, accountContext): string

2. FILE: lib/ai/prompts/strategy.ts
   Export STRATEGY_PROMPT from spec §7.3 (updated with avg_views, avg_skip_rate, avg_completion_rate).
   Export function buildStrategyPrompt(accountData, performanceData, strategyConfig): string

3. FILE: lib/ai/output-parser.ts
   Zod schemas for LLM output validation:
   - PostScoreSchema from spec §7.2 (updated with skip_rate / completion_rate dimension + audience_retention_analysis)
   - StrategyOutputSchema from spec §7.3
   - parseScoringOutput(rawJson: string): PostScore (with Zod validation)
   - parseStrategyOutput(rawJson: string): StrategyOutput (with Zod validation)

4. FILE: lib/ai/cost-calculator.ts
   From spec §12.3:
   - MODEL_PRICING table (gpt-4o-mini and gpt-4o input/output rates)
   - estimateCost(prompt, model): number
   - calculateActualCost(response, model): number

5. FILE: lib/ai/fallback.ts
   Deterministic fallback system from spec §7.5:
   - generateScoringFallback(postMetrics, avgEngagementRate): HeuristicScoreResult (explicitly returning `source: "heuristic"` and calculating basic scores from metrics)
   - generateStrategyFallback(): StrategyFallback (basic suggestions from historical data)

6. FILE: lib/ai/scoring-engine.ts
   Main scoring function (PURE function):
   - scorePost(params: { postData, accountContext, model? }): Promise<PostScore | HeuristicScoreResult>
   - Enforce pure function: No DB calls, no environment usage reads. Simply wraps LLM call -> validate -> fallback on failure.

7. FILE: lib/ai/strategy-generator.ts
   Main strategy generation function (PURE function):
   - generateStrategy(params: { accountData, performanceData, strategyConfig, model? }): Promise<StrategyOutput | StrategyFallback>
   - Same pattern as scoring: Pure function without DB dependencies. Wraps LLM call -> validate -> fallback on failure.

8. FILE: lib/ai/llm-wrapper.ts
   Central LLM call wrapper (PURE function) from spec §7.4:
   - callLLMPure<T>(params): Promise<{ success: true, data: T, tokensUsed: number, costUsd: number, latencyMs: number } | { success: false, error: string }>
   - Timeout (30 seconds)
   - JSON mode enforced (response_format: { type: "json_object" })
   - Temperature: 0.3 (low for consistency)
   - Output validation with provided Zod schema
   - Fallback on any failure (parse error, timeout, API error)

9. FILE: lib/services/scoring.service.ts
   Service layer that orchestrates AI scoring with DB reads/writes and caching:
   - scorePost(userId, postId, options?: { forceRefresh?: boolean }): fetches post data, implements Stale-While-Revalidate (SWR) cache read (24hr expiry, async bg queue sync triggers), checks user monthly AI credits budget (using `checkUsageLimit` from Phase 4), logs usage metrics post-call, handles 1-hour force-refresh cooldown (blocks with 429 if requested too early), calls AI engine, and saves score to DB.
   - This file bridges the boundary between the pure AI engine and the stateful database.

10. FILE: lib/services/strategy.service.ts
    Service layer for strategy generation:
    - generateStrategy(userId, accountId, type, period): fetches data, checks user monthly AI credits budget, calls AI engine, logs usage, and saves strategy to DB.

11. FILE: scripts/test-prompts.ts
    Prompt evaluation test suite script that:
    - Feeds 10 mock posts of varying metrics (views, skips, completion rates, comments) into the AI scoring engine.
    - Validates output conformity across 9 dimensions, score range bounds, and schema correctness.
    - Runs multiple passes on a single post to calculate and verify low variance (consistency checking).

REGISTER QUEUE HANDLERS:
Update lib/queue/handlers.ts to register real handlers:
- SCORE_POST → calls scoringService.scorePost()
- GENERATE_STRATEGY → calls strategyService.generateStrategy()

AI OUTPUT VALIDATION RULES:
- Every LLM response MUST be parsed as JSON
- Every parsed result MUST be validated with Zod
- If Zod validation fails → use deterministic fallback with `source: "heuristic"`
- NEVER trust raw LLM output without validation
```

## Output Artifacts

| File | Description |
|---|---|
| `lib/ai/prompts/scoring.ts` | Post scoring prompt (9 dimensions) |
| `lib/ai/prompts/strategy.ts` | Strategy generation prompt |
| `lib/ai/output-parser.ts` | Zod schemas + parsers |
| `lib/ai/cost-calculator.ts` | LLM cost tracking |
| `lib/ai/fallback.ts` | Deterministic fallbacks |
| `lib/ai/scoring-engine.ts` | Scoring engine |
| `lib/ai/strategy-generator.ts` | Strategy generator |
| `lib/ai/llm-wrapper.ts` | Central LLM wrapper |
| `lib/services/scoring.service.ts` | Scoring service (DB bridge) |
| `lib/services/strategy.service.ts` | Strategy service (DB bridge) |
| `scripts/test-prompts.ts` | Prompt evaluation test suite |

## Checks & Tests

```bash
# CHECK 1: Compiles
npx tsc --noEmit
# Expected: 0 errors

# CHECK 2: AI module boundary — no DB imports in lib/ai/
grep -r "from.*lib/db" lib/ai/
grep -r "from.*lib/services" lib/ai/
grep -r "from.*lib/queue" lib/ai/
grep -r "from.*lib/billing" lib/ai/
# Expected: 0 results for ALL four

# CHECK 3: Budget check exists before calling AI engine
grep -r "checkUsageLimit\|usage-tracker" lib/services/scoring.service.ts lib/services/strategy.service.ts
# Expected: At least 1 match in each service file

# CHECK 4: Fallback returns heuristic source
grep -r '"source": "heuristic"' lib/ai/fallback.ts
# Expected: At least 1 match

# CHECK 5: Zod validation of LLM output
grep -r "\.parse\|\.safeParse" lib/ai/output-parser.ts
# Expected: At least 2 matches (scoring + strategy)

# CHECK 6: 9 scoring dimensions present
grep -r "skip_rate\|completion_rate" lib/ai/prompts/scoring.ts lib/ai/output-parser.ts
# Expected: At least 2 matches

# CHECK 7: JSON mode enforced
grep -r "json_object" lib/ai/llm-wrapper.ts
# Expected: At least 1 match

# CHECK 8: Temperature is 0.3 (not higher)
grep -r "temperature.*0.3" lib/ai/llm-wrapper.ts
# Expected: At least 1 match

# CHECK 9: SWR Caching & Force-Refresh Cooldown
grep -r "scored_at\|forceRefresh\|cooldown" lib/services/scoring.service.ts
# Expected: Stale-While-Revalidate caching and 1-hour force-refresh cooldown logic present

# CHECK 10: Cost calculation uses correct pricing
grep -r "0.00015\|0.0006\|0.005\|0.015" lib/ai/cost-calculator.ts
# Expected: GPT-4o-mini and GPT-4o pricing present

# CHECK 11: Prompt evaluation test suite runs
npx tsx scripts/test-prompts.ts
# Expected: Runs successfully, validating 9-dimension scoring and prompt consistency across 10 mock posts.
```

## Gate Criteria

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] AI module has ZERO imports from db/services/queue/billing
- [ ] Budget check runs before every LLM call inside the service layer
- [ ] Fallback system works on LLM failure and returns `source: "heuristic"`
- [ ] Zod validates all LLM outputs
- [ ] 9 scoring dimensions including `skip_rate` and `completion_rate`
- [ ] JSON mode enforced on LLM calls
- [ ] Temperature = 0.3
- [ ] Queue handlers registered for SCORE_POST and GENERATE_STRATEGY
- [ ] Stale-While-Revalidate (SWR) cache read/refresh logic (24hr expiry, async revalidation, 1hr force-refresh cooldown) enforced in services
- [ ] Cost calculation uses correct model pricing
- [ ] Prompt evaluation script (`scripts/test-prompts.ts`) runs successfully and passes all validations

---

# PHASE 8 — FRONTEND

## Goal

Build the complete dashboard UI: layout, all pages, components, charts, animations, and responsive design. After this phase, the app has a polished, premium dark-mode UI.

## Error UX hardening

These principles are non-negotiable for every page, hook, and shared component built in this phase. Treat them as gate criteria — a beautiful UI that lies about backend state is a regression, not a feature.

- **Distinguish "no data" from "API failed."** Never render the onboarding wizard (or any other "happy-empty" success state) when `GET /api/accounts` — or any list endpoint — returns a network error or a non-2xx status. Show a retryable error banner instead. The onboarding wizard is reserved for the legitimate "200 OK with zero accounts" response.
- **Surface OAuth callback errors on the dashboard.** Read the OAuth callback `?error=` query parameter and render a dismissible banner with human-readable copy for every documented code (`oauth_denied`, `not_business_account`, `token_exchange_failed`, `pages_api_failed`, `account_already_linked`, `invalid_state`, `missing_oauth_params`, `connection_failed`, `platform_not_supported`). Pair the banner with a sandbox-demo fallback CTA so the user is never stranded.
- **Never show success toasts for actions that didn't happen.** If a backend endpoint is not wired yet, label the affected UI **Coming Soon** rather than firing a fake "Saved!" toast. This applies to the Settings (profile save, GDPR export, account deletion) and Billing (Stripe Checkout upgrade) surfaces during the MVP.
- **Show account `syncStatus` in the UI.** Each account row on `/accounts` must render a `syncStatus` chip for `disconnected`, `error`, and `rate_limited` with appropriate copy and a `Re-connect` or `Sync` action where applicable. Do not hide token expiry, OAuth revocation, or rate-limit problems behind a generic "Never synced" placeholder.

## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `frontend-design` | **PRIMARY.** Frontend designer-engineer principles — not a layout generator, a design engineer. Premium visual quality mandatory. |
| `react-patterns` | Modern React patterns — hooks, composition, performance, TypeScript best practices |
| `shadcn` | shadcn/ui component usage — correct import patterns, theming, dark mode, component customization |
| `design-spells` | Micro-interactions and design details that add "magic" — hover effects, transitions, loading states that feel alive |
| `react-component-performance` | React performance diagnostics — memo, useMemo, useCallback, virtualization for long lists |
| `tailwind-patterns` | Tailwind v4 patterns — container queries, design tokens, dark mode architecture |
| `mobile-design` | Mobile-first, touch-first design — 44px touch targets, bottom navigation, gesture patterns |
| `wcag-audit-patterns` | WCAG 2.2 accessibility audit — keyboard navigation, focus management, ARIA labels, color contrast |
| `animejs-animation` | Advanced animation patterns — score gauge fills, staggered card entries, page transitions |

> **`design-spells` micro-interactions to add:**
> - Score gauge: animated arc fill (1.5s ease-out) with number count-up
> - Card hover: scale 1.02 + shadow glow (200ms)
> - Strategy cards: staggered entry (100ms delay per card)
> - Skip rate indicator: pulse animation when skip rate is "critical" (>60%)
> - Metric cards: subtle gradient shift on hover
> - Loading: shimmer skeleton (not plain gray pulsing)
>
> **`wcag-audit-patterns` requirements:**
> - Every interactive element has a unique ID and ARIA label
> - Keyboard-navigable sidebar and card grid
> - Focus visible rings on all interactive elements
> - Color contrast ratio ≥ 4.5:1 for text
> - Score colors (red/yellow/green) also have icon/text indicators (not color-only)

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Confirm Phase 7 gate passed** — AI module has zero DB imports, budget checks work, fallback returns `source: "heuristic"`, Zod validates outputs, 9 scoring dimensions present, JSON mode enforced, temperature 0.3, SWR caching logic in services, prompt evaluation script passes.
2. **Verify ALL backend APIs are functional** — Run the following curl checks to confirm the backend is responsive:
   ```
   curl -s http://localhost:3000/api/health   # Expected: 200 OK with {"status":"healthy"}
   ```
3. **Install Google Fonts locally** (optional) — The design system uses Inter, Outfit, and JetBrains Mono. These will be loaded via `next/font` or Google Fonts CDN, but confirm you can access [fonts.google.com](https://fonts.google.com) from your network.
4. **Review the design system** — Read the SEABS spec §10.1 (Design System) for exact color palette, typography, spacing, and glassmorphism parameters. Key colors: brand purple `#6C5CE7`, green `#00B894`, pink `#FD79A8`.
5. **Read the SEABS spec §10** — Open the spec and read the entire §10 section (Frontend) including §10.2 (Sidebar), §10.3 (Page Specs), §10.4 (Components), §10.5 (Animation Spec), §10.6 (Responsive Breakpoints).
6. **Read the skill SKILL.md files** — Open and read the SKILL.md for `frontend-design`, `react-patterns`, `shadcn`, `design-spells`, `react-component-performance`, `tailwind-patterns`, `mobile-design`, `wcag-audit-patterns`, `animejs-animation`. This is the most skill-intensive phase.
7. **Verify shadcn/ui is initialized** — Check that `components.json` exists and shadcn/ui components can be added. Run `npx shadcn@latest add button --dry-run` to confirm (or similar).
8. **Prepare a test user session** — Create a test user via the Supabase Dashboard (or signup flow) so you can log in and see dashboard pages rendered with real data.
9. **Seed realistic test data** — Run `npx tsx lib/db/seed.ts` to ensure the database has test posts, scores, strategies, and usage data for the UI to display.
10. **Resize your browser** — Have Chrome DevTools open with the device toolbar ready. You'll need to test at 375px (mobile), 768px (tablet), and 1280px (desktop) widths.

## Agent Prompt

```
You are a senior frontend engineer building the dashboard UI for Trendoraa.

CONTEXT:
- Next.js 14+ App Router with React Server Components where possible
- shadcn/ui + Tailwind CSS v4 for styling
- Framer Motion for animations
- Recharts for data visualization
- Dark mode first (from spec §10.1 design system)
- Color palette from spec §10.1: brand purple #6C5CE7, green #00B894, pink #FD79A8
- Typography: Inter (body), Outfit (display), JetBrains Mono (code)
- Glassmorphism effects for cards
- Mobile-first responsive design

DATA-DRIVEN AI STRATEGY MOAT (POST SKIP & COMPLETION RATES):
- Rather than displaying "skip_rate" or "completion_rate" as simple raw API metrics, portray them in the UI and dashboard copy as core components of a larger data-driven AI strategy moat representing proprietary strategic insight. Frame Instagram Reel skip rate as the "Strategic Skip Resistance" or "Audience Retention Moat Index" to emphasize hook effectiveness. Frame TikTok completion rate as the "Strategic Video Completion Retention Index" to represent viewer capture and audience locking capability.

VIEW METRIC NORMALIZATION & ROBUSTNESS:
- All charts, metrics cards, post cards (cross-platform with badges), and list tables must support the normalized views fields (display_views and metric_source) from the database/API.
- Implement robust division-by-zero guards when computing metrics like engagement rate, skip rate, or completion rate. If display_views is 0 or null, return null or a safe custom display (e.g. "—" or "0.00%") instead of NaN or UI crashes.

PREREQUISITE: Phases 0-7 complete (all API routes exist).
Before beginning frontend implementation, execute a curl sanity check to ensure the backend is responsive:
`curl -s http://localhost:3000/api/health` (Expected: 200 OK with {"status":"healthy"})

TASK: Build these files following the page specs from spec §10.3:

LAYOUT:
1. app/(dashboard)/layout.tsx — Dashboard shell with:
   - Collapsible sidebar (from spec §10.2): Dashboard, My Posts, Strategy, Analytics, Accounts, Billing, Settings
   - Top bar: breadcrumb, account switcher dropdown (to toggle/manage connected Instagram and TikTok accounts), notifications bell, user avatar
   - Mobile: sidebar collapses to bottom tab bar
   - Use glassmorphism for sidebar background

COMPONENTS (components/dashboard/):
2. metric-card.tsx — Stat card with value, label, delta arrow, trend. Support display_views and metric_source. Skeleton loading state. (spec §10.4)
3. score-gauge.tsx — Circular arc gauge for scores 1-100. Animated fill on mount. Color: green >70, yellow >40, red ≤40.
4. dimension-bar.tsx — Horizontal bar for 1-10 dimension scores. 9 dimensions. Color-coded.
5. post-card.tsx — Card showing post thumbnail placeholder with platform indicator badge (Instagram vs. TikTok), caption truncated, key metrics (display_views, skip rate / completion rate reframed as Moat Index, ER), score badge. Click to navigate. Safe division-by-zero logic.
6. strategy-card.tsx — Day/time card with content type, topic, hook suggestion, estimated engagement indicator.
7. trend-chart.tsx — Line chart using Recharts. 7/30/90 day toggle. Responsive. Show engagement rate over time. Safe division-by-zero checks.
8. usage-meter.tsx — Progress bar showing used/total. Warning at 80% (yellow), critical at 95% (red).
9. empty-state.tsx — Illustration placeholder + CTA button. Different messages per page context.
10. loading-skeleton.tsx — Pulsing skeleton matching content layout shapes.

COMPONENTS (components/shared/):
11. error-boundary.tsx — Error boundary with retry button. Never shows stack traces to user.
12. account-switcher.tsx — Dropdown to switch between connected social accounts (both Instagram and TikTok).

PAGES:
13. app/(dashboard)/page.tsx — Dashboard (spec §10.3):
    - 4 metric cards: Total Views (display_views), Avg Engagement, Avg Retention Moat (reframed as Strategic Skip Resistance for Instagram / Video Completion Index for TikTok with color indicator), AI Credits Left
    - Engagement trend chart (30 days default)
    - Top Posts list (top 5 by score, displaying platform indicator badges)
    - This week's plan summary (from latest strategy)

14. app/(dashboard)/posts/page.tsx — Posts list:
    - Grid of post-cards, with platform filtering tabs (All, Instagram, TikTok) and sortable by date/engagement/display_views/skip_rate/completion_rate
    - Pagination
    - "Score All" bulk action button

15. app/(dashboard)/posts/[id]/page.tsx — Post detail (spec §10.3):
    - Left: post info (caption, platform indicator badge, metrics: display_views, metric_source, skip rate or completion rate as Moat Index with indicator, likes, comments, shares, saves, public_reposts)
    - Right: AI score gauge + 9 dimension bars + AI analysis text (evaluating hook effectiveness, pacing, audio, and visual trends)
    - Bottom: AI recommendations (strength + opportunity)

16. app/(dashboard)/strategy/page.tsx — Strategy (spec §10.3):
    - Current strategy overview (key insight)
    - Content calendar (day-by-day strategy cards)
    - Improvement priorities list
    - "Generate New Strategy" button

17. app/(dashboard)/analytics/page.tsx — Analytics:
    - Engagement trend (7/30/90 day)
    - Skip rate trend (unique views)
    - Content performance by type (bar chart)
    - Best posting times heatmap

18. app/(dashboard)/accounts/page.tsx — Accounts:
    - List connected accounts with sync status, last synced, follower count
    - "Connect Account" button → OAuth flow
    - "Sync Now" button per account

19. app/(dashboard)/billing/page.tsx — Billing:
    - Current plan card with features
    - Usage meters (posts analyzed, strategies, AI calls)
    - Upgrade/downgrade buttons → Stripe Checkout
    - "Manage Subscription" → Stripe Portal

20. app/(dashboard)/settings/page.tsx — Settings:
    - Profile editing (name, avatar)
    - Connected accounts summary
    - Data export button (GDPR)
    - Delete account button with confirmation modal

HOOKS:
21. hooks/use-posts.ts — SWR/fetch hook for posts data (supporting both Instagram and TikTok posts). Returns display_views and metric_source.
22. hooks/use-strategy.ts — Hook for strategy data
23. hooks/use-analytics.ts — Hook for analytics data
24. hooks/use-subscription.ts — Hook for subscription + usage
25. hooks/use-accounts.ts — Hook for connected accounts

ANIMATION SPEC (from spec §10.5):
- Page transitions: fade in + slide up (300ms)
- Card hover: scale 1.02 + shadow increase (200ms)
- Score gauge: animated arc fill (1.5s ease-out)
- Score number: count-up animation (1.2s ease-out-expo)
- Skeleton: pulsing opacity 0.3→0.7→0.3 (1.5s infinite)
- Strategy cards: staggered entry (100ms delay per card)

RESPONSIVE (from spec §10.6):
- sm: 640px, md: 768px, lg: 1024px, xl: 1280px
- Mobile: bottom tab bar, stacked cards, simplified charts
- Touch targets: minimum 44x44px

RULES:
- NO business logic in components — use hooks that call API routes
- Every async operation shows loading state
- Every page has error boundary
- Every empty state has a clear CTA
- Accessible: proper ARIA labels, keyboard navigation, focus management
- Dark mode only (for now — no light mode toggle needed)
```

## Output Artifacts

| File | Description |
|---|---|
| `app/(dashboard)/layout.tsx` | Dashboard shell |
| `components/dashboard/*.tsx` | 10 dashboard components |
| `components/shared/*.tsx` | 2 shared components |
| `app/(dashboard)/**/*.tsx` | 8 page components |
| `hooks/*.ts` | 5 data hooks |

## Checks & Tests

```bash
# CHECK 1: Compiles
npx tsc --noEmit
# Expected: 0 errors

# CHECK 2: Dev server renders dashboard
npm run dev
# Navigate to localhost:3000 — should show login or dashboard

# CHECK 3: No business logic in components
grep -r "drizzle\|from.*lib/db\|from.*lib/services" components/ app/\(dashboard\)/
# Expected: 0 results (components use hooks, not services)

# CHECK 4: Loading states exist
grep -r "loading\|isLoading\|skeleton\|Skeleton" app/\(dashboard\)/
# Expected: Every page file has loading handling

# CHECK 5: Error boundaries exist
grep -r "ErrorBoundary\|error-boundary" app/\(dashboard\)/
# Expected: At least layout.tsx wraps children in error boundary

# CHECK 6: Skip rate dimension present in UI and framed as strategic moat
grep -r "skip.rate\|skip_rate\|skipRate" components/dashboard/
# Verify skip rate is framed as a strategic moat / hook retention index rather than a basic metric

# CHECK 7: 9 dimensions rendered (not 8)
# Manually check post detail page renders 9 dimension bars

# CHECK 8: Mobile responsive
# Resize browser to 375px width — verify:
# - Sidebar becomes bottom tab bar
# - Cards stack vertically
# - Touch targets ≥ 44px

# CHECK 9: Animations present and performant (LazyMotion Enforced)
grep -r "LazyMotion\|motion-provider" app/\(dashboard\)/
# Expected: Root layout.tsx wraps components inside LazyMotion dynamic animation provider.
# Also check that components DO NOT synchronously import raw 'motion' elements directly from 'framer-motion':
# grep -rn "import.*motion.*from 'framer-motion'" components/dashboard/ app/\(dashboard\)/
# Expected: 0 hits. All pages/components must import from "@/components/shared/performance-motion" instead.

# CHECK 10: Prohibited Layout Properties check in animations
# Verify that animate configs do not target width, height, top, left, margins, paddings, etc.
# Expected: All Framer Motion targets focus strictly on 'scale', 'opacity', 'x', 'y', 'rotate'.

# CHECK 11: Production build and bundle size boundaries
npm run build
# Expected: Build succeeds with 0 errors and First Load JS per route remains under 250KB.

# CHECK 12: Normalized views & division-by-zero guards
grep -r "display_views\|metric_source" app/\(dashboard\)/ components/dashboard/
# Expected: Components fetch and display normalized view fields
# Verify that all calculations dividing by views include strict checks to return null/0 when views are zero.
```

## Gate Criteria

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → succeeds with First Load JS budgets < 250KB per route
- [ ] All 8 dashboard pages render successfully
- [ ] No business logic inside React components (delegated to data hooks)
- [ ] Loading states on every single asynchronous state change
- [ ] Error boundaries properly configured on every sub-route/layout
- [ ] 9 scoring dimensions in UI (including skip rate for Reels and completion rate for TikTok Videos)
- [ ] skip_rate and completion_rate reframed as a core data-driven AI strategy moat representing proprietary strategic insight in the dashboard UI and copy
- [ ] All UI widgets and charts support the normalized views fields (display_views and metric_source) with robust division-by-zero fallbacks
- [ ] Mobile responsive layout optimized (bottom tab bar touch targets ≥ 44x44px, stacked grids)
- [ ] Animations strictly follow compositor-only property constraints (scale, opacity, x, y, rotate)
- [ ] Zero direct synchronous imports of raw `motion` from `framer-motion` in user-facing components (delegated to dynamic LazyMotion client wrapper `performance-motion`)
- [ ] Dark mode styling aligned with Outfit/Inter typography and design system colors


---

# PHASE 9 — OBSERVABILITY

## Goal

Add structured logging, health checks, Sentry error tracking, and alert-ready metrics. After this phase, every API call is traced, errors are captured, and system health is monitorable.

## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `grafana-dashboards` | Dashboard design for system observability — layout patterns, metric panel types, alert rules |
| `analytics-tracking` | Analytics tracking system design — event taxonomy, data quality, decision-ready metrics |

> **Key observability patterns from skills:**
> - Every log entry: `{ timestamp, level, service, traceId, userId?, action, duration_ms?, error? }` — structured JSON only
> - Never log PII, tokens, or secrets (enforced by `security-auditor` from Phase 5)
> - Alert thresholds documented in comments for future Grafana/PagerDuty setup

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Confirm Phase 8 gate passed** — All 8 dashboard pages render, no business logic in components, loading states on every async operation, error boundaries configured, 9 scoring dimensions in UI, mobile responsive, animations use compositor-only properties, `npm run build` succeeds under 250KB per route.
2. **Create a Sentry account** — Go to [sentry.io](https://sentry.io) and create a free account. Create a new project for Next.js.
3. **Get Sentry DSN** — From the Sentry project settings, copy the DSN URL. Add it as `SENTRY_DSN` in `.env.local`.
4. **Install Sentry SDK** (if not already) — The agent will handle this, but verify `@sentry/nextjs` is in your `package.json`. If not, note it for the agent.
5. **Read the SEABS spec §13** — Open the spec and read §13.1 (Structured Logging), §13.2 (Health Checks), §13.3 (Alert Rules).
6. **Read the skill SKILL.md files** — Open and read the SKILL.md for `grafana-dashboards`, `analytics-tracking`.
7. **Verify health endpoint baseline** — Run `curl http://localhost:3000/api/health` and confirm it returns the current simple response. This phase will enhance it.

## Agent Prompt

```
You are a senior DevOps engineer adding observability to Trendoraa.

CONTEXT: Spec §13 defines the observability requirements.

TASK:

1. FILE: lib/telemetry/logger.ts
   Structured JSON logger from spec §13.1:
   - Every log entry: timestamp, level, service, traceId, userId?, action, duration_ms?, metadata?, error?
   - Export functions: logInfo(), logWarn(), logError(), logDebug()
   - Generate traceId per request (UUID v4)
   - NEVER log sensitive data (tokens, passwords, PII)

2. FILE: lib/telemetry/metrics.ts
   Business metrics tracker:
   - trackAICost(userId, model, tokens, cost)
   - trackAPILatency(endpoint, durationMs, statusCode)
   - trackQueueDepth(pending, processing, deadLetter)
   - trackUserAction(userId, action, metadata)

3. FILE: lib/telemetry/health.ts
   Health check functions:
   - checkDatabase(): Promise<"ok" | "degraded">
   - checkOpenAI(): Promise<"ok" | "degraded">
   - checkStripe(): Promise<"ok" | "degraded">
   - checkInstagramAPI(): Promise<"ok" | "degraded">
   - checkTikTokAPI(): Promise<"ok" | "degraded">
   - checkQueueHealth(): Promise<{ pending, processing, deadLetter }>

4. FILE: app/api/health/route.ts — UPDATE existing:
   Shallow health (public): { status, timestamp, version }

5. FILE: app/api/health/deep/route.ts
   Deep health from spec §13.2:
   - Check database, auth, OpenAI, Stripe, Instagram API, TikTok API, queue
   - Return status per dependency
   - Include queue depth and dead letter count

6. FILE: sentry.config.ts (or equivalent Next.js Sentry setup)
   Configure Sentry for:
   - Error tracking (auto-capture unhandled exceptions)
   - Performance monitoring (transaction tracing)
   - Environment tagging (staging/production)

7. UPDATE: lib/api/middleware.ts
   Add request logging to withAuth middleware:
   - Log every API request: method, path, userId, duration, status
   - Generate traceId and pass through request

ALERT RULES (document in comments, implement monitoring later):
- LLM cost >150% daily average → Warning
- Queue >100 pending for >10 min → Warning
- >10 dead letters in 1 hour → Critical
- Instagram or TikTok token refresh failure 3x → Critical
- >5% 5xx in 5 minutes → Critical
```

## Output Artifacts

| File | Description |
|---|---|
| `lib/telemetry/logger.ts` | Structured JSON logger |
| `lib/telemetry/metrics.ts` | Business metrics |
| `lib/telemetry/health.ts` | Dependency health checks |
| `app/api/health/deep/route.ts` | Deep health endpoint |
| `sentry.config.ts` | Sentry configuration |

## Checks & Tests

```bash
# CHECK 1: Compiles
npx tsc --noEmit

# CHECK 2: Health endpoint works
curl http://localhost:3000/api/health
# Expected: { success: true, data: { status: "healthy" } }

# CHECK 3: Deep health shows all dependencies
curl http://localhost:3000/api/health/deep
# Expected: Shows database, auth, openai, stripe, instagram, tiktok, queue status

# CHECK 4: Logger never logs tokens
grep -r "token\|password\|secret" lib/telemetry/logger.ts
# Expected: Only in "DO NOT LOG" comments, not in actual log statements

# CHECK 5: Structured log format
# Verify logger outputs valid JSON with required fields
```

## Gate Criteria

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `/api/health` returns healthy status
- [ ] `/api/health/deep` checks all dependencies (including Instagram and TikTok API connectivity)
- [ ] Structured logging with traceId on every request
- [ ] Sentry configured for error tracking
- [ ] No sensitive data in logs

---

# PHASE 10 — DEPLOYMENT & LAUNCH

## Goal

Set up CI/CD pipeline, staging deployment, production deployment with all gates passing. After this phase, the app is live.

## 🔧 Activate Skills

| Skill | Purpose in This Phase |
|---|---|
| `vercel-deployment` | Vercel deployment expert — Next.js configuration, environment variables, build optimization |
| `github-actions-templates` | Production-ready CI/CD workflows — testing, building, deploying, secret scanning |
| `github` | GitHub CLI for issues, PRs, Actions runs |
| `deployment-pipeline-design` | Multi-stage pipeline architecture — approval gates, rollback strategies |

> **`vercel-deployment` checks:**
> - Framework preset: Next.js (auto-detected)
> - Environment variables set in Vercel dashboard (not in code)
> - Build command: `next build`
> - First-load JS < 250KB
>
> **`github-actions-templates` CI pipeline must include:**
> - `npm ci` (not `npm install`)
> - `npx tsc --noEmit` (type check)
> - `npx eslint . --max-warnings 0` (lint)
> - `npx next build` (build verification)
> - Secret scan step (grep for hardcoded keys)

## 🚦 Steps Before Execution

Complete **all** of these before running the agent prompt:

1. **Confirm Phase 9 gate passed** — Health endpoints work (shallow and deep), structured logging with traceId active, Sentry configured, no sensitive data in logs.
2. **Create a Vercel account** — Go to [vercel.com](https://vercel.com) and create a free account if you don't have one. Link it to your GitHub account.
3. **Create a GitHub repository** — If the project isn't already on GitHub, create a repo and push all code. Vercel deploys from GitHub.
4. **Install Vercel CLI** — Run `npm i -g vercel` and authenticate with `vercel login`.
5. **Link project to Vercel** — Run `vercel link` from the project root to connect it to your Vercel account and project.
6. **Set ALL environment variables in Vercel Dashboard** — Go to Vercel Dashboard → Project → Settings → Environment Variables. Add every variable from `.env.example`:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
   - `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI`, `INSTAGRAM_VERIFY_TOKEN`
   - `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_CREATOR`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_AGENCY`
   - `RESEND_API_KEY`
   - `TOKEN_ENCRYPTION_KEYS`, `ACTIVE_KEY_VERSION`
   - `CRON_SECRET`
   - `SENTRY_DSN`
7. **Set up production Supabase** — Create a production Supabase project at [supabase.com](https://supabase.com). Get the production `SUPABASE_URL`, keys, and `DATABASE_URL`. Use these for the production environment in Vercel.
8. **Configure Stripe for production** (when ready) — Switch from test mode to live mode in Stripe. Update `STRIPE_SECRET_KEY` to `sk_live_...` and create a production webhook endpoint pointing to `https://your-domain.com/api/webhooks/stripe`.
9. **Read the SEABS spec §14** — Open the spec and read §14.3 (Deployment Gates), §14.5 (Disaster Recovery), §14.7 (Public Bundle Separation).
10. **Read the skill SKILL.md files** — Open and read the SKILL.md for `vercel-deployment`, `github-actions-templates`, `github`, `deployment-pipeline-design`.
11. **Run a full local CI check** — Before setting up CI/CD, manually run the full pipeline locally to confirm it passes:
    ```
    npx tsc --noEmit && npx eslint . --max-warnings 0 && npm run build
    ```
12. **Install autocannon** (for load testing) — Run `npm install -g autocannon` for the load testing verification check.

## Agent Prompt

```
You are a senior DevOps engineer deploying Trendoraa to production.

CONTEXT: Spec §14 defines the deployment pipeline.

TASK:

1. FILE: .github/workflows/ci.yml
   CI pipeline that runs on every PR:
   - Install dependencies (npm ci)
   - Type check (npx tsc --noEmit)
   - Lint (npx eslint . --max-warnings 0)
   - Build (npx next build)
   - Secret scan (check for hardcoded secrets)

2. FILE: .github/workflows/deploy.yml
   Deploy pipeline on merge to main:
   - Run full CI
   - Run database migrations: `npx drizzle-kit migrate` (authenticated via DATABASE_URL secret)
   - Deploy to Vercel (auto via Vercel GitHub integration)

3. FILE: vercel.json
   Vercel configuration:
   - Framework: Next.js
   - Build command: next build
   - Region: closest to target users
   - Crons array configuration:
     - `/api/queue/process` runs every minute (`* * * * *`)
     - `/api/cron/token-refresh` runs daily (`0 0 * * *`)
     - `/api/cron/ingest` runs hourly (`0 * * * *`)
     - `/api/health` runs every 5 minutes (`*/5 * * * *`) to keep serverless functions warm (cold-start mitigation)

4. FILE: .eslintrc.json
   ESLint config:
   - Next.js recommended rules
   - TypeScript strict rules
   - No unused variables
   - No explicit any
   - Custom `no-restricted-imports` rule for `app/(public)/**/*` restricting imports of `@/lib/db`, `@/lib/supabase`, and `@/lib/security/encryption` to guarantee complete public-dashboard separation.

5. DATABASE CONNECTION POOL SIZING & TIMEOUT CONFIGURATION (lib/db/index.ts):
   - Enforce direct connection pooling mathematical limits (from spec §2.5):
     `Max Connections = (Vercel Max Serverless Concurrency * Direct Pool Size) + (Workers * Worker Concurrency) + PgBouncer Reserve`
     where:
       - Vercel Max Serverless Concurrency is 100
       - Direct Pool Size is 1 (to prevent rapid connection exhaustion)
       - Worker Concurrency is 5
       - PgBouncer Reserve is 10
   - Enforce a strict connection timeout of 5 seconds (`connect_timeout=5`).
   - Enforce a strict statement execution timeout limit of 10 seconds (`statement_timeout=10000`) on all pooled client connections to prevent slow queries from locking the database indefinitely.
   - Enforce idle in transaction timeouts of 15 seconds (`idle_in_transaction_session_timeout=15000`) to auto-terminate hanging client locks.

6. DISASTER RECOVERY & PITR RESTORATION DRILL RULES:
   - Document Point-in-Time Recovery (PITR) parameters: standard RPO (Recovery Point Objective) of 24 hours under standard daily backups / 2 minutes using PITR WAL streaming, and standard RTO (Recovery Time Objective) of 4 hours.
   - Require quarterly isolated restoration drills (from spec §14.5) in the release workflow:
     1. Create a temporary isolated staging database instance.
     2. Restore the latest PITR WAL snapshot onto the staging instance.
     3. Run the full database RLS verification suite (`scripts/test-rls.ts`) to ensure security rules remain intact post-restore.

7. VERIFY: All environment variables set in Vercel dashboard:
   - SUPABASE_*, INSTAGRAM_*, TIKTOK_*, OPENAI_*, STRIPE_*, RESEND_*, TOKEN_ENCRYPTION_KEYS

8. UPDATE: .env.example — ensure it documents every required var

DEPLOYMENT GATES (from spec §14.3):
- 0 TypeScript errors
- 0 lint warnings
- Build succeeds
- No secrets in code
- All environment variables documented
- Vercel Cron routes mapped in vercel.json
- deploy.yml includes automated DB migration step
```

## Output Artifacts

| File | Description |
|---|---|
| `.github/workflows/ci.yml` | CI pipeline |
| `.github/workflows/deploy.yml` | Deploy pipeline |
| `vercel.json` | Vercel config with crons |
| `.eslintrc.json` | ESLint config |

## Checks & Tests

```bash
# CHECK 1: Full CI passes locally
npx tsc --noEmit        # 0 errors
npx eslint . --max-warnings 0  # 0 warnings
npm run build            # succeeds

# CHECK 2: No secrets in code
grep -r "sk_live\|sk_test\|SUPABASE_SERVICE_ROLE\|eyJ" --include="*.ts" --include="*.tsx" app/ lib/ components/
# Expected: 0 results

# CHECK 3: Env vars documented
cat .env.example
# Expected: Every required var listed with comments

# CHECK 4: Production build bundle size
# First load JS should be < 250KB

# CHECK 5: Staging deployment works
# Deploy to Vercel preview → smoke test all pages

# CHECK 6: Load testing validation (local or staging)
npx autocannon -c 50 -d 10 http://localhost:3000/api/health
# Expected: Avg latency < 200ms with 0 errors under 50 concurrent requests

# CHECK 7: Cold-start Warmup Cron Configuration
grep -r "health" vercel.json
# Expected: Cron entry mapped to trigger health pings every 5 minutes

# CHECK 8: Connection pool sizing timeouts configuration
grep -r "statement_timeout\|connect_timeout" lib/db/
# Expected: Direct connections configure statement_timeout=10000 and connect_timeout=5

# CHECK 9: Supabase PITR verification drill logs
# Verify production database has WAL replication stream enabled
# Expected: PITR stream active; standard staging restoration procedures documented
```

## Gate Criteria

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npx eslint . --max-warnings 0` → 0 warnings
- [ ] `npm run build` → succeeds
- [ ] No secrets in source code
- [ ] All env vars documented in `.env.example`
- [ ] CI pipeline runs successfully
- [ ] Vercel Cron `crons` array configured inside `vercel.json` including the 5-minute `/api/health` warmup ping
- [ ] Direct database connection pool sizing math verified under max serverless concurrency
- [ ] Strict 10s statement execution timeout (`statement_timeout=10000`) and 5s connection timeout enforced in client connection parameters
- [ ] Supabase PITR WAL streaming active with standard disaster recovery drill compliance (RPO 24hr / RTO 4hr) verified
- [ ] Database migration step included in GitHub Actions `deploy.yml` workflow
- [ ] Load testing verification passes (avg latency < 200ms under 50 concurrent requests)
- [ ] Staging deployment works
- [ ] All pages load without errors

---

# POST-LAUNCH CHECKLIST

After all 11 phases pass, verify the complete system:

```markdown
## System Integration Verification

### End-to-End Flows
- [ ] User signs up → lands on dashboard
- [ ] User connects Instagram and TikTok → OAuth flows complete → accounts appear
- [ ] Manual sync → Social posts appear with views, skip_rate/completion_rate, engagement
- [ ] Click "Score" on a Post → AI scores with 9 dimensions → score saved
- [ ] Generate strategy → AI returns content calendar → strategy saved
- [ ] Subscribe to Creator plan → Stripe Checkout → subscription active
- [ ] Usage limits enforced → free user blocked from AI calls, Creator capped at 50, Pro at 200, Agency at 800 (with LLM budget caps circuit breakers that downgrade users to mathematical heuristic scoring without halting the application)
- [ ] Token refresh → cron refreshes tokens before expiry (60-day for Instagram, 24-hour daily dynamic refresh for TikTok)

### Security
- [ ] RLS prevents cross-tenant data access
- [ ] Encrypted tokens in DB (not plaintext)
- [ ] Webhook signatures verified (Stripe, Instagram, and TikTok)
- [ ] Rate limiting active on all endpoints
- [ ] Strict 10s maximum query execution timeout (statement_timeout) and 5s connection timeout active on all database endpoints
- [ ] No secrets in source code or logs

### Resilience
- [ ] LLM failure → fallback response shown (not crash) with source: "heuristic" (mathematical heuristic scoring triggers seamlessly if LLM budget cap is reached)
- [ ] Instagram or TikTok API 429 → exponential backoff (not crash, respect TikTok rate limit of 10 calls/minute/user with sequential background polling and 5-min manual sync cooldown)
- [ ] Stripe webhook replay → idempotent (no duplicate processing)
- [ ] Queue worker crash → jobs released and re-claimed
- [ ] Dead letter jobs → appear in DLQ for review
- [ ] Supabase PITR active and WAL replication validated (RPO 24hr / RTO 4hr)
- [ ] Vercel 5-minute warmup crons active to eliminate cold-starts during core business hours

### Performance
- [ ] Dashboard loads in < 3 seconds
- [ ] API responses < 500ms (p95, excluding AI calls)
- [ ] AI scoring < 30 seconds (including LLM latency)
- [ ] Build size < 250KB first load JS
- [ ] Database connection pool sized mathematically to prevent pool starvation under max serverless concurrency
```

# PHASE 11 — TIKTOK POST-MVP EXPANSION

## Goal

Extend the Instagram MVP to support full cross-platform operations by integrating the **TikTok Display API v2**. Enable TikTok Creator and Business account authentication, secure daily access token rotation pipelines, sequential ingestion queue routines to prevent rate-limit blocks, normalize TikTok metrics (`tiktok_completion_rate`), and enable cross-platform dashboard filters.

## 🚦 Steps Before Execution

1. **Verify Instagram MVP Launch**: Ensure the Instagram-only product is launched, active, and has acquired paying subscribers.
2. **TikTok Developer Portal Application**: 
   - Go to [developers.tiktok.com](https://developers.tiktok.com) → My Apps → Create App.
   - Add the **TikTok Display API** product to your application.
   - Configure Redirect URIs in your TikTok App dashboard under **Display API**:
     - Local: `http://localhost:3000/api/auth/social/tiktok/callback`
     - Production: `https://yourdomain.com/api/auth/social/tiktok/callback`
   - Register sandbox test accounts for ingestion testing.
3. **Configure Environment Keys**:
   - `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`
   - `TIKTOK_REDIRECT_URI`

## Agent Prompt

```
You are a senior backend engineer implementing the TikTok Post-MVP Expansion for Trendoraa.

CONTEXT:
- TikTok Display API v2 Integration (spec §6.8)
- Unified cross-platform database schema (already configured in Phase 2)
- TikTok access tokens (24-hour expiry) with daily refresh using refresh_token.
- TikTok strict rate limit handling: 10 calls per minute per user limit, utilizing sequential background queue workers to prevent rate-limit blocks.
- TikTok-specific metrics: completion_rate, views, likes, comments, shares, saves.

TASK: Modify and create the following files to enable TikTok:

1. MODIFY: lib/services/token-manager.ts
   - Extend shouldRefresh() and refreshToken() to support TikTok accounts using TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to execute daily POST exchanges.

2. MODIFY: lib/ingestion/post-fetcher.ts
   - Implement fetchTikTokVideos(accessToken, platformUserId, limit?): Promise<RawTikTokVideo[]>
   - Enforce sequential polling: Queue TikTok video list fetching sequentially to adhere to the strict 10 calls/minute/user limit.

3. MODIFY: lib/ingestion/data-normalizer.ts
   - Implement normalizeTikTokVideo(rawVideo): Partial<Post>
   - Map tiktok_completion_rate and saves_count cleanly.

4. MODIFY: app/api/auth/social/[platform]/route.ts
   - Enable the "tiktok" OAuth redirect path.
   - TikTok Scopes: video.list, user.info.basic, user.info.stats

5. MODIFY: app/api/auth/social/[platform]/callback/route.ts
   - Enable the "tiktok" callback handler.
   - Exchange code for tokens (TikTok POST /oauth/token/ flow).
   - Call /user/info/ to verify profile.

6. NEW: app/api/webhooks/tiktok/route.ts
   - Implement the TikTok webhook receiver with HMAC-SHA256 signature verification.

7. MODIFY: app/api/accounts/route.ts
   - Ensure connected TikTok accounts are included in list responses.

8. MODIFY: app/components/dashboard/post-card.tsx & dashboard/overview.tsx
   - Add TikTok platform badges and metrics display ("Strategic Video Completion Retention Index").
   - Implement frontend filter controls to toggle between Instagram, TikTok, and unified views.
```

## Gate Criteria

- [ ] TikTok OAuth flow completes successfully in sandbox/test mode
- [ ] TikTok Video list ingestion fetches and normalizes views, completion rate, likes, comments, shares, and saves
- [ ] Daily token manager refresh cron successfully executes dynamic access token exchanges sequentially
- [ ] Rate-limit fallback triggers gracefully (HTTP 429 / Code 10007) and schedules exponential backoff locks
- [ ] Dashboards show TikTok and Instagram posts side-by-side with appropriate platform indicators
- [ ] Codebase compiles cleanly (`npm run typecheck`) and passes all linter checks (`npm run lint`) with 0 errors

---

# SYSTEM STATE TRANSITION SUMMARY

```
Phase 0 (Scaffold)      → INIT
Phase 1 (PRD/Arch)      → ARCH_LOCKED
Phase 2 (Database)      → DATABASE_READY
Phase 3 (Auth/Backend)  → BACKEND_READY
Phase 4 (Billing)       → BILLING_READY
Phase 5 (Instagram MVP) → INGESTION_READY
Phase 6 (Queue)         → QUEUE_READY
Phase 7 (AI Engine)     → AI_READY
Phase 8 (Frontend)      → FRONTEND_READY
Phase 9 (Observability) → OBSERVABILITY_READY
Phase 10 (Deploy)       → DEPLOYED ✅ (Instagram MVP Live!)
Phase 11 (TikTok Post)  → TIKTOK_INTEGRATED 🚀
```

> **Rule:** If any phase fails gate criteria after 3 repair attempts → STOP → troubleshoot manually → DO NOT skip to next phase.


---

*This playbook is the execution companion to [trendoraa-seabs-spec.md](./trendoraa-seabs-spec.md). Follow it sequentially. No shortcuts.*

---

# APPENDIX — CROSS-CUTTING SKILLS CHECKLIST

Run these skills **after every phase** as a validation pass:

| Skill | When to Run | What It Checks |
|---|---|---|
| `debugger` | After any test failure | Systematic error diagnosis, root cause analysis |
| `systematic-debugging` | When encountering unexpected behavior | Hypothesis-driven debugging before proposing fixes |
| `code-reviewer` | After all files in a phase are written | Code quality, patterns, edge cases, security |
| `security-auditor` | After Phases 3, 4, 5 especially | OAuth flows, token handling, webhook signatures, RLS |
| `tdd-workflow` | Before writing implementation code | RED-GREEN-REFACTOR cycle for critical logic |
| `webapp-testing` | After Phase 8 (Frontend) | Playwright scripts for end-to-end UI testing |
| `requesting-code-review` | Before marking any phase as complete | Final verification that work meets requirements |

## How to Use Cross-Cutting Skills

```
1. Complete all files in a phase
2. Run gate checks
3. If checks pass → activate `code-reviewer` skill → run review on all new files
4. If `code-reviewer` finds issues → fix → re-run gate checks
5. For security-sensitive phases (3, 4, 5) → also activate `security-auditor`
6. Only then → mark phase complete → move to next phase
```
