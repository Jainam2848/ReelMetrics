"use client";

import useSWR from "swr";
import { useActiveAccount } from "@/components/shared/active-account-context";

export interface AnalyticsSummary {
  totalViews: number;
  avgEngagementRate: number;
  avgHookRetention: number;
  avgWatchThrough: number;
}

export interface ContentTypePerformance {
  type: string;
  views: number;
  er: number;
}

export interface HeatmapItem {
  day: string;
  hour: string;
  score: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  contentTypes: ContentTypePerformance[];
  heatmap: HeatmapItem[];
}

export interface TrendItem {
  date: string;
  engagementRate: number;
  hookRetention: number;
  watchThrough: number;
}

export function useAnalytics(timeframeDays: 7 | 30 | 90 = 30) {
  const { activeAccount } = useActiveAccount();

  // Fetch metrics summaries
  const {
    data: metrics,
    error: metricsError,
    isLoading: metricsLoading,
    mutate: mutateMetrics,
  } = useSWR<AnalyticsData>(
    activeAccount
      ? `/api/accounts/${activeAccount.id}/analytics?days=${timeframeDays}`
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Fetch trend line timeline
  const {
    data: trends = [],
    error: trendsError,
    isLoading: trendsLoading,
    mutate: mutateTrends,
  } = useSWR<TrendItem[]>(
    activeAccount
      ? `/api/accounts/${activeAccount.id}/trends?days=${timeframeDays}`
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const mutate = async () => {
    await Promise.all([mutateMetrics(), mutateTrends()]);
  };

  return {
    metrics,
    trends,
    error: metricsError || trendsError,
    isLoading: (metricsLoading || trendsLoading) && activeAccount !== null,
    mutate,
  };
}
