"use client";

import React from "react";
import { m, useReducedMotion } from "framer-motion";

interface UsageMeterProps {
  label: string;
  used: number;
  total: number;
  unit?: string;
  isLoading?: boolean;
}

export function UsageMeter({
  label,
  used,
  total,
  unit = "credits",
  isLoading = false,
}: UsageMeterProps) {
  if (isLoading) {
    return (
      <div className="p-5 rounded-xl border border-glass bg-glass animate-pulse flex flex-col gap-2.5">
        <div className="w-1/3 h-4 bg-white/10 rounded" />
        <div className="w-full h-2 bg-white/10 rounded" />
        <div className="w-1/4 h-3.5 bg-white/10 rounded" />
      </div>
    );
  }

  const ratio = total > 0 ? used / total : 0;
  const percentage = Math.min(100, Math.round(ratio * 100));
  const shouldReduceMotion = useReducedMotion();

  // Dynamic colors: Green < 80%, Yellow 80-94%, Red >= 95%
  const getTheme = (pct: number) => {
    if (pct >= 95) {
      return {
        bg: "bg-destructive",
        text: "text-destructive",
        track: "bg-destructive/10",
      };
    }
    if (pct >= 80) {
      return {
        bg: "bg-yellow-400",
        text: "text-yellow-400",
        track: "bg-yellow-400/10",
      };
    }
    return {
      bg: "bg-brand-primary",
      text: "text-brand-primary",
      track: "bg-brand-primary/10",
    };
  };

  const theme = getTheme(percentage);

  return (
    <div className="p-5 rounded-xl border border-glass bg-glass/40 flex flex-col gap-3 relative overflow-hidden group">
      <div className="flex justify-between items-baseline select-none">
        {/* Label */}
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {/* Used / Total Counter */}
        <span className="text-sm font-bold text-white">
          {used} <span className="text-gray-500 font-medium text-xs">/ {total} {unit}</span>
        </span>
      </div>

      {/* Progress Track */}
      <div className={`w-full h-2 rounded-full overflow-hidden ${theme.track} border border-white/5`}>
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 100, damping: 18 }
          }
          className={`h-full rounded-full ${theme.bg}`}
          style={{ willChange: "width" }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] text-gray-500 select-none">
        <span>Usage: {percentage}%</span>
        {percentage >= 95 ? (
          <span className="font-bold text-destructive animate-pulse">Critical: Upgrade Required</span>
        ) : percentage >= 80 ? (
          <span className="font-bold text-yellow-400">Approaching Plan Limit</span>
        ) : (
          <span className="font-medium text-gray-400">Plan Status: OK</span>
        )}
      </div>
    </div>
  );
}
