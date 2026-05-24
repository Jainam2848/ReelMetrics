"use client";

import React from "react";
import { BentoCardMotion } from "@/components/shared/performance-motion";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string | number;
  trend?: "up" | "down" | "neutral";
  description?: string;
  sourceBadge?: string;
  isLoading?: boolean;
}

export function MetricCard({
  label,
  value,
  delta,
  trend = "neutral",
  description,
  sourceBadge,
  isLoading = false,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-glass bg-glass animate-pulse min-h-[140px] flex flex-col justify-between">
        <div className="w-1/3 h-4 bg-white/10 rounded" />
        <div className="w-2/3 h-8 bg-white/10 rounded my-2" />
        <div className="w-1/4 h-3 bg-white/10 rounded" />
      </div>
    );
  }

  const isUp = trend === "up";
  const isDown = trend === "down";

  return (
    <BentoCardMotion className="p-6 rounded-2xl border border-glass bg-glass hover:shadow-glow transition-all flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
      {/* Glow highlight in corner */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-primary/10 rounded-full blur-xl group-hover:bg-brand-primary/20 transition-all duration-300 pointer-events-none" />

      <div className="flex justify-between items-start gap-4">
        {/* Label */}
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
          {label}
          {description && (
            <div className="relative group/tooltip inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-48 p-2 rounded-lg border border-glass bg-popover text-[10px] text-gray-400 font-medium leading-relaxed z-[99]">
                {description}
              </div>
            </div>
          )}
        </span>

        {/* Metric Source Badge */}
        {sourceBadge && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
            {sourceBadge}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-4">
        {/* Value */}
        <span className="text-3xl font-bold font-heading text-white tracking-tight">
          {value}
        </span>

        {/* Delta */}
        {delta && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
              isUp
                ? "bg-brand-secondary/10 text-brand-secondary"
                : isDown
                ? "bg-destructive/10 text-destructive"
                : "bg-white/5 text-gray-400"
            }`}
          >
            {isUp && <TrendingUp className="w-3.5 h-3.5" />}
            {isDown && <TrendingDown className="w-3.5 h-3.5" />}
            <span>{delta}</span>
          </div>
        )}
      </div>
    </BentoCardMotion>
  );
}
