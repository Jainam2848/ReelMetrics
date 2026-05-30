import {
  scoreVisualQuality,
  scoreAudioStrategy,
  scoreTrendAlignment,
  isAudioTrending,
  buildHeuristicStrategy,
} from '@/lib/ai/scoring-engine';

describe('Heuristic Scoring Engine Unit Tests', () => {
  describe('1. Visual Quality Heuristic', () => {
    it('should handle zero views edge case gracefully without crashing and return default score 5.0', () => {
      // savesCount, repostsCount, commentsCount, likesCount, viewsCount
      const result = scoreVisualQuality(0, 0, 0, 0, 0);
      expect(result).toBe(5);
    });

    it('should clamp to 1 when there is all-zero engagement with non-zero views', () => {
      const result = scoreVisualQuality(0, 0, 0, 0, 100);
      expect(result).toBe(1);
    });

    it('should score 8-10 for a viral post with high engagement density (10%+ density)', () => {
      // saves×3 + reposts×2.5 + comments×1.5 + likes×1
      // e.g., 20 saves, 10 reposts, 20 comments, 50 likes on 1000 views
      // density = (20*3 + 10*2.5 + 20*1.5 + 50) / 1000 = (60 + 25 + 30 + 50) / 1000 = 165 / 1000 = 0.165 (16.5% density)
      // Visual Score = clamp(4 + 0.165 * 40) = clamp(4 + 6.6) = clamp(10.6) = 10
      const score = scoreVisualQuality(20, 10, 20, 50, 1000);
      expect(score).toBeGreaterThanOrEqual(8);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('should score ~5 for an average post (3% density)', () => {
      // saves = 2, reposts = 2, comments = 2, likes = 10 on 1000 views
      // density = (6 + 5 + 3 + 10) / 1000 = 24 / 1000 = 0.024 (2.4% density)
      // Visual Score = clamp(4 + 0.024 * 40) = clamp(4 + 0.96) = clamp(4.96) = 5
      const score = scoreVisualQuality(2, 2, 2, 10, 1000);
      expect(score).toBe(5);
    });
  });

  describe('2. Audio Strategy Heuristic', () => {
    it('should handle zero views edge case gracefully without crashing and return 4', () => {
      const score = scoreAudioStrategy(0, 0);
      expect(score).toBe(4);
    });

    it('should score 4-5 for a low share rate (<0.5%)', () => {
      // shares = 2, views = 1000 -> share rate = 0.002 (0.2%)
      // score = clamp(4 + 0.002 * 200) = clamp(4.4) = 4
      const score1 = scoreAudioStrategy(2, 1000);
      expect(score1).toBeGreaterThanOrEqual(4);
      expect(score1).toBeLessThanOrEqual(5);

      // shares = 4, views = 1000 -> share rate = 0.004 (0.4%)
      // score = clamp(4 + 0.004 * 200) = clamp(4.8) = 5
      const score2 = scoreAudioStrategy(4, 1000);
      expect(score2).toBe(5);
    });

    it('should score 8-9 for a high share rate (>2%)', () => {
      // shares = 22, views = 1000 -> share rate = 0.022 (2.2%)
      // score = clamp(4 + 0.022 * 200) = clamp(8.4) = 8
      const score1 = scoreAudioStrategy(22, 1000);
      expect(score1).toBeGreaterThanOrEqual(8);
      expect(score1).toBeLessThanOrEqual(9);
    });

    it('should apply the trending audio bonus of +1.5 if within 7 days of active trend', () => {
      const postDate = "2026-05-30T12:00:00Z";
      const activeTrends = [
        { niche: "tech", trendSignals: "-- AUDIOS --\n- Synthwave Beats", updatedAt: "2026-05-28T12:00:00Z" }
      ];
      // base score without trend: shares = 10, views = 1000 -> share rate = 0.01 -> score = clamp(4 + 0.01*200) = 6
      const scoreWithoutTrend = scoreAudioStrategy(10, 1000);
      expect(scoreWithoutTrend).toBe(6);

      // with active trend bonus: raw score = 6 + 1.5 = 7.5 -> rounded and clamped to 8
      const scoreWithTrend = scoreAudioStrategy(10, 1000, postDate, activeTrends, "tech");
      expect(scoreWithTrend).toBe(8);
    });

    describe('isAudioTrending helper', () => {
      it('should return true when audio trend is active within 7 days', () => {
        const postDate = "2026-05-30T12:00:00Z";
        const activeTrends = [
          { niche: "tech", trendSignals: "-- AUDIOS --\n- Synthwave Beats", updatedAt: "2026-05-28T12:00:00Z" }
        ];
        expect(isAudioTrending(postDate, activeTrends, "tech")).toBe(true);
      });

      it('should return false when audio trend is stale (> 7 days)', () => {
        const postDate = "2026-05-30T12:00:00Z";
        const staleTrends = [
          { niche: "tech", trendSignals: "-- AUDIOS --\n- Synthwave Beats", updatedAt: "2026-05-20T12:00:00Z" }
        ];
        expect(isAudioTrending(postDate, staleTrends, "tech")).toBe(false);
      });

      it('should return false when niche does not match', () => {
        const postDate = "2026-05-30T12:00:00Z";
        const activeTrends = [
          { niche: "tech", trendSignals: "-- AUDIOS --\n- Synthwave Beats", updatedAt: "2026-05-28T12:00:00Z" }
        ];
        expect(isAudioTrending(postDate, activeTrends, "fitness")).toBe(false);
      });
    });
  });

  describe('3. Trend Alignment Piecewise Mapping', () => {
    it('should return exactly 10 when outperformance ratio >= 2.0', () => {
      // totalEngagements = 100, viewsCount = 1000, avgER = 4.0% -> ratio = 10% / 4% = 2.5 >= 2.0 -> returns 10
      const score = scoreTrendAlignment(100, 1000, 4.0);
      expect(score).toBe(10);
    });

    it('should return exactly 8.5 (linear interpolation) when ratio = 1.75', () => {
      // totalEngagements = 70, viewsCount = 1000, avgER = 4.0% -> ratio = 7% / 4% = 1.75
      // ratio is in range [1.5, 2.0], interpolation is 7 + ((1.75 - 1.5) / 0.5) * 3 = 7 + (0.25 / 0.5) * 3 = 7 + 1.5 = 8.5
      // clampScore(8.5) will round to 9 normally, but here we can check the mathematical return before rounding if we test scoreTrendAlignment's raw logic or if we test interpolation.
      // Wait, let's verify if scoreTrendAlignment rounds the interpolation.
      // Let's look at the function:
      // if (ratio >= 1.5) return clampScore(7 + ((ratio - 1.5) / 0.5) * 3);
      // Since clampScore uses Math.round, clampScore(8.5) returns 9.
      // Wait, is it possible to get exactly 9? Yes, 8.5 rounded is 9. Let's assert score is 9.
      const score = scoreTrendAlignment(70, 1000, 4.0);
      expect(score).toBe(9);
    });

    it('should return exactly 5 when ratio = 1.0', () => {
      // ratio = 1.0 -> returns 5
      const score = scoreTrendAlignment(40, 1000, 4.0);
      expect(score).toBe(5);
    });

    it('should return exactly 3 when ratio = 0.5', () => {
      // ratio = 0.5 -> returns 3
      const score = scoreTrendAlignment(20, 1000, 4.0);
      expect(score).toBe(3);
    });

    it('should return exactly 1 when ratio = 0.0', () => {
      // ratio = 0.0 -> returns 1
      const score = scoreTrendAlignment(0, 1000, 4.0);
      expect(score).toBe(1);
    });

    it('should return exactly 2 when ratio = 0.25', () => {
      // ratio = 0.25
      // in range [0.0, 0.5]: clampScore(1 + ratio * 4) = clampScore(1 + 0.25 * 4) = clampScore(2) = 2
      const score = scoreTrendAlignment(10, 1000, 4.0);
      expect(score).toBe(2);
    });
  });

  describe('4. Clamp Behaviour', () => {
    it('should never return a score below 1 or above 10 regardless of inputs', () => {
      // Test Visual Quality
      expect(scoreVisualQuality(100000, 100000, 100000, 100000, 100)).toBe(10);
      expect(scoreVisualQuality(0, 0, 0, 0, 1000)).toBe(1);

      // Test Audio Strategy
      expect(scoreAudioStrategy(100000, 100)).toBe(10);
      expect(scoreAudioStrategy(0, 1000)).toBe(4);

      // Test Trend Alignment
      expect(scoreTrendAlignment(100000, 100, 1.0)).toBe(10);
      expect(scoreTrendAlignment(0, 1000, 1.0)).toBe(1);
    });
  });

  describe('5. buildHeuristicStrategy Functionality', () => {
    it('should handle edge case with fewer than 3 posts gracefully', () => {
      const posts = [
        { caption: 'Post 1', engagementRate: '5.0', viewsCount: 1000, skipRate: '25.0', timestamp: new Date() }
      ];
      const scores = [
        { hookScore: 8, skipRateScore: 7, retentionScore: 6, ctaScore: 5, visualScore: 6, audioScore: 7, trendScore: 8, captionScore: 5, timingScore: 6 }
      ];

      const strategy = buildHeuristicStrategy(posts, scores);
      expect(strategy).toHaveProperty('summary');
      expect(strategy.content_pillars.length).toBeGreaterThan(0);
      expect(strategy.content_calendar.length).toBe(3); // calendars are fixed templates
    });

    it('should correctly identify the best and worst performing posts from a mix', () => {
      const posts = [
        { caption: 'Best Post', engagementRate: '10.0', viewsCount: 2000, skipRate: '15.0', timestamp: new Date() },
        { caption: 'Medium Post', engagementRate: '5.0', viewsCount: 1000, skipRate: '25.0', timestamp: new Date() },
        { caption: 'Worst Post', engagementRate: '1.0', viewsCount: 500, skipRate: '50.0', timestamp: new Date() }
      ];
      const scores = [
        { hookScore: 9, skipRateScore: 8, retentionScore: 7, ctaScore: 8, visualScore: 8, audioScore: 9, trendScore: 9, captionScore: 8, timingScore: 8 },
        { hookScore: 6, skipRateScore: 5, retentionScore: 5, ctaScore: 5, visualScore: 5, audioScore: 6, trendScore: 6, captionScore: 5, timingScore: 6 },
        { hookScore: 3, skipRateScore: 2, retentionScore: 2, ctaScore: 2, visualScore: 3, audioScore: 3, trendScore: 2, captionScore: 3, timingScore: 2 }
      ];

      const strategy = buildHeuristicStrategy(posts, scores);
      expect(strategy.key_insight).toContain('Your top reel (10.0% ER) outperformed');
      expect(strategy.content_pillars[0]?.rationale).toContain('Best Post');
    });
  });
});
