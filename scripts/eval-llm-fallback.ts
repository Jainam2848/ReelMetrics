/**
 * Trendoraa — Resilient LLM Fallback Unit Test Suite.
 *
 * Runs deterministic unit tests on the fallback loop, rate limit recognition,
 * schema repairs, and age-based scoring routing without any live network calls.
 *
 * Run with: npx tsx scripts/eval-llm-fallback.ts
 */

import { z } from "zod";
import { callLLMWithFallback } from "../lib/ai/llm-with-fallback";
import { isRecentPost, getModelCandidates, resolveEffectiveOperation } from "../lib/ai/model-router";

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

// ── Mock Schema ────────────────────────────────────────────────────────────

const TestSchema = z.object({
  success: z.boolean(),
  val: z.number(),
});

type TestData = z.infer<typeof TestSchema>;

// ── Main Test Suite ────────────────────────────────────────────────────────

async function runFallbackTests() {
  section("1. Age-Based Ingestion Routing Checks");
  {
    const now = new Date();
    const recentDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h old
    const oldDate = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 72h old

    // Case 1: Scoring with recent post => should NOT route to batch_scoring
    const recentOp = resolveEffectiveOperation("scoring", recentDate);
    assert(
      recentOp === "scoring",
      "resolveEffectiveOperation keeps 'scoring' for a 24h-old post"
    );
    const recentCandidates = getModelCandidates(recentOp, "standard");
    assert(
      recentCandidates[0] === "deepseek-chat",
      "First candidate for recent post scoring is 'deepseek-chat'"
    );

    // Case 2: Scoring with older post (> 48h) => should route to batch_scoring
    const oldOp = resolveEffectiveOperation("scoring", oldDate);
    assert(
      oldOp === "batch_scoring",
      "resolveEffectiveOperation routes older post (> 48h) to 'batch_scoring'"
    );
    const oldCandidates = getModelCandidates(oldOp, "standard");
    assert(
      oldCandidates[0] === "gemini-2.0-flash",
      "First candidate for older post scoring is 'gemini-2.0-flash' (batch order)"
    );
  }

  // Force environment keys so that isModelAvailable passes in fallback wrapper
  const savedGemini = process.env.GEMINI_API_KEY;
  const savedDeepSeek = process.env.DEEPSEEK_API_KEY;
  process.env.GEMINI_API_KEY = "mock-gemini-key";
  process.env.DEEPSEEK_API_KEY = "mock-deepseek-key";

  section("2. Resilient Retries & Fallback Loop Mocks");
  {
    // Case 3: Mock model 1 timeout, model 2 success
    // First candidate (deepseek-chat) fails with timeout; second (gemini-2.0-flash) succeeds.
    let deepseekCalled = false;
    let geminiCalled = false;

    const mockTimeoutImpl = async (params: any): Promise<any> => {
      if (params.model.id === "deepseek-chat") {
        deepseekCalled = true;
        return {
          success: false,
          error: "LLM call timed out after 30000ms",
          modelId: "deepseek-chat",
        };
      }
      if (params.model.id === "gemini-2.0-flash") {
        geminiCalled = true;
        return {
          success: true,
          data: { success: true, val: 42 },
          tokensUsed: 1500,
          costUsd: 0.0003,
          latencyMs: 120,
          modelId: "gemini-2.0-flash",
        };
      }
      return { success: false, error: "Mock not matched", modelId: params.model.id };
    };

    const response = await callLLMWithFallback({
      operation: "scoring",
      modelTier: "standard",
      prompt: "test",
      outputSchema: TestSchema,
      callLLMImpl: mockTimeoutImpl as any,
    });

    assert(response.success === true, "Task succeeds when fallback model succeeds");
    assert(deepseekCalled, "First model 'deepseek-chat' was attempted");
    assert(geminiCalled, "Second model 'gemini-2.0-flash' was successfully run as fallback");
    if (response.success) {
      assert(response.modelId === "gemini-2.0-flash", "Winning model is the second candidate");
      assert(response.attempts.includes("deepseek-chat"), "Attempts tracks deepseek-chat");
      assert(response.attempts.includes("gemini-2.0-flash"), "Attempts tracks gemini-2.0-flash");
    }
  }

  section("3. In-flight Schema Repair Mock");
  {
    // Case 4: Mock model 1 schema error, repair succeeds
    let firstCall = true;
    let repairCall = false;

    const mockSchemaRepairSuccessImpl = async (params: any): Promise<any> => {
      if (params.model.id === "deepseek-chat") {
        if (firstCall) {
          firstCall = false;
          return {
            success: false,
            error: "AI output schema validation error",
            modelId: "deepseek-chat",
          };
        }
        if (params.prompt.includes("[SYSTEM REPAIR NOTE]")) {
          repairCall = true;
          return {
            success: true,
            data: { success: true, val: 99 },
            tokensUsed: 1600,
            costUsd: 0.00035,
            latencyMs: 250,
            modelId: "deepseek-chat",
          };
        }
      }
      return { success: false, error: "Mock not matched", modelId: params.model.id };
    };

    const response = await callLLMWithFallback({
      operation: "scoring",
      modelTier: "standard",
      prompt: "test",
      outputSchema: TestSchema,
      callLLMImpl: mockSchemaRepairSuccessImpl as any,
    });

    assert(response.success === true, "Task succeeds when schema repair succeeds");
    assert(repairCall, "Schema repair request was successfully triggered on same model");
    if (response.success) {
      assert(response.modelId === "deepseek-chat", "Winning model is still deepseek-chat");
      assert(response.attempts.length === 1, "Only a single candidate attempted");
    }
  }

  section("4. Schema Repair Fails, Next Candidate Resolves");
  {
    // Case 5: Mock model 1 schema error, repair fails, model 2 success
    let firstCall = true;
    let repairCall = false;
    let geminiCalled = false;

    const mockSchemaRepairFailureImpl = async (params: any): Promise<any> => {
      if (params.model.id === "deepseek-chat") {
        if (firstCall) {
          firstCall = false;
          return {
            success: false,
            error: "AI output schema validation error",
            modelId: "deepseek-chat",
          };
        }
        if (params.prompt.includes("[SYSTEM REPAIR NOTE]")) {
          repairCall = true;
          return {
            success: false,
            error: "AI output schema validation error",
            modelId: "deepseek-chat",
          };
        }
      }
      if (params.model.id === "gemini-2.0-flash") {
        geminiCalled = true;
        return {
          success: true,
          data: { success: true, val: 88 },
          tokensUsed: 1200,
          costUsd: 0.0002,
          latencyMs: 80,
          modelId: "gemini-2.0-flash",
        };
      }
      return { success: false, error: "Mock not matched", modelId: params.model.id };
    };

    const response = await callLLMWithFallback({
      operation: "scoring",
      modelTier: "standard",
      prompt: "test",
      outputSchema: TestSchema,
      callLLMImpl: mockSchemaRepairFailureImpl as any,
    });

    assert(response.success === true, "Task succeeds on fallback when first model repair fails");
    assert(repairCall, "Schema repair was triggered and failed on deepseek-chat");
    assert(geminiCalled, "Fallback model gemini-2.0-flash was successfully called");
    if (response.success) {
      assert(response.modelId === "gemini-2.0-flash", "Winning model is gemini-2.0-flash");
      assert(response.attempts.length === 2, "Exactly two candidates were attempted");
    }
  }

  section("5. Rate Limit Skips Schema Repair");
  {
    // Case 6: Mock model 1 isRateLimit, model 2 success.
    // Should NOT trigger schema repair on model 1, but slide immediately.
    let deepseekCalled = false;
    let repairTriggered = false;
    let geminiCalled = false;

    const mockRateLimitImpl = async (params: any): Promise<any> => {
      if (params.model.id === "deepseek-chat") {
        deepseekCalled = true;
        if (params.prompt.includes("[SYSTEM REPAIR NOTE]")) {
          repairTriggered = true;
        }
        return {
          success: false,
          error: "Rate limit exceeded (HTTP 429)",
          modelId: "deepseek-chat",
          isRateLimit: true,
        };
      }
      if (params.model.id === "gemini-2.0-flash") {
        geminiCalled = true;
        return {
          success: true,
          data: { success: true, val: 77 },
          tokensUsed: 1000,
          costUsd: 0.00018,
          latencyMs: 75,
          modelId: "gemini-2.0-flash",
        };
      }
      return { success: false, error: "Mock not matched", modelId: params.model.id };
    };

    const response = await callLLMWithFallback({
      operation: "scoring",
      modelTier: "standard",
      prompt: "test",
      outputSchema: TestSchema,
      callLLMImpl: mockRateLimitImpl as any,
    });

    assert(response.success === true, "Task succeeds on fallback model when rate limited");
    assert(deepseekCalled, "First model deepseek-chat was attempted");
    assert(!repairTriggered, "Schema repair was NOT triggered on rate limited candidate");
    assert(geminiCalled, "Bypassed directly to gemini-2.0-flash fallback model");
  }

  section("6. Exhaustive Fallback Failures");
  {
    // Case 7: Mock all models fail
    const mockAllFailedImpl = async (params: any): Promise<any> => {
      return {
        success: false,
        error: "Fatal model error",
        modelId: params.model.id,
      };
    };

    const response = await callLLMWithFallback({
      operation: "scoring",
      modelTier: "standard",
      prompt: "test",
      outputSchema: TestSchema,
      callLLMImpl: mockAllFailedImpl as any,
    });

    assert(response.success === false, "Returns success: false when all models fail");
    if (!response.success) {
      assert(response.attempts.length > 0, "Attempts record the tried candidate models");
    }
  }

  section("7. Environment Sentinel Check (No API Keys)");
  {
    // Case 8: No API keys configured in process.env
    delete process.env.GEMINI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;

    const mockPassImpl = async (params: any): Promise<any> => {
      return {
        success: true,
        data: { success: true, val: 100 },
        modelId: params.model.id,
      };
    };

    const response = await callLLMWithFallback({
      operation: "scoring",
      modelTier: "standard",
      prompt: "test",
      outputSchema: TestSchema,
      callLLMImpl: mockPassImpl as any,
    });

    assert(response.success === false, "Returns success: false immediately when no keys configured");
    if (!response.success) {
      assert(response.attempts.length === 0, "No attempts are made when keys are completely missing");
    }
  }

  // Restore original keys
  if (savedGemini) process.env.GEMINI_API_KEY = savedGemini;
  else delete process.env.GEMINI_API_KEY;

  if (savedDeepSeek) process.env.DEEPSEEK_API_KEY = savedDeepSeek;
  else delete process.env.DEEPSEEK_API_KEY;

  // ── Results Summary ──────────────────────────────────────────────────────

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Fallback Unit Tests Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log("\nFailed unit tests:");
    for (const f of failures) {
      console.log(`  ❌ ${f}`);
    }
    process.exit(1);
  } else {
    console.log("\n✅ All fallback unit tests successfully passed!");
    process.exit(0);
  }
}

runFallbackTests();
