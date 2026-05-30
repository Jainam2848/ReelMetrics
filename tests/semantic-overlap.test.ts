import {
  computeTrendOverlapScore,
  scoreTrendAlignment,
} from "@/lib/ai/scoring-engine";
import { buildSemanticTags } from "@/lib/ai/prompt-builder";


describe("Lightweight Semantic Similarity Layer Unit Tests", () => {
  describe("1. computeTrendOverlapScore", () => {
    it("should return empty array for empty inputs", () => {
      expect(computeTrendOverlapScore("", [])).toEqual([]);
      expect(computeTrendOverlapScore("test", null)).toEqual([]);
      expect(computeTrendOverlapScore(null, ["test"])).toEqual([]);
    });

    it("should calculate exact token overlap score as 0-1 ratio", () => {
      const caption = "Had a great day at my new desk setup #setup #productivity";
      const trends = ["desk setup", "productivity hack", "unrelated topic"];

      const results = computeTrendOverlapScore(caption, trends);
      expect(results).toHaveLength(3);

      // "desk setup": both tokens exist in caption -> ratio = 2/2 = 1.0
      const deskSetup = results.find((r) => r.trend === "desk setup");
      expect(deskSetup?.score).toBe(1.0);

      // "productivity hack": "productivity" exists, "hack" does not -> ratio = 1/2 = 0.5
      const prodHack = results.find((r) => r.trend === "productivity hack");
      expect(prodHack?.score).toBe(0.5);

      // "unrelated topic": neither exists -> ratio = 0.0
      const unrelated = results.find((r) => r.trend === "unrelated topic");
      expect(unrelated?.score).toBe(0.0);
    });

    it("should ignore capitalization and strip standard punctuation", () => {
      const caption = "ROTH IRA is awesome for Gen Z!!! #GenZ #RothIRA";
      const trends = ["roth ira gen z", "gen-z roth-ira"];

      const results = computeTrendOverlapScore(caption, trends);
      expect(results[0]?.score).toBe(1.0); // roth ira gen z
      expect(results[1]?.score).toBe(1.0); // gen-z roth-ira (punctuation stripped)
    });
  });

  describe("2. Heuristic scoreTrendAlignment Overlap Bonus", () => {
    it("should not apply bonus if caption or semantic tags are missing", () => {
      // ratio = 4.0 / 4.0 = 1.0 (ER matches average exactly -> returns 5)
      const score = scoreTrendAlignment(40, 1000, 4.0);
      expect(score).toBe(5);
    });

    it("should apply trend_alignment_bonus of max(overlap) * 2 to performance ratio before piecewise mapping", () => {
      // average ER = 4.0%
      // post ER: totalEngagements = 30, viewsCount = 1000 -> post ER = 3.0%
      // base performance ratio = 3.0 / 4.0 = 0.75
      //
      // With caption matching:
      // caption: "loving my roth ira account today"
      // trends: ["roth ira", "unrelated"]
      // max overlap = 1.0 ("roth ira" tokens completely matched in caption)
      // trend_alignment_bonus = 1.0 * 2 = 2.0
      //
      // adjusted ratio = 0.75 + 2.0 = 2.75
      // adjusted ratio >= 2.0 -> returns maximum score of 10!
      const scoreWithMatch = scoreTrendAlignment(
        30,
        1000,
        4.0,
        "loving my roth ira account today",
        ["roth ira", "unrelated"]
      );
      expect(scoreWithMatch).toBe(10);

      // Without match, base ratio 0.75 -> is in range [0.5, 1.0]:
      // clampScore(3 + ((0.75 - 0.5) / 0.5) * 2) = clampScore(3 + 0.5 * 2) = clampScore(4) = 4
      const scoreWithoutMatch = scoreTrendAlignment(
        30,
        1000,
        4.0,
        "just posting normal day vlogs today",
        ["roth ira", "unrelated"]
      );
      expect(scoreWithoutMatch).toBe(4);
    });
  });

  describe("3. buildSemanticTags", () => {
    const mockTrendData = {
      surging_hashtags: [{ tag: "RothIraGenZ" }],
      trending_audios: [{ name: "Aesthetic Chill Beat" }],
      viral_formats: [{ name: "POV: Working in Tech" }],
      topic_surges: [{ topic: "AI Productivity Hack", angle: "for freelancers" }],
    };

    it("should programmatically generate short 3-5 word semantic tags from trendData", () => {
      const results = buildSemanticTags(mockTrendData, null);

      expect(results).toContain("roth ira gen z");
      expect(results).toContain("aesthetic chill beat");
      expect(results).toContain("pov working in tech");
      expect(results).toContain("ai productivity hack for freelancers");
    });

    it("should programmatically extract semantic tags from fallbackObj when trendData is null", () => {
      const mockFallback = {
        trend_pillars: [{ trend_name: "Minimalist Desks" }],
        sound_recommendations: [{ audio_name: "Synth Wave beats" }],
        actionable_blueprints: [{ topic: "Optimal desk layout" }],
      };

      const results = buildSemanticTags(null, mockFallback);
      expect(results).toContain("minimalist desks");
      expect(results).toContain("synth wave beats");
      expect(results).toContain("optimal desk layout");
    });
  });
});
