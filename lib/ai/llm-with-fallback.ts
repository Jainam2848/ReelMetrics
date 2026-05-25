/**
 * Trendoraa — LLM Resilient Fallback Wrapper.
 *
 * Implements a robust candidate-based fallback loop across configured LLMs.
 * Loops through resolved candidates, handles sliding window rate limits,
 * captures API issues, and runs an inline schema repair prompt.
 *
 * @module llm-with-fallback
 */

import { z } from "zod";
import type { ModelId, OperationType, ModelTier } from "./model-router";
import {
  MODEL_CONFIGS,
  getModelCandidates,
  geminiRateLimiter,
  isModelAvailable,
  resolveEffectiveOperation,
} from "./model-router";
import { callLLMPure } from "./llm-client";

export interface FallbackCallParams<T> {
  operation: OperationType;
  modelTier?: ModelTier;
  postedAt?: Date | string; // For older posts scoring age routing
  prompt: string;
  outputSchema: z.ZodSchema<T>;
  maxTokens?: number;
  temperature?: number;
  /** Test-only: inject mock client implementation instead of callLLMPure. */
  callLLMImpl?: typeof callLLMPure;
}

export type FallbackCallResult<T> =
  | {
      success: true;
      data: T;
      modelId: ModelId;
      tokensUsed: number;
      costUsd: number;
      latencyMs: number;
      attempts: ModelId[];
    }
  | {
      success: false;
      error: string;
      attempts: ModelId[];
    };

/**
 * Executes a resilient LLM call, sliding through candidate options before giving up.
 */
export async function callLLMWithFallback<T>(
  params: FallbackCallParams<T>
): Promise<FallbackCallResult<T>> {
  const {
    operation,
    modelTier = "standard",
    postedAt,
    prompt,
    outputSchema,
    maxTokens,
    temperature,
    callLLMImpl = callLLMPure,
  } = params;

  const startTime = Date.now();
  const effectiveOperation = resolveEffectiveOperation(operation, postedAt);
  const candidates = getModelCandidates(effectiveOperation, modelTier);
  const attempts: ModelId[] = [];

  // Limit loop to at most 3 candidate models to prevent runaway latency
  const modelQueue = candidates.slice(0, 3);

  for (const modelId of modelQueue) {
    const config = MODEL_CONFIGS[modelId];

    // Ensure model's API key is configured
    if (!isModelAvailable(modelId)) {
      continue;
    }

    // Verify rate limit availability for Gemini process tracker
    if (config.provider === "gemini" && !geminiRateLimiter.canRequest()) {
      console.warn(`[llm-fallback] Sliding past ${modelId} - local rate limiter saturated`);
      continue;
    }

    attempts.push(modelId);

    console.log(`[llm-fallback] Attempting execution on candidate: ${modelId}`);

    const result = await callLLMImpl({
      prompt,
      outputSchema,
      model: config,
      maxTokens,
      temperature,
    });

    // If success, return immediately and record Gemini RPM
    if (result.success) {
      if (config.provider === "gemini") {
        geminiRateLimiter.recordRequest();
      }
      return {
        success: true,
        data: result.data,
        modelId,
        tokensUsed: result.tokensUsed,
        costUsd: result.costUsd,
        latencyMs: Date.now() - startTime,
        attempts,
      };
    }

    // Rate Limit or general API failure: slide gracefully to the next candidate model
    if (result.isRateLimit) {
      console.warn(`[llm-fallback] Candidate ${modelId} failed due to rate limit (isRateLimit = true). Sliding without repair.`);
    } else if (result.error === "AI output schema validation error") {
      // Schema Validation Failure: run a SINGLE repair prompt on the same model
      console.warn(`[llm-fallback] Schema validation mismatch on ${modelId}. Triggering repair prompt...`);
      
      const repairPrompt = `${prompt}\n\n[SYSTEM REPAIR NOTE]\nYour previous response was invalid JSON or did not match the required Zod schema. Return ONLY valid JSON matching the schema precisely. No markdown formatting, no code block backticks (e.g. \`\`\`json), no pre-amble.`;

      const repairResult = await callLLMImpl({
        prompt: repairPrompt,
        outputSchema,
        model: config,
        maxTokens,
        temperature,
      });

      if (repairResult.success) {
        console.log(`[llm-fallback] Schema repair successful on ${modelId}`);
        if (config.provider === "gemini") {
          geminiRateLimiter.recordRequest();
        }
        return {
          success: true,
          data: repairResult.data,
          modelId,
          tokensUsed: repairResult.tokensUsed,
          costUsd: repairResult.costUsd,
          latencyMs: Date.now() - startTime,
          attempts,
        };
      }
      
      console.error(`[llm-fallback] Schema repair failed on ${modelId}: ${repairResult.error}`);
    }

    // Log failure and slide
    console.warn(`[llm-fallback] Candidate ${modelId} failed: ${result.error}. Sliding to next model.`);
  }

  // All candidates exhausted
  console.error(`[llm-fallback] All candidate models exhausted for operation '${operation}'`);
  return {
    success: false,
    error: "All configured candidate models failed or returned invalid schemas.",
    attempts,
  };
}
