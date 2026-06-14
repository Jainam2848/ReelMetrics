import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { callLLMWithFallback } from "@/lib/ai/llm-with-fallback";
import {
  getUserPlanContext,
  checkUsageLimit,
  incrementUsage,
} from "@/lib/billing/usage-tracker";

// Input validation schema
const rewriteRequestSchema = z.object({
  rawScript: z.string().min(10, "Script must be at least 10 characters.").max(3000, "Script cannot exceed 3000 characters."),
  growthGoal: z.enum(["followers", "engagement", "conversions"]),
  niche: z.string().optional(),
});

// Output Zod schema enforced on LLM output
const storyboardItemSchema = z.object({
  time_start_sec: z.number().describe("Start time of this segment in seconds"),
  time_end_sec: z.number().describe("End time of this segment in seconds"),
  visual_action: z.string().describe("Camera directions, cut instructions, and physical pacing"),
  spoken_script: z.string().describe("The exact spoken script words for this segment"),
  on_screen_text: z.string().describe("Exact text overlays appearing on screen"),
  sound_sync_note: z.string().describe("Auditory cues, sound effects, or background audio alignment"),
});

const rewriterResponseSchema = z.object({
  curiosity_audit: z.string().describe("Critical breakdown of why the original hook would fail to resist early skips"),
  psychological_lever: z.string().describe("The primary behavioral psychology model used in the rewrite"),
  rewritten_script: z.array(storyboardItemSchema).min(1).describe("The chronological storyboard timeline segments"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  try {
    // 1. Authenticate caller using Supabase SSR auth
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError("UNAUTHORIZED", "Authentication required to use this service.");
    }

    // 2. Gate access to Paid Subscription Tiers (planId !== 'free')
    const planContext = await getUserPlanContext(user.id);
    if (planContext.planId === "free") {
      return apiError(
        "NO_ACTIVE_SUBSCRIPTION",
        "The Viral Script Rewriter is a paid feature. Please upgrade to Creator, Pro, or Agency plans to unlock."
      );
    }

    // 3. Check AI Call Usage Limits
    const limitCheck = await checkUsageLimit(user.id, "ai_call");
    if (!limitCheck.allowed) {
      return apiError(
        "AI_BUDGET_EXCEEDED",
        "You have reached your monthly AI execution limit for this billing cycle. Upgrade your plan to increase limits."
      );
    }

    // 4. Parse & Validate Payload Input parameters
    let body: z.infer<typeof rewriteRequestSchema>;
    try {
      const rawJson = await request.json();
      body = rewriteRequestSchema.parse(rawJson);
    } catch (err) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid request body parameters",
        err instanceof z.ZodError ? err.format() : undefined
      );
    }

    const { rawScript, growthGoal, niche = "general" } = body;

    // 5. Build prompt incorporating Virality Engine & Guardrails
    const prompt = `You are Trendoraa's Elite Viral Copywriter and Brand Psychologist. Your goal is to transform the user's raw script into a high-retention, viral-engineered Reels script optimized for: ${growthGoal} (followers, engagement, or conversions). 

Creator Niche: ${niche}

Raw Script Provided by Creator:
"""
${rawScript}
"""

## 9-Dimension Engineering Constraints:
1. **The 3-Second Hook Moat**: Mutate the opening hook. Replace generic greetings ("Hey guys...") with a high-curiosity psychological loop (e.g., Curiosity Gap, Loss Aversion, or Status Signaling). Command on-screen text overlays to appear at <0.4 seconds.
2. **Visual Pacing**: Dictate visual cuts/transitions every 1.5–2.5 seconds to prevent visual flatlines.
3. **Utility-Value Drops**: Structure the body into high-density, easily digestible value items (e.g., rules of thumb, checklists) to trigger the "IKEA Effect" (making the user feel smarter) and drive Saves.
4. **The Endless Loop**: Craft the final line to flow seamlessly back into the hook's opening frame, tricking the Instagram algorithm with repeat views.
5. **Call-To-Action (CTA)**:
   - For 'followers': Use an open-ended narrative hook (e.g., "I'm posting Part 2 tomorrow. Follow so you don't miss it").
   - For 'engagement': Direct users to comment a specific trigger word (e.g., "Comment 'BLUEPRINT' and I'll DM you the link"). This boosts comment counts and activates automated DM funnels.
   - For 'conversions': Link the core problem to a direct solution, leading into a clear bio link instructions.

## Operational Virality Engine Rules:
- **Social Currency**: The script must make the viewer look like an insider or expert by sharing it.
- **Curiosity Loop Openers**: Promise a secret or high-value payoff, but withhold the answer until the last 3 seconds of the video.
- **Pacing & Transitions**: Include visual pattern interrupts, zooming/framing cues, and audio sync directions.
- **Length**: Ensure the spoken script remains pacing-efficient. Write short, punchy phrases (avoid long-winded sentences).
- **Ethical Safety**: Never write scripts promoting false financial claims or toxic claims.

Return ONLY a valid JSON object matching this schema precisely:
{
  "curiosity_audit": "<string: breakdown of why the original hook was losing viewers>",
  "psychological_lever": "<string: the primary behavioral model used (e.g. Loss Aversion)>",
  "rewritten_script": [
    {
      "time_start_sec": <number: start time>,
      "time_end_sec": <number: end time>,
      "visual_action": "<string: camera action/cut instruction>",
      "spoken_script": "<string: words to speak>",
      "on_screen_text": "<string: words to display on screen>",
      "sound_sync_note": "<string: audio cue>"
    }
  ]
}`;

    // 6. Call LLM with Fallback (DeepSeek Reasoner -> DeepSeek Chat -> Gemini 2.5 Flash)
    const llmResult = await callLLMWithFallback({
      operation: "strategy", // Uses Strategy routing (DeepSeek Reasoner for premium, DeepSeek Chat for standard paid)
      modelTier: planContext.modelTier,
      prompt,
      outputSchema: rewriterResponseSchema,
      maxTokens: 1500,
      temperature: 0.5,
    });

    if (!llmResult.success) {
      return apiError(
        "SERVICE_UNAVAILABLE",
        "Failed to generate rewritten script due to AI provider errors. Please try again shortly.",
        llmResult.error
      );
    }

    // 7. Atomically increment billing usage counters
    await incrementUsage(user.id, "aiCallsCount", 1);
    await incrementUsage(user.id, "aiTokensUsed", llmResult.tokensUsed);
    await incrementUsage(user.id, "aiCostUsd", llmResult.costUsd);

    // 8. Return successful API response
    return apiSuccess({
      ...llmResult.data,
      metadata: {
        modelUsed: llmResult.modelId,
        costUsd: llmResult.costUsd,
        latencyMs: llmResult.latencyMs,
      },
    });
  } catch (error) {
    console.error(`[API-SCRIPT-REWRITE] Crash at ${ipAddress}:`, error);
    return apiError("INTERNAL_ERROR", "An unexpected server error occurred during script rewriting.");
  }
}
