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
 * - Google Gemini (Flash) and DeepSeek are the primary engines.
 * - OpenAI is fully removed from all routing paths.
 * - Automatic heuristic fallback when all providers are rate-limited or exhausted.
 * - In-memory rate limit tracker for Gemini free tier (15 RPM)
 *
 * @module model-router
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ModelId =
  | "gemini-2.0-flash"
  | "gemini-2.5-flash"
  | "deepseek-chat"
  | "deepseek-reasoner";

export type ModelProvider = "gemini" | "deepseek";

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
 * Pricing updated per official DeepSeek/Google pricing sheets.
 * All prices in USD per 1K tokens (converted from per-1M values).
 */
export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
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
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    provider: "gemini",
    displayName: "Gemini 2.5 Flash (Budget Pro)",
    inputPer1KTokens: 0.000075,
    outputPer1KTokens: 0.0003,
    maxTokens: 8192,
    supportsJsonMode: true,
    freeRpmLimit: 15,
  },
  "deepseek-chat": {
    id: "deepseek-chat",
    provider: "deepseek",
    displayName: "DeepSeek V4 Flash",
    inputPer1KTokens: 0.00014,  // $0.14 per 1M tokens
    outputPer1KTokens: 0.00028, // $0.28 per 1M tokens
    maxTokens: 4096,
    supportsJsonMode: true,
    freeRpmLimit: 0,
  },
  "deepseek-reasoner": {
    id: "deepseek-reasoner",
    provider: "deepseek",
    displayName: "DeepSeek V4 Reasoner (Thinking)",
    inputPer1KTokens: 0.00055,  // $0.55 per 1M tokens
    outputPer1KTokens: 0.00219, // $2.19 per 1M tokens
    maxTokens: 8192,
    supportsJsonMode: true,
    freeRpmLimit: 0,
  },
};

// ── Gemini Rate Limit Tracker ──────────────────────────────────────────────

/**
 * Simple in-memory rate limiter for Gemini free tier.
 * Tracks request timestamps in a sliding 60-second window.
 * If the window has 15+ requests, Gemini is considered rate-limited.
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

// ── Model Routing Table ────────────────────────────────────────────────────

/**
 * Operation-to-model routing table.
 * Resolves candidate list in order of preference.
 */
const ROUTING_TABLE: Record<OperationType, { standard: ModelId[]; premium: ModelId[] }> = {
  scoring: {
    // Scoring (recent reels): DeepSeek V4-Flash -> Gemini 2.0-Flash
    standard: ["deepseek-chat", "gemini-2.0-flash"],
    premium: ["deepseek-chat", "gemini-2.0-flash"],
  },
  batch_scoring: {
    // Batch scoring (reels older than 48h): prioritizes Gemini Flash first for cost savings
    standard: ["gemini-2.0-flash", "deepseek-chat"],
    premium: ["gemini-2.0-flash", "deepseek-chat"],
  },
  strategy: {
    // Strategy standard: DeepSeek V4-Flash -> Gemini 2.5-Flash -> Gemini 2.0-Flash
    standard: ["deepseek-chat", "gemini-2.5-flash", "gemini-2.0-flash"],
    // Strategy premium: DeepSeek Reasoner (Thinking) -> DeepSeek V4-Flash -> Gemini 2.5-Flash
    premium: ["deepseek-reasoner", "deepseek-chat", "gemini-2.5-flash"],
  },
  analysis: {
    // Analysis (ad-hoc trends): DeepSeek V4-Flash -> Gemini 2.5-Flash -> Gemini 2.0-Flash
    standard: ["deepseek-chat", "gemini-2.5-flash", "gemini-2.0-flash"],
    premium: ["deepseek-chat", "gemini-2.5-flash", "gemini-2.0-flash"],
  },
};

/**
 * Returns the candidate model configurations list for a given operation.
 */
export function getModelCandidates(
  operation: OperationType,
  modelTier: ModelTier = "standard"
): ModelId[] {
  return ROUTING_TABLE[operation][modelTier];
}

/**
 * Determines if a post is "recent" (posted within the last 48 hours).
 * Recent posts get real-time scoring; older posts use batch/budget models.
 */
export function isRecentPost(postedAt?: Date | string): boolean {
  if (!postedAt) return false;
  const posted = typeof postedAt === "string" ? new Date(postedAt) : postedAt;
  if (isNaN(posted.getTime())) return false;
  const hoursSincePosted = (Date.now() - posted.getTime()) / (1000 * 60 * 60);
  return hoursSincePosted <= 48;
}

/** True when at least one LLM provider has an API key configured. */
export function isAnyLlmProviderConfigured(): boolean {
  return !!(process.env.GEMINI_API_KEY || process.env.DEEPSEEK_API_KEY);
}

/**
 * Checks if a model's API key is configured in the environment.
 */
export function isModelAvailable(modelId: ModelId): boolean {
  const config = MODEL_CONFIGS[modelId];
  switch (config.provider) {
    case "gemini":
      return !!process.env.GEMINI_API_KEY;
    case "deepseek":
      return !!process.env.DEEPSEEK_API_KEY;
    default:
      return false;
  }
}

/**
 * Resolves the effective operation based on age routing rules.
 * Old posts (>48 hours) mapped to batch_scoring.
 */
export function resolveEffectiveOperation(
  operation: OperationType,
  postedAt?: Date | string
): OperationType {
  if (operation === "scoring" && postedAt && !isRecentPost(postedAt)) {
    return "batch_scoring";
  }
  return operation;
}

/**
 * Selects the best model for a given operation (legacy compat layer).
 * Used when fallback loop is not needed, otherwise callLLMWithFallback is preferred.
 */
export function selectModel(
  operation: OperationType,
  modelTier: ModelTier = "standard",
  postedAt?: Date | string
): ModelSelection | null {
  const effectiveOperation = resolveEffectiveOperation(operation, postedAt);

  const candidates = getModelCandidates(effectiveOperation, modelTier);

  for (const modelId of candidates) {
    const config = MODEL_CONFIGS[modelId];

    if (!isModelAvailable(modelId)) continue;

    if (config.provider === "gemini" && !geminiRateLimiter.canRequest()) {
      continue;
    }

    if (config.provider === "gemini") {
      geminiRateLimiter.recordRequest();
    }

    return {
      model: config,
      reason: `Selected ${config.displayName} for ${effectiveOperation} (tier: ${modelTier})`,
    };
  }

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
