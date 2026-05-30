import { POST_SCORING_PROMPT, STRATEGY_PROMPT } from "./prompts";
import {
  computeTimeDecayFactor,
  truncateCaption,
  type Platform,
} from "./scoring-engine";

export interface ScoringPromptContext {
  platform: Platform;
  caption: string | null;
  timestamp: Date | string;
  viewsCount: number;
  totalViews?: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  skipRate?: number | null;
  publicReposts?: number;
  reach?: number;
  username: string;
  followersCount: number;
  avgEngagementRate: number;
  avgSkipRate?: number;
  avgCompletionRate?: number;
  avgPublicReposts?: number;
  topThemes?: string;
  typicalPostingTime?: string;
  visualMotion?: boolean | null;
  textOverlaySeconds?: number | null;
  avgPacingCutInterval?: number | null;
  nicheTrends?: string | null;
  trendingSounds?: string | null;
  trendOverlapHints?: string | null;
}

export interface StrategyPromptContext {
  platform: Platform;
  postsCount: number;
  avgEngagement: number;
  bestPostCaption: string;
  bestEr: number;
  worstPostCaption: string;
  worstEr: number;
  avgViews: number;
  avgSkipRate?: number;
  avgPublicReposts?: number;
  followerDelta?: number;
  followerGrowthPct?: number;
  topThemes: string;
  strongestDim: string;
  strongestAvg: number;
  weakestDim: string;
  weakestAvg: number;
  postingWindows: string;
  timeDecayFactors: string;
  strategyType: string;
  periodStart: string;
  periodEnd: string;
  niche?: string | null;
  goalFocus?: string | null;
}

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

export function buildScoringPrompt(ctx: ScoringPromptContext): string {
  const decay = computeTimeDecayFactor(ctx.timestamp);
  return fillTemplate(POST_SCORING_PROMPT, {
    platform: ctx.platform,
    caption: truncateCaption(ctx.caption),
    timestamp:
      typeof ctx.timestamp === "string"
        ? ctx.timestamp
        : ctx.timestamp.toISOString(),
    time_decay_factor: decay.toFixed(2),
    views_count: ctx.viewsCount,
    likes_count: ctx.likesCount,
    comments_count: ctx.commentsCount,
    shares_count: ctx.sharesCount,
    saves_count: ctx.savesCount,
    skip_rate: ctx.skipRate ?? "null",
    total_views: ctx.totalViews ?? ctx.viewsCount,
    reach: ctx.reach ?? 0,
    public_reposts: ctx.publicReposts ?? 0,
    tiktok_completion_rate: "null",
    username: ctx.username,
    followers_count: ctx.followersCount,
    avg_engagement_rate: ctx.avgEngagementRate.toFixed(2),
    avg_skip_rate: (ctx.avgSkipRate ?? 50).toFixed(1),
    avg_completion_rate: (ctx.avgCompletionRate ?? 30).toFixed(1),
    avg_public_reposts: (ctx.avgPublicReposts ?? 0).toFixed(0),
    avg_shares_count: ctx.sharesCount.toString(),
    top_themes: ctx.topThemes ?? "General educational content",
    typical_posting_time: ctx.typicalPostingTime ?? "Weekday mornings",
    visual_motion: ctx.visualMotion !== undefined && ctx.visualMotion !== null ? String(ctx.visualMotion) : "true",
    text_overlay_seconds: ctx.textOverlaySeconds !== undefined && ctx.textOverlaySeconds !== null ? ctx.textOverlaySeconds.toFixed(1) : "0.5",
    avg_pacing_cut_interval: ctx.avgPacingCutInterval !== undefined && ctx.avgPacingCutInterval !== null ? ctx.avgPacingCutInterval.toFixed(1) : "2.5",
    trending_sounds: ctx.trendingSounds ?? "1. Synth Wave beats\n2. Minimal tech focus beats\n3. Lofi study background track",
    niche_trends: ctx.nicheTrends ?? "No niche trends available.",
    trend_overlap_hints: ctx.trendOverlapHints ?? "No pre-computed semantic overlap available.",
  });
}

export function extractTopTrendingSounds(trendSignalsText: string | null | undefined): string[] {
  if (!trendSignalsText) return [];
  const lines = trendSignalsText.split("\n");
  const audioIndex = lines.findIndex(l => l.includes("-- AUDIOS --"));
  if (audioIndex === -1) return [];
  
  const audios: string[] = [];
  for (let i = audioIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("--")) break; // Next section
    if (line.startsWith("- ")) {
      audios.push(line.substring(2));
    } else {
      audios.push(line);
    }
    if (audios.length >= 3) break;
  }
  return audios;
}

export function buildStrategyPrompt(ctx: StrategyPromptContext): string {
  return fillTemplate(STRATEGY_PROMPT, {
    platform: ctx.platform,
    niche: ctx.niche ?? "General",
    goal_focus: ctx.goalFocus ?? "General Growth",
    posts_count: ctx.postsCount,
    avg_engagement: ctx.avgEngagement.toFixed(2),
    best_post_caption: truncateCaption(ctx.bestPostCaption),
    best_er: ctx.bestEr.toFixed(2),
    worst_post_caption: truncateCaption(ctx.worstPostCaption),
    worst_er: ctx.worstEr.toFixed(2),
    avg_views: Math.round(ctx.avgViews),
    avg_skip_rate: (ctx.avgSkipRate ?? 50).toFixed(1),
    avg_public_reposts: (ctx.avgPublicReposts ?? 0).toFixed(0),
    avg_completion_rate: "30.0",
    avg_shares_count: "0",
    follower_delta: ctx.followerDelta ?? 0,
    follower_growth_pct: (ctx.followerGrowthPct ?? 0).toFixed(1),
    top_themes: ctx.topThemes,
    strongest_dim: ctx.strongestDim,
    strongest_avg: ctx.strongestAvg.toFixed(1),
    weakest_dim: ctx.weakestDim,
    weakest_avg: ctx.weakestAvg.toFixed(1),
    posting_windows: ctx.postingWindows,
    time_decay_factors: ctx.timeDecayFactors,
    strategy_type: ctx.strategyType,
    period_start: ctx.periodStart,
    period_end: ctx.periodEnd,
  });
}

export function buildSemanticTags(trendData: any, fallbackObj: any): string[] {
  const tags: string[] = [];

  const cleanPhrase = (phrase: string): string => {
    return phrase
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .replace(/#/g, "")
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const limitWords = (text: string): string => {
    const cleaned = cleanPhrase(text);
    return cleaned.split(" ").slice(0, 5).join(" ");
  };

  if (trendData) {
    if (trendData.surging_hashtags) {
      trendData.surging_hashtags.forEach((h: any) => {
        if (h.tag) tags.push(limitWords(h.tag));
      });
    }
    if (trendData.trending_audios) {
      trendData.trending_audios.forEach((a: any) => {
        if (a.name) tags.push(limitWords(a.name));
      });
    }
    if (trendData.viral_formats) {
      trendData.viral_formats.forEach((f: any) => {
        if (f.name) tags.push(limitWords(f.name));
      });
    }
    if (trendData.topic_surges) {
      trendData.topic_surges.forEach((t: any) => {
        if (t.topic) tags.push(limitWords(`${t.topic} ${t.angle || ""}`));
      });
    }
  } else if (fallbackObj) {
    if (fallbackObj.trend_pillars) {
      fallbackObj.trend_pillars.forEach((p: any) => {
        if (p.trend_name) tags.push(limitWords(p.trend_name));
      });
    }
    if (fallbackObj.sound_recommendations) {
      fallbackObj.sound_recommendations.forEach((s: any) => {
        if (s.audio_name) tags.push(limitWords(s.audio_name));
      });
    }
    if (fallbackObj.actionable_blueprints) {
      fallbackObj.actionable_blueprints.forEach((b: any) => {
        if (b.topic) tags.push(limitWords(b.topic));
      });
    }
  }

  return Array.from(new Set(tags)).filter(Boolean);
}

