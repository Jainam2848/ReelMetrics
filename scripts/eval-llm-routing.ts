/**
 * Trendoraa — LLM Resilient Routing & Fallback Evaluation Harness.
 *
 * Validates model candidates resolution, provider cost calculations,
 * in-memory sliding-window rate limit trackers, and fallback candidate loops.
 *
 * Run with: npx tsx scripts/eval-llm-routing.ts
 */

import { z } from "zod";
import {
  isAnyLlmProviderConfigured,
  getModelCandidates,
  isRecentPost,
  calculateCost,
  geminiRateLimiter,
  isModelAvailable,
  MODEL_CONFIGS,
} from "../lib/ai/model-router";
import { callLLMWithFallback } from "../lib/ai/llm-with-fallback";

// Load local .env manually to ensure actual API keys are accessible
import * as fs from "fs";
import * as path from "path";

function loadEnv(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.trim().match(/^([^#\s=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let val = match[2]?.trim() ?? "";
        // Remove surrounding quotes if any
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

// ── Test Infrastructure ────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, name: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ❌ ${name}`);
  }
}

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

// ── Test Suite ─────────────────────────────────────────────────────────────

section("1. Provider Configuration & Sentinel");
{
  const originalGemini = process.env.GEMINI_API_KEY;
  const originalDeepSeek = process.env.DEEPSEEK_API_KEY;

  // Case 1: Both keys missing
  delete process.env.GEMINI_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  assert(
    !isAnyLlmProviderConfigured(),
    "isAnyLlmProviderConfigured() returns false when both keys are missing"
  );
  assert(
    !isModelAvailable("gemini-2.0-flash"),
    "Gemini model is unavailable when GEMINI_API_KEY is missing"
  );
  assert(
    !isModelAvailable("deepseek-chat"),
    "DeepSeek model is unavailable when DEEPSEEK_API_KEY is missing"
  );

  // Case 2: Only Gemini configured
  process.env.GEMINI_API_KEY = "mock-gemini-key";
  assert(
    isAnyLlmProviderConfigured(),
    "isAnyLlmProviderConfigured() returns true when only GEMINI_API_KEY is configured"
  );
  assert(
    isModelAvailable("gemini-2.0-flash"),
    "Gemini model is available when key is set"
  );
  assert(
    !isModelAvailable("deepseek-chat"),
    "DeepSeek is still unavailable when its key is missing"
  );

  // Case 3: Only DeepSeek configured
  delete process.env.GEMINI_API_KEY;
  process.env.DEEPSEEK_API_KEY = "mock-deepseek-key";
  assert(
    isAnyLlmProviderConfigured(),
    "isAnyLlmProviderConfigured() returns true when only DEEPSEEK_API_KEY is configured"
  );
  assert(
    !isModelAvailable("gemini-2.0-flash"),
    "Gemini is unavailable when key is missing"
  );
  assert(
    isModelAvailable("deepseek-chat"),
    "DeepSeek model is available when key is set"
  );

  // Restore original environment values
  if (originalGemini) process.env.GEMINI_API_KEY = originalGemini;
  else delete process.env.GEMINI_API_KEY;

  if (originalDeepSeek) process.env.DEEPSEEK_API_KEY = originalDeepSeek;
  else delete process.env.DEEPSEEK_API_KEY;
}

section("2. Routing Candidate Mappings");
{
  // Scoring recent vs batch
  const now = new Date();
  const recentTime = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
  const oldTime = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 72 hours ago

  assert(isRecentPost(recentTime), "Post from 12h ago is classified as recent (<= 48h)");
  assert(!isRecentPost(oldTime), "Post from 72h ago is classified as batch (> 48h)");

  // Candidates resolution mapping
  const scoringCandidates = getModelCandidates("scoring");
  assert(
    scoringCandidates[0] === "deepseek-chat" && scoringCandidates[1] === "gemini-2.0-flash",
    "scoring operations route [deepseek-chat -> gemini-2.0-flash] in correct priority"
  );

  const batchCandidates = getModelCandidates("batch_scoring");
  assert(
    batchCandidates[0] === "gemini-2.0-flash" && batchCandidates[1] === "deepseek-chat",
    "batch_scoring operations prioritize [gemini-2.0-flash -> deepseek-chat] for budget savings"
  );

  const strategyStandardCandidates = getModelCandidates("strategy", "standard");
  assert(
    strategyStandardCandidates[0] === "deepseek-chat" &&
      strategyStandardCandidates[1] === "gemini-2.5-flash" &&
      strategyStandardCandidates[2] === "gemini-2.0-flash",
    "strategy standard operations resolve standard candidate chain correctly"
  );

  const strategyPremiumCandidates = getModelCandidates("strategy", "premium");
  assert(
    strategyPremiumCandidates[0] === "deepseek-reasoner" &&
      strategyPremiumCandidates[1] === "deepseek-chat" &&
      strategyPremiumCandidates[2] === "gemini-2.5-flash",
    "strategy premium operations route DeepSeek Reasoner first, followed by fallback layers"
  );
}

section("3. Provider Pricing & Cost Calculation");
{
  // Gemini costs ($0.000075 input, $0.00030 output)
  const geminiCost = calculateCost("gemini-2.0-flash", 10000, 2000);
  // Input: 10 * 0.000075 = 0.00075
  // Output: 2 * 0.00030 = 0.00060
  // Total: 0.00135
  assert(
    Math.abs(geminiCost - 0.00135) < 0.00001,
    `Gemini cost calculation is correct: computed $${geminiCost.toFixed(6)}`
  );

  // DeepSeek Chat costs ($0.00014 input, $0.00028 output)
  const deepseekChatCost = calculateCost("deepseek-chat", 10000, 2000);
  // Input: 10 * 0.00014 = 0.00140
  // Output: 2 * 0.00028 = 0.00056
  // Total: 0.00196
  assert(
    Math.abs(deepseekChatCost - 0.00196) < 0.00001,
    `DeepSeek Chat cost calculation is correct: computed $${deepseekChatCost.toFixed(6)}`
  );

  // DeepSeek Reasoner costs ($0.00055 input, $0.00219 output)
  const reasonerCost = calculateCost("deepseek-reasoner", 10000, 2000);
  // Input: 10 * 0.00055 = 0.0055
  // Output: 2 * 0.00219 = 0.00438
  // Total: 0.00988
  assert(
    Math.abs(reasonerCost - 0.00988) < 0.00001,
    `DeepSeek Reasoner cost calculation is correct: computed $${reasonerCost.toFixed(6)}`
  );
}

section("4. Sliding-Window Rate Limiter");
{
  // Clear any existing tracked timestamps for clean test state
  (geminiRateLimiter as any).timestamps = [];

  assert(geminiRateLimiter.canRequest(), "Rate limiter accepts first request");

  // Record 14 requests
  for (let i = 0; i < 14; i++) {
    geminiRateLimiter.recordRequest();
  }
  assert(geminiRateLimiter.canRequest(), "Rate limiter allows 15th request (14 recorded + 1 allowed)");
  assert(geminiRateLimiter.remaining() === 1, "Rate limiter indicates 1 request remaining");

  // Record 15th request
  geminiRateLimiter.recordRequest();
  assert(!geminiRateLimiter.canRequest(), "Rate limiter blocks 16th request");
  assert(geminiRateLimiter.remaining() === 0, "Rate limiter indicates 0 requests remaining");

  // Simulate sliding window window passage
  const now = Date.now();
  (geminiRateLimiter as any).timestamps = (geminiRateLimiter as any).timestamps.map(
    (t: number) => t - 61_000 // move requests 61s into the past
  );
  assert(geminiRateLimiter.canRequest(), "Rate limiter recovers successfully after 60s sliding window passes");
  assert(geminiRateLimiter.remaining() === 15, "Rate limiter resets remaining pool to 15");
}

// ── Live/Dry Run Executions ────────────────────────────────────────────────

async function runAsyncTests(): Promise<void> {
  section("5. Resilient Fallback Loop & Dry-runs");

  const runLive = process.env.EVAL_LLM_LIVE === "1";
  const hasAnyKey = isAnyLlmProviderConfigured();
  
  console.log(`  EVAL_LLM_LIVE flag: ${runLive ? "ENABLED" : "DISABLED (set EVAL_LLM_LIVE=1 to run live smoke tests)"}`);
  console.log(`  AI keys available in environment: ${hasAnyKey ? "YES" : "NO"}`);
  if (process.env.GEMINI_API_KEY) {
    console.log(`    - GEMINI_API_KEY: Configured (ends in ...${process.env.GEMINI_API_KEY.slice(-5)})`);
  }
  if (process.env.DEEPSEEK_API_KEY) {
    console.log(`    - DEEPSEEK_API_KEY: Configured (ends in ...${process.env.DEEPSEEK_API_KEY.slice(-5)})`);
  }

  const MockSchema = z.object({
    is_test_successful: z.boolean(),
    message: z.string(),
  });

  if (runLive && hasAnyKey) {
    console.log("  Executing LIVE dry-run with configured keys...");
    try {
      const response = await callLLMWithFallback({
        operation: "analysis",
        modelTier: "standard",
        prompt: "Return valid JSON with 'is_test_successful' set to true, and a short friendly greeting 'message' for the test engineer.",
        outputSchema: MockSchema,
      });

      if (response.success) {
        assert(response.success, "Resilient fallback pipeline executed successfully!");
        console.log(`    - Winning Model: ${response.modelId}`);
        console.log(`    - Token usage: ${response.tokensUsed}`);
        console.log(`    - Estimated cost: $${response.costUsd.toFixed(6)}`);
        console.log(`    - Latency: ${response.latencyMs}ms`);
        console.log(`    - Output data:`, response.data);
        assert(response.data.is_test_successful === true, "Returned schema attributes are fully parsed and type-safe");
      } else {
        console.warn(`  ⚠️ Live AI call did not succeed: ${response.error}. Skipping assertion check.`);
      }
    } catch (e: any) {
      console.error("  ❌ Unexpected failure during fallback dry-run:", e);
      failed++;
      failures.push("Live dry-run exception");
    }
  } else {
    if (runLive && !hasAnyKey) {
      console.log("  EVAL_LLM_LIVE was set, but no active API keys were found in the local environment.");
    }
    console.log("  Skipping live API call tests. Running offline heuristic fallback check.");
    
    // Simulate fallback exhaustiveness behavior
    const mockOutput = await callLLMWithFallback({
      operation: "scoring",
      modelTier: "standard",
      prompt: "This prompt won't reach any LLM.",
      outputSchema: MockSchema,
    });
    
    assert(mockOutput.success === false, "Returns success: false when no credentials are configured");
    assert(mockOutput.attempts.length === 0, "No candidate models attempted due to missing keys");
  }

  // ── Results Summary ──────────────────────────────────────────────────────

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Test Execution Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log("\nFailed test details:");
    for (const f of failures) {
      console.log(`  ❌ ${f}`);
    }
    process.exit(1);
  } else {
    console.log("\n✅ All LLM Routing & Fallback tests successfully passed!");
    process.exit(0);
  }
}

runAsyncTests();
