"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { m } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Check,
  Tv,
  Flame,
  Users,
  Video,
  AlertCircle,
} from "lucide-react";
import { Instagram } from "@/components/shared/icons";
import { InstagramConnectButton } from "@/components/shared/instagram-connect";
import { OAuthErrorBanner } from "@/components/dashboard/oauth-error-banner";
import { useToast } from "@/components/shared/toast";

const OnboardingCore3D = dynamic(
  () => import("@/components/dashboard/onboarding-core-3d"),
  { ssr: false }
);

const NICHE_COLORS = {
  tech: { from: "rgba(99, 102, 241, 0.12)", to: "rgba(139, 92, 246, 0.12)" },
  comedy: { from: "rgba(244, 63, 94, 0.12)", to: "rgba(236, 72, 153, 0.12)" },
  finance: { from: "rgba(245, 158, 11, 0.12)", to: "rgba(16, 185, 129, 0.12)" },
  education: { from: "rgba(14, 165, 233, 0.12)", to: "rgba(20, 184, 166, 0.12)" },
  lifestyle: { from: "rgba(167, 139, 250, 0.12)", to: "rgba(253, 186, 116, 0.12)" },
  fashion: { from: "rgba(253, 164, 175, 0.12)", to: "rgba(253, 224, 71, 0.12)" },
  "": { from: "rgba(255, 255, 255, 0.03)", to: "rgba(255, 255, 255, 0.03)" },
};

interface OnboardingWizardProps {
  onComplete: () => void; // called after mutateAccounts to refresh the parent
}

/**
 * Self-contained onboarding wizard shown when the user has no connected accounts.
 * Owns its own step/niche/goal state so DashboardHome stays thin.
 */
export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const toast = useToast();
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "sandbox_syncing" | "success" | "error"
  >("idle");
  const [syncProgress, setSyncProgress] = useState("");

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

    const steps = [
      "Creating virtual sandbox environment...",
      "Connecting to Trendoraa AI ingestion pipeline...",
      "Syncing last 30 posts from demo profile...",
      "Calculating AI Engagement Moat Index...",
      "Compiling weekly content strategy calendar...",
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step) setSyncProgress(step);
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
        onComplete();
      } else {
        setSyncStatus("error");
        toast.error(data.error?.message || "Failed to initialize demo sandbox");
      }
    } catch {
      setSyncStatus("error");
      toast.error("An unexpected error occurred during demo setup.");
    }
  };

  const activeBackdrop = NICHE_COLORS[niche as keyof typeof NICHE_COLORS] || NICHE_COLORS[""];

  return (
    <div className={`mx-auto py-10 transition-all duration-500 ease-out ${onboardingStep === 3 ? "max-w-4xl" : "max-w-xl"}`}>
      <OAuthErrorBanner />
      <m.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          background: `radial-gradient(circle at 50% 50%, ${activeBackdrop.from} 0%, ${activeBackdrop.to} 100%), rgba(10, 10, 12, 0.85)`
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="border border-glass backdrop-blur-2xl rounded-2xl p-8 shadow-glow overflow-hidden relative"
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
            Follow these three quick steps to link your short-form video channels
            and generate immediate analytics.
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

        {/* Step 1 */}
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

        {/* Step 2 */}
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

        {/* Step 3 */}
        {onboardingStep === 3 && (
          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              {/* Left column: Actions (3/5 width) */}
              <div className="lg:col-span-3 flex flex-col gap-4 text-center lg:text-left">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Step 3: Connect Social Profile
                </h3>

                {syncStatus === "idle" && (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={triggerSandboxSeeding}
                      className="w-full min-h-[52px] bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-glow cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Explore Sandbox Demo Account (3 Seconds)</span>
                    </button>

                    <div className="flex items-center justify-center gap-4 my-2 select-none">
                      <div className="h-px bg-white/10 flex-grow" />
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        or link production
                      </span>
                      <div className="h-px bg-white/10 flex-grow" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <InstagramConnectButton label="Instagram" />
                      <button
                        onClick={() =>
                          toast.info(
                            "TikTok OAuth integration is in beta. Try the sandbox!"
                          )
                        }
                        className="min-h-[46px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-gray-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Video className="w-4 h-4 text-brand-secondary" />
                        <span>TikTok</span>
                      </button>
                    </div>
                  </div>
                )}

                {syncStatus === "sandbox_syncing" && (
                  <div className="py-6 flex flex-col items-center lg:items-start justify-center gap-4 select-none">
                    <div className="relative w-16 h-16 rounded-full border-4 border-white/5 border-t-brand-primary animate-spin mx-auto lg:mx-0" />
                    <div className="flex flex-col gap-1 text-center lg:text-left">
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
                  <div className="py-6 flex flex-col items-center lg:items-start justify-center gap-3 select-none">
                    <div className="w-12 h-12 rounded-full bg-brand-secondary/15 border border-brand-secondary flex items-center justify-center text-brand-secondary mb-2 animate-bounce">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="font-display font-extrabold text-white text-lg">
                      Sandbox Ready!
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto lg:mx-0">
                      We connected your test credentials and imported mock data. Press
                      continue to view your dashboard!
                    </p>
                    <button
                      onClick={onComplete}
                      className="mt-4 px-6 min-h-[40px] bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-gray-100 flex items-center gap-2 mx-auto lg:mx-0 active:scale-95"
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {syncStatus === "error" && (
                  <div className="py-6 flex flex-col items-center lg:items-start justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500 flex items-center justify-center text-red-500 mb-2">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h4 className="font-display font-extrabold text-white text-lg">
                      Demo Seeding Failed
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      There was an issue claiming Alice&apos;s pre-seeded data. Ensure
                      database migrations were run.
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
                    className="text-xs font-semibold text-gray-500 hover:text-white mt-2 underline self-center lg:self-start"
                  >
                    Back to Goal Selection
                  </button>
                )}
              </div>

              {/* Right column: Interactive 3D Strategy Core & Surfing Academy (2/5 width) */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* 3D Visual Block */}
                <div className="flex flex-col items-center justify-center border border-glass bg-glass-deep p-4 rounded-2xl relative shadow-glow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl" />
                  <div className="w-full h-[140px] flex items-center justify-center">
                    <OnboardingCore3D niche={niche} goal={goal} />
                  </div>
                  <div className="w-full mt-2 text-center select-none z-10">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-brand-primary/20 text-brand-primary border border-brand-primary/30 tracking-wider">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                      Active 3D Strategy Core
                    </span>
                  </div>
                </div>

                {/* Surfing Academy Guide Preview Cards */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest pl-1">
                    📖 Trendoraa Surfing Academy
                  </span>

                  {[
                    {
                      num: "1",
                      title: "Explore Hold Curves (My Posts)",
                      desc: "See a mathematical Bezier timeline tracking exactly where viewers scrolled away in the first 3 seconds of your Reels.",
                      color: "border-brand-primary/20 text-brand-primary bg-brand-primary/5 hover:border-brand-primary/40",
                    },
                    {
                      num: "2",
                      title: "Inspect Engagement Velocity (Analytics)",
                      desc: "Identify peak commuting times and optimal posting schedules automatically calculated for your niche.",
                      color: "border-brand-secondary/20 text-brand-secondary bg-brand-secondary/5 hover:border-brand-secondary/40",
                    },
                    {
                      num: "3",
                      title: "Access Content Roadmaps (Strategy)",
                      desc: "Grab personalized AI script outlines, scheduled drop times, and formatting baselines customized for you.",
                      color: "border-brand-accent/20 text-brand-accent bg-brand-accent/5 hover:border-brand-accent/40",
                    },
                  ].map((academyItem) => (
                    <div
                      key={academyItem.num}
                      className={`p-3 rounded-xl border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 select-none ${academyItem.color}`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {academyItem.num}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <h4 className="font-bold text-xs text-white">
                            {academyItem.title}
                          </h4>
                          <p className="text-[10px] leading-relaxed text-gray-300 font-medium">
                            {academyItem.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </m.div>
        )}
      </m.div>
    </div>
  );
}
