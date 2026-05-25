/**
 * Trendoraa — Trends Analysis Engine Test Harness.
 *
 * Validates the prompt schema, heuristic fallback engine, and Zod output
 * validation without requiring a live OpenAI key.
 *
 * Run with: npx tsx scripts/test-trends.ts
 *
 * Tests:
 * 1. TrendAnalysisOutputSchema validates correct output
 * 2. TrendAnalysisOutputSchema rejects invalid output
 * 3. getHeuristicTrendFallback returns valid schema for known niches
 * 4. getHeuristicTrendFallback returns valid schema for unknown niches
 * 5. TRENDS_ANALYSIS_PROMPT contains all required template placeholders
 * 6. generateTrendsAnalysis falls back to heuristics when no LLM model is configured
 * 7. Heuristic output fields match expected values (tech niche = score 75)
 * 8. Heuristic output fields match expected values (comedy niche = score 80)
 * 9. Unknown niche falls back to tech defaults
 */

import {
  TrendAnalysisOutputSchema,
  TRENDS_ANALYSIS_PROMPT,
  type TrendAnalysisOutput,
} from "../lib/ai/prompts/trends";
import { getHeuristicTrendFallback, generateTrendsAnalysis } from "../lib/ai/trend-generator";

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

function assertThrows(fn: () => unknown, name: string): void {
  try {
    fn();
    failed++;
    failures.push(name);
    console.log(`  ❌ ${name} (expected to throw, did not)`);
  } catch {
    passed++;
    console.log(`  ✅ ${name}`);
  }
}

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

// ── Test Fixtures ──────────────────────────────────────────────────────────

const VALID_OUTPUT: TrendAnalysisOutput = {
  niche_trend_score: 75,
  trend_verdict: "Tech content is growing with stable desktop aesthetic trends.",
  trend_pillars: [
    {
      trend_name: "Minimalist Workspaces",
      velocity: "stable",
      niche_relevance: "Showcase clean desk setups to attract productivity-focused audiences.",
    },
  ],
  sound_recommendations: [
    {
      audio_name: "Lo-fi Study Beats",
      original_link: "https://instagram.com/audio/lofi",
      usage_type: "background_music",
      editing_instruction: "Fade in at second 2, cut on beat drops.",
    },
  ],
  hook_mutations: [
    {
      original_trend_hook: "Stop scrolling if you love...",
      mutated_niche_hook: "Stop scrolling if your desk looks like a battlestation...",
      psychological_trigger: "Visual curiosity and tribal identity trigger.",
    },
  ],
  actionable_blueprints: [
    {
      title: "Tech Desk Tour",
      format: "aesthetic_broll",
      topic: "Ultimate developer desk setup",
      visual_directions: "Wide shot establishing desk, zoom into keyboard, close-up on monitors.",
      suggested_duration_seconds: 15,
    },
  ],
};

const INVALID_OUTPUT_MISSING_SCORE = {
  trend_verdict: "Missing niche_trend_score field.",
  trend_pillars: [],
  sound_recommendations: [],
  hook_mutations: [],
  actionable_blueprints: [],
};

const INVALID_OUTPUT_SCORE_OUT_OF_RANGE = {
  ...VALID_OUTPUT,
  niche_trend_score: 150, // Must be 1-100
};

const INVALID_OUTPUT_VELOCITY = {
  ...VALID_OUTPUT,
  trend_pillars: [
    {
      trend_name: "Bad Trend",
      velocity: "FAST_RISING", // Not a valid enum value
      niche_relevance: "Does not matter.",
    },
  ],
};

// ── Test Suite ─────────────────────────────────────────────────────────────

section("1. Zod Schema — Valid Output");
{
  const result = TrendAnalysisOutputSchema.safeParse(VALID_OUTPUT);
  assert(result.success, "Valid output passes schema validation");
  if (result.success) {
    assert(result.data.niche_trend_score === 75, "Parsed score equals 75");
    assert(result.data.trend_pillars.length === 1, "Parsed 1 trend pillar");
    assert(result.data.hook_mutations.length === 1, "Parsed 1 hook mutation");
  }
}

section("2. Zod Schema — Invalid Outputs Rejected");
{
  const r1 = TrendAnalysisOutputSchema.safeParse(INVALID_OUTPUT_MISSING_SCORE);
  assert(!r1.success, "Missing niche_trend_score is rejected");

  const r2 = TrendAnalysisOutputSchema.safeParse(INVALID_OUTPUT_SCORE_OUT_OF_RANGE);
  assert(!r2.success, "Score > 100 is rejected");

  const r3 = TrendAnalysisOutputSchema.safeParse(INVALID_OUTPUT_VELOCITY);
  assert(!r3.success, "Invalid velocity enum is rejected");

  const r4 = TrendAnalysisOutputSchema.safeParse({ ...VALID_OUTPUT, trend_verdict: "short" });
  assert(!r4.success, "trend_verdict shorter than 10 chars is rejected");
}

section("3. Heuristic Fallback — Known Niches");
{
  const techFallback = getHeuristicTrendFallback("tech");
  const r1 = TrendAnalysisOutputSchema.safeParse(techFallback);
  assert(r1.success, "Tech fallback passes schema validation");
  assert(techFallback.niche_trend_score === 75, "Tech niche score is 75");

  const comedyFallback = getHeuristicTrendFallback("comedy");
  const r2 = TrendAnalysisOutputSchema.safeParse(comedyFallback);
  assert(r2.success, "Comedy fallback passes schema validation");
  assert(comedyFallback.niche_trend_score === 80, "Comedy niche score is 80");

  // Case-insensitive normalization
  const techUpper = getHeuristicTrendFallback("TECH");
  assert(techUpper.niche_trend_score === 75, "Case-insensitive niche lookup works (TECH → tech)");
}

section("4. Heuristic Fallback — Unknown Niche Falls Back to Tech Defaults");
{
  const unknownFallback = getHeuristicTrendFallback("aviation");
  const r = TrendAnalysisOutputSchema.safeParse(unknownFallback);
  assert(r.success, "Unknown niche fallback passes schema validation");
  assert(unknownFallback.niche_trend_score === 75, "Unknown niche defaults to tech score of 75");
  assert(
    unknownFallback.trend_pillars[0]?.trend_name === "Minimalist Desks",
    "Unknown niche gets tech's first trend pillar"
  );
}

section("5. Prompt Template — Contains Required Placeholders");
{
  const requiredPlaceholders = [
    "{username}",
    "{niche}",
    "{goal}",
    "{avg_engagement_rate}",
    "{avg_skip_rate}",
    "{avg_completion_rate}",
    "{ingested_trend_signals}",
    "{recent_content_history}",
  ];

  for (const placeholder of requiredPlaceholders) {
    assert(
      TRENDS_ANALYSIS_PROMPT.includes(placeholder),
      `Prompt contains placeholder: ${placeholder}`
    );
  }
}

// ── Async Tests Runner ────────────────────────────────────────────────────

async function runAsyncTests(): Promise<void> {
  section("6. generateTrendsAnalysis — No API Key Falls Back to Heuristics");
  {
    // Temporarily clear OPENAI_API_KEY to force fallback path
    const savedKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const result = await generateTrendsAnalysis({
        username: "test_creator",
        niche: "tech",
        goal: "audience retention",
        avgEngagementRate: 4.5,
        avgSkipRate: 28.0,
        avgCompletionRate: 35.0,
        ingestedTrendSignals: "• #techsetup surging\n• Lo-fi music trending\n• Desk aesthetic format viral",
        recentContentHistory: "1. Caption: \"My workspace\" | ER: 5.2% | Skip Rate: 22%",
        modelTier: "standard",
      });

      assert(result.success === true, "generateTrendsAnalysis succeeds (heuristic path)");
      assert(result.source === "heuristic", "Source is 'heuristic' when no API key");
      assert(result.tokensUsed === 0, "No tokens used in heuristic path");
      assert(result.costUsd === 0, "No cost in heuristic path");

      const schemaResult = TrendAnalysisOutputSchema.safeParse(result.data);
      assert(schemaResult.success, "Heuristic result passes Zod schema validation");
    } finally {
      if (savedKey !== undefined) {
        process.env.OPENAI_API_KEY = savedKey;
      }
    }
  }

  section("7. Prompt Compilation — Template Interpolation");
  {
    const filledPrompt = TRENDS_ANALYSIS_PROMPT
      .replaceAll("{username}", "test_creator")
      .replaceAll("{niche}", "finance")
      .replaceAll("{goal}", "follower growth")
      .replaceAll("{avg_engagement_rate}", "6.20")
      .replaceAll("{avg_skip_rate}", "25.5")
      .replaceAll("{avg_completion_rate}", "38.0")
      .replaceAll("{ingested_trend_signals}", "• #investing surging")
      .replaceAll("{recent_content_history}", "1. Caption: \"Compound interest\" | ER: 6.2%");

    assert(!filledPrompt.includes("{username}"), "Username placeholder replaced");
    assert(!filledPrompt.includes("{niche}"), "Niche placeholder replaced");
    assert(!filledPrompt.includes("{goal}"), "Goal placeholder replaced");
    assert(filledPrompt.includes("test_creator"), "Creator username appears in prompt");
    assert(filledPrompt.includes("finance"), "Niche appears in compiled prompt");
    assert(filledPrompt.includes("follower growth"), "Goal appears in compiled prompt");
  }

  // ── Results ──────────────────────────────────────────────────────────────

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log("\nFailed tests:");
    for (const f of failures) {
      console.log(`  ❌ ${f}`);
    }
    process.exit(1);
  } else {
    console.log("\n✅ All trends tests passed!");
    process.exit(0);
  }
}

runAsyncTests();
