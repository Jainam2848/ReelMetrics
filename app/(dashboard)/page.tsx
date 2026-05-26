"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useAnalytics } from "@/hooks/use-analytics";
import { usePosts } from "@/hooks/use-posts";
import { useSubscription } from "@/hooks/use-subscription";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { PostCard } from "@/components/dashboard/post-card";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { useToast } from "@/components/shared/toast";
import { m } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Tv, 
  Flame, 
  Zap, 
  Users, 
  TrendingUp, 
  Video, 
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Settings
} from "lucide-react";
import { Instagram } from "@/components/shared/icons";
import { InstagramConnectButton } from "@/components/shared/instagram-connect";
import { OAuthErrorBanner } from "@/components/dashboard/oauth-error-banner";
import { LoadError } from "@/components/shared/load-error";
import { SyncStatusChip } from "@/components/dashboard/sync-status-chip";
import Link from "next/link";

const OnboardingCore3D = dynamic(() => import("@/components/dashboard/onboarding-core-3d"), {
  ssr: false,
});

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
  const toast = useToast();

  // Dashboard customization states
  const [layoutOrder, setLayoutOrder] = useState<string[]>(["metrics", "charts", "strategy", "posts"]);
  const [hiddenBlocks, setHiddenBlocks] = useState<string[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Sync layout from localStorage on client-side mount
  useEffect(() => {
    const savedOrder = localStorage.getItem("trendoraa_layout_order");
    const savedHidden = localStorage.getItem("trendoraa_hidden_blocks");
    if (savedOrder) {
      try {
        setLayoutOrder(JSON.parse(savedOrder));
      } catch (e) {}
    }
    if (savedHidden) {
      try {
        setHiddenBlocks(JSON.parse(savedHidden));
      } catch (e) {}
    }
  }, []);

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newOrder = [...layoutOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index]!;
      newOrder[index] = newOrder[targetIndex]!;
      newOrder[targetIndex] = temp;
      setLayoutOrder(newOrder);
    }
  };

  const toggleHideBlock = (blockId: string) => {
    if (hiddenBlocks.includes(blockId)) {
      setHiddenBlocks(hiddenBlocks.filter((id) => id !== blockId));
    } else {
      setHiddenBlocks([...hiddenBlocks, blockId]);
    }
  };

  const saveLayout = () => {
    localStorage.setItem("trendoraa_layout_order", JSON.stringify(layoutOrder));
    localStorage.setItem("trendoraa_hidden_blocks", JSON.stringify(hiddenBlocks));
    setIsCustomizing(false);
    toast.success("Dashboard layout saved successfully!");
  };

  const resetLayout = () => {
    setLayoutOrder(["metrics", "charts", "strategy", "posts"]);
    setHiddenBlocks([]);
    localStorage.removeItem("trendoraa_layout_order");
    localStorage.removeItem("trendoraa_hidden_blocks");
    toast.success("Dashboard layout reset to defaults!");
  };

  // Onboarding Wizard states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "sandbox_syncing" | "success" | "error">("idle");
  const [syncProgress, setSyncProgress] = useState("");

  // Derive active parameters from database if connected, falling back to onboarding stepper states
  const activeNiche = activeAccount?.niche || niche;
  const activeGoal = activeAccount?.goal || goal;

  const handleNicheSelect = (val: string) => {
    setNiche(val);
    setOnboardingStep(2);
  };

  const handleGoalSelect = (val: string) => {
    setGoal(val);
    setOnboardingStep(3);
  };

  const triggerSandboxSeeding = async () => {
    setSyncStatus("sandbox_syncing");
    
    // Simulate high-fidelity sync steps for user retention and wow effect
    const steps = [
      "Creating virtual sandbox environment...",
      "Connecting to Trendoraa AI ingestion pipeline...",
      "Syncing last 30 posts from demo profile...",
      "Calculating AI Engagement Moat Index...",
      "Compiling weekly content strategy calendar...",
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step) {
        setSyncProgress(step);
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      const res = await fetch("/api/accounts/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, goal }),
      });
      const data = await res.json();
      
      if (data.success) {
        setSyncStatus("success");
        toast.success("Sandbox demo account connected! Welcome to Trendoraa.");
        await mutateAccounts();
      } else {
        setSyncStatus("error");
        toast.error(data.error?.message || "Failed to initialize demo sandbox");
      }
    } catch (err) {
      setSyncStatus("error");
      toast.error("An unexpected error occurred during demo setup.");
    }
  };

  // Render a full-page loading loader while SWR is initially loading profiles to prevent flash of content
  if (accountsLoading) {
    return (
      <div className="max-w-xl mx-auto py-20 flex flex-col items-center justify-center gap-4 select-none">
        <div className="relative w-12 h-12 rounded-full border-4 border-white/5 border-t-brand-primary animate-spin" />
        <p className="text-xs font-semibold text-gray-400">Loading workspace...</p>
      </div>
    );
  }

  // Surface API failure distinctly from "no accounts connected" so users can
  // retry instead of being dropped into the onboarding wizard with no signal.
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

  // Render Onboarding Wizard if no accounts are connected
  if (!accountsLoading && accounts.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <OAuthErrorBanner />
        <m.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="border border-glass bg-glass backdrop-blur-2xl rounded-2xl p-8 shadow-glow overflow-hidden relative"
        >
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-brand-accent/10 rounded-full blur-3xl -z-10" />

          {/* Header */}
          <div className="text-center mb-8 select-none">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-glass bg-white/5 text-xs text-brand-primary font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Onboarding Stepper
            </div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-white mb-2">
              Launch Your AI Strategy Moat
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Follow these three quick steps to link your short-form video channels and generate immediate analytics.
            </p>
          </div>

          {/* Stepper progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8 select-none">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    onboardingStep === step
                      ? "bg-brand-primary text-white ring-4 ring-brand-primary/20"
                      : onboardingStep > step
                      ? "bg-brand-secondary text-white"
                      : "bg-white/5 text-gray-500 border border-white/10"
                  }`}
                >
                  {onboardingStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 rounded ${
                      onboardingStep > step ? "bg-brand-secondary" : "bg-white/5"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Contents */}
          {onboardingStep === 1 && (
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-center mb-1">
                Step 1: Choose Content Niche
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "tech", label: "Tech & Gadgets", icon: "💻" },
                  { id: "comedy", label: "Comedy & Skits", icon: "🎭" },
                  { id: "finance", label: "Business & Finance", icon: "📈" },
                  { id: "education", label: "Education & How-to", icon: "🧠" },
                  { id: "lifestyle", label: "Lifestyle & Vlogs", icon: "✈️" },
                  { id: "fashion", label: "Fashion & Beauty", icon: "✨" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNicheSelect(item.id)}
                    className="min-h-[56px] px-5 rounded-xl border border-glass bg-white/5 hover:bg-white/10 hover:border-brand-primary flex items-center gap-3 transition-all duration-300 text-left active:scale-95 group"
                  >
                    <span className="text-xl group-hover:scale-125 transition-transform duration-300">
                      {item.icon}
                    </span>
                    <span className="font-bold text-sm text-gray-200 group-hover:text-white">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </m.div>
          )}

          {onboardingStep === 2 && (
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-center mb-1">
                Step 2: Choose Growth Goal
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  {
                    id: "retention",
                    title: "Maximize Audience Retention",
                    desc: "Focus on hook execution and watch-through consistency.",
                    icon: <Tv className="w-5 h-5 text-brand-primary" />,
                  },
                  {
                    id: "engagement",
                    title: "Scale Engagement Rate",
                    desc: "Optimize CTA positioning to drive shares, comments, and saves.",
                    icon: <Flame className="w-5 h-5 text-brand-accent" />,
                  },
                  {
                    id: "followers",
                    title: "Grow Active Follower Base",
                    desc: "Align posting schedule to commuter peak hours.",
                    icon: <Users className="w-5 h-5 text-brand-secondary" />,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleGoalSelect(item.id)}
                    className="p-4 rounded-xl border border-glass bg-white/5 hover:bg-white/10 hover:border-brand-primary flex items-start gap-4 transition-all duration-300 text-left active:scale-95"
                  >
                    <div className="p-2 bg-white/5 rounded-lg border border-glass shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white mb-0.5">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setOnboardingStep(1)}
                className="text-xs font-semibold text-gray-500 hover:text-white text-center mt-2 underline"
              >
                Back to Niche
              </button>
            </m.div>
          )}

          {onboardingStep === 3 && (
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
                {/* Left column: Actions */}
                <div className="md:col-span-3 flex flex-col gap-4 text-center md:text-left">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Step 3: Connect Social Profile
                  </h3>
                  
                  {syncStatus === "idle" && (
                    <div className="flex flex-col gap-3">
                      {/* Option 1: Sandbox seeding */}
                      <button
                        onClick={triggerSandboxSeeding}
                        className="w-full min-h-[52px] bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-glow cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Explore Sandbox Demo Account</span>
                      </button>

                      <div className="flex items-center justify-center gap-4 my-2 select-none">
                        <div className="h-px bg-white/10 flex-grow" />
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                          or link production
                        </span>
                        <div className="h-px bg-white/10 flex-grow" />
                      </div>

                      {/* Option 2: Production Links */}
                      <div className="grid grid-cols-2 gap-3">
                        <InstagramConnectButton label="Instagram" />
                        <button
                          onClick={() => toast.info("TikTok OAuth integration is in beta. Try the sandbox!")}
                          className="min-h-[46px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-gray-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Video className="w-4 h-4 text-brand-secondary" />
                          <span>TikTok</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {syncStatus === "sandbox_syncing" && (
                    <div className="py-6 flex flex-col items-center md:items-start justify-center gap-4 select-none">
                      <div className="relative w-16 h-16 rounded-full border-4 border-white/5 border-t-brand-primary animate-spin mx-auto md:mx-0" />
                      <div className="flex flex-col gap-1 text-center md:text-left">
                        <p className="font-bold text-sm text-white animate-pulse">
                          Generating sandbox metrics...
                        </p>
                        <p className="text-xs text-muted-foreground tracking-wide font-mono">
                          {syncProgress}
                        </p>
                      </div>
                    </div>
                  )}

                  {syncStatus === "success" && (
                    <div className="py-6 flex flex-col items-center md:items-start justify-center gap-3 select-none">
                      <div className="w-12 h-12 rounded-full bg-brand-secondary/15 border border-brand-secondary flex items-center justify-center text-brand-secondary mb-2 animate-bounce">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="font-display font-extrabold text-white text-lg">
                        Sandbox Ready!
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        We connected your test credentials and imported mock data. Press continue to view your dashboard!
                      </p>
                      <button
                        onClick={mutateAccounts}
                        className="mt-4 px-6 min-h-[40px] bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-gray-100 flex items-center gap-2 mx-auto active:scale-95"
                      >
                        <span>Go to Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {syncStatus === "error" && (
                    <div className="py-6 flex flex-col items-center md:items-start justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500 flex items-center justify-center text-red-500 mb-2">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h4 className="font-display font-extrabold text-white text-lg">
                        Demo Seeding Failed
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        There was an issue claiming Alice&apos;s pre-seeded data. Ensure database migrations were run.
                      </p>
                      <button
                        onClick={() => setSyncStatus("idle")}
                        className="mt-4 px-4 py-2 border border-glass bg-white/5 rounded-lg text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {syncStatus === "idle" && (
                    <button
                      onClick={() => setOnboardingStep(2)}
                      className="text-xs font-semibold text-gray-500 hover:text-white mt-2 underline self-center md:self-start"
                    >
                      Back to Goal Selection
                    </button>
                  )}
                </div>

                {/* Right column: Interactive 3D Onboarding Strategy Core */}
                <div className="md:col-span-2 flex flex-col items-center justify-center border border-glass bg-glass-deep p-5 rounded-2xl relative shadow-glow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl" />
                  
                  <div className="w-full h-[220px] flex items-center justify-center">
                    <OnboardingCore3D niche={niche} goal={goal} />
                  </div>

                  <div className="w-full mt-3 p-3 rounded-xl bg-white/5 border border-glass text-center select-none z-10">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-brand-primary/20 text-brand-primary border border-brand-primary/30 tracking-wider">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                      Active 3D Strategy Core
                    </span>
                    <p className="text-[10px] text-gray-300 font-bold mt-1.5 leading-relaxed">
                      Holographic shell aligned to <strong className="text-brand-accent">{niche ? niche.toUpperCase() : "GENERAL"}</strong> niche and morphing under <strong className="text-brand-secondary">{goal ? goal.toUpperCase() : "GROWTH"}</strong> parameters.
                    </p>
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </m.div>
      </div>
    );
  }

  // Dashboard Normal State
  const activeAcctName = activeAccount?.username || "Account";
  const isInstagram = activeAccount?.platform === "instagram";

  // Compute metric numbers safely (guarding division by zero)
  const viewsArr = posts?.map((p) => p.displayViews) || [];
  const totalViews = viewsArr.reduce((a, b) => a + b, 0);

  const engagementArr = posts?.map((p) => Number(p.engagementRate) || 0) || [];
  const averageEngagement = engagementArr.length
    ? (engagementArr.reduce((a, b) => a + b, 0) / engagementArr.length).toFixed(2) + "%"
    : "—";

  // Rebranded metrics matching the database fields
  // Skip rate average (Instagram: 100 - skipRate is Hook Retention)
  const skipRates = posts?.filter((p) => p.skipRate != null).map((p) => Number(p.skipRate)) || [];
  const hookRetentionAvg = skipRates.length
    ? (100 - skipRates.reduce((a, b) => a + b, 0) / skipRates.length).toFixed(1) + "%"
    : "—";

  // Watch-through rate average — we only compute this from real metrics on
  // Instagram (derived from skip rate). TikTok completion rate is not yet
  // ingested, so we show a placeholder instead of fabricating a number.
  const watchThroughAvg = isInstagram ? hookRetentionAvg : "—";

  const unhealthyStatuses = new Set([
    "error",
    "disconnected",
    "rate_limited",
  ]);
  const activeStatus = activeAccount?.syncStatus ?? null;
  const showSyncWarning =
    activeStatus !== null && unhealthyStatuses.has(activeStatus);

  return (
    <div className="flex flex-col gap-8">
      <OAuthErrorBanner />

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

      {/* ── Welcome Banner with pulse stats ── */}
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
              AI Credits: <strong>{usage.aiCallsCount} / {usage.limits?.monthlyAiLimit || 100}</strong>
            </span>
          </div>
        )}
      </m.div>

      {/* ── Dashboard Customizer Toolbar ── */}
      <div className="flex justify-end gap-3 select-none relative z-20 -mb-2">
        {isCustomizing ? (
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-glass">
            <button
              onClick={saveLayout}
              className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-brand-primary text-white shadow-glow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all"
            >
              Save Layout
            </button>
            <button
              onClick={resetLayout}
              className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            >
              Reset
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCustomizing(true)}
            className="px-4 py-2 border border-glass bg-glass hover:bg-white/5 rounded-xl text-xs font-bold text-gray-300 hover:text-white cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4 text-brand-primary animate-spin" style={{ animationDuration: "6s" }} />
            <span>Customize Dashboard</span>
          </button>
        )}
      </div>

      {/* ── Dynamic Customizable Bento Blocks ── */}
      {layoutOrder.map((blockId, index) => {
        const isHidden = hiddenBlocks.includes(blockId);
        if (isHidden && !isCustomizing) return null;

        // Swapping/Customizing Header Controls for each block while in edit mode
        const blockControls = isCustomizing && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-brand-primary/30 select-none">
            <span className="text-[9px] font-black text-brand-primary uppercase mr-2">
              {blockId === "metrics" ? "Bento Metric Cards" : blockId === "charts" ? "Engagement Trend" : blockId === "strategy" ? "Content Strategy" : "Peak Performers"}
            </span>
            <button
              onClick={() => moveBlock(index, "up")}
              disabled={index === 0}
              className="p-1 text-gray-400 hover:text-brand-primary disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer transition-colors"
              title="Move Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveBlock(index, "down")}
              disabled={index === layoutOrder.length - 1}
              className="p-1 text-gray-400 hover:text-brand-primary disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer transition-colors"
              title="Move Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleHideBlock(blockId)}
              className={`p-1 cursor-pointer transition-colors ${isHidden ? "text-brand-primary" : "text-gray-400 hover:text-white"}`}
              title={isHidden ? "Show Section" : "Hide Section"}
            >
              {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        );

        const wrapBlock = (content: React.ReactNode, className = "") => (
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
            {blockControls}
            {content}
          </m.div>
        );

        if (blockId === "metrics") {
          return wrapBlock(
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {analyticsLoading ? (
                <LoadingSkeleton variant="metrics" />
              ) : (
                <>
                  <MetricCard
                    label="Proprietary Hook Retention"
                    value={isInstagram ? hookRetentionAvg : "—"}
                    description="Scroll-stop percentage. Renamed from Instagram skip rate."
                    sourceBadge={activeGoal === "retention" ? "🎯 Goal Focus" : (activeAccount?.platform === "tiktok" ? "TikTok Watch-Through" : "Instagram Reels")}
                  />
                  <MetricCard
                    label="Strategic Watch-Through"
                    value={watchThroughAvg}
                    description="Proprietary Watch-Through score signifying retention completion."
                    sourceBadge={activeGoal === "retention" ? "🎯 Goal Focus" : (activeAccount?.platform === "tiktok" ? "TikTok Complete" : "Instagram Average")}
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

        // To keep layout organic and stunning, if charts and strategy are adjacent and both visible, we group them into a 3-column row.
        // Otherwise, they expand standalone to take full screen width beautifully.
        const chartsIdx = layoutOrder.indexOf("charts");
        const strategyIdx = layoutOrder.indexOf("strategy");
        const areAdjacent = Math.abs(chartsIdx - strategyIdx) === 1;

        if (blockId === "charts") {
          if (areAdjacent && !hiddenBlocks.includes("strategy") && !isCustomizing) {
            if (chartsIdx < strategyIdx) {
              return (
                <div key="charts-strategy-row" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Analytics engagement chart (2/3 width) */}
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

                  {/* Weekly planning summary widget (1/3 width) */}
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
                        {(() => {
                          const key = (activeNiche && activeNiche in NICHE_STRATEGY_TEMPLATES ? activeNiche : "tech") as keyof typeof NICHE_STRATEGY_TEMPLATES;
                          return NICHE_STRATEGY_TEMPLATES[key];
                        })().map((item, idx) => (
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
              return null; // strategy rendered first, handled the row
            }
          }

          // Render standalone full-width charts card
          return wrapBlock(
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

        if (blockId === "strategy") {
          if (areAdjacent && !hiddenBlocks.includes("charts") && !isCustomizing) {
            if (strategyIdx < chartsIdx) {
              return (
                <div key="strategy-charts-row" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Weekly planning summary widget (1/3 width) */}
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
                        {(() => {
                          const key = (activeNiche && activeNiche in NICHE_STRATEGY_TEMPLATES ? activeNiche : "tech") as keyof typeof NICHE_STRATEGY_TEMPLATES;
                          return NICHE_STRATEGY_TEMPLATES[key];
                        })().map((item, idx) => (
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

                  {/* Analytics engagement chart (2/3 width) */}
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
              return null; // charts rendered first, handled the row
            }
          }

          // Render standalone strategy planner (expanded into gorgeous 3 columns)
          return wrapBlock(
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
                {(() => {
                  const key = (activeNiche && activeNiche in NICHE_STRATEGY_TEMPLATES ? activeNiche : "tech") as keyof typeof NICHE_STRATEGY_TEMPLATES;
                  return NICHE_STRATEGY_TEMPLATES[key];
                })().map((item, idx) => (
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

        if (blockId === "posts") {
          return wrapBlock(
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
                    <p className="text-sm text-muted-foreground">No posts have been scored yet.</p>
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
