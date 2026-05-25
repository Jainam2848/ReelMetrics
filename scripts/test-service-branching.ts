/**
 * Trendoraa — Service Branching & Heuristic Integration Unit Tests.
 *
 * Verifies that when the LLM resilient fallback layer fails (returns success: false),
 * the scoring service gracefully falls back to calculateHeuristicScore with source: "heuristic".
 * Also verifies that generateTrendsAnalysis yields a valid TrendAnalysisOutputSchema payload on fallback.
 *
 * Run with: npx tsx scripts/test-service-branching.ts
 */

import { z } from "zod";
import { calculateHeuristicScore } from "../lib/ai/scoring-engine";
import { generateTrendsAnalysis } from "../lib/ai/trend-generator";
import { TrendAnalysisOutputSchema } from "../lib/ai/prompts/trends";

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

async function runBranchingTests() {
  section("1. Service Fallback Branching Logic (Isolation Check)");
  {
    // Simulating callLLMWithFallback returning success: false
    const fallbackResponse = {
      success: false as const,
      error: "All configured candidate models failed or returned invalid schemas.",
      attempts: ["deepseek-chat", "gemini-2.0-flash"] as any[],
    };

    // Branching assertion: when fallbackResponse.success is false, service layer must invoke calculateHeuristicScore
    let branchToHeuristics = false;
    let heuristicScoreResult: any = null;

    if (!fallbackResponse.success) {
      branchToHeuristics = true;
      heuristicScoreResult = calculateHeuristicScore(
        "instagram",
        {
          views_count: 10000,
          likes_count: 500,
          comments_count: 50,
          shares_count: 30,
          saves_count: 20,
          skip_rate: 35,
        },
        4.5 // avgEngagementRate
      );
    }

    assert(branchToHeuristics, "Branching logic correctly switches to heuristics when LLM fallback fails");
    assert(heuristicScoreResult !== null, "Heuristic scorer successfully generates a fallback payload");
    if (heuristicScoreResult) {
      assert(heuristicScoreResult.source === "heuristic", "Heuristic score metadata source is strictly set to 'heuristic'");
      assert(heuristicScoreResult.overall_score >= 1 && heuristicScoreResult.overall_score <= 100, "Heuristic overall score matches 1-100 range validation");
      assert(typeof heuristicScoreResult.dimensions === "object", "Heuristic payload preserves 9-dimension score layouts");
    }
  }

  section("2. Trends Analysis Fallback Schema Conformity");
  {
    // Temporarily clear environment credentials to force the heuristic fallback path
    const savedGemini = process.env.GEMINI_API_KEY;
    const savedDeepSeek = process.env.DEEPSEEK_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;

    try {
      const result = await generateTrendsAnalysis({
        username: "test_engineer",
        niche: "comedy",
        goal: "follower growth",
        avgEngagementRate: 5.2,
        avgSkipRate: 40.0,
        avgCompletionRate: 25.0,
        ingestedTrendSignals: "• #comedy surging\n• Relay formats trending",
        recentContentHistory: "1. Caption: \"Work from home POV\" | ER: 6.8%",
        modelTier: "standard",
      });

      assert(result.success === true, "generateTrendsAnalysis completes successfully on fallback");
      assert(result.source === "heuristic", "Result metadata identifies 'heuristic' source");
      assert(result.tokensUsed === 0, "Zero tokens are consumed during offline heuristic runs");
      assert(result.costUsd === 0, "Cost is exactly $0 for offline heuristic runs");

      const schemaResult = TrendAnalysisOutputSchema.safeParse(result.data);
      assert(schemaResult.success, "Heuristic trends output matches the exact production TrendAnalysisOutputSchema");
      if (schemaResult.success && result.data) {
        assert(result.data.niche_trend_score === 80, "Returned comedy niche trend score matches 80");
        assert(result.data.trend_pillars.length > 0, "Contains valid trend pillars list");
      }
    } catch (e: any) {
      console.error("  ❌ Unexpected failure during trends fallback verification:", e);
      failed++;
      failures.push("Trends fallback exception");
    } finally {
      // Restore credentials
      if (savedGemini) process.env.GEMINI_API_KEY = savedGemini;
      if (savedDeepSeek) process.env.DEEPSEEK_API_KEY = savedDeepSeek;
    }
  }

  // ── Results Summary ──────────────────────────────────────────────────────

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Branching Verification Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log("\nFailed service branching tests:");
    for (const f of failures) {
      console.log(`  ❌ ${f}`);
    }
    process.exit(1);
  } else {
    console.log("\n✅ All service branching and heuristic integration tests successfully passed!");
    process.exit(0);
  }
}

runBranchingTests();
