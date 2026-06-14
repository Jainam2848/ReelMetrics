"use client";

import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";

// Helper formatter for numbers (e.g., 10000 -> 10k)
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return Math.round(num).toString();
};

export default function GrowthCalculator() {
  const [currentViews, setCurrentViews] = useState(5000);
  const [currentSkipRate, setCurrentSkipRate] = useState(65); // 65% of people scroll away in first 3s
  const [currentCtaRate, setCurrentCtaRate] = useState(3); // 3% engagement rate (saves/shares)

  // Trendoraa optimization benchmarks
  const targetSkipRate = 35; // Target skip rate drops to 35% with a structured hook
  const ctaMultiplier = 1.6; // Better CTA structure increases save/share rate by 1.6x

  // Calculated stats
  const [projectedViews, setProjectedViews] = useState(5000);
  const [viewMultiplier, setViewMultiplier] = useState(1);
  const [currentSaves, setCurrentSaves] = useState(150);
  const [projectedSaves, setProjectedSaves] = useState(150);

  useEffect(() => {
    // Retention is (100 - skipRate)
    const currentRetention = 100 - currentSkipRate;
    const targetRetention = 100 - targetSkipRate;

    // Short-form algorithms distribute videos exponentially based on early retention
    // We model this with a 1.5 power factor
    const multiplier = Math.max(1, Math.pow(targetRetention / Math.max(1, currentRetention), 1.5));
    const nextViews = Math.round(currentViews * multiplier);
    
    const nextCurrentSaves = Math.round(currentViews * (currentCtaRate / 100));
    const nextProjectedSaves = Math.round(nextViews * ((currentCtaRate * ctaMultiplier) / 100));

    setViewMultiplier(multiplier);
    setProjectedViews(nextViews);
    setCurrentSaves(nextCurrentSaves);
    setProjectedSaves(nextProjectedSaves);
  }, [currentViews, currentSkipRate, currentCtaRate]);

  return (
    <div className="w-full max-w-xl bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden select-none font-outfit text-white">
      {/* Background glow overlay */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-brand-secondary/10 blur-3xl pointer-events-none" />

      <div className="mb-6">
        <h3 className="text-xl font-bold tracking-tight text-white mb-1">
          Algorithm Reach Calculator
        </h3>
        <p className="text-xs text-white/50 leading-normal">
          Adjust your current video metrics to see how decreasing your early scroll-away rate changes distribution.
        </p>
      </div>

      <div className="space-y-6">
        {/* Input 1: Average Views */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold tracking-wide uppercase text-white/60">
            <span>Average Views / Video</span>
            <span className="font-mono text-brand-secondary">{formatNumber(currentViews)}</span>
          </div>
          <input
            type="range"
            min="500"
            max="100000"
            step="500"
            value={currentViews}
            onChange={(e) => setCurrentViews(parseInt(e.target.value))}
            onInput={(e) => setCurrentViews(parseInt(e.currentTarget.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-secondary"
          />
        </div>

        {/* Input 2: Early Scroll-away (Skip) Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold tracking-wide uppercase text-white/60">
            <span>Early Scroll-away Rate (First 3s)</span>
            <span className="font-mono text-red-400">{currentSkipRate}%</span>
          </div>
          <input
            type="range"
            min="45"
            max="90"
            step="1"
            value={currentSkipRate}
            onChange={(e) => setCurrentSkipRate(parseInt(e.target.value))}
            onInput={(e) => setCurrentSkipRate(parseInt(e.currentTarget.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-400"
          />
          <p className="text-[10px] text-white/40 italic">
            Lowering skips from {currentSkipRate}% to {targetSkipRate}% is our standard benchmark goal.
          </p>
        </div>

        {/* Input 3: Save & Share Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold tracking-wide uppercase text-white/60">
            <span>Save & Share (CTA) Rate</span>
            <span className="font-mono text-brand-primary">{currentCtaRate}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={currentCtaRate}
            onChange={(e) => setCurrentCtaRate(parseFloat(e.target.value))}
            onInput={(e) => setCurrentCtaRate(parseFloat(e.currentTarget.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-primary"
          />
        </div>

        {/* Output Dividers / Visualization */}
        <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Comparison Bar Visual */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-white/50">
                <span>Baseline Views</span>
                <span className="font-mono text-white/70">{formatNumber(currentViews)}</span>
              </div>
              <div className="h-6 w-full bg-white/[0.02] border border-white/5 rounded-md overflow-hidden relative">
                <m.div 
                  initial={{ width: "10%" }}
                  animate={{ width: `${Math.max(10, (currentViews / projectedViews) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  className="h-full bg-white/20 rounded-r-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-white/50">
                <span>Projected Views (with strategy)</span>
                <span className="font-mono text-brand-secondary font-bold">{formatNumber(projectedViews)}</span>
              </div>
              <div className="h-6 w-full bg-white/[0.02] border border-white/5 rounded-md overflow-hidden relative">
                <m.div 
                  initial={{ width: "100%" }}
                  className="h-full bg-gradient-to-r from-brand-secondary to-brand-primary rounded-r-sm"
                />
              </div>
            </div>
          </div>

          {/* Numerical Stats & Metrics Card */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
              Estimated Growth Lift
            </div>
            
            <div className="text-3xl font-extrabold tracking-tight text-white mb-1 font-mono">
              <AnimatePresence mode="wait">
                <m.span
                  key={viewMultiplier}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  {viewMultiplier.toFixed(1)}x
                </m.span>
              </AnimatePresence>
            </div>
            
            <p className="text-[10px] text-white/50 max-w-[180px] leading-normal">
              Algorithm scaling boost due to {currentSkipRate - targetSkipRate}% skip rate reduction.
            </p>

            <div className="mt-3 pt-3 border-t border-white/5 w-full flex justify-around text-center">
              <div>
                <div className="text-[9px] uppercase font-bold text-white/40">Current Saves</div>
                <div className="text-xs font-mono font-bold text-white/80">{formatNumber(currentSaves)}</div>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div>
                <div className="text-[9px] uppercase font-bold text-white/40">Projected Saves</div>
                <div className="text-xs font-mono font-bold text-brand-primary">{formatNumber(projectedSaves)}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Small explainer text to prove why this works */}
        <p className="text-[10px] text-white/30 leading-relaxed text-center mt-2">
          Why this works: Recommendation systems optimize for watch-time triggers. Shifting hook skips from {currentSkipRate}% to {targetSkipRate}% increases average completion depth, prompting the algorithm to expand your distribution loop.
        </p>

      </div>
    </div>
  );
}
