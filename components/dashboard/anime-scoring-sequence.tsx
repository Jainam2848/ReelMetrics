"use client";

import React, { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";

const STEPS = [
  "Initializing neural matrices...",
  "Parsing video skip-resistance...",
  "Evaluating hook density...",
  "Extracting CTA structures...",
  "Running comparative niche baselines...",
  "Finalizing Engagement Moat score...",
];

export function AnimeScoringSequence() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    return () => clearInterval(stepInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[320px] py-8 relative overflow-hidden">
      {/* Background Grid Scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      
      {/* Central Animation */}
      <div className="relative w-40 h-40 flex items-center justify-center mb-8">
        {/* Glow */}
        <m.div
          animate={{
            scale: [0.9, 1.15, 0.9],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-brand-primary/20 rounded-full blur-2xl"
        />
        <m.div
          animate={{
            scale: [1.1, 0.85, 1.1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.7,
          }}
          className="absolute inset-0 bg-brand-accent/20 rounded-full blur-3xl"
        />
        
        {/* Rings Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Outer Ring */}
          <m.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute w-full h-full rounded-full border border-dashed border-brand-primary/40"
          />
          {/* Middle Ring */}
          <m.div
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute w-4/5 h-4/5 rounded-full border-2 border-brand-accent/30 border-t-brand-accent"
          />
          {/* Inner Ring */}
          <m.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute w-3/5 h-3/5 rounded-full border border-white/20 border-b-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          />
        </div>

        {/* Center Core */}
        <div className="relative w-10 h-10 bg-white shadow-[0_0_30px_rgba(255,255,255,0.8)] rounded-full z-10 flex items-center justify-center overflow-hidden">
          <div className="w-full h-1 bg-black/20 animate-pulse absolute" />
        </div>
      </div>

      {/* Dynamic Text */}
      <div className="flex flex-col items-center gap-2 z-10">
        <div className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-2">
          AI Engine Active
        </div>
        <div className="text-sm font-mono text-white/90 text-center tracking-wide min-h-[24px] px-4">
          <AnimatePresence mode="wait">
            <m.span
              key={currentStep}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="inline-block"
            >
              {STEPS[currentStep]}
            </m.span>
          </AnimatePresence>
        </div>
        
        {/* Progress Bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full mt-4 overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-1000 ease-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
