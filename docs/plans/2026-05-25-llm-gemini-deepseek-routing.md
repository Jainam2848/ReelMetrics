# LLM Stack Migration (Gemini Flash + DeepSeek Routing) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reconfigure Trendoraa's AI layer to route tasks across Google Gemini and DeepSeek model candidates, eliminating the OpenAI dependency while maintaining robust, rate-limit-aware fallback channels.

**Architecture:** We will replace the static, direct LLM call sites with a resilient candidate-based fallback client. When an AI pipeline triggers, the router resolves an ordered list of viable model configurations. The fallback wrapper queries each candidate in succession, dynamically detecting provider-specific rate limits and schema parse failures, before sliding into heuristic mock operations on total exhaustion.

**Tech Stack:** Next.js (App Router), TypeScript, Google Gemini REST API, DeepSeek OpenAI-compatible Client, Recharts, Zod, Drizzle ORM.

---

### Task 1: Extend Model Configs & Provider availability

**Files:**
- Modify: `lib/ai/model-router.ts`

**Step 1: Edit Types & Configurations**
Update the file to add `deepseek-chat`, `deepseek-reasoner`, and `gemini-2.5-flash` model IDs, configure their exact per-1K USD pricing, and update the routing tables. Remove `gpt-4o` and `gpt-4o-mini`.

```typescript
export type ModelId =
  | "gemini-2.0-flash"
  | "gemini-2.5-flash"
  | "deepseek-chat"
  | "deepseek-reasoner";
```

**Step 2: Implement Candidate Utility**
Implement `getModelCandidates(operation: OperationType, tier: ModelTier): ModelId[]` mapping the workload requirements exactly:
- `batch_scoring`: `gemini-2.0-flash` -> `deepseek-chat`
- `scoring`: `deepseek-chat` -> `gemini-2.0-flash`
- `strategy`: Standard -> `deepseek-chat` -> `gemini-2.5-flash` -> `gemini-2.0-flash`; Premium -> `deepseek-reasoner` -> `deepseek-chat` -> `gemini-2.5-flash`
- `analysis`: `deepseek-chat` -> `gemini-2.5-flash` -> `gemini-2.0-flash`

**Step 3: Update Provider Config checks**
Verify availability by checking:
- `gemini`: `GEMINI_API_KEY`
- `deepseek`: `DEEPSEEK_API_KEY`
Remove `OPENAI_API_KEY` requirement from `isAnyLlmProviderConfigured()`.

**Step 4: Verify typecheck**
Run: `node d:\Desktop\reel-logic-ai\node_modules\typescript\bin\tsc -p d:\Desktop\reel-logic-ai\tsconfig.json --noEmit`
Expected: PASS

**Step 5: Commit**
```bash
git add lib/ai/model-router.ts
git commit -m "feat: upgrade model router configurations and candidates routing table"
```

---

### Task 2: Update LLM Client Providers

**Files:**
- Modify: `lib/ai/llm-client.ts`

**Step 1: Update Provider Calls**
- Map `deepseek-chat` -> `"deepseek-chat"` API model ID.
- Map `deepseek-reasoner` -> `"deepseek-reasoner"` API model ID.
- Enable `gemini-2.5-flash` support inside `callGemini`.
- Deprecate or throw on `callOpenAI` to avoid leaks.

**Step 2: Standardize Rate-Limit Recognition**
Catch raw API responses and if status is 429 or body contains rate limit messages, throw a standardized error so the wrapper can easily intercept it.

**Step 3: Verify typecheck**
Run: `node d:\Desktop\reel-logic-ai\node_modules\typescript\bin\tsc -p d:\Desktop\reel-logic-ai\tsconfig.json --noEmit`
Expected: PASS

**Step 4: Commit**
```bash
git add lib/ai/llm-client.ts
git commit -m "feat: configure client endpoints for DeepSeek chats and Gemini Flash v2.5"
```

---

### Task 3: Implement Resilient Fallback Wrapper

**Files:**
- Create: `lib/ai/llm-with-fallback.ts`

**Step 1: Write Fallback Loop Logic**
Write `callLLMWithFallback<T>` executing candidate models sequentially (max 3), skipping Gemini if the process rate limiter is restricted, and running a single JSON schema repair request on parse failure.

**Step 2: Export client types**
Expose input parameters and output results with cost and token usages.

**Step 3: Verify typecheck**
Run: `node d:\Desktop\reel-logic-ai\node_modules\typescript\bin\tsc -p d:\Desktop\reel-logic-ai\tsconfig.json --noEmit`
Expected: PASS

**Step 4: Commit**
```bash
git add lib/ai/llm-with-fallback.ts
git commit -m "feat: implement candidate-loop fallback client wrapper with auto-repair"
```

---

### Task 4: Connect Services & ground prompts

**Files:**
- Modify: `lib/services/scoring.service.ts`
- Modify: `lib/services/strategy.service.ts`
- Modify: `lib/services/trends.service.ts`
- Modify: `lib/ai/prompts/index.ts`
- Modify: `lib/ai/prompts/trends.ts`

**Step 1: Connect Ingestion & Scoring**
Integrate `callLLMWithFallback` in `runScoringPipeline`, routing to `batch_scoring` for reels older than 48 hours.

**Step 2: Connect Strategy & Trends**
Integrate `callLLMWithFallback` in `generateStrategy` and `runAnalysis`. Limit Daily cron costs in `refreshGlobalTrendsFeed` by explicitly passing a standard candidate list.

**Step 3: Ground Prompts**
Inject metrics-limiting guidelines into prompt templates:
- *"Use ONLY metrics provided; never invent statistics."*
- *"Output must validate against the Zod schema exactly."*

**Step 4: Verify typecheck**
Run: `node d:\Desktop\reel-logic-ai\node_modules\typescript\bin\tsc -p d:\Desktop\reel-logic-ai\tsconfig.json --noEmit`
Expected: PASS

**Step 5: Commit**
```bash
git add lib/services/scoring.service.ts lib/services/strategy.service.ts lib/services/trends.service.ts lib/ai/prompts/index.ts lib/ai/prompts/trends.ts
git commit -m "feat: connect core services to fallback wrapper and ground prompts with constraints"
```

---

### Task 5: Upgrade Env, CSP, and Documentation

**Files:**
- Modify: `lib/env.ts`
- Modify: `.env.example`
- Modify: `middleware.ts`
- Create: `docs/plans/2026-05-25-llm-routing.md`

**Step 1: Refine Environment Keys**
- Change `OPENAI_API_KEY` to `.optional()`.
- Add cross-field checks at boot verifying at least one of `GEMINI_API_KEY` or `DEEPSEEK_API_KEY` exists.

**Step 2: Update CSP Headers**
Add `generativelanguage.googleapis.com` and `api.deepseek.com` inside `connect-src` in `middleware.ts`. Remove `api.openai.com`.

**Step 3: Write routing documentation**
Write the comprehensive markdown reference document.

**Step 4: Verify typecheck**
Run: `node d:\Desktop\reel-logic-ai\node_modules\typescript\bin\tsc -p d:\Desktop\reel-logic-ai\tsconfig.json --noEmit`
Expected: PASS

**Step 5: Commit**
```bash
git add lib/env.ts .env.example middleware.ts docs/plans/2026-05-25-llm-routing.md
git commit -m "feat: adjust environment key constraints, CSP headers, and document routing rules"
```

---

### Task 6: Create Evaluation Test Harness & Verify

**Files:**
- Create: `scripts/eval-llm-routing.ts`

**Step 1: Write dry-run evaluations**
Implement manual validation test scoring and strategy pipelines, reporting the winning models, execution costs, and latencies.

**Step 2: Verify typecheck**
Run: `node d:\Desktop\reel-logic-ai\node_modules\typescript\bin\tsc -p d:\Desktop\reel-logic-ai\tsconfig.json --noEmit`
Expected: PASS

**Step 3: Commit**
```bash
git add scripts/eval-llm-routing.ts
git commit -m "test: add dry-run verification harness for LLM operations"
```
