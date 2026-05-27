"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useAnalytics } from "@/hooks/use-analytics";
import { usePosts } from "@/hooks/use-posts";
import { useSubscription } from "@/hooks/use-subscription";
import { MetricCard } from "@/components/dashboard/metric-card";
const TrendChart = dynamic(
  () => import("@/components/dashboard/trend-chart").then((mod) => mod.TrendChart),
  {
    ssr: false,
    loading: () => <LoadingSkeleton variant="chart" />,
  }
);
const StrategyMatrix3D = dynamic(() => import("@/components/dashboard/strategy-matrix-3d"), {
  ssr: false,
});
import { PostCard } from "@/components/dashboard/post-card";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer";
import { OAuthErrorBanner } from "@/components/dashboard/oauth-error-banner";
import { SyncStatusChip } from "@/components/dashboard/sync-status-chip";
import { LoadError } from "@/components/shared/load-error";
import { m } from "framer-motion";
import {
  Zap,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

// ─── Static Data ─────────────────────────────────────────────────────────────
// Moved outside the component so the object is created only once, not on
// every render. React strict-mode double-invokes components so this matters.
const NICHE_STRATEGY_TEMPLATES = {
  tech: [
    { day: "Monday", time: "08:15 AM", topic: "CSS Grid vs Flexbox", format: "Fast Reel" },
    { day: "Wednesday", time: "05:30 PM", topic: "Setup Gear Unboxing", format: "Aesthetic B-Roll" },
    { day: "Friday", time: "08:30 AM", topic: "10s Dev Tips", format: "Split screen tutorial" },
  ],
  comedy: [
    { day: "Monday", time: "11:30 AM", topic: "When the server goes down mid-demo 🎭", format: "Aesthetic POV" },
    { day: "Wednesday", time: "06:00 PM", topic: "Expectation vs Reality: AI pair programming 💻", format: "Fast Reel" },
    { day: "Friday", time: "01:15 PM", topic: "The developer's typical coffee intake cycle ☕", format: "Fast Reel" },
  ],
  finance: [
    { day: "Monday", time: "09:00 AM", topic: "3 Indicators I watch for market pivots 📈", format: "Fast Reel" },
    { day: "Wednesday", time: "04:30 PM", topic: "How high-net-worth creators structure LLCs 🏢", format: "Aesthetic POV" },
    { day: "Friday", time: "09:30 AM", topic: "My weekly compound interest tracking routine 💸", format: "Split screen" },
  ],
  education: [
    { day: "Monday", time: "10:00 AM", topic: "How the Transformer Attention Mechanism works 🧠", format: "Visual sketch" },
    { day: "Wednesday", time: "02:00 PM", topic: "Why standard database indexing drops writes 📊", format: "Screen share" },
    { day: "Friday", time: "11:00 AM", topic: "5 concepts from Onboarding Psychology 🧪", format: "Aesthetic B-Roll" },
  ],
  lifestyle: [
    { day: "Monday", time: "07:30 AM", topic: "My digital nomad morning setup in Kyoto ✈️", format: "Aesthetic POV" },
    { day: "Wednesday", time: "05:00 PM", topic: "Co-working spaces that don't feel like cubicles ☕", format: "Fast Reel" },
    { day: "Friday", time: "08:00 AM", topic: "Reflecting on 6 months of asynchronous traveling 🎒", format: "Aesthetic B-Roll" },
  ],
  fashion: [
    { day: "Monday", time: "12:00 PM", topic: "Aesthetic palette matching for dark-mode desks ✨", format: "Aesthetic B-Roll" },
    { day: "Wednesday", time: "05:30 PM", topic: "Summer office capsule wardrobe essentials 👗", format: "Fast Reel" },
    { day: "Friday", time: "03:00 PM", topic: "Rebranding tech apparel: what actually works 👟", format: "Fast Reel" },
  ],
};

const UNHEALTHY_SYNC_STATUSES = new Set(["error", "disconnected", "rate_limited"]);
const DEFAULT_LAYOUT_ORDER = ["metrics", "charts", "strategy", "posts"];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardHome() {
  const {
    activeAccount,
    accounts,
    isLoading: accountsLoading,
    error: accountsError,
    mutate: mutateAccounts,
  } = useActiveAccount();
  const { metrics, trends, trendsHasData, isLoading: analyticsLoading } = useAnalytics();
  const { posts, isLoading: postsLoading } = usePosts();
  const { usage, isLoading: usageLoading } = useSubscription();

  // ── Layout Customization State ──────────────────────────────────────────────
  const [layoutOrder, setLayoutOrder] = useState<string[]>(DEFAULT_LAYOUT_ORDER);
  const [hiddenBlocks, setHiddenBlocks] = useState<string[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Rehydrate layout preferences from localStorage on first client-side paint.
  // Deferred to requestAnimationFrame to avoid hydration mismatch cascades.
  useEffect(() => {
    requestAnimationFrame(() => {
      try {
        const savedOrder = localStorage.getItem("trendoraa_layout_order");
        if (savedOrder) setLayoutOrder(JSON.parse(savedOrder));
      } catch { /* keep default */ }
      try {
        const savedHidden = localStorage.getItem("trendoraa_hidden_blocks");
        if (savedHidden) setHiddenBlocks(JSON.parse(savedHidden));
      } catch { /* keep default */ }
    });
  }, []);

  // ── Customizer (toolbar + per-block controls) ───────────────────────────────
  const { toolbar: customizerToolbar, getBlockControls } = DashboardCustomizer({
    layoutOrder,
    hiddenBlocks,
    isCustomizing,
    setIsCustomizing,
    setLayoutOrder,
    setHiddenBlocks,
  });

  // ── Derived Metric Values ───────────────────────────────────────────────────
  const isInstagram = activeAccount?.platform === "instagram";
  const activeNiche = activeAccount?.niche ?? "";
  const activeGoal = activeAccount?.goal ?? "";

  const viewsArr = posts?.map((p) => p.displayViews) ?? [];
  const totalViews = viewsArr.reduce((a, b) => a + b, 0);

  const engagementArr = posts?.map((p) => Number(p.engagementRate) || 0) ?? [];
  const averageEngagement = engagementArr.length
    ? (engagementArr.reduce((a, b) => a + b, 0) / engagementArr.length).toFixed(2) + "%"
    : "—";

  const skipRates = posts?.filter((p) => p.skipRate != null).map((p) => Number(p.skipRate)) ?? [];
  const hookRetentionAvg = skipRates.length
    ? (100 - skipRates.reduce((a, b) => a + b, 0) / skipRates.length).toFixed(1) + "%"
    : "—";
  const watchThroughAvg = isInstagram ? hookRetentionAvg : "—";

  const activeStatus = activeAccount?.syncStatus ?? null;
  const showSyncWarning = activeStatus !== null && UNHEALTHY_SYNC_STATUSES.has(activeStatus);

  const strategyItems = (() => {
    const key = (activeNiche && activeNiche in NICHE_STRATEGY_TEMPLATES
      ? activeNiche
      : "tech") as keyof typeof NICHE_STRATEGY_TEMPLATES;
    return NICHE_STRATEGY_TEMPLATES[key];
  })();

  // ── Block Wrapper ───────────────────────────────────────────────────────────
  const wrapBlock = useCallback(
    (blockId: string, index: number, content: React.ReactNode, className = "") => {
      const isHidden = hiddenBlocks.includes(blockId);
      return (
        <m.div
          key={blockId}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`relative transition-all duration-300 ${className} ${
            isCustomizing
              ? "border-2 border-dashed border-brand-primary/50 rounded-3xl p-3 bg-brand-primary/5 scale-[0.99] shadow-glow-sm"
              : ""
          } ${isHidden ? "opacity-30 grayscale pointer-events-none" : ""}`}
        >
          {getBlockControls(blockId, index)}
          {content}
        </m.div>
      );
    },
    [hiddenBlocks, isCustomizing, getBlockControls]
  );

  // ── Loading / Error / Onboarding Gates ─────────────────────────────────────
  if (accountsLoading) {
    return (
      <div className="max-w-xl mx-auto py-20 flex flex-col items-center justify-center gap-4 select-none">
        <div className="relative w-12 h-12 rounded-full border-4 border-white/5 border-t-brand-primary animate-spin" />
        <p className="text-xs font-semibold text-gray-400">Loading workspace...</p>
      </div>
    );
  }

  if (!accountsLoading && accountsError && accounts.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-10 flex flex-col gap-4">
        <OAuthErrorBanner />
        <LoadError
          title="Couldn't load your connected accounts"
          error={accountsError}
          onRetry={() => mutateAccounts()}
        />
      </div>
    );
  }

  if (!accountsLoading && accounts.length === 0) {
    return <OnboardingWizard onComplete={() => mutateAccounts()} />;
  }

  // ── Main Dashboard ──────────────────────────────────────────────────────────
  const activeAcctName = activeAccount?.username ?? "Account";
  const chartsIdx = layoutOrder.indexOf("charts");
  const strategyIdx = layoutOrder.indexOf("strategy");
  const areAdjacent = Math.abs(chartsIdx - strategyIdx) === 1;

  return (
    <div className="flex flex-col gap-8 relative">
      <StrategyMatrix3D />
      <OAuthErrorBanner />

      {/* Sync status warning */}
      {showSyncWarning && (
        <div
          role="alert"
          className="border border-amber-500/30 bg-amber-500/10 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="flex items-center gap-2 flex-grow text-xs text-amber-100">
            <SyncStatusChip status={activeStatus} />
            <span>
              <strong className="text-white">@{activeAccount?.username}</strong>{" "}
              {activeStatus === "disconnected"
                ? "is no longer authorized. Reconnect to resume ingestion."
                : activeStatus === "rate_limited"
                ? "is temporarily rate limited by the platform. Sync will resume automatically."
                : "encountered a sync error. Try a manual sync or reconnect."}
            </span>
          </div>
          <Link
            href="/accounts"
            className="self-start sm:self-auto px-4 min-h-[36px] inline-flex items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-xs font-bold uppercase tracking-wider text-white hover:bg-amber-500/30 active:scale-95"
          >
            Open Accounts
          </Link>
        </div>
      )}

      {/* Welcome Banner */}
      <m.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 select-none"
      >
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white mb-1">
            Hello, {activeAcctName}! 👋
          </h2>
          <p className="text-xs text-muted-foreground tracking-wide uppercase font-semibold">
            {isInstagram ? "Instagram" : "TikTok"} • {posts?.length ?? 0} posts tracked
          </p>
        </div>

        {!usageLoading && usage && (
          <div className="flex items-center gap-3 px-4 py-2 border border-glass bg-glass rounded-xl text-xs text-gray-300">
            <Zap className="w-4 h-4 text-brand-primary" />
            <span>
              AI Credits:{" "}
              <strong>
                {usage.aiCallsCount} / {usage.limits?.monthlyAiLimit || 100}
              </strong>
            </span>
          </div>
        )}
      </m.div>

      {/* Customizer Toolbar */}
      {customizerToolbar}

      {/* Bento Blocks */}
      {layoutOrder.map((blockId, index) => {
        const isHidden = hiddenBlocks.includes(blockId);
        if (isHidden && !isCustomizing) return null;

        // ── Metrics block ────────────────────────────────────────────────────
        if (blockId === "metrics") {
          return wrapBlock(
            blockId,
            index,
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {analyticsLoading ? (
                <LoadingSkeleton variant="metrics" />
              ) : (
                <>
                  <MetricCard
                    label="Proprietary Hook Retention"
                    value={isInstagram ? hookRetentionAvg : "—"}
                    description="Scroll-stop percentage. Renamed from Instagram skip rate."
                    sourceBadge={
                      activeGoal === "retention"
                        ? "🎯 Goal Focus"
                        : activeAccount?.platform === "tiktok"
                        ? "TikTok Watch-Through"
                        : "Instagram Reels"
                    }
                  />
                  <MetricCard
                    label="Strategic Watch-Through"
                    value={watchThroughAvg}
                    description="Proprietary Watch-Through score signifying retention completion."
                    sourceBadge={
                      activeGoal === "retention"
                        ? "🎯 Goal Focus"
                        : activeAccount?.platform === "tiktok"
                        ? "TikTok Complete"
                        : "Instagram Average"
                    }
                  />
                  <MetricCard
                    label="Accumulated Impressions"
                    value={totalViews > 0 ? totalViews.toLocaleString() : "—"}
                    description="Total display views across your tracked short-form content."
                    sourceBadge={activeGoal === "followers" ? "🎯 Goal Focus" : undefined}
                  />
                  <MetricCard
                    label="Average Engagement Rate"
                    value={averageEngagement}
                    description="Average like + comment + share + save divided by views across your tracked posts."
                    sourceBadge={activeGoal === "engagement" ? "🎯 Goal Focus" : undefined}
                  />
                </>
              )}
            </div>
          );
        }

        // ── Charts + Strategy combined row (when adjacent) ───────────────────
        if (blockId === "charts") {
          if (areAdjacent && !hiddenBlocks.includes("strategy") && !isCustomizing) {
            if (chartsIdx < strategyIdx) {
              return (
                <div key="charts-strategy-row" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Chart (2/3 width) */}
                  <m.div layout className="lg:col-span-2 border border-glass bg-glass rounded-2xl p-6 shadow-glow relative">
                    <div className="flex justify-between items-center mb-6 select-none">
                      <div>
                        <h3 className="text-base font-display font-extrabold text-white">
                          Engagement Velocity Trend
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          30-day average interaction rate changes
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 border border-glass bg-white/5 rounded-lg text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Moat Velocity</span>
                      </div>
                    </div>
                    {analyticsLoading ? (
                      <LoadingSkeleton variant="chart" />
                    ) : trendsHasData && trends.length > 0 ? (
                      <TrendChart data={trends} />
                    ) : (
                      <p className="text-sm text-muted-foreground py-16 text-center">
                        Sync your account to see engagement trends from real reel data.
                      </p>
                    )}
                  </m.div>

                  {/* Strategy (1/3 width) */}
                  <m.div layout className="border border-glass bg-glass rounded-2xl p-6 shadow-glow relative select-none flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-display font-extrabold text-white">
                          Weekly Content Strategy
                        </h3>
                        <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-[10px] font-bold text-gray-400 rounded-full uppercase tracking-wider">
                          {activeNiche ? `${activeNiche} focus` : "Sample"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-6">
                        Below is a sample plan personalized to your niche. Open Strategy to generate a full calendar.
                      </p>
                      <div className="flex flex-col gap-4">
                        {strategyItems.map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <div className="w-2.5 h-2.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                            <div>
                              <h4 className="font-bold text-xs text-gray-200">
                                {item.day} • <span className="text-brand-accent">{item.time}</span>
                              </h4>
                              <p className="text-xs text-muted-foreground font-semibold">
                                {item.topic} ({item.format})
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Link
                      href="/strategy"
                      className="w-full mt-8 min-h-[40px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-white active:scale-95 transition-all"
                    >
                      <span>Explore Planner Matrix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </m.div>
                </div>
              );
            } else {
              return null; // strategy rendered first, handled the row below
            }
          }

          // Standalone chart (wide)
          return wrapBlock(
            blockId,
            index,
            <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow relative w-full">
              <div className="flex justify-between items-center mb-6 select-none">
                <div>
                  <h3 className="text-base font-display font-extrabold text-white">
                    Engagement Velocity Trend
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    30-day average interaction rate changes
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 border border-glass bg-white/5 rounded-lg text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Moat Velocity</span>
                </div>
              </div>
              {analyticsLoading ? (
                <LoadingSkeleton variant="chart" />
              ) : trendsHasData && trends.length > 0 ? (
                <div className="w-full h-[280px]">
                  <TrendChart data={trends} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-16 text-center">
                  Sync your account to see engagement trends from real reel data.
                </p>
              )}
            </div>
          );
        }

        // ── Strategy + Charts combined row (strategy first) ──────────────────
        if (blockId === "strategy") {
          if (areAdjacent && !hiddenBlocks.includes("charts") && !isCustomizing) {
            if (strategyIdx < chartsIdx) {
              return (
                <div key="strategy-charts-row" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Strategy (1/3 width) */}
                  <m.div layout className="border border-glass bg-glass rounded-2xl p-6 shadow-glow relative select-none flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-display font-extrabold text-white">
                          Weekly Content Strategy
                        </h3>
                        <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-[10px] font-bold text-gray-400 rounded-full uppercase tracking-wider">
                          {activeNiche ? `${activeNiche} focus` : "Sample"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-6">
                        Below is a sample plan personalized to your niche. Open Strategy to generate a full calendar.
                      </p>
                      <div className="flex flex-col gap-4">
                        {strategyItems.map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <div className="w-2.5 h-2.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                            <div>
                              <h4 className="font-bold text-xs text-gray-200">
                                {item.day} • <span className="text-brand-accent">{item.time}</span>
                              </h4>
                              <p className="text-xs text-muted-foreground font-semibold">
                                {item.topic} ({item.format})
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Link
                      href="/strategy"
                      className="w-full mt-8 min-h-[40px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-white active:scale-95 transition-all"
                    >
                      <span>Explore Planner Matrix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </m.div>

                  {/* Chart (2/3 width) */}
                  <m.div layout className="lg:col-span-2 border border-glass bg-glass rounded-2xl p-6 shadow-glow relative">
                    <div className="flex justify-between items-center mb-6 select-none">
                      <div>
                        <h3 className="text-base font-display font-extrabold text-white">
                          Engagement Velocity Trend
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          30-day average interaction rate changes
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 border border-glass bg-white/5 rounded-lg text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Moat Velocity</span>
                      </div>
                    </div>
                    {analyticsLoading ? (
                      <LoadingSkeleton variant="chart" />
                    ) : trendsHasData && trends.length > 0 ? (
                      <TrendChart data={trends} />
                    ) : (
                      <p className="text-sm text-muted-foreground py-16 text-center">
                        Sync your account to see engagement trends from real reel data.
                      </p>
                    )}
                  </m.div>
                </div>
              );
            } else {
              return null; // charts rendered first, handled the row above
            }
          }

          // Standalone strategy planner (3-column expanded)
          return wrapBlock(
            blockId,
            index,
            <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow relative select-none w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-display font-extrabold text-white">
                  Weekly Content Strategy
                </h3>
                <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-[10px] font-bold text-gray-400 rounded-full uppercase tracking-wider">
                  {activeNiche ? `${activeNiche} focus` : "Sample"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                Below is a sample plan personalized to your niche. Open Strategy to generate a full calendar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {strategyItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-gray-200">
                        {item.day} • <span className="text-brand-accent">{item.time}</span>
                      </h4>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                        {item.topic} ({item.format})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/strategy"
                className="w-fit mt-6 px-6 min-h-[40px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-white active:scale-95 transition-all"
              >
                <span>Explore Planner Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        }

        // ── Posts block ──────────────────────────────────────────────────────
        if (blockId === "posts") {
          return wrapBlock(
            blockId,
            index,
            <div>
              <div className="flex justify-between items-center mb-6 select-none">
                <div>
                  <h3 className="text-lg font-display font-extrabold text-white">
                    Peak Performing Reels
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Your top 3 video creations evaluated by the Trendoraa AI engine
                  </p>
                </div>
                <Link
                  href="/posts"
                  className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 active:scale-95"
                >
                  <span>See All Posts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {postsLoading ? (
                  <LoadingSkeleton variant="posts" count={3} />
                ) : posts && posts.length > 0 ? (
                  posts.slice(0, 3).map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <div className="col-span-3 text-center py-10 border border-glass bg-glass rounded-2xl">
                    <p className="text-sm text-muted-foreground">
                      No posts have been scored yet.
                    </p>
                    <Link
                      href="/posts"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-primary rounded-xl text-xs font-bold uppercase tracking-wider text-white"
                    >
                      Go to Posts Manager
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
