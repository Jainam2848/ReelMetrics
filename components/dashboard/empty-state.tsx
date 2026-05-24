"use client";

import React from "react";
import { Film, Calendar, Settings, AlertCircle, PlusCircle } from "lucide-react";

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
  const getContextDetails = () => {
    switch (context) {
      case "posts":
        return {
          icon: <Film className="w-8 h-8 text-brand-primary" />,
          title: "No posts discovered yet",
          description: "Sync your connected profiles to import your latest Instagram Reels and TikTok videos for deep AI scoring.",
          defaultActionLabel: "Sync Profiles Now",
        };
      case "strategy":
        return {
          icon: <Calendar className="w-8 h-8 text-brand-secondary" />,
          title: "No strategic content calendar",
          description: "Our AI is ready to analyze your hooks, pacing, and audience hold curves. Generate your first weekly strategic plan now.",
          defaultActionLabel: "Generate Strategy Plan",
        };
      case "accounts":
        return {
          icon: <Settings className="w-8 h-8 text-brand-accent" />,
          title: "No social profiles connected",
          description: "To unlock AI scoring, hook metrics, and trends, link your creator or business social profiles.",
          defaultActionLabel: "Connect First Profile",
        };
      default:
        return {
          icon: <AlertCircle className="w-8 h-8 text-gray-400" />,
          title: "No metrics discovered",
          description: "We require active post sync data before we can construct heatmaps or aggregated retention charts.",
          defaultActionLabel: "Link Account & Sync",
        };
    }
  };

  const details = getContextDetails();

  return (
    <div className="w-full flex items-center justify-center py-12 px-4">
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

        {/* Action Button */}
        {(actionLabel || details.defaultActionLabel) && onActionClick && (
          <button
            onClick={onActionClick}
            disabled={isLoading}
            className="min-h-[44px] min-w-[180px] py-2.5 px-6 rounded-xl font-semibold bg-brand-primary hover:bg-brand-primary/95 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-glow disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            {isLoading ? "Processing..." : actionLabel || details.defaultActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
