"use client";

import React from "react";

export function ScoreRing() {
  return (
    <div className="fixed bottom-0 left-0 w-[200px] h-[200px] pointer-events-none z-1 overflow-hidden select-none">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Track Ring - Barely Visible white curve */}
        <circle
          cx="0"
          cy="200"
          r="90"
          stroke="rgba(255, 255, 255, 0.02)"
          strokeWidth="12"
        />

        {/* Fill Ring - Brand Indigo curve with CSS-driven progress pulse */}
        <circle
          cx="0"
          cy="200"
          r="90"
          stroke="rgba(99, 102, 241, 0.08)"
          strokeWidth="12"
          strokeDasharray="565.48"
          strokeDashoffset="113"
          strokeLinecap="round"
          style={{
            animation: "score-ring-pulse 6s ease-in-out infinite",
            transformOrigin: "0px 200px",
            transform: "rotate(-90deg)",
          }}
        />
      </svg>
    </div>
  );
}
