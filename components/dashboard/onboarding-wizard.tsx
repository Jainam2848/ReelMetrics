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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
              {/* Left column: Actions */}
              <div className="md:col-span-3 flex flex-col gap-4 text-center md:text-left">
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
                      <span>Explore Sandbox Demo Account</span>
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
                      We connected your test credentials and imported mock data. Press
                      continue to view your dashboard!
                    </p>
                    <button
                      onClick={onComplete}
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
                    Holographic shell aligned to{" "}
                    <strong className="text-brand-accent">
                      {niche ? niche.toUpperCase() : "GENERAL"}
                    </strong>{" "}
                    niche and morphing under{" "}
                    <strong className="text-brand-secondary">
                      {goal ? goal.toUpperCase() : "GROWTH"}
                    </strong>{" "}
                    parameters.
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
