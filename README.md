# 🌟 Trendoraa — AI-Powered Short-Form Video Strategy Engine

Welcome to **Trendoraa**, the state-of-the-art AI-powered short-form video optimization platform. Trendoraa automates short-form video analysis (Instagram Reels & TikTok Videos), scores each post across 9 structural dimensions, and outputs custom posting calendars and weekly strategies.

By shifting workflows from intuitive guessing to highly tailored, data-backed strategy, Trendoraa establishes an elite content performance optimization engine for creators, social media managers, and agencies.

---

## ✨ Features

* **Instagram MVP Ingestion (live):** OAuth2 for Instagram Professional accounts via `POST /api/auth/social/instagram`, Reel sync into `instagram_accounts` / `reels` / `reel_scores`, manual sync, and webhook subscription. TikTok integration is Post-MVP (Phase 11).
* **The Hook Moat (Strategic Insight):** Surfacing Instagram Graph API `reels_skip_rate` (stored as `reels.skip_rate`) as *Strategic Skip Resistance* to mathematically dissect opening hooks.
* **9-Dimension Scoring Engine:** Fully customized GPT-4o analytics model mapping hooks, visual pacing, structural retention, and captions.
* **Profitable Strategy Generation:** Beautiful interactive calendars, automated posting schedules, and personalized copy generation.
* **Cost-Optimized Architecture:** Strict monthly LLM budget caps and mathematical heuristic fallbacks to ensure sustainable **>90% Gross Margins**.

---

## 🛠️ Technology Stack

1. **Frontend:** Next.js 16 (App Router), React 19, Framer Motion, and Tailwind CSS.
2. **Backend & DB:** Supabase SSR Auth, PostgreSQL with Drizzle ORM, and database-level `SKIP LOCKED` job queue.
3. **External Integrations:**
   - Meta Graph API (v22.0+)
   - TikTok Display API (v2)
   - OpenAI API (GPT-4o & GPT-4o-mini)
   - Stripe API (Dynamic checkout & billing portal)
   - Resend API (Transactional notification mailers)

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and fill in the required keys:
```bash
cp .env.example .env
```

Ensure the following variables are configured:
* `DATABASE_URL` (Supabase Postgres Connection)
* `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `OPENAI_API_KEY` (AI Engine)
* `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
* `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, and `INSTAGRAM_REDIRECT_URI` (callback: `/api/auth/social/instagram/callback`)

**Key Instagram API routes (MVP):**
* `POST /api/auth/social/instagram` — start OAuth (returns `{ authUrl }`)
* `GET /api/accounts` — list connected `instagram_accounts`
* `GET /api/accounts/:id/reels` — list ingested Reels
* `GET|POST /api/reels/:id/score` — fetch or trigger scoring
* `POST /api/accounts/:id/sync` — manual sync (5-minute cooldown)
* `POST /api/accounts/demo` — sandbox demo (`alice_reels` seed)

### 2. Install Dependencies & Build
Install workspace dependencies and verify compilation and code quality:
```bash
npm install
npm run typecheck
npm run lint
```

### 3. Run Development Server
Boot up the next.js dashboard:
```bash
npm run dev
```

Trendoraa is now running on [http://localhost:3000](http://localhost:3000).

### 4. Local development credentials

The login page (`app/(auth)/login/page.tsx`) ships with two one-click presets that auto-fill the form with seeded demo accounts:

| Preset | Email | Password |
| :--- | :--- | :--- |
| User A | `userA@example.com` | `password123` |
| User B | `userB@example.com` | `password123` |

These accounts are populated by `lib/db/seed.ts` and exist purely so contributors can sign in immediately without provisioning Supabase users by hand. After login, use **Use sandbox demo** on the home onboarding wizard or `/accounts` empty state (`POST /api/accounts/demo`) to attach the pre-seeded `alice_reels` profile — see `docs/instagram-setup.md` §8.

> [!WARNING]
> **Development-only.** These presets MUST be removed — or gated behind `process.env.NODE_ENV !== 'production'` — before deploying to any internet-reachable environment. Shipping the buttons (or the seeded passwords) to production would expose a trivial credential-stuffing target.

---

## 🛡️ Architecture & Boundaries

Trendoraa is engineered under strict architectural constraints to ensure stability, performance, and security:
- **No Heavy Message Brokers:** Background processing runs entirely on PostgreSQL `SKIP LOCKED` worker queues to keep infrastructure lightweight and maintainable.
- **Strict Module Isolation:** The billing system is completely isolated and never imports from the ingestion, queue, or AI engine modules to maintain high security bounds.
- **Circuit Breakers:** All third-party outbound APIs are shielded by resilient circuit breakers.

---

*This repository is engineered in compliance with the Trendoraa canonical specifications and execution playbooks.*
