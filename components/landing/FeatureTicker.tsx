"use client";

import React from "react";

const BUZZWORDS = [
  "Skip-Proof Hooks ✦",
  "2.3× Retention ✦",
  "9-Dimension AI ✦",
  "Content Calendar ✦",
  "Hook Moat ✦",
  "Viral Engineering ✦",
];

export function FeatureTicker() {
  return (
    <div className="w-full py-16 overflow-hidden select-none relative z-10">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-rtl {
          0% { transform: translate3d(0%, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        
        .animate-marquee-rtl {
          animation: marquee-rtl 25s linear infinite;
        }
        
        @media (max-width: 768px) {
          .animate-marquee-rtl {
            animation: marquee-rtl 50s linear infinite;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee-rtl {
            animation: none !important;
          }
        }
      `}} />
      
      {/* Full-width rotated container */}
      <div className="w-[115vw] relative left-1/2 -translate-x-1/2 -rotate-[1.5deg] bg-[#4F46E5]/[0.06] border-y border-[#4F46E5]/30 py-5 overflow-hidden flex">
        {/* Double renders list for seamless looping */}
        <div className="flex shrink-0 items-center justify-around min-w-full animate-marquee-rtl hover:[animation-play-state:paused] cursor-pointer gap-8">
          {BUZZWORDS.concat(BUZZWORDS).map((word, i) => (
            <span 
              key={i}
              className={`font-cabinet font-bold uppercase tracking-tight whitespace-nowrap px-4 shrink-0 transition-transform duration-300 hover:scale-105 ${
                i % 2 === 0 ? "text-white" : "text-[#4F46E5]"
              }`}
              style={{ fontSize: "clamp(1.2rem, 2vw, 1.6rem)" }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
