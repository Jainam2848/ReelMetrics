"use client";

import React from "react";
import { m } from "framer-motion";
import { NumberTicker } from "@/components/shared/number-ticker";

export function SocialProofTicker() {
  return (
    <m.div
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full border-y border-white/5 bg-black/40 backdrop-blur-md py-4 relative z-10"
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Ticker side */}
        <div className="flex items-center gap-3 text-sm font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-secondary"></span>
            </span>
            <span className="uppercase font-bold tracking-wider text-white">Live</span>
          </div>
          <span className="hidden md:inline-block w-px h-4 bg-white/10 mx-2"></span>
          <p>
            Trendoraa has analyzed <NumberTicker value={23412} /> Reels in the last 24 hours.
          </p>
        </div>

        {/* Testimonial Orbit Card */}
        <m.div 
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="border border-glass bg-glass shadow-glow backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 max-w-sm"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent shrink-0 flex items-center justify-center text-white font-bold text-xs">
            C
          </div>
          <div>
            <p className="text-xs text-white/90 italic leading-relaxed mb-1">
              &quot;Trendoraa’s Hook Retention Analysis told me exactly why my hooks were failing. +120% views in 2 weeks.&quot;
            </p>
            <p className="text-[10px] font-bold text-brand-secondary">@creatorhandle</p>
          </div>
        </m.div>

      </div>
    </m.div>
  );
}
