import { POST } from "@/app/api/scripts/rewrite/route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callLLMWithFallback } from "@/lib/ai/llm-with-fallback";
import {
  getUserPlanContext,
  checkUsageLimit,
  incrementUsage,
} from "@/lib/billing/usage-tracker";

// Mock Supabase
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Mock LLM Fallback Wrapper
jest.mock("@/lib/ai/llm-with-fallback", () => ({
  callLLMWithFallback: jest.fn(),
}));

// Mock Usage Tracker
jest.mock("@/lib/billing/usage-tracker", () => ({
  getUserPlanContext: jest.fn(),
  checkUsageLimit: jest.fn(),
  incrementUsage: jest.fn(),
}));

describe("POST /api/scripts/rewrite API Endpoint Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    return new NextRequest("http://localhost:3000/api/scripts/rewrite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  it("should return 401 UNAUTHORIZED if the caller has no active session", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const req = createMockRequest({
      rawScript: "Let's negotiate your salary draft...",
      growthGoal: "followers",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 403 NO_ACTIVE_SUBSCRIPTION if the user is on the free plan tier", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user_123" } }, error: null }),
      },
    });
    (getUserPlanContext as jest.Mock).mockResolvedValue({
      planId: "free",
      modelTier: "standard",
    });

    const req = createMockRequest({
      rawScript: "Let's negotiate your salary draft...",
      growthGoal: "followers",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("NO_ACTIVE_SUBSCRIPTION");
  });

  it("should return 403 AI_BUDGET_EXCEEDED if the usage tracker signals limits exceeded", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user_123" } }, error: null }),
      },
    });
    (getUserPlanContext as jest.Mock).mockResolvedValue({
      planId: "creator",
      modelTier: "standard",
    });
    (checkUsageLimit as jest.Mock).mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 150,
    });

    const req = createMockRequest({
      rawScript: "Let's negotiate your salary draft...",
      growthGoal: "followers",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("AI_BUDGET_EXCEEDED");
  });

  it("should return 400 VALIDATION_ERROR if required body fields are missing or invalid", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user_123" } }, error: null }),
      },
    });
    (getUserPlanContext as jest.Mock).mockResolvedValue({
      planId: "creator",
      modelTier: "standard",
    });
    (checkUsageLimit as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 10,
      limit: 150,
    });

    // Too short script (under 10 chars)
    const req = createMockRequest({
      rawScript: "short",
      growthGoal: "followers",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("should process rewrite successfully, increment usage, and return storyboard data", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user_123" } }, error: null }),
      },
    });
    (getUserPlanContext as jest.Mock).mockResolvedValue({
      planId: "pro",
      modelTier: "premium",
    });
    (checkUsageLimit as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 100,
      limit: 600,
    });

    const mockLlmOutput = {
      curiosity_audit: "The original hook lacks tension and self-reference.",
      psychological_lever: "Loss Aversion",
      rewritten_script: [
        {
          time_start_sec: 0,
          time_end_sec: 3,
          visual_action: "Zoom in on face with serious expression.",
          spoken_script: "Stop scrolling if you want to save your job.",
          on_screen_text: "SAVE YOUR JOB",
          sound_sync_note: "Swoosh sound effect",
        },
      ],
    };

    (callLLMWithFallback as jest.Mock).mockResolvedValue({
      success: true,
      data: mockLlmOutput,
      modelId: "deepseek-reasoner",
      tokensUsed: 800,
      costUsd: 0.0012,
      latencyMs: 1200,
      attempts: ["deepseek-reasoner"],
    });

    const req = createMockRequest({
      rawScript: "Negotiating your salary is crucial, but most people just accept whatever they are offered...",
      growthGoal: "engagement",
      niche: "careers",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.curiosity_audit).toBe(mockLlmOutput.curiosity_audit);
    expect(json.data.psychological_lever).toBe(mockLlmOutput.psychological_lever);
    expect(json.data.rewritten_script.length).toBe(1);
    expect(json.data.metadata.modelUsed).toBe("deepseek-reasoner");

    // Verify usage logging was triggered
    expect(incrementUsage).toHaveBeenCalledWith("user_123", "aiCallsCount", 1);
    expect(incrementUsage).toHaveBeenCalledWith("user_123", "aiTokensUsed", 800);
    expect(incrementUsage).toHaveBeenCalledWith("user_123", "aiCostUsd", 0.0012);
  });
});
