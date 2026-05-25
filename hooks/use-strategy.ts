"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useToast } from "@/components/shared/toast";

export interface CalendarItem {
  day: string;
  time: string;
  contentType: string;
  topic: string;
  hookSuggestion: string;
  audio?: string;
  estEngagement: string;
  captionDirection?: string;
  hashtags?: string[];
  reasoning?: string;
}

export interface StrategyData {
  id: string;
  accountId: string;
  strategyType: string;
  content: {
    focus: string;
    keyInsight: string;
    postingCadence: string;
    tactics: string[];
    contentCalendar: CalendarItem[];
    summary?: string;
    source?: "ai" | "heuristic";
  };
  periodStart: string;
  periodEnd: string;
  generatedAt: string | null;
}

export function useStrategy() {
  const { activeAccount } = useActiveAccount();
  const toast = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousGeneratedAtRef = useRef<string | null>(null);

  // Fetch the latest strategy
  const {
    data: strategy,
    error,
    isLoading,
    mutate,
  } = useSWR<StrategyData>(
    activeAccount ? `/api/accounts/${activeAccount.id}/strategy` : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Cache previous generation time to check for updates
  useEffect(() => {
    if (strategy?.generatedAt) {
      previousGeneratedAtRef.current = strategy.generatedAt;
    }
  }, [strategy]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Poll strategy status until new one is generated
  const pollStrategy = useCallback(async () => {
    if (!activeAccount) return;

    try {
      const res = await fetch(`/api/accounts/${activeAccount.id}/strategy`);
      const json = await res.json();

      if (json.success && json.data) {
        const newStrategy: StrategyData = json.data;
        
        // If generatedAt timestamp is newer than what we had before, it finished!
        const isNew =
          newStrategy.generatedAt !== null &&
          (!previousGeneratedAtRef.current ||
            new Date(newStrategy.generatedAt).getTime() > new Date(previousGeneratedAtRef.current).getTime());

        if (isNew) {
          setIsGenerating(false);
          stopPolling();
          mutate(newStrategy, false);
          toast.success("AI Strategy Blueprint compiled successfully!");
        }
      }
    } catch (err) {
      console.error("Error polling strategy:", err);
    }
  }, [activeAccount, stopPolling, mutate, toast]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Trigger strategy generation
  const generateStrategy = useCallback(async () => {
    if (!activeAccount) return;

    try {
      setIsGenerating(true);
      toast.info("Enqueuing strategy job. AI is analyzing your last 30 posts to compile a new weekly plan...");

      const res = await fetch(`/api/accounts/${activeAccount.id}/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();

      if (json.success) {
        stopPolling();
        pollIntervalRef.current = setInterval(pollStrategy, 5000); // Poll every 5s per spec
      } else {
        throw new Error(json.error?.message || "Failed to trigger strategy");
      }
    } catch (err) {
      console.error("Strategy generation failed:", err);
      setIsGenerating(false);
      toast.error(err instanceof Error ? err.message : "Failed to compile strategy.");
    }
  }, [activeAccount, pollStrategy, stopPolling, toast]);

  return {
    strategy,
    error,
    isLoading: isLoading && activeAccount !== null,
    isGenerating,
    generateStrategy,
    mutate,
  };
}
