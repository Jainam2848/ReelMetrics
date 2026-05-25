import { callLLMWithFallback } from "./llm-with-fallback";
import { TRENDS_ANALYSIS_PROMPT, TrendAnalysisOutputSchema, type TrendAnalysisOutput } from "./prompts/trends";
import type { ModelTier } from "./model-router";

export interface TrendGeneratorParams {
  username: string;
  niche: string;
  goal: string;
  avgEngagementRate: number;
  avgSkipRate: number;
  avgCompletionRate: number;
  ingestedTrendSignals: string;
  recentContentHistory: string;
  modelTier?: ModelTier;
}

export interface TrendGeneratorResult {
  success: boolean;
  data: TrendAnalysisOutput;
  tokensUsed: number;
  costUsd: number;
  latencyMs: number;
  modelId: string;
  source: "ai" | "heuristic";
  error?: string;
}

export function getHeuristicTrendFallback(niche: string): TrendAnalysisOutput {
  const normalized = (niche || "tech").toLowerCase();
  const defaults = {
    tech: {
      niche_trend_score: 75,
      trend_verdict: "Standard tech topics are stable, with increased interest in minimal physical workspace integrations.",
      trend_pillars: [{ trend_name: "Minimalist Desks", velocity: "stable" as const, niche_relevance: "Highlight clean workstation aesthetics." }],
      sound_recommendations: [{ audio_name: "Synth Wave beats", original_link: "https://instagram.com/audio/synth", usage_type: "background_music" as const, editing_instruction: "Use rapid cuts on audio transients." }],
      hook_mutations: [{ original_trend_hook: "Stop scrolling if you want...", mutated_niche_hook: "Stop scrolling if your desk setup looks like this...", psychological_trigger: "Endowment effect and visual curiosity." }],
      actionable_blueprints: [{ title: "Desk Tour", format: "aesthetic_broll" as const, topic: "Optimal desk layout", visual_directions: "Slow panning shots over items", suggested_duration_seconds: 12 }]
    },
    comedy: {
      niche_trend_score: 80,
      trend_verdict: "Relatable workplace skits are surging on short-form feeds.",
      trend_pillars: [{ trend_name: "Corporate Satire", velocity: "surging" as const, niche_relevance: "Adapt common remote work scenarios to your comedy." }],
      sound_recommendations: [{ audio_name: "Silly woodwind effects", original_link: "", usage_type: "pattern_interrupt" as const, editing_instruction: "Insert immediately after punchline." }],
      hook_mutations: [{ original_trend_hook: "Tell me you work in X without...", mutated_niche_hook: "Tell me you're a remote software engineer without saying it...", psychological_trigger: "Instantiates instant relatability." }],
      actionable_blueprints: [{ title: "The Standup Meeting POV", format: "talking_head" as const, topic: "typical agile standups", visual_directions: "Quick lens shifts to mimic different meeting members", suggested_duration_seconds: 15 }]
    }
  };

  const result = defaults[normalized as keyof typeof defaults];
  if (result) return result;
  return defaults.tech;
}

export async function generateTrendsAnalysis(
  params: TrendGeneratorParams
): Promise<TrendGeneratorResult> {
  const {
    username,
    niche,
    goal,
    avgEngagementRate,
    avgSkipRate,
    avgCompletionRate,
    ingestedTrendSignals,
    recentContentHistory,
    modelTier = "standard",
  } = params;

  // 1. Build prompt template
  const filledPrompt = TRENDS_ANALYSIS_PROMPT
    .replaceAll("{username}", username)
    .replaceAll("{niche}", niche)
    .replaceAll("{goal}", goal)
    .replaceAll("{avg_engagement_rate}", avgEngagementRate.toFixed(2))
    .replaceAll("{avg_skip_rate}", avgSkipRate.toFixed(1))
    .replaceAll("{avg_completion_rate}", avgCompletionRate.toFixed(1))
    .replaceAll("{ingested_trend_signals}", ingestedTrendSignals)
    .replaceAll("{recent_content_history}", recentContentHistory);

  const startTime = Date.now();

  try {
    // 2. Call LLM fallback wrapper
    const response = await callLLMWithFallback({
      operation: "analysis",
      modelTier,
      prompt: filledPrompt,
      outputSchema: TrendAnalysisOutputSchema,
      temperature: 0.3,
      maxTokens: 2000,
    });

    if (response.success) {
      return {
        success: true,
        data: response.data,
        tokensUsed: response.tokensUsed,
        costUsd: response.costUsd,
        latencyMs: response.latencyMs,
        modelId: response.modelId,
        source: "ai",
      };
    } else {
      console.error(`[trend-generator] LLM execution failed: ${response.error}. Using fallback.`);
      return {
        success: true,
        data: getHeuristicTrendFallback(niche),
        tokensUsed: 0,
        costUsd: 0,
        latencyMs: Date.now() - startTime,
        modelId: "heuristic",
        source: "heuristic",
        error: response.error,
      };
    }
  } catch (err: any) {
    console.error("[trend-generator] Unexpected exception during generation:", err.message);
    return {
      success: true,
      data: getHeuristicTrendFallback(niche),
      tokensUsed: 0,
      costUsd: 0,
      latencyMs: Date.now() - startTime,
      modelId: "heuristic",
      source: "heuristic",
      error: err.message,
    };
  }
}
