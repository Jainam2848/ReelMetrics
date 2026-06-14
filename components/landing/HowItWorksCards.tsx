"use client";

import React, { useRef, useState } from "react";
import { m, Variants, useInView, useReducedMotion } from "framer-motion";

// Framer Motion spring physics definitions
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    }
  }
};

const cardVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 20,
    }
  }
};

// Micro-UI Visual 1: Sync Feed Simulated Interface
function SyncFeedVisual({ active }: { active: boolean }) {
  return (
    <div className="w-full h-28 rounded-xl border border-white/5 bg-neutral-950/40 p-3 overflow-hidden relative transition-colors duration-300 group-hover:border-indigo-500/20">
      {/* Background ambient light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)] pointer-events-none" />
      
      {/* Top dashboard row */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#E1306C] to-[#833AB4] flex items-center justify-center text-[9px] text-white font-bold select-none">
            i
          </div>
          <span className="text-[10px] font-satoshi font-semibold text-gray-300">@creator.feed</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[8px] font-satoshi font-bold text-[#10B981] uppercase tracking-wider">Connected</span>
        </div>
      </div>

      {/* Simulated feed items */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {[0, 1, 2].map((i) => (
          <m.div 
            key={i}
            initial={{ y: 5, opacity: 0.8 }}
            animate={active ? { y: 0, opacity: 1, scale: 1.02 } : { y: 5, opacity: 0.8, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={`h-12 rounded-lg border border-white/5 bg-white/5 relative overflow-hidden flex flex-col justify-end p-1 transition-all duration-300 ${active ? "border-indigo-500/30 bg-indigo-500/5 shadow-inner" : ""}`}
          >
            {/* Ambient post color */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0 transition-opacity duration-300 ${active ? "opacity-40" : "opacity-20"}`} />
            <div className={`absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[8px] text-emerald-400 font-bold transition-all duration-300 ${active ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
              ✓
            </div>
            {/* Visual indicator lines in card */}
            <div className="w-2/3 h-1 bg-white/20 rounded z-10 mb-0.5" />
            <div className="w-1/2 h-1 bg-white/10 rounded z-10" />
          </m.div>
        ))}
      </div>
    </div>
  );
}

// Micro-UI Visual 2: Retention Leak Interactive Chart
function RetentionLeakVisual({ active }: { active: boolean }) {
  return (
    <div className="w-full h-28 rounded-xl border border-white/5 bg-neutral-950/40 p-3 overflow-hidden relative transition-colors duration-300 group-hover:border-indigo-500/20">
      {/* Background ambient light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.03),transparent_70%)] pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 relative z-10">
        <span className="text-[10px] font-satoshi font-semibold text-gray-300">Auditing Timeline</span>
        <span className="text-[8px] font-satoshi font-bold text-red-400 uppercase bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
          Leak Flagged
        </span>
      </div>

      {/* Mini Chart Area */}
      <div className="relative h-12 w-full z-10 flex items-end">
        {/* Playhead line */}
        <m.div 
          initial={{ left: "10%" }}
          animate={active ? { left: "45%" } : { left: "10%" }}
          transition={{ duration: 1.5, ease: "easeInOut", repeat: active ? Infinity : 0, repeatType: "reverse" }}
          className="absolute top-0 bottom-0 w-[1.5px] bg-red-400/80 z-20"
        >
          <div className="w-2 h-2 rounded-full bg-red-400 absolute top-0 left-1/2 transform -translate-x-1/2" />
        </m.div>

        {/* Leak Tooltip */}
        <m.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="absolute top-[-8px] left-[32%] z-20 bg-red-500 text-white text-[8px] font-satoshi font-bold px-1 py-0.5 rounded shadow-lg border border-red-400 pointer-events-none"
        >
          -45% Drop
        </m.div>

        {/* SVG Chart Wave */}
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
          {/* Retention line */}
          <m.path
            d="M0 5 Q 20 5, 40 10 T 50 24 T 70 26 T 100 27"
            fill="none"
            stroke={active ? "url(#retentionGrad)" : "rgba(255,255,255,0.2)"}
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />
          <defs>
            <linearGradient id="retentionGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="40%" stopColor="#818CF8" />
              <stop offset="50%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// Micro-UI Visual 3: Playbook Optimization Checklist
function PlaybookVisual({ active }: { active: boolean }) {
  return (
    <div className="w-full h-28 rounded-xl border border-white/5 bg-neutral-950/40 p-3 overflow-hidden relative transition-colors duration-300 group-hover:border-indigo-500/20">
      {/* Background ambient light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 relative z-10">
        <span className="text-[10px] font-satoshi font-semibold text-gray-300">Creator Playbook</span>
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-satoshi font-bold text-gray-400">Score:</span>
          <m.span 
            className="text-[9px] font-satoshi font-black text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-1.5 rounded"
          >
            {active ? "94" : "78"}
          </m.span>
        </div>
      </div>

      {/* Simulated checklist */}
      <div className="flex flex-col gap-1.5 relative z-10">
        {[
          { text: "Change hook phrase", delay: 0.1 },
          { text: "Fix 3s editing cuts", delay: 0.2 },
          { text: "Adjust music drop", delay: 0.3 }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <m.div 
              initial={{ scale: 0.8 }}
              animate={active ? { scale: 1, backgroundColor: "rgba(16, 185, 129, 0.2)", borderColor: "rgba(16, 185, 129, 0.4)" } : { scale: 0.9, backgroundColor: "rgba(255, 255, 255, 0.03)", borderColor: "rgba(255, 255, 255, 0.08)" }}
              transition={{ duration: 0.3, delay: item.delay }}
              className="w-3.5 h-3.5 rounded border border-white/10 flex items-center justify-center"
            >
              <m.svg 
                initial={{ opacity: 0, pathLength: 0 }}
                animate={active ? { opacity: 1, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
                transition={{ duration: 0.3, delay: item.delay + 0.1 }}
                className="w-2.5 h-2.5 text-emerald-400" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </m.svg>
            </m.div>
            <m.span 
              animate={active ? { color: "#F8F8FC" } : { color: "#9CA3AF" }}
              className="text-[10px] font-satoshi font-medium transition-colors"
            >
              {item.text}
            </m.span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HowItWorksCards() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Cards definitions
  const steps = [
    {
      num: "1",
      title: "Sync Your Feed",
      description: "Safely sync your creator account in one tap. We pull your performance data directly from Meta with complete security.",
      badge: "One-Click Safe Sync →",
      visual: (active: boolean) => <SyncFeedVisual active={active} />
    },
    {
      num: "2",
      title: "Find retention leaks",
      description: "Our AI instantly scans your video styling, audio drops, editing pacing, and visual transitions to find exactly why viewers swipe away.",
      badge: "Smart Retention Audit →",
      visual: (active: boolean) => <RetentionLeakVisual active={active} />
    },
    {
      num: "3",
      title: "Boost your reach",
      description: "Get a personalized creator playbook with fresh hook ideas, high-engagement pacing suggestions, and script tweaks to maximize retention.",
      badge: "Creator Playbook →",
      visual: (active: boolean) => <PlaybookVisual active={active} />
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent, stepTitle: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const targetId = stepTitle.toLowerCase() === "connect" ? "/login" : "#transformation";
      if (typeof window !== "undefined") {
        window.location.assign(targetId);
      }
    }
  };

  return (
    <m.div
      ref={ref}
      variants={shouldReduceMotion ? {} : containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 w-full relative z-10"
    >
      {steps.map((step, idx) => {
        const isHovered = hoveredIdx === idx;
        return (
          <m.div
            key={step.num}
            variants={shouldReduceMotion ? {} : cardVariants}
            whileHover={shouldReduceMotion ? {} : { 
              y: -4, 
              borderColor: "rgba(79, 70, 229, 0.4)",
              backgroundColor: "rgba(255, 255, 255, 0.05)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            tabIndex={0}
            role="button"
            aria-label={`Step ${step.num}: ${step.title}. ${step.description}`}
            onKeyDown={(e) => handleKeyDown(e, step.title)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 relative flex flex-col justify-between min-h-[340px] overflow-hidden group cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090D] transition-all duration-300"
          >
            {/* Top content group */}
            <div className="relative z-10 flex flex-col items-start w-full">
              {/* Context-aware Graphic Preview (Bespoke visual in place of basic icon) */}
              <div className="w-full mb-6">
                {step.visual(isHovered)}
              </div>

              {/* Title with smaller inline number container */}
              <div className="flex items-center gap-2.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center text-xs font-bold text-[#818CF8] select-none">
                  {step.num}
                </span>
                <h3 className="text-lg font-satoshi font-bold text-white tracking-tight leading-tight">
                  {step.title}
                </h3>
              </div>
              
              <p className="text-sm font-satoshi font-medium text-gray-400 leading-relaxed max-w-[28ch] mt-3">
                {step.description}
              </p>
            </div>

            {/* Action indicator tag */}
            <div className="relative z-10 text-[11px] font-satoshi font-bold text-[#10B981] group-hover:text-[#10B981]/80 transition-colors duration-200 mt-6 tracking-wide uppercase">
              {step.badge}
            </div>
          </m.div>
        );
      })}
    </m.div>
  );
}
