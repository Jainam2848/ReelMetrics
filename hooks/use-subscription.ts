"use client";

import useSWR from "swr";

export interface SubscriptionData {
  id: string;
  planId: "free" | "creator" | "pro" | "agency";
  status: string;
  currentPeriodEnd: string;
  stripeSubId: string | null;
  plan: {
    name: string;
    priceMonthly: number;
    maxAccounts: number;
    maxReels: number;
    aiTier: string;
    features: string[];
  };
}

export interface UsageData {
  aiCallsCount: number;
  aiTokensUsed: number;
  aiCostUsd: number;
  reelsAnalyzed: number;
  strategiesGen: number;
  apiCallsCount: number;
  limits: {
    maxAccounts: number;
    maxReelsAnalyzed: number;
    monthlyAiLimit: number;
    maxStrategies: number;
  };
}

export function useSubscription() {
  // Fetch active plan
  const {
    data: subscription,
    error: subError,
    isLoading: subLoading,
    mutate: mutateSubscription,
  } = useSWR<SubscriptionData>("/api/billing/subscription", {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  // Fetch usage meters
  const {
    data: usage,
    error: usageError,
    isLoading: usageLoading,
    mutate: mutateUsage,
  } = useSWR<UsageData>("/api/billing/usage", {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const mutate = async () => {
    await Promise.all([mutateSubscription(), mutateUsage()]);
  };

  return {
    subscription,
    usage,
    error: subError || usageError,
    isLoading: subLoading || usageLoading,
    mutate,
  };
}
