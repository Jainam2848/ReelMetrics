/**
 * Trendoraa — Model Router (spec §7, upgraded for multi-model cost efficiency).
 *
 * Intelligently selects the most cost-efficient LLM model based on:
 * - Operation type (scoring vs strategy vs batch)
 * - Post age (recent vs older)
 * - User plan tier (standard vs premium)
 * - Provider rate limits and availability
 *
 * Key design decisions:
 * - Gemini 2.0 Flash is the default for batch scoring (98% cheaper than GPT-4o)
 * - GPT-4o reserved for premium-tier strategy generation
 * - GPT-4o-mini is the default real-time scoring model for standard tiers
 * - Automatic heuristic fallback when all providers are rate-limited
 * - In-memory rate limit tracker for Gemini free tier (15 RPM)
 *
 * @module model-router
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ModelId =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gemini-2.0-flash"
  | "deepseek-v3";

export type ModelProvider = "openai" | "gemini" | "deepseek";

export type OperationType =
  | "scoring"         // Real-time single post scoring
  | "batch_scoring"   // Background batch scoring of older posts
  | "strategy"        // Strategy generation (high-value)
  | "analysis";       // Ad-hoc analysis

export type ModelTier = "standard" | "premium";

export interface ModelConfig {
  id: ModelId;
  provider: ModelProvider;
  displayName: string;
  inputPer1KTokens: number;   // USD per 1K input tokens
  outputPer1KTokens: number;  // USD per 1K output tokens
  maxTokens: number;
  supportsJsonMode: boolean;
  /** Free tier RPM limit (0 = no free tier). */
  freeRpmLimit: number;
}

export interface ModelSelection {
  model: ModelConfig;
  reason: string;
}

// ── Model Configurations ───────────────────────────────────────────────────

/**
 * Model pricing and capabilities configuration.
 * Updated manually when providers change pricing.
 * All prices in USD per 1K tokens.
 */
export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    displayName: "GPT-4o (Premium)",
    inputPer1KTokens: 0.005,
    outputPer1KTokens: 0.015,
    maxTokens: 4096,
    supportsJsonMode: true,
    freeRpmLimit: 0,
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "openai",
    displayName: "GPT-4o-mini (Standard)",
    inputPer1KTokens: 0.00015,
    outputPer1KTokens: 0.0006,
    maxTokens: 4096,
    supportsJsonMode: true,
    freeRpmLimit: 0,
  },
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    provider: "gemini",
    displayName: "Gemini 2.0 Flash (Budget)",
    inputPer1KTokens: 0.000075,
    outputPer1KTokens: 0.0003,
    maxTokens: 8192,
    supportsJsonMode: true,
    freeRpmLimit: 15, // Google AI Studio free tier: 15 RPM
  },
  "deepseek-v3": {
    id: "deepseek-v3",
    provider: "deepseek",
    displayName: "DeepSeek-V3 (Budget)",
    inputPer1KTokens: 0.00014,
    outputPer1KTokens: 0.00028,
    maxTokens: 4096,
    supportsJsonMode: true,
    freeRpmLimit: 0,
  },
};

// ── Gemini Rate Limit Tracker ──────────────────────────────────────────────

/**
 * Simple in-memory rate limiter for Gemini free tier.
 * Tracks request timestamps in a sliding 60-second window.
 * If the window has 15+ requests, Gemini is considered rate-limited.
 *
 * NOTE: This is per-process. In multi-instance deployments, a shared
 * counter in Redis or Postgres would be needed for cross-instance tracking.
 */
class GeminiRateLimiter {
  private timestamps: number[] = [];
  private readonly windowMs = 60_000; // 1 minute
  private readonly maxRpm = 15;

  /**
   * Returns true if a new request can be made within rate limits.
   */
  canRequest(): boolean {
    this.pruneOldEntries();
    return this.timestamps.length < this.maxRpm;
  }

  /**
   * Records a request timestamp.
   */
  recordRequest(): void {
    this.timestamps.push(Date.now());
  }

  /**
   * Returns remaining requests in the current window.
   */
  remaining(): number {
    this.pruneOldEntries();
    return Math.max(0, this.maxRpm - this.timestamps.length);
  }

  private pruneOldEntries(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }
}

export const geminiRateLimiter = new GeminiRateLimiter();

// ── Model Selection Logic ──────────────────────────────────────────────────

/**
 * Operation-to-model routing table.
 *
 * Priority order for each operation:
 * 1. Try the cheapest viable model first
 * 2. Fall back to more expensive models if cheap ones are unavailable
 * 3. Return null if no model is available (caller should use heuristic fallback)
 */
const ROUTING_TABLE: Record<OperationType, { standard: ModelId[]; premium: ModelId[] }> = {
  scoring: {
    // Standard tier: GPT-4o-mini for real-time, Gemini as fallback
    standard: ["gpt-4o-mini", "gemini-2.0-flash", "deepseek-v3"],
    // Premium tier: GPT-4o for real-time, GPT-4o-mini as fallback
    premium: ["gpt-4o-mini", "gpt-4o", "gemini-2.0-flash"],
  },
  batch_scoring: {
    // Batch scoring prioritizes cost: Gemini > DeepSeek > GPT-4o-mini
    standard: ["gemini-2.0-flash", "deepseek-v3", "gpt-4o-mini"],
    premium: ["gemini-2.0-flash", "deepseek-v3", "gpt-4o-mini"],
  },
  strategy: {
    // Strategy generation needs the best model for nuanced analysis
    standard: ["gpt-4o-mini", "deepseek-v3", "gemini-2.0-flash"],
    premium: ["gpt-4o", "gpt-4o-mini", "deepseek-v3"],
  },
  analysis: {
    standard: ["gpt-4o-mini", "gemini-2.0-flash", "deepseek-v3"],
    premium: ["gpt-4o", "gpt-4o-mini", "gemini-2.0-flash"],
  },
};

/**
 * Determines if a post is "recent" (posted within the last 48 hours).
 * Recent posts get real-time scoring; older posts use batch/budget models.
 */
function isRecentPost(postedAt?: Date | string): boolean {
  if (!postedAt) return false;
  const posted = typeof postedAt === "string" ? new Date(postedAt) : postedAt;
  if (isNaN(posted.getTime())) return false;
  const hoursSincePosted = (Date.now() - posted.getTime()) / (1000 * 60 * 60);
  return hoursSincePosted <= 48;
}

/** True when at least one LLM provider has an API key configured. */
export function isAnyLlmProviderConfigured(): boolean {
  return (Object.keys(MODEL_CONFIGS) as ModelId[]).some((id) =>
    isModelAvailable(id)
  );
}

/**
 * Checks if a model's API key is configured in the environment.
 */
function isModelAvailable(modelId: ModelId): boolean {
  const config = MODEL_CONFIGS[modelId];
  switch (config.provider) {
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "gemini":
      return !!process.env.GEMINI_API_KEY;
    case "deepseek":
      return !!process.env.DEEPSEEK_API_KEY;
    default:
      return false;
  }
}

/**
 * Selects the best model for a given operation.
 *
 * @param operation - The type of AI operation to perform.
 * @param modelTier - User's plan tier ("standard" for free/creator, "premium" for pro/agency).
 * @param postedAt - When the post was published (for age-based routing).
 * @returns The selected model config and reason, or null if no model is available.
 */
export function selectModel(
  operation: OperationType,
  modelTier: ModelTier = "standard",
  postedAt?: Date | string
): ModelSelection | null {
  // Override: for scoring of older posts, switch to batch_scoring for cost savings
  let effectiveOperation = operation;
  if (operation === "scoring" && postedAt && !isRecentPost(postedAt)) {
    effectiveOperation = "batch_scoring";
  }

  const candidates = ROUTING_TABLE[effectiveOperation][modelTier];

  for (const modelId of candidates) {
    const config = MODEL_CONFIGS[modelId];

    // Check if API key is configured
    if (!isModelAvailable(modelId)) continue;

    // Check Gemini rate limits
    if (config.provider === "gemini" && !geminiRateLimiter.canRequest()) {
      continue; // Skip Gemini if rate-limited, try next candidate
    }

    // Record the request if it's Gemini
    if (config.provider === "gemini") {
      geminiRateLimiter.recordRequest();
    }

    return {
      model: config,
      reason: `Selected ${config.displayName} for ${effectiveOperation} (tier: ${modelTier})`,
    };
  }

  // No model available — caller should use heuristic fallback
  return null;
}

// ── Cost Calculation ───────────────────────────────────────────────────────

/**
 * Calculates the actual USD cost of an LLM call.
 */
export function calculateCost(
  modelId: ModelId,
  inputTokens: number,
  outputTokens: number
): number {
  const config = MODEL_CONFIGS[modelId];
  return (
    (inputTokens / 1000) * config.inputPer1KTokens +
    (outputTokens / 1000) * config.outputPer1KTokens
  );
}
