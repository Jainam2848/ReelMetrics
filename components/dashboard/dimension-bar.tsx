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
        bg: "bg-emerald-400",
        text: "text-emerald-400",
        track: "bg-emerald-400/15",
        glow: "shadow-[0_0_15px_rgba(52,211,153,0.3)]",
      };
    }
    if (val >= 5) {
      return {
        bg: "bg-amber-400",
        text: "text-amber-400",
        track: "bg-amber-400/15",
        glow: "shadow-[0_0_15px_rgba(251,191,36,0.3)]",
      };
    }
    return {
      bg: "bg-brand-accent",
      text: "text-brand-accent",
      track: "bg-brand-accent/15",
      glow: "shadow-[0_0_15px_rgba(255,0,60,0.3)]",
    };
  };

  const theme = getTheme(clampedScore);

  // Hierarchy styles
  const baseContainer = "flex flex-col p-4 relative overflow-hidden group transition-all duration-300";
  
  let containerStyle = "";
  if (importance === "primary") {
    containerStyle = `${baseContainer} rounded-2xl border-2 border-white/20 bg-glass ${theme.glow} backdrop-blur-xl hover:bg-white/10`;
  } else if (importance === "secondary") {
    containerStyle = `${baseContainer} rounded-xl border border-glass bg-white/5 hover:bg-white/10`;
  } else {
    // Tertiary: terminal/flat style
    containerStyle = `${baseContainer} rounded-none border-l-2 border-white/10 bg-black/40 hover:bg-black/60 font-mono`;
  }

  return (
    <div className={containerStyle}>
      <div className="flex justify-between items-center select-none mb-3">
        {/* Label */}
        <span className={`${
          importance === 'tertiary'
            ? 'text-xs font-mono font-bold text-gray-300 uppercase tracking-widest'
            : 'text-sm font-bold font-heading tracking-wide text-white group-hover:text-brand-primary transition-colors duration-300'
        }`}>
          {label}
        </span>
        
        {/* Numerical Score Pill Badge */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border bg-black/60 font-mono shadow-inner transition-all duration-300 group-hover:scale-105"
          style={{ 
            borderColor: clampedScore > 7 ? 'rgba(52, 211, 153, 0.3)' : clampedScore >= 5 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255, 0, 60, 0.3)',
            boxShadow: clampedScore > 7 ? '0 0 10px rgba(52, 211, 153, 0.15)' : clampedScore >= 5 ? '0 0 10px rgba(251, 191, 36, 0.15)' : '0 0 10px rgba(255, 0, 60, 0.15)'
          }}
        >
          <span 
            className={`text-sm font-extrabold tracking-wider transition-all duration-300 ${theme.text}`}
            style={{
              textShadow: clampedScore > 7 ? '0 0 8px rgba(52, 211, 153, 0.6)' : clampedScore >= 5 ? '0 0 8px rgba(251, 191, 36, 0.6)' : '0 0 8px rgba(255, 0, 60, 0.6)'
            }}
          >
            {clampedScore}
          </span>
          <span className="text-gray-600 text-[10px] font-bold">/</span>
          <span className="text-gray-400 text-[10px] font-extrabold tracking-widest">10</span>
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
        <div className={`mt-2 ${importance === 'tertiary' ? 'text-[9px] font-mono' : 'text-[11px]'} text-gray-400 flex flex-col gap-1.5 border-t border-white/5 pt-2 select-text leading-relaxed`}>
          {reasoning && (
            <p>
              <strong className="text-gray-300 mr-1 select-none">ANALYSIS_</strong> {reasoning}
            </p>
          )}
          {improvement && (
            <p>
              <strong className={`font-semibold mr-1 select-none ${theme.text}`}>ACTION_</strong> {improvement}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
