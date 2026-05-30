"use client";

import React from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useMomentum } from "@/hooks/use-momentum";
import { TrendingUp, TrendingDown, HelpCircle, Activity } from "lucide-react";
import { InsightReveal } from "@/components/analytics/InsightReveal";

export function ContentMomentumCard() {
  const { momentum, isLoading, error } = useMomentum();

  if (isLoading) {
    return (
      <PremiumCard
        className="p-6 flex flex-col justify-between min-h-[140px] relative group"
        glowColor="blue"
      >
        <div className="flex justify-between items-start gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-pulse w-1/2 h-4 bg-white/10 rounded" />
        </div>
        <div className="flex items-baseline justify-between mt-4">
          <span className="w-1/3 h-8 bg-white/10 rounded animate-pulse" />
          <div className="w-12 h-6 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="mt-4 border-t border-white/5 pt-3 w-full h-4 bg-white/10 rounded animate-pulse" />
      </PremiumCard>
    );
  }

  if (error || !momentum) {
    return (
      <PremiumCard
        className="p-6 flex flex-col justify-between min-h-[140px] relative group border-destructive/20 bg-destructive/5"
        glowColor="none"
      >
        <div className="flex justify-between items-start gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-destructive flex items-center gap-1.5 select-none">
            Content Momentum
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-4 leading-relaxed font-semibold">
          Could not fetch momentum indicators. Verify your connection or try again.
        </div>
      </PremiumCard>
    );
  }

  const { momentumState, compositeDelta, interpretation } = momentum;

  const isUp = momentumState === "trending-up";
  const isDown = momentumState === "cooling-off";

  const glowColor = isUp ? "green" : isDown ? "pink" : "none";
  const stateLabel = isUp
    ? "Trending Up"
    : isDown
    ? "Cooling Off"
    : "Stable";

  const deltaText = compositeDelta >= 0 ? `+${compositeDelta}%` : `${compositeDelta}%`;

  return (
    <PremiumCard
      className="p-6 flex flex-col justify-between min-h-[140px] relative group"
      glowColor={glowColor}
    >
      <div className="flex justify-between items-start gap-4">
        {/* Label */}
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
          Content Momentum
          <div className="relative group/tooltip inline-block">
            <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white cursor-help transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-48 p-2 rounded-lg border border-glass bg-popover text-[10px] text-gray-400 font-medium leading-relaxed z-[99]">
              Calculates a rolling signal comparing Engagement Rate, Reach, and Saves averages from the last 7 days vs the prior 7 days.
            </div>
          </div>
        </span>

        {/* Source Badge */}
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 flex items-center gap-1">
          <Activity className={`w-2.5 h-2.5 ${isUp ? "text-emerald-500 animate-pulse" : isDown ? "text-pink-500" : "text-gray-400"}`} />
          Rolling 7D
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-4">
        {/* State Value */}
        <span className={`text-xl font-extrabold font-heading tracking-tight ${
          isUp
            ? "text-emerald-400"
            : isDown
            ? "text-rose-400"
            : "text-white"
        }`}>
          {stateLabel}
        </span>

        {/* Delta */}
        <div
          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
            isUp
              ? "bg-emerald-500/10 text-emerald-400"
              : isDown
              ? "bg-rose-500/10 text-rose-400"
              : "bg-white/5 text-gray-400"
          }`}
        >
          {isUp && <TrendingUp className="w-3.5 h-3.5" />}
          {isDown && <TrendingDown className="w-3.5 h-3.5" />}
          <span>{deltaText}</span>
        </div>
      </div>

      {/* AI Interpretation text with stagger reveal animation */}
      <div className="mt-4 border-t border-white/5 pt-3">
        <InsightReveal
          text={interpretation}
          className="text-[10px] text-gray-400 font-medium leading-relaxed italic"
          delay={100}
        />
      </div>
    </PremiumCard>
  );
}
