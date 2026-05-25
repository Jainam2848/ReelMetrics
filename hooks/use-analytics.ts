"use client";

import useSWR from "swr";
import { useActiveAccount } from "@/components/shared/active-account-context";

export interface AnalyticsSummary {
  totalViews: number;
  avgEngagementRate: number | null;
  avgHookRetention: number | null;
  avgWatchThrough: number | null;
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
  hasData?: boolean;
  summary: AnalyticsSummary;
  contentTypes: ContentTypePerformance[];
  heatmap: HeatmapItem[];
}

export interface TrendItem {
  date: string;
  engagementRate: number;
  hookRetention: number;
  watchThrough: number | null;
}

interface TrendsResponse {
  hasData: boolean;
  timeline: TrendItem[];
}

export function useAnalytics(timeframeDays: 7 | 30 | 90 = 30) {
  const { activeAccount } = useActiveAccount();

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

  const {
    data: trendsPayload,
    error: trendsError,
    isLoading: trendsLoading,
    mutate: mutateTrends,
  } = useSWR<TrendsResponse>(
    activeAccount
      ? `/api/accounts/${activeAccount.id}/trends?days=${timeframeDays}`
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const trends = trendsPayload?.timeline ?? [];
  const trendsHasData = trendsPayload?.hasData ?? trends.length > 0;

  const mutate = async () => {
    await Promise.all([mutateMetrics(), mutateTrends()]);
  };

  return {
    metrics,
    trends,
    trendsHasData,
    metricsHasData: metrics?.hasData ?? (metrics?.summary?.totalViews ?? 0) > 0,
    error: metricsError || trendsError,
    isLoading: (metricsLoading || trendsLoading) && activeAccount !== null,
    mutate,
  };
}
