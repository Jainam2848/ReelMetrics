"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useToast } from "@/components/shared/toast";

export interface PostDetailData {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  permalink: string | null;
  timestamp: string;
  viewsCount: number;
  displayViews: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  skipRate: number | null;
  completionRate: number | null;
  engagementRate: number;
  overallScore: number | null;
  platform: "instagram" | "tiktok";
  reach: number;
}

export interface ScoreData {
  reelId: string;
  overallScore: number;
  dimensions: {
    hook: { score: number; reasoning: string; improvement: string };
    retention_metric: { score: number; reasoning: string; improvement: string };
    retention_proxy: { score: number; reasoning: string; improvement: string };
    cta: { score: number; reasoning: string; improvement: string };
    visual: { score: number; reasoning: string; improvement: string };
    audio: { score: number; reasoning: string; improvement: string };
    trend: { score: number; reasoning: string; improvement: string };
    caption: { score: number; reasoning: string; improvement: string };
    timing: { score: number; reasoning: string; improvement: string };
  };
  aiAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  source: string;
  scoredAt: string;
}

/**
 * Searches across the user's connected accounts to find a post by id.
 * Tries the active account first to minimize network calls; falls back
 * to scanning the remaining accounts if not found there (handles direct
 * navigation / bookmarked URLs).
 */
async function locatePostAcrossAccounts(
  postId: string,
  accountIds: string[]
): Promise<PostDetailData> {
  for (const accountId of accountIds) {
    const res = await fetch(`/api/accounts/${accountId}/reels?limit=100`);
    if (!res.ok) continue;

    let json: { success?: boolean; data?: PostDetailData[] };
    try {
      json = await res.json();
    } catch {
      continue;
    }
    if (!json?.success || !Array.isArray(json.data)) continue;

    const match = json.data.find((p) => p.id === postId);
    if (match) return match;
  }

  throw new Error("Post not found in any connected account");
}

export function usePostDetail(postId: string) {
  const toast = useToast();
  const { activeAccount, accounts } = useActiveAccount();
  const [isScoring, setIsScoring] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Build a deterministic SWR key that includes account ids so the cache
  // invalidates when the user adds/removes accounts.
  const accountIdsKey = accounts.map((a) => a.id).sort().join(",");
  const swrKey =
    postId && accounts.length > 0
      ? ["post-detail", postId, accountIdsKey]
      : null;

  const { data: post, error: postError, isLoading: postLoading } = useSWR<PostDetailData>(
    swrKey,
    async () => {
      // Prefer the active account first; fall back to the rest in order.
      const orderedIds = activeAccount
        ? [activeAccount.id, ...accounts.filter((a) => a.id !== activeAccount.id).map((a) => a.id)]
        : accounts.map((a) => a.id);

      return locatePostAcrossAccounts(postId, orderedIds);
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const { data: scores, error: scoreError, isLoading: scoreLoading, mutate: mutateScore } = useSWR<ScoreData>(
    postId ? `/api/reels/${postId}/score` : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Poll until a database-backed (non-heuristic) score appears.
  const pollScoring = useCallback(async () => {
    try {
      const res = await fetch(`/api/reels/${postId}/score`);
      const json = await res.json();

      if (json.success && json.data && (json.data.source === "ai" || json.data.source === "heuristic")) {
        setIsScoring(false);
        stopPolling();
        mutateScore(json.data, false);
        toast.success("AI post evaluation completed.");
      }
    } catch (err) {
      console.error("Error polling post score:", err);
    }
  }, [postId, stopPolling, mutateScore, toast]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const triggerScoring = useCallback(async () => {
    try {
      setIsScoring(true);

      const res = await fetch(`/api/reels/${postId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();

      if (json.success) {
        stopPolling();
        pollIntervalRef.current = setInterval(pollScoring, 3000);
      } else {
        throw new Error(json.error?.message || "Failed to enqueue scoring job");
      }
    } catch (err) {
      console.error("Trigger scoring failed:", err);
      setIsScoring(false);
      throw err instanceof Error ? err : new Error("Failed to trigger AI scoring");
    }
  }, [postId, pollScoring, stopPolling]);

  return {
    post,
    scores,
    error: postError || scoreError,
    isLoading: postLoading || scoreLoading,
    mutate: mutateScore,
    triggerScoring,
    isScoring,
  };
}
