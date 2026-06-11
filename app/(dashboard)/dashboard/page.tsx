"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useAnalytics } from "@/hooks/use-analytics";
import { usePosts } from "@/hooks/use-posts";
import { useSubscription } from "@/hooks/use-subscription";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ContentMomentumCard } from "@/components/dashboard/content-momentum-card";
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
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Compass,
  Tv2,
  LineChart,
  CalendarDays,
  RefreshCw,
  Clock,
  LogOut,
} from "lucide-react";
import { useToast } from "@/components/shared/toast";
import Link from "next/link";
import { MotionList } from "@/components/ui/MotionList";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { InsightReveal } from "@/components/analytics/InsightReveal";
import { GraphAnimator } from "@/components/analytics/GraphAnimator";

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

  // ── Surfing Launchpad & Checklist State ─────────────────────────────────────
  const toast = useToast();
  const [checklist, setChecklist] = useState({
    niche: true,
    posts: false,
    analytics: false,
    strategy: false,
  });
  const [showLaunchpad, setShowLaunchpad] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    try {
      const savedChecklist = localStorage.getItem("trendoraa_surfing_checklist");
      if (savedChecklist) {
        setChecklist(JSON.parse(savedChecklist));
      }
      const isDismissed = localStorage.getItem("trendoraa_launchpad_dismissed");
      if (activeAccount?.username === "alice_reels" && isDismissed !== "true") {
        setShowLaunchpad(true);
      } else {
        setShowLaunchpad(false);
      }
    } catch { /* keep defaults */ }
  }, [activeAccount]);

  const markChecklistItem = (key: keyof typeof checklist) => {
    const updated = { ...checklist, [key]: true };
    setChecklist(updated);
    try {
      localStorage.setItem("trendoraa_surfing_checklist", JSON.stringify(updated));
    } catch {}
  };

  const dismissLaunchpad = () => {
    setShowLaunchpad(false);
    try {
      localStorage.setItem("trendoraa_launchpad_dismissed", "true");
    } catch {}
  };

  const handleLaunchSandbox = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/accounts/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: activeAccount?.niche || "tech",
          goal: activeAccount?.goal || "retention",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Sandbox Demo Account connected successfully! Happy Surfing.");
        mutateAccounts();
      } else {
        toast.error("Failed to seed sandbox demo.");
      }
    } catch {
      toast.error("Error setting up demo sandbox.");
    } finally {
      setDemoLoading(false);
    }
  };

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

  const topPostingWindows = React.useMemo(() => {
    if (!posts || posts.length < 10) return [];

    const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const groups: { [key: string]: { sumER: number; count: number; day: string; hour: number } } = {};

    posts.forEach((post) => {
      const d = new Date(post.timestamp);
      if (Number.isNaN(d.getTime())) return;

      const dayIdx = d.getDay();
      const dayName = DAY_NAMES[dayIdx]!;
      const hour = d.getHours();
      
      const key = `${dayIdx}|${hour}`;
      if (!groups[key]) {
        groups[key] = { sumER: 0, count: 0, day: dayName, hour };
      }
      groups[key].sumER += Number(post.engagementRate) || 0;
      groups[key].count += 1;
    });

    const flat = Object.values(groups).map((g) => ({
      day: g.day,
      hour: g.hour,
      avgER: g.count > 0 ? g.sumER / g.count : 0,
      count: g.count,
    }));

    return flat.sort((a, b) => b.avgER - a.avgER).slice(0, 3);
  }, [posts]);

  const formatHourRange = (hour: number) => {
    const startHour = hour;
    const endHour = (hour + 1) % 24;
    const startM = startHour >= 12 ? "pm" : "am";
    const endM = endHour >= 12 ? "pm" : "am";
    
    const startVal = startHour > 12 ? startHour - 12 : (startHour === 0 ? 12 : startHour);
    const endVal = endHour > 12 ? endHour - 12 : (endHour === 0 ? 12 : endHour);
    
    if (startM === endM) {
      return `${startVal}–${endVal}${startM}`;
    } else {
      return `${startVal}${startM}–${endVal}${endM}`;
    }
  };

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

      {/* Global Sandbox Demo Status Banner */}
      {activeAccount?.username === "alice_reels" && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-xl rounded-2xl p-5 shadow-glow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-sm text-white flex items-center gap-2">
                <span>Sandbox Demo Mode Active</span>
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[8px] font-bold text-indigo-300 uppercase tracking-wider">
                  Live Preview
                </span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                You are currently exploring Trendoraa using mock creator analytics. Link a real social profile when you are ready!
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              if (!confirm("Are you sure you want to quit the Sandbox Demo? This will purge all simulated reels, scores, and strategy reports, returning you to the onboarding cockpit.")) return;
              setDemoLoading(true);
              try {
                const res = await fetch(`/api/accounts/${activeAccount.id}`, { method: "DELETE" });
                const data = await res.json();
                if (data.success) {
                  toast.success("Sandbox Demo purged successfully!");
                  await mutateAccounts();
                } else {
                  toast.error("Failed to quit Sandbox Demo.");
                }
              } catch {
                toast.error("An unexpected error occurred.");
              } finally {
                setDemoLoading(false);
              }
            }}
            disabled={demoLoading}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {demoLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>Quit Sandbox Demo</span>
          </button>
        </m.div>
      )}

      {/* Connection Cockpit Card */}
      {showSyncWarning && (
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-glass bg-glass-deep backdrop-blur-xl rounded-2xl p-6 shadow-glow relative select-none"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -z-10" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col gap-2 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[8.5px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                  Link Security Refresh Required
                </span>
                <SyncStatusChip status={activeStatus} />
              </div>
              
              <h3 className="font-display font-extrabold text-sm text-white">
                Let&apos;s get your short-form strategy back on track!
              </h3>
              
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                {activeStatus === "disconnected"
                  ? `To protect your data and stay aligned with Meta's security guidelines, channel credentials periodically expire. Reconnect @${activeAccount?.username} to resume AI hold curves and post syncs, or spin up a Sandbox profile below to continue surfing.`
                  : activeStatus === "rate_limited"
                  ? "Meta's Graph API is taking a quick breather. We safely limit calls to protect your profile from being flagged. Syncs will resume automatically shortly. In the meantime, you can explore utilizing the Sandbox Demo!"
                  : "encountered a sync error. Try a manual sync, reconnect, or explore with a sandbox profile."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              {/* Spin up sandbox demo button */}
              <button
                onClick={handleLaunchSandbox}
                disabled={demoLoading}
                className="px-4 py-2.5 rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {demoLoading ? (
                  <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
                )}
                <span>{demoLoading ? "Starting Sandbox..." : "Launch Sandbox Demo"}</span>
              </button>

              <Link
                href="/accounts"
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow active:scale-95 text-center"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reconnect Instagram</span>
              </Link>
            </div>
          </div>
        </m.div>
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

      {/* Exploration Launchpad */}
      {showLaunchpad && (
        <m.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-brand-primary/30 bg-brand-primary/5 backdrop-blur-xl rounded-2xl p-6 shadow-glow relative select-none overflow-hidden"
        >
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -z-10 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl -z-10" />

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-base text-white">
                  🚀 Trendoraa Surfing Launchpad
                </h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  You are surfing Alice&apos;s Sandbox Demo Profile. Follow this checklist to master our creator-strategy cockpit!
                </p>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={dismissLaunchpad}
              className="text-xs font-extrabold text-gray-500 hover:text-white uppercase tracking-widest px-2.5 py-1 border border-glass bg-white/5 rounded-lg active:scale-95 transition-all shrink-0 self-end sm:self-auto"
            >
              Dismiss Guide
            </button>
          </div>

          {/* Checklist grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1: Config niche */}
            <div className="p-4 rounded-xl border border-brand-primary/10 bg-white/5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider">
                    Step 1
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-brand-secondary fill-brand-secondary/10 animate-pulse" />
                </div>
                <h4 className="font-bold text-xs text-white mb-1">
                  Configure Niche & Goals
                </h4>
                <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                  Select your content type to calibrate our target holding parameters.
                </p>
              </div>
              <span className="text-[9px] font-black text-brand-secondary uppercase tracking-widest mt-4 flex items-center gap-1 select-none">
                ✓ Completed
              </span>
            </div>

            {/* Step 2: Hold Curves */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
              checklist.posts ? "border-brand-primary/10 bg-white/5" : "border-glass bg-glass-deep"
            }`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider">
                    Step 2
                  </span>
                  {checklist.posts ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-secondary fill-brand-secondary/10" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-glass shrink-0" />
                  )}
                </div>
                <h4 className="font-bold text-xs text-white mb-1">
                  Explore Hold Curves
                </h4>
                <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                  Go to My Posts, select the tech-gear unboxing post, and check our 3s retention timeline.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                <Link
                  href="/posts"
                  onClick={() => markChecklistItem("posts")}
                  className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 shadow-glow hover:opacity-90"
                >
                  <Tv2 className="w-3 h-3" />
                  <span>Surf to Reels 🏄‍♂️</span>
                </Link>
                {!checklist.posts && (
                  <button
                    onClick={() => markChecklistItem("posts")}
                    className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-wider underline"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>

            {/* Step 3: Heatmaps */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
              checklist.analytics ? "border-brand-primary/10 bg-white/5" : "border-glass bg-glass-deep"
            }`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider">
                    Step 3
                  </span>
                  {checklist.analytics ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-secondary fill-brand-secondary/10" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-glass shrink-0" />
                  )}
                </div>
                <h4 className="font-bold text-xs text-white mb-1">
                  Check Engagement Velocity
                </h4>
                <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                  Review posting schedules, optimal peak hours heatmaps, and reaching velocity baselines.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                <Link
                  href="/analytics"
                  onClick={() => markChecklistItem("analytics")}
                  className="px-3 py-1.5 rounded-lg bg-brand-secondary text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 shadow-glow hover:opacity-90"
                >
                  <LineChart className="w-3 h-3" />
                  <span>Surf Analytics 📊</span>
                </Link>
                {!checklist.analytics && (
                  <button
                    onClick={() => markChecklistItem("analytics")}
                    className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-wider underline"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>

            {/* Step 4: Roadmaps */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
              checklist.strategy ? "border-brand-primary/10 bg-white/5" : "border-glass bg-glass-deep"
            }`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider">
                    Step 4
                  </span>
                  {checklist.strategy ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-secondary fill-brand-secondary/10" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-glass shrink-0" />
                  )}
                </div>
                <h4 className="font-bold text-xs text-white mb-1">
                  Review Weekly Roadmap
                </h4>
                <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                  Generate customized weekly strategies, posting slots, and AI caption suggestions.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                <Link
                  href="/strategy"
                  onClick={() => markChecklistItem("strategy")}
                  className="px-3 py-1.5 rounded-lg bg-brand-accent text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 shadow-glow hover:opacity-90"
                >
                  <CalendarDays className="w-3 h-3" />
                  <span>Surf Strategy 🗓️</span>
                </Link>
                {!checklist.strategy && (
                  <button
                    onClick={() => markChecklistItem("strategy")}
                    className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-wider underline"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </m.div>
      )}

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
            <MotionList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {analyticsLoading ? (
                <LoadingSkeleton variant="metrics" />
              ) : (
                <>
                  <ContentMomentumCard />
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
            </MotionList>
          );
        }

        // ── Charts + Strategy combined row (when adjacent) ───────────────────
        if (blockId === "charts") {
          if (areAdjacent && !hiddenBlocks.includes("strategy") && !isCustomizing) {
            if (chartsIdx < strategyIdx) {
              return (
                <div key="charts-strategy-row" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Chart (2/3 width) */}
                  <PremiumCard layout className="lg:col-span-2 p-6" glowColor="blue">
                    <div className="flex justify-between items-start mb-6 select-none">
                      <div>
                        <h3 className="text-base font-display font-extrabold text-white">
                          Engagement Velocity Trend
                        </h3>
                        <InsightReveal delay={300} text="30-day average interaction rate changes" className="text-xs text-muted-foreground mt-1" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 border border-glass bg-white/5 rounded-lg text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Moat Velocity</span>
                      </div>
                    </div>
                    {analyticsLoading ? (
                      <LoadingSkeleton variant="chart" />
                    ) : trendsHasData && trends.length > 0 ? (
                      <GraphAnimator delay={600}>
                        <TrendChart data={trends} />
                      </GraphAnimator>
                    ) : (
                      <p className="text-sm text-muted-foreground py-16 text-center">
                        Sync your account to see engagement trends from real reel data.
                      </p>
                    )}
                  </PremiumCard>

                  {/* Strategy (1/3 width) */}
                  <PremiumCard layout className="p-6 select-none flex flex-col justify-between" glowColor="pink">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-display font-extrabold text-white">
                          Weekly Content Strategy
                        </h3>
                        <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-[10px] font-bold text-gray-400 rounded-full uppercase tracking-wider">
                          {activeNiche ? `${activeNiche} focus` : "Sample"}
                        </span>
                      </div>

                      {/* Dynamic Progress Meter */}
                      <div className="mt-2 mb-5">
                        <div className="flex justify-between items-center text-[10px] font-extrabold text-gray-400 mb-1.5 uppercase tracking-wider">
                          <span>Active Strategy Progress</span>
                          <span className="text-brand-accent">2 of 3 scheduled (67%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                          <div className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full" style={{ width: "67%" }} />
                        </div>
                      </div>

                      <InsightReveal delay={500} text="Below is a sample plan personalized to your niche. Open Strategy to generate a full calendar." className="text-xs text-muted-foreground mb-4" />
                      <div className="flex flex-col gap-3.5">
                        {strategyItems.map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <div className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0" />
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

                      {/* Best Posting Windows Heatmap (Dashboard Preview) */}
                      <div className="h-px bg-white/10 my-5" />
                      <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-secondary" />
                          <span>Top Optimal Windows</span>
                        </h4>

                        {posts.length >= 10 ? (
                          <div className="flex flex-col gap-3.5">
                            {topPostingWindows.map((window, idx) => {
                              const maxER = topPostingWindows[0]?.avgER || 1;
                              const pct = maxER > 0 ? (window.avgER / maxER) * 100 : 0;
                              return (
                                <div key={idx} className="flex flex-col gap-1">
                                  <div className="flex justify-between items-center text-xs font-semibold text-gray-200">
                                    <span>{window.day} {formatHourRange(window.hour)}</span>
                                    <span className="text-brand-primary font-black">{window.avgER.toFixed(2)}% ER</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-brand-primary rounded-full" 
                                      style={{ width: `${pct}%` }} 
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-white/5 border border-glass text-center select-none">
                            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                              Post at least 10 times to unlock your optimal windows.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 mt-6">
                      <Link
                        href="/analytics?expand=heatmap"
                        className="w-full min-h-[40px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-brand-primary hover:text-white active:scale-95 transition-all"
                      >
                        <span>View full posting heatmap →</span>
                      </Link>
                      <Link
                        href="/strategy"
                        className="w-full min-h-[40px] rounded-xl border border-white/5 bg-transparent hover:bg-white/5 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-gray-400 hover:text-white active:scale-95 transition-all"
                      >
                        <span>View full strategy →</span>
                      </Link>
                    </div>
                  </PremiumCard>
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
            <PremiumCard className="p-6 w-full" glowColor="blue">
              <div className="flex justify-between items-start mb-6 select-none">
                <div>
                  <h3 className="text-base font-display font-extrabold text-white">
                    Engagement Velocity Trend
                  </h3>
                  <InsightReveal delay={200} text="30-day average interaction rate changes" className="text-xs text-muted-foreground mt-1" />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 border border-glass bg-white/5 rounded-lg text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Moat Velocity</span>
                </div>
              </div>
              {analyticsLoading ? (
                <LoadingSkeleton variant="chart" />
              ) : trendsHasData && trends.length > 0 ? (
                <GraphAnimator delay={500}>
                  <div className="w-full h-[280px]">
                    <TrendChart data={trends} />
                  </div>
                </GraphAnimator>
              ) : (
                <p className="text-sm text-muted-foreground py-16 text-center">
                  Sync your account to see engagement trends from real reel data.
                </p>
              )}
            </PremiumCard>
          );
        }

        // ── Strategy + Charts combined row (strategy first) ──────────────────
        if (blockId === "strategy") {
          if (areAdjacent && !hiddenBlocks.includes("charts") && !isCustomizing) {
            if (strategyIdx < chartsIdx) {
              return (
                <div key="strategy-charts-row" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Strategy (1/3 width) */}
                  <PremiumCard layout className="p-6 select-none flex flex-col justify-between" glowColor="pink">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-display font-extrabold text-white">
                          Weekly Content Strategy
                        </h3>
                        <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-[10px] font-bold text-gray-400 rounded-full uppercase tracking-wider">
                          {activeNiche ? `${activeNiche} focus` : "Sample"}
                        </span>
                      </div>

                      {/* Dynamic Progress Meter */}
                      <div className="mt-2 mb-5">
                        <div className="flex justify-between items-center text-[10px] font-extrabold text-gray-400 mb-1.5 uppercase tracking-wider">
                          <span>Active Strategy Progress</span>
                          <span className="text-brand-accent">2 of 3 scheduled (67%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                          <div className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full" style={{ width: "67%" }} />
                        </div>
                      </div>

                      <InsightReveal delay={200} text="Below is a sample plan personalized to your niche. Open Strategy to generate a full calendar." className="text-xs text-muted-foreground mb-4" />
                      <div className="flex flex-col gap-3.5">
                        {strategyItems.map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <div className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0" />
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

                      {/* Best Posting Windows Heatmap (Dashboard Preview) */}
                      <div className="h-px bg-white/10 my-5" />
                      <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-secondary" />
                          <span>Top Optimal Windows</span>
                        </h4>

                        {posts.length >= 10 ? (
                          <div className="flex flex-col gap-3.5">
                            {topPostingWindows.map((window, idx) => {
                              const maxER = topPostingWindows[0]?.avgER || 1;
                              const pct = maxER > 0 ? (window.avgER / maxER) * 100 : 0;
                              return (
                                <div key={idx} className="flex flex-col gap-1">
                                  <div className="flex justify-between items-center text-xs font-semibold text-gray-200">
                                    <span>{window.day} {formatHourRange(window.hour)}</span>
                                    <span className="text-brand-primary font-black">{window.avgER.toFixed(2)}% ER</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-brand-primary rounded-full" 
                                      style={{ width: `${pct}%` }} 
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-white/5 border border-glass text-center select-none">
                            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                              Post at least 10 times to unlock your optimal windows.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 mt-6">
                      <Link
                        href="/analytics?expand=heatmap"
                        className="w-full min-h-[40px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-brand-primary hover:text-white active:scale-95 transition-all"
                      >
                        <span>View full posting heatmap →</span>
                      </Link>
                      <Link
                        href="/strategy"
                        className="w-full min-h-[40px] rounded-xl border border-white/5 bg-transparent hover:bg-white/5 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-gray-400 hover:text-white active:scale-95 transition-all"
                      >
                        <span>View full strategy →</span>
                      </Link>
                    </div>
                  </PremiumCard>

                  {/* Chart (2/3 width) */}
                  <PremiumCard layout className="lg:col-span-2 p-6" glowColor="blue">
                    <div className="flex justify-between items-start mb-6 select-none">
                      <div>
                        <h3 className="text-base font-display font-extrabold text-white">
                          Engagement Velocity Trend
                        </h3>
                        <InsightReveal delay={400} text="30-day average interaction rate changes" className="text-xs text-muted-foreground mt-1" />
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 border border-glass bg-white/5 rounded-lg text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Moat Velocity</span>
                      </div>
                    </div>
                    {analyticsLoading ? (
                      <LoadingSkeleton variant="chart" />
                    ) : trendsHasData && trends.length > 0 ? (
                      <GraphAnimator delay={700}>
                        <TrendChart data={trends} />
                      </GraphAnimator>
                    ) : (
                      <p className="text-sm text-muted-foreground py-16 text-center">
                        Sync your account to see engagement trends from real reel data.
                      </p>
                    )}
                  </PremiumCard>
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
            <PremiumCard className="p-6 select-none w-full" glowColor="pink">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-base font-display font-extrabold text-white">
                    Weekly Content Strategy
                  </h3>
                  <InsightReveal delay={200} text="Below is a sample plan personalized to your niche. Open Strategy to generate a full calendar." className="text-xs text-muted-foreground mt-0.5" />
                </div>
                <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-[10px] font-bold text-gray-400 rounded-full uppercase tracking-wider shrink-0">
                  {activeNiche ? `${activeNiche} focus` : "Sample"}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Col 1 & 2: Active Strategy Progress & Weekly Content Items */}
                <div className="lg:col-span-2 flex flex-col justify-between">
                  <div>
                    {/* Dynamic Progress Meter */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center text-[10px] font-extrabold text-gray-400 mb-1.5 uppercase tracking-wider">
                        <span>Active Strategy Progress</span>
                        <span className="text-brand-accent">2 of 3 scheduled (67%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full" style={{ width: "67%" }} />
                      </div>
                    </div>

                    <MotionList className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {strategyItems.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start p-4 rounded-xl bg-white/5 border border-white/5">
                          <div className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                          <div>
                            <h4 className="font-bold text-xs text-gray-200">
                              {item.day} • <span className="text-brand-accent">{item.time}</span>
                            </h4>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 leading-relaxed">
                              {item.topic} ({item.format})
                            </p>
                          </div>
                        </div>
                      ))}
                    </MotionList>
                  </div>

                  <div className="mt-6">
                    <Link
                      href="/strategy"
                      className="w-fit px-6 min-h-[40px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-white active:scale-95 transition-all"
                    >
                      <span>Explore Planner Matrix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Col 3: Best Posting Windows */}
                <div className="border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between">
                  <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-secondary" />
                      <span>Top Optimal Windows</span>
                    </h4>

                    {posts.length >= 10 ? (
                      <div className="flex flex-col gap-3.5">
                        {topPostingWindows.map((window, idx) => {
                          const maxER = topPostingWindows[0]?.avgER || 1;
                          const pct = maxER > 0 ? (window.avgER / maxER) * 100 : 0;
                          return (
                            <div key={idx} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-xs font-semibold text-gray-200">
                                <span>{window.day} {formatHourRange(window.hour)}</span>
                                <span className="text-brand-primary font-black">{window.avgER.toFixed(2)}% ER</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-brand-primary rounded-full" 
                                  style={{ width: `${pct}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white/5 border border-glass text-center select-none">
                        <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                          Post at least 10 times to unlock your optimal windows.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-6">
                    <Link
                      href="/analytics?expand=heatmap"
                      className="w-full min-h-[40px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-brand-primary hover:text-white active:scale-95 transition-all text-center"
                    >
                      <span>View full posting heatmap →</span>
                    </Link>
                    <Link
                      href="/strategy"
                      className="w-full min-h-[40px] rounded-xl border border-white/5 bg-transparent hover:bg-white/5 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 text-gray-400 hover:text-white active:scale-95 transition-all text-center"
                    >
                      <span>View full strategy →</span>
                    </Link>
                  </div>
                </div>
              </div>
            </PremiumCard>
          );
        }

        // ── Posts block ──────────────────────────────────────────────────────
        if (blockId === "posts") {
          return wrapBlock(
            blockId,
            index,
            <PremiumCard className="p-6" glowColor="none">
              <div className="flex justify-between items-start mb-6 select-none">
                <div>
                  <h3 className="text-lg font-display font-extrabold text-white">
                    Peak Performing Reels
                  </h3>
                  <InsightReveal delay={200} text="Your top 3 video creations evaluated by the Trendoraa AI engine" className="text-xs text-muted-foreground mt-1" />
                </div>
                <Link
                  href="/posts"
                  className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 active:scale-95 mt-1"
                >
                  <span>See All Posts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <MotionList className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </MotionList>
            </PremiumCard>
          );
        }

        return null;
      })}
    </div>
  );
}
