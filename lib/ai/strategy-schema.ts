import { z } from "zod";

export const StrategyOutputSchema = z.object({
  summary: z.string().min(20).max(600),
  key_insight: z.string().min(20).max(400),
  content_pillars: z
    .array(
      z.object({
        theme: z.string().min(3).max(120),
        percentage: z.number().min(0).max(100),
        rationale: z.string().min(10).max(300),
      })
    )
    .min(1)
    .max(5),
  content_calendar: z
    .array(
      z.object({
        day: z.string().min(8).max(20),
        time: z.string().min(4).max(10),
        content_type: z.string().min(3).max(40),
        topic: z.string().min(5).max(200),
        hook_suggestion: z.string().min(10).max(300),
        caption_direction: z.string().min(10).max(300),
        audio_suggestion: z.string().min(3).max(120),
        hashtags: z.array(z.string()).max(10),
        estimated_engagement: z.enum(["low", "medium", "high"]),
        reasoning: z.string().min(10).max(300),
      })
    )
    .min(1)
    .max(7),
});

export type StrategyOutput = z.infer<typeof StrategyOutputSchema>;
