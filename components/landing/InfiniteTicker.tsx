"use client";

import React from "react";

const BRANDS = [
  { name: "VLOGR.AI", symbol: "V" },
  { name: "CREATOR.HQ", symbol: "C" },
  { name: "REELFLOW", symbol: "R" },
  { name: "PACING.CO", symbol: "P" },
  { name: "HOOKLAB", symbol: "H" },
  { name: "RETENTIO", symbol: "R" },
];

export function InfiniteTicker() {
  return (
    <div className="w-full py-8 overflow-hidden select-none relative z-10">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-ltr {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0%, 0, 0); }
        }
        
        .animate-marquee-ltr {
          animation: marquee-ltr 30s linear infinite;
        }
        
        @media (max-width: 768px) {
          .animate-marquee-ltr {
            animation: marquee-ltr 60s linear infinite;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee-ltr {
            animation: none !important;
          }
        }
      `}} />
      
      {/* Ticker Row */}
      <div 
        className="w-full overflow-hidden flex"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
          maskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
        }}
      >
        {/* Double renders list for seamless looping */}
        <div className="flex shrink-0 items-center justify-around gap-16 min-w-full animate-marquee-ltr hover:[animation-play-state:paused] cursor-pointer">
          {BRANDS.concat(BRANDS).map((brand, i) => (
            <div 
              key={i}
              className="flex items-center gap-2.5 h-12 text-white/25 hover:text-white/70 transition-colors duration-300 select-none font-mono tracking-widest text-[11px] font-bold border border-white/5 bg-white/[0.01] px-5 py-2.5 rounded-xl shrink-0"
            >
              <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[9px] font-black text-white/50">
                {brand.symbol}
              </div>
              <span>{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
