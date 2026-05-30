import { z } from "zod";

/**
 * Zod schema representing a single surging hashtag signal.
 */
export const HashtagSignalSchema = z.object({
  tag: z.string().min(1),
  estimated_reach: z.number().int().nonnegative().default(0),
  trend_strength: z.number().int().min(1).max(100).default(50),
});

/**
 * Zod schema representing a single trending audio track.
 */
export const AudioSignalSchema = z.object({
  name: z.string().min(1),
  platform_id: z.string().optional(),
  genre: z.string().default("Unknown"),
  surge_percentage: z.number().nonnegative().default(0),
});

/**
 * Zod schema representing a single viral content format.
 */
export const ViralFormatSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(5),
  example_accounts: z.array(z.string()).optional().default([]),
});

/**
 * Zod schema representing an emerging editing pattern.
 */
export const EditingPatternSchema = z.object({
  description: z.string().min(5),
  effectiveness_score: z.number().int().min(1).max(10).default(5),
});

/**
 * Zod schema representing a surging topic within a niche.
 */
export const TopicSurgeSchema = z.object({
  topic: z.string().min(1),
  angle: z.string().min(5),
  estimated_engagement_lift: z.number().nonnegative().default(1.0),
});

/**
 * Global trend ingestion response schema returned by the structured LLM prompt.
 * Arrays default to empty list to degrade gracefully if the response is missing keys.
 */
export const TrendIngestionSchema = z.object({
  surging_hashtags: z.array(HashtagSignalSchema).default([]),
  trending_audios: z.array(AudioSignalSchema).default([]),
  viral_formats: z.array(ViralFormatSchema).default([]),
  editing_patterns: z.array(EditingPatternSchema).default([]),
  topic_surges: z.array(TopicSurgeSchema).default([]),
  time_sensitivity_hours: z.number().int().positive().default(24),
});

export type HashtagSignal = z.infer<typeof HashtagSignalSchema>;
export type AudioSignal = z.infer<typeof AudioSignalSchema>;
export type ViralFormat = z.infer<typeof ViralFormatSchema>;
export type EditingPattern = z.infer<typeof EditingPatternSchema>;
export type TopicSurge = z.infer<typeof TopicSurgeSchema>;
export type TrendIngestionOutput = z.infer<typeof TrendIngestionSchema>;
