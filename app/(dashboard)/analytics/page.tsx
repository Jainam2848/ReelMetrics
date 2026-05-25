"use client";

import React, { useMemo, useState } from "react";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useAnalytics } from "@/hooks/use-analytics";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LoadError } from "@/components/shared/load-error";
import {
  BarChart3,
  Clock,
  Flame,
  TrendingUp,
  Info,
} from "lucide-react";

const HEATMAP_HOUR_SLOTS = ["8:00", "12:00", "18:00", "20:00"];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalyticsPage() {
  const { activeAccount } = useActiveAccount();
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30);
  const {
    metrics,
    trends,
    trendsHasData,
    metricsHasData,
    isLoading,
    error,
    mutate,
  } = useAnalytics(timeframe);

  const heatmapGrid = useMemo(() => {
    const cells = metrics?.heatmap ?? [];
    if (cells.length === 0) return null;

    const lookup = new Map<string, number>();
    for (const cell of cells) {
      lookup.set(`${cell.day}|${cell.hour}`, cell.score);
    }

    return WEEK_DAYS.map((day) =>
      HEATMAP_HOUR_SLOTS.map((hour) => lookup.get(`${day}|${hour}`) ?? 0)
    );
  }, [metrics?.heatmap]);

  if (!activeAccount) {
    return (
      <EmptyState
        context="accounts"
        actionLabel="Connect an account"
        onActionClick={() => {
          window.location.assign("/accounts");
        }}
      />
    );
  }

  const avgEngagementRate =
    metrics?.summary?.avgEngagementRate != null
      ? `${Number(metrics.summary.avgEngagementRate).toFixed(2)}%`
      : "—";

  const totalImpressions =
    metrics?.summary?.totalViews != null && metrics.summary.totalViews > 0
      ? Number(metrics.summary.totalViews).toLocaleString()
      : "—";

  const hookStrength =
    metrics?.summary?.avgHookRetention != null
      ? `${Number(metrics.summary.avgHookRetention).toFixed(1)}%`
      : "—";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white mb-1">
            Audience Retention & Heatmaps
          </h2>
          <p className="text-xs text-muted-foreground">
            Metrics are computed from your synced reels only — no synthetic filler.
          </p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-lg border border-glass select-none">
          {([7, 30, 90] as const).map((days) => (
            <button
              key={days}
              onClick={() => setTimeframe(days)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                timeframe === days
                  ? "bg-brand-primary text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {error && (
        <LoadError
          title="Couldn't load analytics"
          error={error}
          onRetry={() => mutate()}
          variant="inline"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        {[
          {
            label: "Total Impressions",
            val: totalImpressions,
            desc: "Accumulated views across content",
            icon: <TrendingUp className="w-5 h-5 text-brand-primary" />,
          },
          {
            label: "Average Engagement Moat",
            val: avgEngagementRate,
            desc: "Like + Save + Comment index",
            icon: <Flame className="w-5 h-5 text-brand-accent" />,
          },
          {
            label: "Proprietary Hook Strength",
            val: hookStrength,
            desc: "100% − average reels_skip_rate",
            icon: <BarChart3 className="w-5 h-5 text-brand-secondary" />,
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="border border-glass bg-glass rounded-2xl p-5 shadow-glow relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-white/5 border border-glass rounded-xl">
                {stat.icon}
              </div>
              {!metricsHasData && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-gray-400 border border-white/10 uppercase tracking-wider">
                  No data yet
                </span>
              )}
            </div>
            <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
              {stat.label}
            </h4>
            <strong className="text-xl font-display font-black text-white tracking-tight">
              {stat.val}
            </strong>
            <p className="text-[10px] text-gray-500 font-semibold mt-2">
              {stat.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-glass bg-glass rounded-2xl p-6 shadow-glow relative">
          <div className="flex justify-between items-center mb-6 select-none">
            <div>
              <h3 className="text-base font-display font-extrabold text-white">
                Engagement Velocity Curve
              </h3>
              <p className="text-xs text-muted-foreground">
                Daily averages on days you published reels
              </p>
            </div>
            <div className="px-2 py-0.5 border border-brand-primary/30 bg-brand-primary/10 text-[9px] font-bold text-brand-primary rounded-full uppercase tracking-wider">
              {timeframe}d Interval
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton variant="chart" />
          ) : trendsHasData && trends.length > 0 ? (
            <TrendChart data={trends} />
          ) : (
            <EmptyState
              context="posts"
              actionLabel="Sync account"
              onActionClick={() => {
                window.location.assign("/accounts");
              }}
            />
          )}
        </div>

        <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow flex flex-col justify-between select-none">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-display font-extrabold text-white flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-brand-primary" />
                <span>Posting Time Heatmap</span>
              </h3>
              {!heatmapGrid && (
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  No data
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Relative publish density by weekday and hour (from synced reels).
            </p>

            {heatmapGrid ? (
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-5 gap-1 text-[10px] font-bold text-center text-gray-500 pb-1 border-b border-white/5">
                  <div></div>
                  {HEATMAP_HOUR_SLOTS.map((hour) => (
                    <div key={hour}>{hour.replace(":00", "")}</div>
                  ))}
                </div>

                {WEEK_DAYS.map((day, dayIdx) => (
                  <div
                    key={day}
                    className="grid grid-cols-5 gap-1.5 items-center text-center"
                  >
                    <div className="text-[10px] font-bold text-gray-400 text-left pl-1">
                      {day}
                    </div>
                    {heatmapGrid[dayIdx]!.map((score, hourIdx) => {
                      const opacityClass =
                        score >= 90
                          ? "bg-brand-primary"
                          : score >= 75
                            ? "bg-brand-primary/75"
                            : score >= 50
                              ? "bg-brand-primary/45"
                              : score > 0
                                ? "bg-brand-primary/15"
                                : "bg-white/5";
                      return (
                        <div
                          key={hourIdx}
                          className={`h-6 rounded-lg ${opacityClass} border border-glass transition-all`}
                          title={`${day} ${HEATMAP_HOUR_SLOTS[hourIdx]}: ${score}%`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Sync reels to see when you publish most often.
              </p>
            )}
          </div>

          <div className="mt-6 p-3 rounded-xl bg-white/5 border border-glass flex items-start gap-3">
            <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-300 leading-normal font-semibold">
              Heatmap intensity reflects how many reels you posted in each slot — not predicted engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
