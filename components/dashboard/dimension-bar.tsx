"use client";

import React from "react";
import { m, useReducedMotion } from "framer-motion";

interface DimensionBarProps {
  label: string;
  score: number; // 1 to 10
  reasoning?: string;
  improvement?: string;
  importance?: "primary" | "secondary" | "tertiary";
}

export function DimensionBar({
  label,
  score,
  reasoning,
  improvement,
  importance = "secondary",
}: DimensionBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const clampedScore = Math.max(1, Math.min(10, score));

  // Color mappings based on score thresholds
  const getTheme = (val: number) => {
    if (val > 7) {
      return {
        bg: "bg-emerald-500",
        text: "text-emerald-500",
        track: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        glow: "shadow-[0_2px_8px_rgba(16,185,129,0.1)]",
      };
    }
    if (val >= 5) {
      return {
        bg: "bg-amber-500",
        text: "text-amber-500",
        track: "bg-amber-500/10",
        border: "border-amber-500/20",
        glow: "shadow-[0_2px_8px_rgba(245,158,11,0.1)]",
      };
    }
    return {
      bg: "bg-red-500",
      text: "text-red-500",
      track: "bg-red-500/10",
      border: "border-red-500/20",
      glow: "shadow-[0_2px_8px_rgba(239,68,68,0.1)]",
    };
  };

  const theme = getTheme(clampedScore);

  // Hierarchy styles
  const baseContainer = "flex flex-col p-4 relative overflow-hidden group transition-all duration-300";
  
  let containerStyle = "";
  if (importance === "primary") {
    containerStyle = `${baseContainer} rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04]`;
  } else if (importance === "secondary") {
    containerStyle = `${baseContainer} rounded-xl border border-white/[0.05] bg-transparent hover:bg-white/[0.02]`;
  } else {
    // Tertiary: flat/minimal style
    containerStyle = `${baseContainer} p-3 rounded-lg border-l-2 border-white/10 bg-transparent hover:bg-white/[0.02]`;
  }

  return (
    <div className={containerStyle}>
      <div className="flex justify-between items-center select-none mb-3">
        {/* Label */}
        <span className={`${
          importance === 'tertiary'
            ? 'text-xs font-outfit font-semibold text-gray-400 uppercase tracking-widest'
            : 'text-sm font-bold font-outfit tracking-wide text-white group-hover:text-gray-200 transition-colors duration-300'
        }`}>
          {label}
        </span>
        
        {/* Numerical Score Pill Badge */}
        <div 
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border bg-black/20 ${theme.border} ${theme.glow} font-outfit transition-all duration-300 group-hover:scale-105`}
        >
          <span className={`text-sm font-black tracking-wide ${theme.text}`}>
            {clampedScore}
          </span>
          <span className="text-gray-600 text-[10px] font-bold">/</span>
          <span className="text-gray-400 text-[10px] font-bold tracking-widest">10</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className={`w-full h-1.5 ${importance === 'tertiary' ? 'rounded-none' : 'rounded-full'} overflow-hidden ${theme.track} border border-white/5 mb-1`}>
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedScore * 10}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 120, damping: 20, delay: 0.1 }
          }
          className={`h-full ${importance === 'tertiary' ? 'rounded-none' : 'rounded-full'} ${theme.bg}`}
          style={{ willChange: "width" }}
        />
      </div>

      {/* Accordion Reasoning & Improvements on hover */}
      {(reasoning || improvement) && (
        <div className={`mt-2 ${importance === 'tertiary' ? 'text-[10px]' : 'text-[11px]'} text-gray-400 flex flex-col gap-1.5 border-t border-white/5 pt-2 select-text leading-relaxed font-outfit`}>
          {reasoning && (
            <p>
              <strong className="text-gray-300 mr-1 select-none font-semibold">Diagnosis:</strong> {reasoning}
            </p>
          )}
          {improvement && (
            <p>
              <strong className={`font-semibold mr-1 select-none ${theme.text}`}>Action:</strong> {improvement}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
