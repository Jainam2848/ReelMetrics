"use client";

import React, { useMemo, useState } from "react";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useAnalytics } from "@/hooks/use-analytics";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LoadError } from "@/components/shared/load-error";
import { m, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const ReelsPerformanceChart = dynamic(
  () => import("@/components/analytics/reels-performance-chart").then((mod) => mod.ReelsPerformanceChart),
  {
    ssr: false,
    loading: () => <LoadingSkeleton variant="chart" />,
  }
);
import {
  BarChart3,
  Clock,
  Flame,
  TrendingUp,
  Info,
  ArrowUpRight,
  Sparkles,
  Layers,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

const HEATMAP_HOUR_SLOTS = ["8:00", "12:00", "18:00", "20:00"];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalyticsPage() {
  const { activeAccount } = useActiveAccount();
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30);
  const [baselineDays, setBaselineDays] = useState<30 | 60>(30);
  const [activeTab, setActiveTab] = useState<"growth" | "content" | "heatmap" | "next-tests">("growth");
  const [sortKey, setSortKey] = useState<"intent" | "reachRate" | "saveRate" | "shareRate">("intent");

  const {
    metrics,
    isLoading,
    error,
    mutate,
    metricsHasData,
  } = useAnalytics(timeframe, baselineDays);

  // Construct Heatmap Data Lookups
  const heatmapGrid = useMemo(() => {
    const cells = metrics?.heatmap ?? [];
    if (cells.length === 0) return null;

    const lookup = new Map<string, { score: number; lift: number; count: number }>();
    for (const cell of cells) {
      lookup.set(`${cell.day}|${cell.hour}`, {
        score: cell.score,
        lift: cell.lift,
        count: cell.count,
      });
    }

    return WEEK_DAYS.map((day) =>
      HEATMAP_HOUR_SLOTS.map((hour) => lookup.get(`${day}|${hour}`) ?? { score: 0, lift: 0, count: 0 })
    );
  }, [metrics]);

  // Rank Feed Posts / Reels by intent
  const sortedReels = useMemo(() => {
    const rows = metrics?.content ?? [];
    const baselineReelReach = metrics?.baselines?.reels?.avgReach ?? 0;

    return rows.map((p) => {
      const caption = p.caption?.trim();
      const title = caption
        ? caption.length > 86
          ? `${caption.slice(0, 83)}...`
          : caption
        : "Untitled synced post";
      const reachLift =
        baselineReelReach > 0 ? ((p.reach - baselineReelReach) / baselineReelReach) * 100 : 0;
      const intentScore = p.saves * 2 + p.shares * 3 + p.comments;

      return {
        ...p,
        type: p.mediaType || "REEL",
        title,
        date: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        reachRate: Number(p.reachRate.toFixed(2)),
        saveRate: Number(p.saveRateReach.toFixed(2)),
        shareRate: Number(p.shareRateReach.toFixed(2)),
        intentScore,
        reachLift: Number(reachLift.toFixed(1)),
        trust: p.dataTrustLabel,
      };
    }).sort((a, b) => {
      if (sortKey === "intent") return b.intentScore - a.intentScore;
      if (sortKey === "reachRate") return b.reachRate - a.reachRate;
      if (sortKey === "saveRate") return b.saveRate - a.saveRate;
      return b.shareRate - a.shareRate;
    });
  }, [metrics, sortKey]);

  // Active Stories List
  const storiesList = useMemo(() => {
    return metrics?.stories ?? [];
  }, [metrics]);

  // Account daily reach and impressions line data
  const lineChartData = useMemo(() => {
    const rows = metrics?.dailyInsights ?? [];
    if (rows.length > 0) {
      return [...rows].reverse().map((r) => ({
        date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Reach: r.reach,
        Views: r.impressions,
        Intent: 0,
        Engagements: 0,
      }));
    }

    return metrics?.contentTimeline ?? [];
  }, [metrics]);

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

  if (!isLoading && !error && !metricsHasData) {
    return (
      <EmptyState
        context="analytics"
        actionLabel="Go to Accounts to Sync"
        onActionClick={() => {
          window.location.assign("/accounts");
        }}
      />
    );
  }

  const growthMetrics = metrics?.growth ?? {
    totalFollowers: activeAccount.followersCount,
    newFollowers: 0,
    growthRate: 0,
  };
  const formatBaselines = metrics?.baselines ?? {
    reels: { avgReach: 0, avgEngagement: 0, avgSaves: 0, avgShares: 0 },
    stories: { avgReach: 0, avgImpressions: 0, avgCompletionRate: 0 },
  };

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
    <div className="flex flex-col gap-8 text-white relative">
      {/* Background neon glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-brand-secondary/5 rounded-full blur-[150px] pointer-events-none select-none" />

      {/* Header section with high visual design */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 select-none relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
              Decision Intelligence Engine
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10">
              v22.0 Meta Core
            </span>
          </div>
          <h2 className="text-3xl font-display font-black tracking-tight text-white mb-1.5 flex items-center gap-2">
            Creator-Centric Strategy Analytics
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl font-medium">
            Stop guessing. Trendoraa dissects your synced Reels, feed posts, and active stories into actionable signals with a guaranteed index of trust.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-glass select-none">
            {([7, 30, 90] as const).map((days) => (
              <button
                key={days}
                onClick={() => setTimeframe(days)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  timeframe === days
                    ? "bg-brand-primary text-white shadow-glow-sm"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="chart" />
      ) : error ? (
        <LoadError
          title="Couldn't load strategy metrics"
          error={error}
          onRetry={() => mutate()}
          variant="inline"
        />
      ) : (
        <>
          {/* Core Key Metrics Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none relative z-10">
            {[
              {
                label: "Total Impressions",
                val: totalImpressions,
                desc: "Cumulative content reach density",
                icon: <TrendingUp className="w-5 h-5 text-brand-primary" />,
                badge: "Verified Source",
              },
              {
                label: "Average Engagement Moat",
                val: avgEngagementRate,
                desc: "Like + Save + Comment index per post",
                icon: <Flame className="w-5 h-5 text-brand-accent" />,
                badge: "Calculated Signal",
              },
              {
                label: "Proprietary Hook Strength",
                val: hookStrength,
                desc: "100% minus average skip rate",
                icon: <BarChart3 className="w-5 h-5 text-brand-secondary" />,
                badge: "Calculated Signal",
              },
            ].map((stat, idx) => (
              <m.div
                key={idx}
                whileHover={{ y: -4, scale: 1.01 }}
                className="border border-white/10 bg-glass-deep backdrop-blur-md rounded-2xl p-5 shadow-glow relative overflow-hidden group transition-all"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-xl group-hover:bg-brand-primary/10 transition-all" />
                <div className="flex justify-between items-start mb-3.5">
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl group-hover:border-brand-primary/30 transition-all">
                    {stat.icon}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-gray-400 border border-white/10 uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-brand-primary" />
                    {stat.badge}
                  </span>
                </div>
                <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
                  {stat.label}
                </h4>
                <strong className="text-2xl font-display font-black text-white tracking-tight">
                  {stat.val}
                </strong>
                <p className="text-[10px] text-gray-500 font-semibold mt-2">
                  {stat.desc}
                </p>
              </m.div>
            ))}
          </div>

          {/* Navigation tab bar matching creator-centric questions */}
          <div className="flex border-b border-white/10 p-0.5 select-none relative z-10 w-full overflow-x-auto gap-2">
            {([
              { id: "growth", label: "Did I Grow?", question: "Audience & Reach Velocity" },
              { id: "content", label: "What Worked?", question: "Intent-driven post ranking" },
              { id: "heatmap", label: "When to Post?", question: "Reach lift optimal times" },
              { id: "next-tests", label: "What to Test?", question: "Format baselines & warnings" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col text-left px-5 py-3 rounded-t-xl transition-all relative shrink-0 active:scale-98 cursor-pointer ${
                  activeTab === tab.id
                    ? "text-brand-primary bg-white/5 font-bold border-t-2 border-brand-primary"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <span className="text-xs font-black uppercase tracking-wide">{tab.label}</span>
                <span className="text-[9px] text-gray-500 font-semibold mt-0.5">{tab.question}</span>
              </button>
            ))}
          </div>

          {/* Interactive tab viewport with spring animation transitions */}
          <div className="relative z-10 min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === "growth" && (
                <m.div
                  key="growth-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                  <div className="lg:col-span-2 border border-glass bg-glass rounded-2xl p-6 shadow-glow relative">
                    <div className="flex justify-between items-center mb-6 select-none">
                      <div>
                        <h3 className="text-base font-display font-extrabold text-white">
                          Daily Account Reach vs Impressions
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Rolling {timeframe}d time-series from account insights or synced content
                        </p>
                      </div>
                      <div className="px-3 py-1 border border-brand-primary/30 bg-brand-primary/10 text-[9px] font-bold text-brand-primary rounded-full uppercase tracking-wider">
                        Account-Day Metric Grain
                      </div>
                    </div>

                    <div className="w-full h-[250px] min-w-0 min-h-0 text-xs">
                      <ReelsPerformanceChart data={lineChartData} />
                    </div>
                  </div>

                  <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow flex flex-col justify-between select-none">
                    <div>
                      <h3 className="text-base font-display font-extrabold text-white mb-2 flex items-center gap-1.5">
                        <span>Follower Growth Velocity</span>
                      </h3>
                      <p className="text-xs text-muted-foreground mb-6">
                        Calculated from localized audience snapshot history.
                      </p>

                      <div className="flex flex-col gap-5">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Followers</h4>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black">{growthMetrics.totalFollowers.toLocaleString()}</span>
                            <span className="text-[10px] text-brand-primary font-bold bg-brand-primary/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <ArrowUpRight className="w-3 h-3" />
                              {growthMetrics.growthRate.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">New Followers in period</h4>
                          <span className="text-xl font-black text-brand-secondary">+{growthMetrics.newFollowers.toLocaleString()}</span>
                          <p className="text-[9px] text-gray-500 mt-1 font-semibold">Net new accounts gained locally</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-glass flex items-start gap-2.5 mt-6">
                      <Sparkles className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-300 leading-normal font-semibold">
                        Gained an average of <strong>{(growthMetrics.newFollowers / timeframe).toFixed(1)}</strong> new followers daily over this window.
                      </p>
                    </div>
                  </div>
                </m.div>
              )}

              {activeTab === "content" && (
                <m.div
                  key="content-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-6"
                >
                  {/* Sort toolbar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-glass select-none">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-primary" />
                      <span className="text-xs font-black uppercase tracking-wider">Rank Content By:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { id: "intent", label: "Saves + Shares Index (Intent)" },
                        { id: "reachRate", label: "Reach Rate %" },
                        { id: "saveRate", label: "Save Rate %" },
                        { id: "shareRate", label: "Share Rate %" },
                      ] as const).map((key) => (
                        <button
                          key={key.id}
                          onClick={() => setSortKey(key.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${
                            sortKey === key.id
                              ? "bg-brand-primary text-white shadow-glow-sm"
                              : "bg-white/5 text-gray-400 hover:text-white"
                          }`}
                        >
                          {key.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Media Post Listing */}
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-400">Reels & Feed Posts ({sortedReels.length})</h3>
                        <div className="flex items-center gap-1.5 select-none">
                          <label className="text-[10px] text-gray-500 font-bold uppercase">Baseline Window:</label>
                          <select
                            value={baselineDays}
                            onChange={(e) => setBaselineDays(Number(e.target.value) === 60 ? 60 : 30)}
                            className="bg-white/5 text-white border border-white/10 rounded-lg text-[9px] px-2 py-0.5 font-bold uppercase"
                          >
                            <option value={30}>30d Baseline</option>
                            <option value={60}>60d Baseline</option>
                          </select>
                        </div>
                      </div>

                      {sortedReels.length > 0 ? sortedReels.map((post) => (
                        <div key={post.id} className="border border-white/10 bg-glass-deep backdrop-blur-md rounded-2xl p-5 hover:border-brand-primary/45 transition-all flex flex-col gap-4 group">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wide ${post.type === "REEL" ? "bg-purple-500/20 text-purple-400 border border-purple-500/35" : "bg-blue-500/20 text-blue-400 border border-blue-500/35"}`}>
                                  {post.type}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold">{post.date}</span>
                              </div>
                              <h4 className="text-xs font-black text-white leading-normal pr-8 group-hover:text-brand-primary transition-all">
                                {post.title}
                              </h4>
                            </div>

                            {/* Neon Baseline Indicator */}
                            <div className="text-right shrink-0">
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                                post.reachLift >= 0
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {post.reachLift >= 0 ? "+" : ""}{post.reachLift}% reach
                              </span>
                            </div>
                          </div>

                          {/* Stat Grid with derived metrics */}
                          <div className="grid grid-cols-5 gap-2 pt-3 border-t border-white/5 text-center">
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Reach</span>
                              <strong className="text-xs text-white font-black">{post.reach.toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Reach Rate</span>
                              <strong className="text-xs text-brand-primary font-black">{post.reachRate}%</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Save Rate</span>
                              <strong className="text-xs text-brand-secondary font-black">{post.saveRate}%</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Share Rate</span>
                              <strong className="text-xs text-brand-accent font-black">{post.shareRate}%</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Trust</span>
                              <span className="text-[8px] bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase block w-fit mx-auto mt-0.5">
                                {post.trust}
                              </span>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="border border-white/10 bg-white/5 rounded-2xl p-6 text-center">
                          <p className="text-xs text-muted-foreground font-semibold">
                            No synced posts in this window yet. Sync an account to rank content by reach, saves, and shares.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Stories Listing */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-1">Active Stories ({storiesList.length})</h3>

                      {storiesList.length > 0 ? storiesList.map((story) => (
                        <div key={story.id} className="border border-white/10 bg-glass-deep backdrop-blur-md rounded-2xl p-5 hover:border-brand-secondary/45 transition-all flex flex-col gap-4 group">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] text-gray-500 font-bold">
                                {new Date(story.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(story.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                              <h4 className="text-xs font-black text-white mt-0.5">
                                Story Broadcast Ingestion
                              </h4>
                            </div>
                            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-brand-secondary/15 text-brand-secondary border border-brand-secondary/30 uppercase tracking-wider">
                              <ShieldCheck className="w-3 h-3" />
                              {story.dataTrustLabel || "Verified Source"}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/5 text-center">
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Impressions</span>
                              <strong className="text-xs text-white font-black">{story.impressions}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Reach</span>
                              <strong className="text-xs text-white font-black">{story.reach}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Exits</span>
                              <strong className="text-xs text-rose-400 font-black">{story.exits}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Completion Rate</span>
                              <strong className="text-xs text-brand-secondary font-black">{story.completionRate == null ? "-" : `${Number(story.completionRate).toFixed(1)}%`}</strong>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="border border-white/10 bg-white/5 rounded-2xl p-6 text-center">
                          <p className="text-xs text-muted-foreground font-semibold">
                            No active story insights in this window.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </m.div>
              )}

              {activeTab === "heatmap" && (
                <m.div
                  key="heatmap-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                  <div className="lg:col-span-2 border border-glass bg-glass rounded-2xl p-6 shadow-glow relative select-none">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-display font-extrabold text-white flex items-center gap-1.5">
                          <Clock className="w-5 h-5 text-brand-primary" />
                          <span>Posting Reach-Lift Heatmap</span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Color intensity indicates the <strong>average reach lift relative to baseline</strong> when publishing in each slot.
                        </p>
                      </div>
                      {!heatmapGrid && (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          No data
                        </span>
                      )}
                    </div>

                    {heatmapGrid ? (
                      <div className="flex flex-col gap-2.5 mt-6">
                        <div className="grid grid-cols-5 gap-1 text-[10px] font-bold text-center text-gray-500 pb-1 border-b border-white/5">
                          <div></div>
                          {HEATMAP_HOUR_SLOTS.map((hour) => (
                            <div key={hour}>{hour}</div>
                          ))}
                        </div>

                        {WEEK_DAYS.map((day, dayIdx) => (
                          <div key={day} className="grid grid-cols-5 gap-2 items-center text-center">
                            <div className="text-[10px] font-bold text-gray-400 text-left pl-1">
                              {day}
                            </div>
                            {heatmapGrid[dayIdx]!.map((cell, hourIdx) => {
                              const lift = cell.lift;
                              const isPositive = lift >= 0;
                              
                              // Background coloring based on positive vs negative lift
                              const opacityClass =
                                cell.count === 0
                                  ? "bg-white/5 border-white/5"
                                  : isPositive
                                    ? lift >= 30
                                      ? "bg-brand-primary border-brand-primary"
                                      : lift >= 15
                                        ? "bg-brand-primary/75 border-brand-primary/50"
                                        : "bg-brand-primary/40 border-brand-primary/30"
                                    : lift <= -20
                                      ? "bg-rose-500/40 border-rose-500/25"
                                      : "bg-amber-500/25 border-amber-500/15";

                              return (
                                <div
                                  key={hourIdx}
                                  className={`h-7 rounded-lg ${opacityClass} border transition-all relative group flex items-center justify-center`}
                                  title={`${day} ${HEATMAP_HOUR_SLOTS[hourIdx]}: ${lift >= 0 ? "+" : ""}${lift}% lift (${cell.count} posts)`}
                                >
                                  {cell.count > 0 && (
                                    <span className="text-[8px] font-black opacity-60 text-white select-none">
                                      {lift >= 0 ? "+" : ""}{Math.round(lift)}%
                                    </span>
                                  )}
                                </div>
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

                  <div className="flex flex-col gap-6 select-none">
                    <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow">
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-brand-secondary animate-pulse" />
                        <span>Confidence Warnings</span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-normal mb-4 font-semibold">
                        We scan each day-hour slot and check the publication sample size to avoid false strategic suggestions.
                      </p>

                      <div className="flex flex-col gap-3">
                        {heatmapGrid ? (
                          // Find slots with low sample size
                          (() => {
                            const warnings: React.ReactNode[] = [];
                            WEEK_DAYS.forEach((day, dayIdx) => {
                              HEATMAP_HOUR_SLOTS.forEach((hour, hourIdx) => {
                                const cell = heatmapGrid[dayIdx]![hourIdx]!;
                                if (cell.count > 0 && cell.count < 5) {
                                  warnings.push(
                                    <div key={`${day}-${hour}`} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                      <p className="text-[9px] text-amber-300 leading-normal font-semibold">
                                        <strong>{day} at {hour}</strong> has only {cell.count} samples. Publish at least {5 - cell.count} more times in this slot to confirm lift trends.
                                      </p>
                                    </div>
                                  );
                                }
                              });
                            });
                            
                            return warnings.length > 0 ? (
                              <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1">
                                {warnings}
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <span className="text-[9px] text-emerald-300 font-bold uppercase">All posting slots have high confidence!</span>
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-[9px] text-gray-500 italic">No warnings computed yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </m.div>
              )}

              {activeTab === "next-tests" && (
                <m.div
                  key="next-tests-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8 select-none"
                >
                  <div className="lg:col-span-2 border border-glass bg-glass rounded-2xl p-6 shadow-glow">
                    <h3 className="text-base font-display font-extrabold text-white mb-4 flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-brand-primary" />
                      <span>Format Baseline Performance Signals</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mb-6">
                      How your active media types compare against rolling averages in this account.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Reels Baseline */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                          <span className="px-2 py-0.5 rounded text-[8px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/35 uppercase">REELS BASELINE</span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase">{baselineDays}d window</span>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Average Reach</span>
                            <strong className="text-white">{formatBaselines.reels.avgReach.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Average Engagement</span>
                            <strong className="text-brand-primary">{formatBaselines.reels.avgEngagement}%</strong>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Average Saves</span>
                            <strong className="text-brand-secondary">{formatBaselines.reels.avgSaves}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Stories Baseline */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                          <span className="px-2 py-0.5 rounded text-[8px] font-black bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/35 uppercase">STORIES BASELINE</span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase">{baselineDays}d window</span>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Average Reach</span>
                            <strong className="text-white">{formatBaselines.stories.avgReach.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Average Impressions</span>
                            <strong className="text-white">{formatBaselines.stories.avgImpressions.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Average Completion</span>
                            <strong className="text-brand-secondary">{Number(formatBaselines.stories.avgCompletionRate).toFixed(1)}%</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-brand-primary" />
                        <span>Vanity vs Intent Guidelines</span>
                      </h3>
                      
                      <div className="flex flex-col gap-4 text-[11px] text-muted-foreground leading-relaxed font-semibold">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1.5" />
                          <p>
                            <strong>Vanity Metrics (Likes, Comments)</strong>: Easy to acquire but weak indicators of content pillar interest or real user value.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                          <p>
                            <strong>Intent Metrics (Saves, Shares)</strong>: Reflect maximum commitment. A save proves a user wants to refer back; a share expands viral reach loops automatically.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-3 rounded-xl bg-white/5 border border-glass flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-300 leading-normal font-semibold">
                        We prioritize Saves + Shares heavily in our content score to separate hollow viral trends from real audience commitment.
                      </p>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
