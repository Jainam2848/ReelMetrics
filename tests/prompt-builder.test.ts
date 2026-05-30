import { buildScoringPrompt, extractTopTrendingSounds } from "@/lib/ai/prompt-builder";
import { PostScoreSchema } from "@/lib/ai/scoring-engine";

describe("Prompt Builder & Dynamic Signal Ingestion Unit Tests", () => {
  describe("1. buildScoringPrompt Templates", () => {
    const baseContext = {
      platform: "instagram" as const,
      caption: "This is a test caption about productivity in tech #tech #minimal",
      timestamp: "2026-05-30T12:00:00Z",
      viewsCount: 1500,
      likesCount: 150,
      commentsCount: 25,
      sharesCount: 10,
      savesCount: 30,
      skipRate: 25.5,
      username: "tech_guru",
      followersCount: 5000,
      avgEngagementRate: 4.5,
      avgSkipRate: 28.0,
      typicalPostingTime: "Weekday afternoons",
      topThemes: "Minimal desk setup, tech setups",
    };

    it("should correctly compile the base scoring prompt with all placeholder variables", () => {
      const prompt = buildScoringPrompt(baseContext);

      expect(prompt).toContain("instagram");
      expect(prompt).toContain("tech_guru");
      expect(prompt).toContain("1500");
      expect(prompt).toContain("150");
      expect(prompt).toContain("25");
      expect(prompt).toContain("10");
      expect(prompt).toContain("30");
      expect(prompt).toContain("25.5%");
      expect(prompt).toContain("4.50%");
      expect(prompt).toContain("28.0%");
    });

    it("should include visual signals block with explicit implies labels and custom values when provided", () => {
      const prompt = buildScoringPrompt({
        ...baseContext,
        visualMotion: false,
        textOverlaySeconds: 1.2,
        avgPacingCutInterval: 3.5,
      });

      expect(prompt).toContain("**Visual Motion (First Frame)**: false");
      expect(prompt).toContain("**Text Overlay Onset**: 1.2 seconds");
      expect(prompt).toContain("**Average Pacing Cut Interval**: 3.5 seconds");
      expect(prompt).toContain("Grabs immediate attention");
      expect(prompt).toContain("Establishes visual context without audio");
      expect(prompt).toContain("Controls visual storytelling speed");
    });

    it("should fallback to robust defaults for visual signals when not supplied", () => {
      const prompt = buildScoringPrompt(baseContext);

      expect(prompt).toContain("**Visual Motion (First Frame)**: true");
      expect(prompt).toContain("**Text Overlay Onset**: 0.5 seconds");
      expect(prompt).toContain("**Average Pacing Cut Interval**: 2.5 seconds");
    });

    it("should inject custom trending audio and niche trends feed into the prompt correctly", () => {
      const nicheTrends = "-- HASHTAGS --\n- #coding (Strength: 90)\n\n-- AUDIOS --\n- Coding Beats\n- Developer Groove\n\n-- FORMATS --\n- Laptop transition";
      const trendingSounds = "1. Coding Beats\n2. Developer Groove\n3. Synth Wave";

      const prompt = buildScoringPrompt({
        ...baseContext,
        nicheTrends,
        trendingSounds,
      });

      expect(prompt).toContain("Top 3 trending sounds for this creator's niche:\n1. Coding Beats\n2. Developer Groove\n3. Synth Wave");
      expect(prompt).toContain("Niche Trends Feed");
      expect(prompt).toContain("Coding Beats");
      expect(prompt).toContain("Developer Groove");
    });

    it("should fall back safely for trending audio and niche trends when not provided", () => {
      const prompt = buildScoringPrompt(baseContext);

      expect(prompt).toContain("1. Synth Wave beats\n2. Minimal tech focus beats\n3. Lofi study background track");
      expect(prompt).toContain("No niche trends available.");
    });
  });

  describe("2. extractTopTrendingSounds Parser", () => {
    it("should correctly parse the top 3 trending audios under -- AUDIOS -- section", () => {
      const trendText = `-- HASHTAGS --
- #tech (Strength: 95)

-- AUDIOS --
- Sound Alpha (Surge: +120%)
- Sound Beta (Surge: +90%)
- Sound Gamma (Surge: +45%)
- Sound Delta (Surge: +20%)

-- FORMATS --
- POV transitions`;

      const result = extractTopTrendingSounds(trendText);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe("Sound Alpha (Surge: +120%)");
      expect(result[1]).toBe("Sound Beta (Surge: +90%)");
      expect(result[2]).toBe("Sound Gamma (Surge: +45%)");
    });

    it("should strip out leading '- ' from the parsed sound lines", () => {
      const trendText = `-- AUDIOS --
- Chill Beats
- Focus Lofi`;

      const result = extractTopTrendingSounds(trendText);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe("Chill Beats");
      expect(result[1]).toBe("Focus Lofi");
    });

    it("should handle empty or missing sections gracefully returning empty array", () => {
      expect(extractTopTrendingSounds("")).toHaveLength(0);
      expect(extractTopTrendingSounds(null)).toHaveLength(0);
      expect(extractTopTrendingSounds(undefined)).toHaveLength(0);
      expect(extractTopTrendingSounds("just plain text with no markers")).toHaveLength(0);
    });
  });

  describe("3. PostScoreSchema Zod Output Parsing with trend_overlap_details", () => {
    const validBaseObject = {
      overall_score: 85,
      dimensions: {
        hook: { score: 8, reasoning: "Good hook that does things.", improvement: "Make it even faster." },
        retention_metric: { score: 7, reasoning: "Solid skip rate.", improvement: "Improve visual change." },
        retention_proxy: { score: 8, reasoning: "Good proxy.", improvement: "Keep visual consistency." },
        cta: { score: 9, reasoning: "Very clear CTA.", improvement: "Make visual prompt clearer." },
        visual: { score: 7, reasoning: "Standard lighting.", improvement: "Use more vibrant tones." },
        audio: { score: 6, reasoning: "Standard track.", improvement: "Use trending sounds." },
        trend: { score: 8, reasoning: "High overlap with coding.", improvement: "Use more relevant tags." },
        caption: { score: 7, reasoning: "Short caption.", improvement: "Use bullet points." },
        timing: { score: 8, reasoning: "Great pacing.", improvement: "Pacing is excellent for this niche." },
      },
      platform_retention_analysis: {
        strength: "good" as const,
        estimated_retained_viewers: 3500,
        verdict: "High engagement expected.",
      },
      top_strength: "Excellent hook.",
      biggest_opportunity: "Refine audio choices.",
      one_line_summary: "High performing post with minimal issues.",
      virality_potential: "high" as const,
    };

    it("should successfully parse without trend_overlap_details since it is optional", () => {
      const parsed = PostScoreSchema.safeParse(validBaseObject);
      expect(parsed.success).toBe(true);
    });

    it("should successfully parse with fully populated trend_overlap_details", () => {
      const objectWithDetails = {
        ...validBaseObject,
        trend_overlap_details: [
          {
            trend_name: "Minimalist Desks",
            overlap_score: 0.8,
            overlapping_aspect: "format" as const,
            rationale: "Post shows a minimalist workspace layout.",
          },
          {
            trend_name: "Synth Beats",
            overlap_score: 0.2,
            overlapping_aspect: "none" as const,
            rationale: "Post uses simple background voiceover without synth music.",
          },
        ],
      };

      const parsed = PostScoreSchema.safeParse(objectWithDetails);
      expect(parsed.success).toBe(true);
      expect(parsed.data?.trend_overlap_details).toHaveLength(2);
      expect(parsed.data?.trend_overlap_details?.[0].trend_name).toBe("Minimalist Desks");
      expect(parsed.data?.trend_overlap_details?.[0].overlap_score).toBe(0.8);
      expect(parsed.data?.trend_overlap_details?.[0].overlapping_aspect).toBe("format");
    });

    it("should fail validation if overlap_score is out of bounds [0, 1]", () => {
      const invalidObject = {
        ...validBaseObject,
        trend_overlap_details: [
          {
            trend_name: "Minimalist Desks",
            overlap_score: 1.5, // Invalid, max is 1
            overlapping_aspect: "format" as const,
            rationale: "invalid score",
          },
        ],
      };

      const parsed = PostScoreSchema.safeParse(invalidObject);
      expect(parsed.success).toBe(false);
    });
  });
});
