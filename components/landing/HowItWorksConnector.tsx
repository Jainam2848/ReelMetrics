"use client";

import React from "react";

export function HowItWorksConnector() {
  return (
    <div 
      className="absolute top-1/2 left-[12%] right-[12%] -translate-y-1/2 h-20 pointer-events-none hidden lg:block z-0"
    >
      <svg 
        viewBox="0 0 1000 80" 
        className="w-full h-full overflow-visible" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Core Curved Dashed Connector Line */}
        <path
          d="M 20 40 C 250 -10, 250 90, 500 40 C 750 -10, 750 90, 980 40"
          stroke="rgba(79, 70, 229, 0.15)"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        
        {/* Glowing tracking indicator dot utilizing native high-performance SVG animation */}
        <circle
          r="6"
          fill="#10B981"
          style={{
            filter: "drop-shadow(0 0 6px #10B981) drop-shadow(0 0 12px #4F46E5)",
          }}
        >
          <animateMotion
            dur="8s"
            repeatCount="indefinite"
            path="M 20 40 C 250 -10, 250 90, 500 40 C 750 -10, 750 90, 980 40"
          />
        </circle>
      </svg>
    </div>
  );
}
