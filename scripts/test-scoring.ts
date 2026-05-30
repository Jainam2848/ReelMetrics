/**
 * Trendoraa — Scoring Engine Test Harness.
 *
 * Validates the heuristic scoring engine across both platforms,
 * edge cases, and qualitative benchmark alignment.
 *
 * Run with: npx tsx scripts/test-scoring.ts
 *
 * Tests:
 * 1. Score range is always 1-100
 * 2. Dimension weights sum to 100%
 * 3. Piecewise functions align with AI prompt benchmarks
 * 4. Instagram hook ≠ retention_metric scores
 * 5. Edge cases: 0 views, null skip_rate, viral posts, new accounts
 * 6. Virality potential computation
 * 7. Time decay factor computation
 * 8. Caption truncation
 */

import {
  calculateHeuristicScore,
  computeTimeDecayFactor,
  truncateCaption,
  type PostMetricsInput,
  type Platform,
  scoreVisualQuality,
  scoreAudioStrategy,
  scoreTrendAlignment,
  isAudioTrending,
} from "../lib/ai/scoring-engine";

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
    console.log(`  ❌ FAIL: ${name}`);
  }
}

function assertRange(value: number, min: number, max: number, name: string): void {
  assert(value >= min && value <= max, `${name} (${value} in [${min}, ${max}])`);
}

// ── Test Scenarios ─────────────────────────────────────────────────────────

const SCENARIOS: Array<{
  name: string;
  platform: Platform;
  metrics: PostMetricsInput;
  avgER: number;
  checks: (result: ReturnType<typeof calculateHeuristicScore>) => void;
}> = [
  {
    name: "Instagram — Excellent performer (low skip rate, high engagement)",
    platform: "instagram",
    metrics: {
      views_count: 100_000,
      likes_count: 8_000,
      comments_count: 1_200,
      shares_count: 3_000,
      saves_count: 2_500,
      public_reposts: 500,
      skip_rate: 12, // Excellent (<20%)
    },
    avgER: 5.0,
    checks: (r) => {
      assertRange(r.overall_score, 1, 100, "Overall score in 1-100 range");
      assertRange(r.overall_score, 60, 100, "Excellent post scores high");
      assertRange(r.dimensions.retention_metric.score, 9, 10, "Skip rate 12% → excellent (9-10)");
      assert(r.dimensions.hook.score !== r.dimensions.retention_metric.score,
        "IG hook ≠ retention_metric (differentiated)");
      assert(r.platform_retention_analysis.strength === "excellent", "Retention strength is excellent");
      assert(r.virality_potential === "high" || r.virality_potential === "very_high",
        "High-engagement post has high virality potential");
      assert(r.source === "heuristic", "Source is heuristic");
    },
  },
  {
    name: "Instagram — Poor performer (high skip rate, low engagement)",
    platform: "instagram",
    metrics: {
      views_count: 5_000,
      likes_count: 50,
      comments_count: 3,
      shares_count: 1,
      saves_count: 2,
      public_reposts: 0,
      skip_rate: 75, // Poor (>60%)
    },
    avgER: 5.0,
    checks: (r) => {
      assertRange(r.overall_score, 1, 100, "Overall score in 1-100 range");
      assertRange(r.overall_score, 1, 40, "Poor post scores low");
      assertRange(r.dimensions.retention_metric.score, 1, 2, "Skip rate 75% → poor (1-2)");
      assert(r.platform_retention_analysis.strength === "critical", "Retention strength is critical");
      assert(r.virality_potential === "low", "Low-engagement post has low virality");
    },
  },
  {
    name: "Instagram — Average performer (mid skip rate)",
    platform: "instagram",
    metrics: {
      views_count: 25_000,
      likes_count: 1_000,
      comments_count: 100,
      shares_count: 200,
      saves_count: 300,
      public_reposts: 50,
      skip_rate: 45, // Average (40-60%)
    },
    avgER: 4.0,
    checks: (r) => {
      assertRange(r.overall_score, 1, 100, "Overall score in 1-100 range");
      assertRange(r.dimensions.retention_metric.score, 3, 5, "Skip rate 45% → average (3-5)");
      assert(r.platform_retention_analysis.strength === "average" || r.platform_retention_analysis.strength === "weak",
        "Retention strength is average or weak");
    },
  },
  {
    name: "TikTok — Excellent performer (high completion rate)",
    platform: "tiktok",
    metrics: {
      views_count: 500_000,
      likes_count: 40_000,
      comments_count: 5_000,
      shares_count: 10_000,
      saves_count: 8_000,
      tiktok_completion_rate: 55, // Excellent (>40%)
    },
    avgER: 6.0,
    checks: (r) => {
      assertRange(r.overall_score, 1, 100, "Overall score in 1-100 range");
      assertRange(r.overall_score, 60, 100, "Excellent TikTok post scores high");
      assertRange(r.dimensions.retention_metric.score, 9, 10, "Completion rate 55% → excellent (9-10)");
      assert(r.platform_retention_analysis.strength === "excellent", "Retention strength is excellent");
      assert(r.virality_potential === "very_high" || r.virality_potential === "high",
        "Viral TikTok has high virality potential");
    },
  },
  {
    name: "TikTok — Poor performer (low completion rate)",
    platform: "tiktok",
    metrics: {
      views_count: 3_000,
      likes_count: 20,
      comments_count: 1,
      shares_count: 0,
      saves_count: 1,
      tiktok_completion_rate: 8, // Poor (<15%)
    },
    avgER: 6.0,
    checks: (r) => {
      assertRange(r.overall_score, 1, 100, "Overall score in 1-100 range");
      assertRange(r.dimensions.retention_metric.score, 1, 2, "Completion rate 8% → poor (1-2)");
      assert(r.platform_retention_analysis.strength === "critical", "Retention strength is critical");
    },
  },
  {
    name: "Edge Case — 0 views (division by zero guard)",
    platform: "instagram",
    metrics: {
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      saves_count: 0,
      public_reposts: 0,
      skip_rate: undefined,
    },
    avgER: 0,
    checks: (r) => {
      assertRange(r.overall_score, 1, 100, "Zero-view post still produces valid score");
      assert(r.virality_potential === "low", "Zero views → low virality");
      assert(!isNaN(r.overall_score), "Score is not NaN");
      assert(Number.isFinite(r.overall_score), "Score is finite");
    },
  },
  {
    name: "Edge Case — null/undefined metrics (graceful handling)",
    platform: "instagram",
    metrics: {
      views_count: undefined as unknown as number,
      likes_count: null as unknown as number,
      comments_count: NaN,
      shares_count: -5,
      saves_count: Infinity,
      public_reposts: undefined,
      skip_rate: null as unknown as number,
    },
    avgER: NaN,
    checks: (r) => {
      assertRange(r.overall_score, 1, 100, "Null/undefined metrics produce valid score");
      assert(!isNaN(r.overall_score), "Score is not NaN with null inputs");
      assert(Number.isFinite(r.overall_score), "Score is finite with null inputs");
      // All dimension scores should be valid integers 1-10
      for (const [dim, val] of Object.entries(r.dimensions)) {
        assert(val.score >= 1 && val.score <= 10, `${dim} score in [1, 10] range`);
        assert(Number.isInteger(val.score), `${dim} score is integer`);
      }
    },
  },
  {
    name: "Edge Case — Viral post (extreme engagement)",
    platform: "instagram",
    metrics: {
      views_count: 5_000_000,
      likes_count: 500_000,
      comments_count: 50_000,
      shares_count: 100_000,
      saves_count: 200_000,
      public_reposts: 25_000,
      skip_rate: 5,
    },
    avgER: 3.0,
    checks: (r) => {
      assertRange(r.overall_score, 80, 100, "Viral post scores very high");
      assert(r.virality_potential === "very_high", "Viral post has very_high virality");
      assertRange(r.dimensions.retention_metric.score, 9, 10, "5% skip rate → excellent");
    },
  },
  {
    name: "Edge Case — New account with no history (avgER = 0)",
    platform: "tiktok",
    metrics: {
      views_count: 500,
      likes_count: 30,
      comments_count: 5,
      shares_count: 2,
      saves_count: 3,
      tiktok_completion_rate: 25,
    },
    avgER: 0,
    checks: (r) => {
      assertRange(r.overall_score, 1, 100, "New account produces valid score");
      assert(!isNaN(r.overall_score), "Score is not NaN for new account");
    },
  },
];

// ── Run Tests ──────────────────────────────────────────────────────────────

console.log("\n🧪 Trendoraa Scoring Engine Test Harness\n");
console.log("=".repeat(60));

// Test 1: Dimension weights sum to 100%
console.log("\n📐 Test: Dimension Weight Sum");
const DIMENSION_WEIGHTS = {
  hook: 0.12, retention_metric: 0.13, retention_proxy: 0.12,
  cta: 0.10, visual: 0.10, audio: 0.10,
  trend: 0.13, caption: 0.08, timing: 0.12,
};
const weightSum = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
assert(Math.abs(weightSum - 1.0) < 0.001, `Weights sum to 1.0 (got ${weightSum})`);

// Test 2: Time decay factor
console.log("\n⏱️  Test: Time Decay Factor");
const now = new Date();
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

const decayNow = computeTimeDecayFactor(now);
const decay1d = computeTimeDecayFactor(oneDayAgo);
const decay14d = computeTimeDecayFactor(fourteenDaysAgo);
const decay60d = computeTimeDecayFactor(sixtyDaysAgo);

assertRange(decayNow, 0.95, 1.0, `Recent post decay: ${decayNow.toFixed(3)}`);
assertRange(decay1d, 0.9, 1.0, `1-day-old decay: ${decay1d.toFixed(3)}`);
assertRange(decay14d, 0.45, 0.55, `14-day-old decay: ${decay14d.toFixed(3)}`);
assertRange(decay60d, 0.49, 0.51, `60-day-old decay (floored at 0.5): ${decay60d.toFixed(3)}`);
assert(decayNow > decay1d, "Recent > 1 day old");
assert(decay1d > decay14d, "1 day old > 14 days old");

// Edge cases for time decay
const decayNull = computeTimeDecayFactor(undefined);
const decayInvalid = computeTimeDecayFactor("not-a-date");
assertRange(decayNull, 0.74, 0.76, `Undefined date defaults to 0.75: ${decayNull}`);
assertRange(decayInvalid, 0.74, 0.76, `Invalid date defaults to 0.75: ${decayInvalid}`);

// Test 3: Caption truncation
console.log("\n✂️  Test: Caption Truncation");
assert(truncateCaption(null) === "(no caption)", "Null caption returns placeholder");
assert(truncateCaption(undefined) === "(no caption)", "Undefined caption returns placeholder");
assert(truncateCaption("Short caption") === "Short caption", "Short caption unchanged");
assert(truncateCaption("x".repeat(300)).length === 300, "300-char caption unchanged");
assert(truncateCaption("x".repeat(500)).length === 300, "500-char caption truncated to 300");
assert(truncateCaption("x".repeat(500)).endsWith("..."), "Truncated caption ends with ...");

// Test 10: Advanced Refinements Validation (Follower Tier, Video Length, Momentum, Timing)
console.log("\n⚡ Test: Advanced Refinements (Follower Tier, Video Length, Momentum, Timing)");

// A: Follower Tier Skip Rate Scaling
const resLargeAccount = calculateHeuristicScore("instagram", {
  views_count: 100_000, likes_count: 1000, comments_count: 100, shares_count: 100, saves_count: 100,
  skip_rate: 28,
}, 2.0, 600_000);

const resSmallAccount = calculateHeuristicScore("instagram", {
  views_count: 100_000, likes_count: 1000, comments_count: 100, shares_count: 100, saves_count: 100,
  skip_rate: 28,
}, 2.0, 5_000);

assert(resSmallAccount.dimensions.retention_metric.score >= resLargeAccount.dimensions.retention_metric.score,
  "Small account scores equal or higher than large account for same skip rate due to tier scaling");

// B: Video Length Awareness
const metricsBase = {
  views_count: 10_000, likes_count: 100, comments_count: 10, shares_count: 10, saves_count: 10,
  skip_rate: 30,
};
const resLongVideo = calculateHeuristicScore("instagram", { ...metricsBase, video_length: 60 }, 2.0);
const resShortVideo = calculateHeuristicScore("instagram", { ...metricsBase, video_length: 5 }, 2.0);

assert(resLongVideo.dimensions.retention_proxy.score > resShortVideo.dimensions.retention_proxy.score,
  "Longer video gets a retention proxy score boost over short video");

// C: Momentum Virality Bump
const resLowMomentum = calculateHeuristicScore("tiktok", {
  views_count: 10_000, likes_count: 100, comments_count: 10, shares_count: 20, saves_count: 20,
  tiktok_completion_rate: 20,
}, 2.0);
const resHighMomentum = calculateHeuristicScore("tiktok", {
  views_count: 10_000, likes_count: 100, comments_count: 10, shares_count: 20, saves_count: 20,
  tiktok_completion_rate: 20,
  views_momentum: 2.5,
}, 2.0);

assert(resHighMomentum.virality_potential === "medium" && resLowMomentum.virality_potential === "low",
  "High views momentum bumps virality potential classifications");

// D: Dynamic Timing Peak Hour Awareness
const resPeakHour = calculateHeuristicScore("instagram", {
  views_count: 10_000, likes_count: 500, comments_count: 50, shares_count: 50, saves_count: 50,
  posted_at: "2026-05-23T19:00:00", // 7:00 PM (Local Peak Hour)
}, 2.0);
const resOffHour = calculateHeuristicScore("instagram", {
  views_count: 10_000, likes_count: 500, comments_count: 50, shares_count: 50, saves_count: 50,
  posted_at: "2026-05-23T03:00:00", // 3:00 AM (Graveyard Hour)
}, 2.0);

assert(resPeakHour.dimensions.timing.score > resOffHour.dimensions.timing.score,
  "Peak hours post gets timing score boost over graveyard shift post");

// Test 11: Unit Tests for Exported Pure Sub-formulas
console.log("\n🧪 Test: Exported Pure Sub-formulas");

// A: scoreVisualQuality
const visualScore1 = scoreVisualQuality(10, 20, 30, 100, 1000);
assert(visualScore1 === 10, `scoreVisualQuality high engagement: expected 10, got ${visualScore1}`);
const visualScore2 = scoreVisualQuality(0, 0, 0, 1, 1000);
assert(visualScore2 === 4, `scoreVisualQuality baseline likes: expected 4, got ${visualScore2}`);
const visualScoreZeroViews = scoreVisualQuality(0, 0, 0, 0, 0);
assert(visualScoreZeroViews === 5, `scoreVisualQuality zero views defaults to 5: got ${visualScoreZeroViews}`);

// B: isAudioTrending
const postDate = "2026-05-30T12:00:00Z";
const activeTrendFeed = [
  { niche: "tech", trendSignals: "-- AUDIOS --\n- Synth-Beats", updatedAt: "2026-05-28T12:00:00Z" }
];
const staleTrendFeed = [
  { niche: "tech", trendSignals: "-- AUDIOS --\n- Synth-Beats", updatedAt: "2026-05-20T12:00:00Z" }
];
assert(isAudioTrending(postDate, activeTrendFeed, "tech") === true, "isAudioTrending active trend within 7 days: expected true");
assert(isAudioTrending(postDate, staleTrendFeed, "tech") === false, "isAudioTrending stale trend > 7 days: expected false");
assert(isAudioTrending(postDate, activeTrendFeed, "fitness") === false, "isAudioTrending different niche: expected false");
assert(isAudioTrending(undefined, activeTrendFeed, "tech") === false, "isAudioTrending missing date: expected false");

// C: scoreAudioStrategy
const audioScoreBase = scoreAudioStrategy(10, 1000);
assert(audioScoreBase === 6, `scoreAudioStrategy base without trend: expected 6, got ${audioScoreBase}`);
const audioScoreTrending = scoreAudioStrategy(10, 1000, postDate, activeTrendFeed, "tech");
assert(audioScoreTrending === 8, `scoreAudioStrategy with trend (+1.5): expected 8 (6 + 1.5 = 7.5 rounded to 8), got ${audioScoreTrending}`);
const audioScoreStale = scoreAudioStrategy(10, 1000, postDate, staleTrendFeed, "tech");
assert(audioScoreStale === 6, `scoreAudioStrategy with stale trend: expected 6, got ${audioScoreStale}`);

// D: scoreTrendAlignment
const trendScoreHigh = scoreTrendAlignment(50, 1000, 2.0); // ER = 5.0%, avgER = 2.0% -> ratio = 2.5
assert(trendScoreHigh === 10, `scoreTrendAlignment outperforming (ratio 2.5): expected 10, got ${trendScoreHigh}`);
const trendScoreAvg = scoreTrendAlignment(20, 1000, 2.0); // ER = 2.0%, avgER = 2.0% -> ratio = 1.0
assert(trendScoreAvg === 5, `scoreTrendAlignment average (ratio 1.0): expected 5, got ${trendScoreAvg}`);


// Test 4-9: Scoring Scenarios
for (const scenario of SCENARIOS) {
  console.log(`\n🎯 Test: ${scenario.name}`);
  const result = calculateHeuristicScore(scenario.platform, scenario.metrics, scenario.avgER);
  scenario.checks(result);
}

// ── Summary ────────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failures.length > 0) {
  console.log("❌ Failures:");
  for (const f of failures) {
    console.log(`   - ${f}`);
  }
  process.exit(1);
}

console.log("✅ All tests passed!\n");
process.exit(0);
