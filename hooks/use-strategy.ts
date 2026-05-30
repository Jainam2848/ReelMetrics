"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useToast } from "@/components/shared/toast";

const STRATEGY_POLL_INTERVAL_MS = 5000;
const STRATEGY_POLL_MAX_MS = 5 * 60 * 1000;

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
    winningTemplate?: any;
    nicheGaps?: any;
    experimentQueue?: any;
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
  const pollStartedAtRef = useRef<number | null>(null);
  const previousGeneratedAtRef = useRef<string | null>(null);

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
    pollStartedAtRef.current = null;
  }, []);

  const failGeneration = useCallback(
    (userMessage: string) => {
      setIsGenerating(false);
      stopPolling();
      toast.error(userMessage);
    },
    [stopPolling, toast]
  );

  const pollStrategy = useCallback(async () => {
    if (!activeAccount) return;

    if (
      pollStartedAtRef.current &&
      Date.now() - pollStartedAtRef.current > STRATEGY_POLL_MAX_MS
    ) {
      failGeneration(
        "Strategy generation is taking longer than expected. Check back shortly or try again."
      );
      return;
    }

    try {
      const res = await fetch(`/api/accounts/${activeAccount.id}/strategy`);
      const json = await res.json();

      if (json.success && json.data) {
        const newStrategy: StrategyData = json.data;

        const isNew =
          newStrategy.generatedAt !== null &&
          (!previousGeneratedAtRef.current ||
            new Date(newStrategy.generatedAt).getTime() >
              new Date(previousGeneratedAtRef.current).getTime());

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
  }, [activeAccount, failGeneration, stopPolling, mutate, toast]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const generateStrategy = useCallback(async () => {
    if (!activeAccount) return;

    try {
      setIsGenerating(true);
      toast.info(
        "Enqueuing strategy job. AI is analyzing your last 30 posts to compile a new weekly plan..."
      );

      const res = await fetch(`/api/accounts/${activeAccount.id}/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();

      if (!json.success) {
        if (json.error?.code === "USAGE_LIMIT_EXCEEDED") {
          failGeneration(
            json.error.message ||
              "Monthly usage limit reached for strategy generation. Upgrade your plan on Billing."
          );
          return;
        }
        throw new Error(json.error?.message || "Failed to trigger strategy");
      }

      stopPolling();
      pollStartedAtRef.current = Date.now();
      pollIntervalRef.current = setInterval(
        pollStrategy,
        STRATEGY_POLL_INTERVAL_MS
      );
    } catch (err) {
      console.error("Strategy generation failed:", err);
      failGeneration(
        err instanceof Error ? err.message : "Failed to compile strategy."
      );
    }
  }, [activeAccount, failGeneration, pollStrategy, stopPolling, toast]);

  return {
    strategy,
    error,
    isLoading: isLoading && activeAccount !== null,
    isGenerating,
    generateStrategy,
    mutate,
  };
}
