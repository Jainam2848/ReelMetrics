"use client";

import useSWR from "swr";
import { useActiveAccount } from "@/components/shared/active-account-context";

export interface MomentumData {
  momentumState: "trending-up" | "stable" | "cooling-off";
  compositeDelta: number;
  interpretation: string;
  source: "ai" | "heuristic";
  modelId: string;
  currentAverages: {
    avgEngagementRate: number;
    avgReach: number;
    avgSaves: number;
  };
  priorAverages: {
    avgEngagementRate: number;
    avgReach: number;
    avgSaves: number;
  };
  deltas: {
    engagementRate: number;
    reach: number;
    saves: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: MomentumData;
}

export function useMomentum() {
  const { activeAccount } = useActiveAccount();

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    activeAccount ? `/api/accounts/${activeAccount.id}/momentum` : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    momentum: data?.success ? data.data : undefined,
    error,
    isLoading: isLoading && activeAccount !== null,
    mutate,
  };
}
