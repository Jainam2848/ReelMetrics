"use client";

import React from "react";
import { m, useReducedMotion } from "framer-motion";

interface DimensionBarProps {
  label: string;
  score: number; // 1 to 10
  reasoning?: string;
  improvement?: string;
}

export function DimensionBar({
  label,
  score,
  reasoning,
  improvement,
}: DimensionBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const clampedScore = Math.max(1, Math.min(10, score));

  // Color mappings based on score thresholds (Green > 7, Yellow 5-7, Red < 5)
  const getTheme = (val: number) => {
    if (val > 7) {
      return {
        bg: "bg-brand-secondary",
        text: "text-brand-secondary",
        track: "bg-brand-secondary/15",
      };
    }
    if (val >= 5) {
      return {
        bg: "bg-yellow-400",
        text: "text-yellow-400",
        track: "bg-yellow-400/15",
      };
    }
    return {
      bg: "bg-destructive",
      text: "text-destructive",
      track: "bg-destructive/15",
    };
  };

  const theme = getTheme(clampedScore);

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-glass bg-white/5 relative overflow-hidden group hover:bg-white/10 transition-colors">
      <div className="flex justify-between items-center select-none">
        {/* Label */}
        <span className="text-sm font-semibold tracking-wide text-white">
          {label}
        </span>
        {/* Numerical Score */}
        <span className={`text-sm font-bold ${theme.text}`}>
          {clampedScore} <span className="text-gray-500 font-medium text-xs">/ 10</span>
        </span>
      </div>

      {/* Progress Track */}
      <div className={`w-full h-2 rounded-full overflow-hidden ${theme.track} border border-white/5`}>
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedScore * 10}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 120, damping: 20, delay: 0.1 }
          }
          className={`h-full rounded-full ${theme.bg}`}
          style={{ willChange: "width" }}
        />
      </div>

      {/* Accordion Reasoning & Improvements on hover */}
      {(reasoning || improvement) && (
        <div className="mt-2 text-[11px] text-gray-400 flex flex-col gap-1.5 border-t border-white/5 pt-2 select-text leading-relaxed">
          {reasoning && (
            <p>
              <strong className="text-gray-300 mr-1 select-none">Analysis:</strong> {reasoning}
            </p>
          )}
          {improvement && (
            <p>
              <strong className={`font-semibold mr-1 select-none ${theme.text}`}>Improvement:</strong> {improvement}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
