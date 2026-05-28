"use client";

import React, { useState } from "react";
import { Film, Calendar, Settings, AlertCircle, PlusCircle, Sparkles, BookOpen } from "lucide-react";
import { useToast } from "@/components/shared/toast";

interface EmptyStateProps {
  context: "posts" | "strategy" | "accounts" | "analytics";
  actionLabel?: string;
  onActionClick?: () => void;
  isLoading?: boolean;
}

export function EmptyState({
  context,
  actionLabel,
  onActionClick,
  isLoading = false,
}: EmptyStateProps) {
  const toast = useToast();
  const [demoLoading, setDemoLoading] = useState(false);

  const getContextDetails = () => {
    switch (context) {
      case "posts":
        return {
          icon: <Film className="w-8 h-8 text-brand-primary" />,
          title: "No posts discovered yet",
          description: "Sync your connected profiles to import your latest Instagram Reels and TikTok videos for deep AI scoring.",
          defaultActionLabel: "Sync Profiles Now",
          surfingTip: "Want to see our AI hold curves in action? By spinning up the Sandbox, you will unlock detailed retention scorecards for premium tech-gear reels instantly!",
        };
      case "strategy":
        return {
          icon: <Calendar className="w-8 h-8 text-brand-secondary" />,
          title: "No strategic content calendar",
          description: "Our AI is ready to analyze your hooks, pacing, and audience hold curves. Generate your first weekly strategic plan now.",
          defaultActionLabel: "Generate Strategy Plan",
          surfingTip: "The Content Strategy matrix compiles custom posting schedules, optimal peak hours, and AI captions tailored perfectly to help tech and lifestyle creators grow.",
        };
      case "accounts":
        return {
          icon: <Settings className="w-8 h-8 text-brand-accent" />,
          title: "No social profiles connected",
          description: "To unlock AI scoring, hook metrics, and trends, link your creator or business social profiles.",
          defaultActionLabel: "Connect First Profile",
          surfingTip: "Connecting your channels allows Trendoraa to continuously ingest Graph API parameters. Rest assured, we strictly read engagement metrics safely without accessing personal data.",
        };
      default:
        return {
          icon: <AlertCircle className="w-8 h-8 text-gray-400" />,
          title: "No metrics discovered",
          description: "We require active post sync data before we can construct heatmaps or aggregated retention charts.",
          defaultActionLabel: "Link Account & Sync",
          surfingTip: "Once synced, we generate interactive engagement baselines and posting schedules to identify exactly which days and hours yield the highest scroll-stop velocity.",
        };
    }
  };

  const details = getContextDetails();

  const handleLaunchSandbox = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/accounts/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: "tech", goal: "retention" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Sandbox Demo Account connected successfully! Surf's up!");
        // Reloading the page will cleanly rehydrate activeAccount SWR caches and route states.
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Failed to connect sandbox account.");
      }
    } catch {
      toast.error("An unexpected error occurred during demo setup.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-12 px-4 select-none">
      <div className="w-full max-w-md p-8 rounded-2xl border border-glass bg-glass backdrop-blur-md shadow-glow text-center flex flex-col items-center">
        {/* Animated visual frame */}
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 animate-pulse shadow-inner">
          {details.icon}
        </div>

        <h3 className="text-xl font-bold font-heading text-white mb-3">
          {details.title}
        </h3>

        <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-sm">
          {details.description}
        </p>

        {/* Action Button Row */}
        <div className="flex flex-col gap-3 w-full items-center mb-8">
          {(actionLabel || details.defaultActionLabel) && onActionClick && (
            <button
              onClick={onActionClick}
              disabled={isLoading || demoLoading}
              className="min-h-[44px] w-full max-w-xs py-2.5 px-6 rounded-xl font-semibold bg-brand-primary hover:bg-brand-primary/95 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-glow disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              {isLoading ? "Processing..." : actionLabel || details.defaultActionLabel}
            </button>
          )}

          {/* Sandbox demo bypass button */}
          <button
            onClick={handleLaunchSandbox}
            disabled={isLoading || demoLoading}
            className="min-h-[44px] w-full max-w-xs py-2.5 px-6 rounded-xl font-semibold border border-glass bg-white/5 hover:bg-white/10 text-gray-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95"
          >
            {demoLoading ? (
              <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
            )}
            {demoLoading ? "Initializing Demo..." : "Explore Sandbox Demo Profile"}
          </button>
        </div>

        {/* Supportive Surfing Tip Panel */}
        <div className="w-full p-4 rounded-xl border border-glass bg-white/5 text-left flex gap-3">
          <BookOpen className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-brand-primary tracking-wider">
              Surfing Tip
            </span>
            <p className="text-[11px] leading-relaxed text-gray-300 font-medium">
              {details.surfingTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

