"use client";

import React from "react";

export function RetentionArc() {
  return (
    <div className="fixed top-0 right-0 w-[320px] h-[320px] pointer-events-none z-1 overflow-hidden select-none">
      <svg
        width="320"
        height="320"
        viewBox="0 0 320 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full opacity-90"
      >
        {/* Outer Accent Arc - Muted Brand Indigo (#4F46E5) */}
        <circle
          cx="320"
          cy="0"
          r="280"
          stroke="rgba(99, 102, 241, 0.06)"
          strokeWidth="1"
          strokeDasharray="8 6"
        />

        {/* Inner Accent Arc - Muted Brand Emerald (#10B981) */}
        <circle
          cx="320"
          cy="0"
          r="220"
          stroke="rgba(16, 185, 129, 0.04)"
          strokeWidth="1"
          strokeDasharray="8 6"
        />
      </svg>
    </div>
  );
}
