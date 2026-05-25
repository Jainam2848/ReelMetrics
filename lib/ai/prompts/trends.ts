import { z } from "zod";

export const TRENDS_ANALYSIS_PROMPT = `
You are a master social media algorithms engineer and viral growth strategist. Your task is to analyze raw platform trend data (audios, hashtags, topics) and cross-reference them with a specific creator's performance history and niche parameters to generate actionable content hooks and strategic alignment scores.

## 1. Creator Profile
- Handle: @{username}
- Niche: {niche} (e.g., tech, comedy, finance, education, lifestyle, fashion)
- Primary Goal: {goal} (e.g., audience retention, engagement, follower growth)
- Historical Performance:
  - Avg engagement rate: {avg_engagement_rate}%
  - Avg skip rate (Instagram): {avg_skip_rate}%
  - Avg completion rate (TikTok): {avg_completion_rate}%

## 2. Ingested Trend Signals (Last 24 Hours)
{ingested_trend_signals}

## 3. Creator's Recent Content History
{recent_content_history}

## 4. Instructions
Analyze the raw trend signals through the strict lens of the creator's specific {niche} content. Map out exactly:
- **Niche Trend Score:** How well current platform-wide trends align with their topic authority (1-100).
- **Viral Sound Alignment:** Identify which high-velocity audio formats can be adapted to their format.
- **Hook Mutations:** Take 3 high-velocity platform hooks and mutate them specifically to fit the creator's niche and goal.
- **Actionable Content Blueprints:** Draft 3 quick-execution Reel/TikTok ideas utilizing these trends.

## STRICT TRENDS CONSTRAINTS
- Use ONLY the actual niche, goal, and performance statistics provided; NEVER invent or extrapolate metrics.
- Keep recommendations specific and creator-friendly; do not include generic fluff.
- Output MUST validate against the Zod JSON schema exactly.

Return ONLY a valid JSON payload matching this Zod-enforceable schema:
{
  "niche_trend_score": <number 1-100>,
  "trend_verdict": "<1-2 sentence high-level trend summary>",
  "trend_pillars": [
    {
      "trend_name": "<string>",
      "velocity": "high|surging|stable",
      "niche_relevance": "<string explaining how this niche can utilize it>"
    }
  ],
  "sound_recommendations": [
    {
      "audio_name": "<string>",
      "original_link": "<string>",
      "usage_type": "background_music|voiceover_underlay|pattern_interrupt",
      "editing_instruction": "<specific editing instruction like 'cut on beat 4' or 'fade at 3s'>"
    }
  ],
  "hook_mutations": [
    {
      "original_trend_hook": "<string describing the viral platform hook>",
      "mutated_niche_hook": "<the exact 3-second text overlay/spoken line for this creator>",
      "psychological_trigger": "<why this mutated hook lowers skip rate or drives saves>"
    }
  ],
  "actionable_blueprints": [
    {
      "title": "<string>",
      "format": "fast_reel|talking_head|aesthetic_broll|split_screen",
      "topic": "<specific topic tailored to niche>",
      "visual_directions": "<brief editing/shooting instructions>",
      "suggested_duration_seconds": <number>
    }
  ]
}
`;

export const TrendAnalysisOutputSchema = z.object({
  niche_trend_score: z.number().int().min(1).max(100),
  trend_verdict: z.string().min(10).max(200),
  trend_pillars: z.array(
    z.object({
      trend_name: z.string().min(2),
      velocity: z.enum(["high", "surging", "stable"]),
      niche_relevance: z.string().min(10),
    })
  ).min(1),
  sound_recommendations: z.array(
    z.object({
      audio_name: z.string(),
      original_link: z.string().url().optional().or(z.literal("")),
      usage_type: z.enum(["background_music", "voiceover_underlay", "pattern_interrupt"]),
      editing_instruction: z.string().min(10),
    })
  ),
  hook_mutations: z.array(
    z.object({
      original_trend_hook: z.string().min(5),
      mutated_niche_hook: z.string().min(5),
      psychological_trigger: z.string().min(10),
    })
  ).min(1),
  actionable_blueprints: z.array(
    z.object({
      title: z.string().min(5),
      format: z.enum(["fast_reel", "talking_head", "aesthetic_broll", "split_screen"]),
      topic: z.string().min(5),
      visual_directions: z.string().min(10),
      suggested_duration_seconds: z.number().int().positive(),
    })
  ).min(1),
});

export type TrendAnalysisOutput = z.infer<typeof TrendAnalysisOutputSchema>;
export type TrendPillar = TrendAnalysisOutput["trend_pillars"][number];
export type SoundRecommendation = TrendAnalysisOutput["sound_recommendations"][number];
export type HookMutation = TrendAnalysisOutput["hook_mutations"][number];
export type ActionableBlueprint = TrendAnalysisOutput["actionable_blueprints"][number];
