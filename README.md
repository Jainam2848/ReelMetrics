# 🌟 Trendoraa — AI-Powered Short-Form Video Strategy Engine

Welcome to **Trendoraa**, the state-of-the-art AI-powered short-form video optimization platform. Trendoraa automates short-form video analysis (Instagram Reels & TikTok Videos), scores each post across 9 structural dimensions, and outputs custom posting calendars and weekly strategies.

By shifting workflows from intuitive guessing to highly tailored, data-backed strategy, Trendoraa establishes an elite content performance optimization engine for creators, social media managers, and agencies.

---

## ✨ Features

* **Unified Cross-Platform Ingestion:** Dynamic OAuth2 integrations for Meta Graph API (Instagram Reels) and TikTok Display API (TikTok Videos).
* **The Hook Moat (Strategic Insight):** Surfacing Instagram `reels_skip_rate` as *Strategic Skip Resistance* and TikTok `completion_rate` as *Strategic Video Completion Retention Index* to mathematically dissect opening hooks.
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
* `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, and `TIKTOK_REDIRECT_URI`
* `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, and `INSTAGRAM_REDIRECT_URI`

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

---

## 🛡️ Architecture & Boundaries

Trendoraa is engineered under strict architectural constraints to ensure stability, performance, and security:
- **No Heavy Message Brokers:** Background processing runs entirely on PostgreSQL `SKIP LOCKED` worker queues to keep infrastructure lightweight and maintainable.
- **Strict Module Isolation:** The billing system is completely isolated and never imports from the ingestion, queue, or AI engine modules to maintain high security bounds.
- **Circuit Breakers:** All third-party outbound APIs are shielded by resilient circuit breakers.

---

*This repository is engineered in compliance with the Trendoraa canonical specifications and execution playbooks.*
