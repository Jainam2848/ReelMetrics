"use client";

import React, { useEffect, useState, useRef } from "react";
import { m, useAnimation, useInView, Variants } from "framer-motion";
import { CTAButton } from "./CTAButton";
import { RetentionCurve } from "./RetentionCurve";

// Stagger child animation definition matching section 4 spec
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

/* CELL 1: HOOK MOAT */
const WAVES_PRIMARY = [
  "M0,50 Q100,10 200,50 T400,50",
  "M0,50 Q100,90 200,50 T400,50",
  "M0,50 Q100,30 200,50 T400,50",
];

const WAVES_SECONDARY = [
  "M0,50 Q100,80 200,50 T400,50",
  "M0,50 Q100,20 200,50 T400,50",
  "M0,50 Q100,70 200,50 T400,50",
];

function HookMoatCell() {
  const [score, setScore] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  const primaryControls = useAnimation();
  const secondaryControls = useAnimation();

  // Function to initialize and loop waveform morph paths
  const startWaves = () => {
    primaryControls.start({
      d: WAVES_PRIMARY,
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }
    });
    secondaryControls.start({
      d: WAVES_SECONDARY,
      transition: {
        duration: 4,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }
    });
  };

  useEffect(() => {
    if (isInView) {
      startWaves();
    }
  }, [isInView]);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setScore((prev) => {
        if (prev >= 87) {
          clearInterval(interval);
          return 87;
        }
        return prev + 1;
      });
    }, 15);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <m.div
      ref={containerRef}
      variants={cardVariants}
      whileHover={{
        y: -2,
        borderColor: "rgba(79, 70, 229, 0.3)",
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.07)"
      }}
      onMouseEnter={() => {
        primaryControls.stop();
        secondaryControls.stop();
      }}
      onMouseLeave={() => {
        startWaves();
      }}
      className="col-span-12 lg:col-span-8 row-span-2 rounded-2xl border backdrop-blur-[12px] p-8 flex flex-col justify-between select-none group min-h-[420px] cursor-pointer"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold tracking-widest text-[#4F46E5] uppercase">Module 01 // Hook Moat</span>
          <span className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-mono text-[9px] font-bold tracking-wider">ACTIVE DIAGNOSTIC</span>
        </div>
        <h3 className="text-xl md:text-2xl font-cabinet font-bold text-white tracking-tight flex items-baseline gap-2">
          Opening Hook Score <span className="text-brand-secondary font-mono text-2xl font-black">{score}</span>
        </h3>
        <p className="text-sm font-satoshi font-medium text-white/50 max-w-md leading-relaxed mt-1">
          Trendoraa crawls and scans the initial 3 seconds of footage to evaluate pacing speed and audio contrast.
        </p>
      </div>

      {/* SVG Morphing Waveform Area */}
      <div className="h-28 w-full relative bg-black/10 rounded-xl overflow-hidden flex items-center justify-center border border-white/5 my-6">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
          {/* Primary Wave */}
          <m.path
            d={WAVES_PRIMARY[0]}
            animate={primaryControls}
            fill="none"
            stroke="#4F46E5"
            strokeWidth="2.5"
            className="opacity-80"
          />
          {/* Secondary Wave */}
          <m.path
            d={WAVES_SECONDARY[0]}
            animate={secondaryControls}
            fill="none"
            stroke="#10B981"
            strokeWidth="1.5"
            className="opacity-45"
          />
        </svg>

        {/* Live Score Overlay HUD */}
        <div className="absolute right-4 top-4 bg-black/60 border border-white/10 px-3 py-1.5 rounded-lg flex items-baseline gap-1 select-none font-mono">
          <span className="text-[10px] text-white/40 font-bold uppercase mr-1">Score:</span>
          <span className="text-lg font-black text-white">{score}</span>
          <span className="text-[10px] text-[#10B981] font-bold">/100</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
        <span className="text-xs font-mono font-medium text-white/40">
          Target: Stop scroll escape triggers.
        </span>
        <CTAButton
          label="Analyze a Hook →"
          href="/login"
          variant="primary"
          className="px-6 py-2.5 text-xs font-bold"
          data-magnetic
        />
      </div>
    </m.div>
  );
}

/* CELL 2: STATS */
function StatsCell() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  const metrics = [
    { label: "Views", val: 85, color: "bg-[#4F46E5] shadow-[0_0_10px_rgba(79,70,229,0.3)]" },
    { label: "Retention", val: 72, color: "bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.3)]" },
    { label: "Skip Rate", val: 38, color: "bg-[#FF6B6B] shadow-[0_0_10px_rgba(255,107,107,0.3)]" },
  ];

  return (
    <m.div
      ref={containerRef}
      variants={cardVariants}
      whileHover={{
        y: -2,
        borderColor: "rgba(79, 70, 229, 0.3)",
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.07)"
      }}
      className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1 rounded-2xl border backdrop-blur-[12px] p-6 flex flex-col justify-between select-none group cursor-pointer"
    >
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-mono font-bold tracking-widest text-[#10B981] uppercase">Module 02 // Analytics</span>
        <h3 className="text-lg font-cabinet font-bold text-white tracking-tight">System Performance</h3>
      </div>

      <div className="flex flex-col gap-5 my-6">
        {metrics.map((mItem, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-white/60 font-semibold">{mItem.label}</span>
              <span className="text-white font-extrabold">{mItem.val}%</span>
            </div>
            {/* Background track */}
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
              <m.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: mItem.val / 100 } : { scaleX: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.1 }}
                style={{ originX: 0, willChange: "transform" }}
                className={`h-full rounded-full w-full ${mItem.color}`}
              />
            </div>
          </div>
        ))}
      </div>

      <span className="text-[10px] font-mono font-medium text-white/45">
        Optimized via GPU layout transforms.
      </span>
    </m.div>
  );
}

/* CELL 3: SCORE */
function ScoreCell() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });
  const [count, setCount] = useState(0);

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (84 / 100) * circumference;

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev >= 84) {
          clearInterval(interval);
          return 84;
        }
        return prev + 1;
      });
    }, 15);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <m.div
      ref={containerRef}
      variants={cardVariants}
      whileHover={{
        y: -2,
        borderColor: "rgba(79, 70, 229, 0.3)",
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.07)"
      }}
      className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1 rounded-2xl border backdrop-blur-[12px] p-6 flex flex-col justify-between select-none group text-center cursor-pointer"
    >
      <div className="flex flex-col gap-1 items-center">
        <span className="text-[11px] font-mono font-bold tracking-widest text-[#4F46E5] uppercase">Module 03 // Vector Scoring</span>
        <h3 className="text-lg font-cabinet font-bold text-white tracking-tight">9-Dimension Score</h3>
      </div>

      {/* Radial Progress Graphic */}
      <div className="relative flex items-center justify-center my-4">
        <svg width="100" height="100" className="rotate-[-90deg]">
          {/* Background Ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#1F2128"
            strokeWidth="6"
          />
          {/* Foreground Animated Ring */}
          <m.circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#4F46E5"
            strokeWidth="6"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={isInView ? { strokeDashoffset: targetOffset } : { strokeDashoffset: circumference }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Centered Score HUD */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-mono font-black text-white leading-none">{count}</span>
          <span className="text-[8px] font-mono font-bold text-[#10B981] mt-0.5">84/100</span>
        </div>
      </div>

      <p className="text-[11px] font-satoshi font-semibold text-white/50 leading-relaxed max-w-[200px] mx-auto">
        Weighted average of multi-layer cinematic retention variables.
      </p>
    </m.div>
  );
}

/* CELL 4: CALENDAR */
const DAYS = [
  { label: "M", type: "reel" },
  { label: "T", type: "none" },
  { label: "W", type: "reel" },
  { label: "T", type: "story" },
  { label: "F", type: "reel" },
  { label: "S", type: "none" },
  { label: "S", type: "none" },
];

function CalendarCell() {
  return (
    <m.div
      variants={cardVariants}
      whileHover={{
        y: -2,
        borderColor: "rgba(79, 70, 229, 0.3)",
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.07)"
      }}
      className="col-span-12 md:col-span-5 lg:col-span-4 row-span-1 rounded-2xl border backdrop-blur-[12px] p-6 flex flex-col justify-between select-none group cursor-pointer"
    >
      <div className="flex flex-col gap-1 mb-4">
        <span className="text-[11px] font-mono font-bold tracking-widest text-[#10B981] uppercase">Module 04 // Scheduler</span>
        <h3 className="text-lg font-cabinet font-bold text-white tracking-tight">AI Content Calendar</h3>
      </div>

      {/* Mini 7-Day Calendar Grid */}
      <div className="grid grid-cols-7 gap-2.5 my-3">
        {DAYS.map((day, i) => (
          <m.div
            key={i}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="bg-white/[0.02] border border-white/5 rounded-xl py-3 px-1.5 flex flex-col items-center gap-2 select-none hover:bg-white/[0.04] hover:border-[#4F46E5]/20 cursor-pointer"
          >
            <span className="text-[10px] font-mono font-bold text-white/40">{day.label}</span>
            {day.type === "reel" && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
            )}
            {day.type === "story" && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#F97316] shadow-[0_0_6px_#F97316]" />
            )}
            {day.type === "none" && (
              <span className="h-1.5 w-1.5 rounded-full bg-white/5" />
            )}
          </m.div>
        ))}
      </div>

      <span className="text-[10px] font-mono font-semibold text-white/45 mt-4">
        ✦ Recommended pacing slots active.
      </span>
    </m.div>
  );
}

/* CELL 5: RETENTION CURVE */
function RetentionCurveCell() {
  return (
    <m.div
      variants={cardVariants}
      whileHover={{
        y: -2,
        borderColor: "rgba(79, 70, 229, 0.3)",
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.07)"
      }}
      className="col-span-12 md:col-span-7 lg:col-span-8 row-span-1 rounded-2xl border backdrop-blur-[12px] p-6 md:p-8 flex flex-col justify-between select-none group cursor-pointer"
    >
      <div className="flex flex-col gap-1 mb-4">
        <span className="text-[11px] font-mono font-bold tracking-widest text-[#4F46E5] uppercase">Module 05 // Retention</span>
        <h3 className="text-lg md:text-xl font-cabinet font-bold text-white tracking-tight">Retention scrubbing engine</h3>
      </div>

      {/* Embedded interactive retention curve component */}
      <RetentionCurve />
    </m.div>
  );
}

/* MAIN BENTO FEATURE GRID */
export function BentoFeatureGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  return (
    <section id="features" className="py-32 md:py-48 relative overflow-hidden select-none border-t border-white/[0.03]">
      <div className="max-w-6xl w-full mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-secondary/30 bg-brand-secondary/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-secondary">
            Advanced Features
          </div>
          
          <h2 className="text-3xl md:text-5xl font-satoshi font-black tracking-tight text-white leading-tight">
            Stop Guessing. Diagnose.
          </h2>
          
          <p className="mt-4 text-base text-gray-400 font-satoshi font-medium leading-relaxed">
            Every video is evaluated by our 9-dimension analytical vector engine. Click, drag, and scrub to isolate pacing failure nodes.
          </p>
        </div>

        {/* 12-Column Dense Interlocking Grid */}
        <m.div
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-12 gap-6 w-full relative z-10 items-stretch grid-flow-row-dense"
        >
          {/* Cell 1: Hook Moat (col-8, row-2) */}
          <HookMoatCell />

          {/* Cell 2: Stats (col-4) */}
          <StatsCell />

          {/* Cell 3: Score (col-4) */}
          <ScoreCell />

          {/* Cell 4: Calendar (col-4) */}
          <CalendarCell />

          {/* Cell 5: Retention Curve (col-8) */}
          <RetentionCurveCell />
        </m.div>

      </div>
    </section>
  );
}
