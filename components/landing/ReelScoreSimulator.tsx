"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useAnalysisTimeline } from "@/hooks/useAnalysisTimeline";
import { useTypewriter } from "@/hooks/useTypewriter";
import { WAVE_1, WAVE_2, WAVE_3 } from "@/lib/waveform-paths";

// ==========================================
// 1. SMALL HELPER: CLICKSPARK EFFECT
// ==========================================
interface Spark {
  id: number;
  x: number;
  y: number;
  angle: number;
}

export function ClickSpark({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const nextId = useRef(0);

  const handleTrigger = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSparks: Spark[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * 360) / 8;
      newSparks.push({
        id: nextId.current++,
        x,
        y,
        angle,
      });
    }

    setSparks((prev) => [...prev, ...newSparks]);

    // Automatically remove after 500ms
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => !newSparks.find((ns) => ns.id === s.id)));
    }, 500);

    if (onClick) onClick();
  };

  return (
    <div onClick={handleTrigger} className="relative overflow-hidden w-full h-full flex items-center justify-center">
      {children}
      <AnimatePresence>
        {sparks.map((spark) => (
          <m.div
            key={spark.id}
            initial={{ 
              x: spark.x, 
              y: spark.y, 
              rotate: spark.angle, 
              scaleX: 0, 
              opacity: 1 
            }}
            animate={{ 
              x: spark.x + Math.cos((spark.angle * Math.PI) / 180) * 35, 
              y: spark.y + Math.sin((spark.angle * Math.PI) / 180) * 35, 
              scaleX: [0, 1.5, 0], 
              opacity: 0 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute pointer-events-none w-5 h-[1.5px] bg-gradient-to-r from-[#14B8A6] to-[#4F46E5] origin-left rounded-full z-20"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 2. SMALL HELPER: TYPEWRITER LINE
// ==========================================
const TypewriterLine = memo(function TypewriterLine({ text, active }: { text: string; active: boolean }) {
  const typed = useTypewriter(active ? text : "", 20);
  if (!active) return null;
  return (
    <div className="text-white/60 font-mono text-[11px] leading-relaxed flex items-center gap-1.5">
      <span className="text-[#14B8A6]">›</span>
      <span>{typed}</span>
    </div>
  );
});

// ==========================================
// 3. SMALL HELPER: COUNT-UP ANIMATED NUMBER
// ==========================================
const AnimatedScore = memo(function AnimatedScore({ value, active }: { value: number; active: boolean }) {
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!active) {
      setScore(0);
      return;
    }

    const duration = 400; // Complete within 400ms dimension fill time
    const steps = 15;
    const stepTime = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setScore(Math.min(value, Math.floor((value * step) / steps)));
      if (step >= steps) {
        clearInterval(interval);
        setScore(value);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [value, active]);

  return <span className="font-mono font-bold text-white text-[12px]">{score}</span>;
});

// ==========================================
// 4. MAIN SIMULATOR COMPONENT
// ==========================================
const DIMENSIONS = [
  { name: "Hook Strength", score: 88 },
  { name: "Visual Pacing", score: 76 },
  { name: "Skip Resistance", score: 91 },
  { name: "Retention Curve", score: 84 },
  { name: "Caption Layout", score: 67 },
  { name: "Emotional Trigger", score: 79 },
  { name: "Audio Hook", score: 85 },
  { name: "Structural Flow", score: 72 },
  { name: "Trend Alignment", score: 90 },
];

export default function ReelScoreSimulator({ 
  onStateChange 
}: { 
  onStateChange?: (state: "idle" | "scanning" | "analyzing" | "complete") => void 
}) {
  const { state, startAnalysis, reset, loadDemo, setUrl } = useAnalysisTimeline();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Synced ambient state communication
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state.status);
    }
  }, [state.status, onStateChange]);

  // Keep internal URL state sync'd when Autofilling demo
  useEffect(() => {
    if (state.url) {
      setInputValue(state.url);
    }
  }, [state.url]);

  const handleAnalyzeClick = () => {
    if (inputValue.trim()) {
      startAnalysis(inputValue.trim());
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAnalyzeClick();
    }
  };

  const handleResetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setInputValue("");
    reset();
  };

  const handleViewReport = () => {
    const pricingEl = document.getElementById("section-pricing");
    if (pricingEl) {
      pricingEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Performance-based checks
  const [isMobile, setIsMobile] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const shouldAnimateWave = !isMobile && !reduceMotion && isTabVisible;

  return (
    <div 
      style={{
        width: "clamp(340px, 38vw, 500px)",
        background: "rgba(255, 255, 255, 0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "24px",
      }}
      className={`p-6 border transition-all duration-[1200ms] flex flex-col gap-5 w-full relative z-20 ${
        state.status === "complete" 
          ? "border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.08),_0_32px_80px_rgba(0,0,0,0.5),_inset_0_0_0_1px_rgba(255,255,255,0.05)]"
          : "border-white/8 shadow-[0_32px_80px_rgba(0,0,0,0.5),_inset_0_0_0_1px_rgba(255,255,255,0.05)]"
      }`}
    >
      {/* 1. CHROME HEADER BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-2">
          {state.status !== "idle" && (
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
          )}
          <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">
            TRENDORAA AI
          </span>
        </div>
      </div>

      {/* 2. DYNAMIC CONTENT SWITCHER */}
      <div className="relative overflow-hidden flex-1 min-h-[300px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* STATE A: IDLE INPUT */}
          {state.status === "idle" && (
            <m.div
              key="idle"
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4 w-full"
            >
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider">
                  Reel Source
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Paste your Instagram Reel URL..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] font-mono text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-brand-primary/60 focus:ring-[3px] focus:ring-brand-primary/15"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3.5 mt-1 select-none">
                <div className="h-11 rounded-xl overflow-hidden">
                  <ClickSpark onClick={handleAnalyzeClick}>
                    <button
                      type="button"
                      data-magnetic
                      className="w-full h-full bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-white font-bold text-xs flex items-center justify-center tracking-wider uppercase border border-transparent shadow-glow transition-colors duration-300 cursor-pointer"
                    >
                      Analyze Reel →
                    </button>
                  </ClickSpark>
                </div>

                <button
                  type="button"
                  onClick={loadDemo}
                  className="h-11 bg-transparent hover:bg-white/5 text-white/80 font-bold text-xs rounded-xl flex items-center justify-center tracking-wider uppercase border border-white/15 transition-colors duration-300 cursor-pointer"
                >
                  Use Demo Reel
                </button>
              </div>

              <p className="text-[11px] font-medium text-white/30 text-center mt-1">
                No account needed · Analysis runs in ~4 seconds
              </p>
            </m.div>
          )}

          {/* STATE B: SCANNING OR STATE C: ANALYZING OR COMPLETE */}
          {state.status !== "idle" && (
            <m.div
              key="active-sequence"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5 w-full h-full justify-between"
            >
              
              {/* TOP HEADER STATUS */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase font-bold text-white/80 tracking-wide">
                    {state.status === "scanning" 
                      ? "Phase 1: Fetching Reel Metadata" 
                      : state.status === "analyzing" 
                        ? "Phase 2: Running 9-Dimension Analysis" 
                        : "Analysis Complete"}
                  </span>
                  {state.status === "scanning" && (
                    <svg className="animate-spin h-4.5 w-4.5 text-[#14B8A6]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                      />
                    </svg>
                  )}
                </div>

                {/* Progress Bar (0% to 100% in exactly 2000ms starting at 'analyzing') */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                  <m.div
                    initial={{ width: 0 }}
                    animate={
                      state.status === "scanning" 
                        ? { width: "12%" } 
                        : state.status === "analyzing" 
                          ? { width: "100%" } 
                          : { width: "100%", backgroundColor: "#10B981" }
                    }
                    transition={
                      state.status === "analyzing" 
                        ? { duration: 2.0, ease: "linear" } 
                        : { duration: 0.3 }
                    }
                    className="h-full bg-[#4F46E5] rounded-full"
                  />
                </div>
              </div>

              {/* 2.1 SCANNING METADATA INTERNALS */}
              {state.status === "scanning" && (
                <div className="flex-1 bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-2 min-h-[160px] justify-center">
                  <div className="flex items-center gap-2 mb-1 select-none">
                    <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-pulse" />
                    <span className="text-[10px] font-mono text-white/50 tracking-wider uppercase">Parsing URL...</span>
                  </div>
                  <TypewriterLine text="reel_id: Cd7xK2mPqR8" active={state.typingStep >= 1} />
                  <TypewriterLine text="duration: 00:28" active={state.typingStep >= 2} />
                  <TypewriterLine text="resolution: 1080×1920" active={state.typingStep >= 3} />
                </div>
              )}

              {/* 2.2 ANALYZING & COMPLETE - 9 DIMENSIONS LIST */}
              {(state.status === "analyzing" || state.status === "complete") && (
                <div className="flex flex-col gap-3 flex-1 select-none">
                  {DIMENSIONS.map((dim, index) => {
                    const isRendered = state.activeDimensionIndex >= index || state.status === "complete";
                    const isAnimating = state.activeDimensionIndex === index && state.status === "analyzing";
                    
                    return (
                      <m.div
                        key={dim.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={isRendered ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          willChange: isAnimating ? "opacity" : "auto",
                        }}
                        className="flex flex-col gap-1 w-full"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider">
                          <span className="text-white/50 uppercase">{dim.name}</span>
                          <AnimatedScore value={dim.score} active={isRendered} />
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <m.div
                            initial={{ width: 0 }}
                            animate={isRendered ? { width: `${dim.score}%` } : { width: 0 }}
                            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                            className={`h-full rounded-full ${
                              dim.score > 70 
                                ? "bg-[#4F46E5]" 
                                : dim.score >= 50 
                                  ? "bg-amber-500" 
                                  : "bg-rose-500"
                            }`}
                          />
                        </div>
                      </m.div>
                    );
                  })}
                </div>
              )}

              {/* 2.3 WAVEFORM DISPLAY (RUNS DURING PHASE 2) */}
              {state.status === "analyzing" && (
                <div className="border-t border-white/5 pt-4 flex flex-col gap-2 select-none">
                  <div className="h-12 w-full relative overflow-hidden bg-black/25 rounded-xl border border-white/5 flex items-center justify-center">
                    <svg className="w-full h-full px-2" viewBox="0 0 300 48" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#4F46E5" />
                          <stop offset="50%" stopColor="#F97316" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                      <m.path
                        d={WAVE_1}
                        animate={shouldAnimateWave ? { d: [WAVE_1, WAVE_2, WAVE_3, WAVE_1] } : undefined}
                        transition={shouldAnimateWave ? {
                          duration: 2.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          times: [0, 0.33, 0.66, 1]
                        } : undefined}
                        stroke="url(#wave-gradient)"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Sweeping playhead line */}
                      <m.line
                        x1="0"
                        y1="2"
                        x2="0"
                        y2="46"
                        animate={shouldAnimateWave ? { x1: [0, 300], x2: [0, 300] } : undefined}
                        transition={shouldAnimateWave ? {
                          duration: 2.4,
                          repeat: Infinity,
                          ease: "linear"
                        } : undefined}
                        stroke="rgba(255, 255, 255, 0.45)"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-white/30 uppercase tracking-widest font-semibold px-0.5">
                    <span>AUDIO HOOK · FIRST 3 SECONDS</span>
                    <span>0:03s</span>
                  </div>
                </div>
              )}

              {/* 2.4 RETENTION CURVE DRAW & OVERALL SCORE (RUNS DURING PHASE 3) */}
              {state.status === "complete" && (
                <m.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 18, stiffness: 100 }}
                  className="border-t border-white/5 pt-4 flex flex-col gap-4 select-none"
                >
                  
                  {/* OVERALL SCORE RING & BADGE */}
                  <div className="flex items-center gap-5 bg-black/20 border border-white/5 rounded-2xl p-3.5">
                    {/* Radial SVG progress circle */}
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 80 80">
                        <defs>
                          <linearGradient id="score-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4F46E5" />
                            <stop offset="100%" stopColor="#10B981" />
                          </linearGradient>
                        </defs>
                        {/* Background track circle */}
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        {/* Fill Ring */}
                        <m.circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="url(#score-grad)"
                          strokeWidth="6"
                          fill="transparent"
                          strokeLinecap="round"
                          strokeDasharray="226.19" // 2 * Math.PI * 36
                          initial={{ strokeDashoffset: 226.19 }}
                          animate={{ strokeDashoffset: 226.19 * (1 - 0.83) }}
                          transition={{ duration: 1.0, ease: [0.25, 1, 0.5, 1] }}
                          transform="rotate(-90 40 40)"
                        />
                      </svg>
                      {/* Overall Center Score Number */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-heading font-semibold text-white text-[23px] tracking-tight leading-none mt-[-1px]">
                          83
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest font-bold">
                        OVERALL SCORE
                      </span>
                      <div className="bg-[#10B981]/15 px-3 py-1 rounded-full border border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.08)] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-[9px] font-bold text-[#10B981] font-mono tracking-widest uppercase">
                          STRONG HOOK PROFILE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RETENTION CHART SVG */}
                  <div className="flex flex-col gap-2 bg-black/20 border border-white/5 rounded-2xl p-3.5">
                    <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest font-bold">
                      PROPOSED RETENTION PATHWAY
                    </span>
                    <div className="h-16 w-full relative overflow-hidden bg-black/15 rounded-xl border border-white/5 flex items-center justify-center">
                      <svg className="w-full h-full px-1 pt-1.5" viewBox="0 0 300 60" preserveAspectRatio="none">
                        {/* Red Curve (Average Creator drops steeply) */}
                        <m.path
                          d="M 0,10 C 40,48 80,50 300,53"
                          fill="none"
                          stroke="rgba(239, 68, 68, 0.45)"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          initial={{ strokeDashoffset: 310, strokeDasharray: 310 }}
                          animate={{ strokeDashoffset: 0 }}
                          transition={{ duration: 1.0, ease: "easeOut" }}
                        />

                        {/* Emerald Curve (Trendoraa Optimized) */}
                        <m.path
                          d="M 0,5 C 80,6 180,12 300,24"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          initial={{ strokeDashoffset: 310, strokeDasharray: 310 }}
                          animate={{ strokeDashoffset: 0 }}
                          transition={{ duration: 1.0, ease: "easeOut", delay: 0.4 }}
                        />
                      </svg>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-wider mt-0.5 px-0.5 select-none">
                      <div className="flex items-center gap-3">
                        <span className="text-rose-500/60">● AVG CREATOR</span>
                        <span className="text-emerald-500">● TRENDORAA OPTIMIZED</span>
                      </div>
                      <span className="text-white/30 uppercase">0S → 28S Timeline</span>
                    </div>
                  </div>

                  {/* BOTTOM ACTION CTA */}
                  <div className="flex flex-col gap-3 mt-1 text-center">
                    <m.div
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="h-11 rounded-xl overflow-hidden"
                    >
                      <ClickSpark onClick={handleViewReport}>
                        <button
                          type="button"
                          className="w-full h-full bg-transparent hover:bg-white/5 text-white font-bold text-xs flex items-center justify-center tracking-wider uppercase border border-white/20 transition-all duration-300 cursor-pointer"
                        >
                          View Full Report →
                        </button>
                      </ClickSpark>
                    </m.div>
                    
                    <a
                      href="#"
                      onClick={handleResetClick}
                      className="text-[10px] font-bold font-mono text-indigo-400 hover:text-indigo-300 underline tracking-wider uppercase mt-1 transition-colors select-none"
                    >
                      Try another reel
                    </a>
                  </div>
                </m.div>
              )}

            </m.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
