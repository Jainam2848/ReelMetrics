/**
 * Trendoraa — LLM Client (spec §7.4, upgraded for Gemini + DeepSeek routing).
 *
 * Pure function wrapper for all LLM calls. Has ZERO database dependencies
 * and ZERO side effects. All user budget checks, token usage tracking, and
 * database commits MUST be performed by the calling service.
 *
 * Supports multiple providers:
 * - Google Gemini (2.0 Flash, 2.5 Flash) via REST API
 * - DeepSeek (V4 Flash, V4 Reasoner) via OpenAI-compatible API
 *
 * @module llm-client
 */

import { z } from "zod";
import type { ModelConfig, ModelId } from "./model-router";
import { calculateCost } from "./model-router";

// ── Types ──────────────────────────────────────────────────────────────────

export interface LLMCallParams<T> {
  prompt: string;
  outputSchema: z.ZodSchema<T>;
  model: ModelConfig;
  maxTokens?: number;
  temperature?: number;
}

export type LLMCallResult<T> =
  | {
      success: true;
      data: T;
      tokensUsed: number;
      costUsd: number;
      latencyMs: number;
      modelId: ModelId;
    }
  | {
      success: false;
      error: string;
      modelId: ModelId;
      isRateLimit?: boolean;
    };

// ── Timeout Utility ────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`LLM call timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Sanitize sensitive data from log messages.
 * Prevents accidental leakage of API keys or tokens in error logs.
 */
function sanitizeForLogs(message: string): string {
  // Redact anything that looks like an API key
  return message.replace(/\b(sk-|AIza|dsk_)[A-Za-z0-9_-]{10,}\b/g, "[REDACTED]");
}

// ── Gemini Adapter ─────────────────────────────────────────────────────────

/**
 * Calls Google Gemini via REST API.
 * Adapts to Gemini's format:
 * - JSON output via `response_mime_type: 'application/json'`
 */
async function callGemini(
  prompt: string,
  model: ModelConfig,
  maxTokens: number,
  temperature: number
): Promise<{ content: string; totalTokens: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: "application/json",
    },
  };

  const response = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    30_000
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: { totalTokenCount?: number };
  };

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const totalTokens = data.usageMetadata?.totalTokenCount ?? 0;

  return { content, totalTokens };
}

// ── DeepSeek Adapter ───────────────────────────────────────────────────────

/**
 * Calls DeepSeek via their OpenAI-compatible API.
 * Uses the same interface as OpenAI but with a different base URL.
 */
async function callDeepSeek(
  prompt: string,
  model: ModelConfig,
  maxTokens: number,
  temperature: number
): Promise<{ content: string; totalTokens: number }> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const isReasoner = model.id === "deepseek-reasoner";

  // DeepSeek Reasoner (Thinking R1) specifications:
  // - Does NOT support response_format / json_object mode
  // - Does NOT support custom temperature / top_p (must omit or keep undefined)
  const completion = await withTimeout(
    client.chat.completions.create({
      model: model.id,
      messages: [{ role: "user", content: prompt }],
      response_format: isReasoner ? undefined : { type: "json_object" },
      max_tokens: maxTokens,
      temperature: isReasoner ? undefined : temperature,
    }),
    60_000 // Increase thinking model timeout to 60 seconds
  );

  return {
    content: completion.choices[0]?.message?.content ?? "",
    totalTokens: completion.usage?.total_tokens ?? 0,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Pure LLM call wrapper — zero database side-effects.
 *
 * Routes to the appropriate provider adapter based on the model config,
 * parses the JSON response against the Zod schema, and returns a
 * typed result with cost and latency metadata.
 */
export async function callLLMPure<T>(
  params: LLMCallParams<T>
): Promise<LLMCallResult<T>> {
  const {
    prompt,
    outputSchema,
    model,
    maxTokens = 2000,
    temperature = 0.3,
  } = params;

  const startTime = Date.now();

  let rawContent: string;
  let totalTokens: number;

  try {
    // Route to the appropriate provider adapter
    let result: { content: string; totalTokens: number };

    switch (model.provider) {
      case "gemini":
        result = await callGemini(prompt, model, maxTokens, temperature);
        break;
      case "deepseek":
        result = await callDeepSeek(prompt, model, maxTokens, temperature);
        break;
      default:
        return { success: false, error: `Unknown provider: ${model.provider}`, modelId: model.id };
    }

    rawContent = result.content;
    totalTokens = result.totalTokens;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown LLM error";
    console.error(`[llm-client] ${model.id} call failed:`, sanitizeForLogs(message));
    
    // Standardize rate limit recognition
    const isRateLimit =
      message.includes("429") ||
      message.toLowerCase().includes("rate limit") ||
      message.toLowerCase().includes("quota") ||
      message.includes("RESOURCE_EXHAUSTED");

    return { success: false, error: message, modelId: model.id, isRateLimit };
  }

  // Parse and validate the JSON response against the Zod schema
  try {
    const json = JSON.parse(rawContent);
    const parsed = outputSchema.parse(json);
    const costUsd = calculateCost(model.id, totalTokens * 0.4, totalTokens * 0.6); // Approximate 40/60 split

    return {
      success: true,
      data: parsed,
      tokensUsed: totalTokens,
      costUsd,
      latencyMs: Date.now() - startTime,
      modelId: model.id,
    };
  } catch (parseError: unknown) {
    const message = parseError instanceof Error ? parseError.message : String(parseError);
    console.error("[llm-client] Output parsing or schema validation failed:", sanitizeForLogs(message));
    return { success: false, error: "AI output schema validation error", modelId: model.id };
  }
}
