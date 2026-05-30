/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Activity, Sparkles, AlertCircle, CheckCircle2, TrendingUp, Clock, Target } from "lucide-react";

interface GrowthMatrixProps {
  mode?: "scoring" | "interactive";
  scores?: {
    hook?: number;
    retention?: number;
    completion?: number;
    cta?: number;
    visual?: number;
    audio?: number;
    trend?: number;
    caption?: number;
    timing?: number;
  };
  onCellClick?: (dimensionName: string, score: number) => void;
}

export function GrowthMatrix({
  mode = "scoring",
  scores,
  onCellClick,
}: GrowthMatrixProps) {
  const isReducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "-");
  const gradientGlowId = `retention-glow-${uid}`;
  const gradientAreaId = `retention-area-${uid}`;
  const patternId = `dot-matrix-${uid}`;
  const pathRef = useRef<SVGPathElement>(null);
  
  const [activePhase, setActivePhase] = useState<number>(0);
  const [animeLoaded, setAnimeLoaded] = useState(false);
  const animeInstance = useRef<any>(null);

  // Dynamic import of AnimeJS to satisfy Next.js SSR boundaries safely
  useEffect(() => {
    import("animejs").then((module) => {
      animeInstance.current = (module as any).default || module;
      setAnimeLoaded(true);
    });
  }, []);

  // Timeline values from live scores
  const hookVal = scores?.hook ?? 82;
  const retentionVal = scores?.retention ?? 74;
  const completionVal = scores?.completion ?? 68;

  const hVal = Math.max(10, Math.min(100, hookVal));
  const rVal = Math.max(5, Math.min(hVal, retentionVal));
  const cVal = Math.max(1, Math.min(rVal, completionVal));

  // Build second-by-second decay array representing video duration (15s)
  // Ensure we inject a drop of >15% at Second 6-8 (index 5 to 7)
  const seconds: number[] = [
    100, // sec 1
    Math.round(100 - (100 - hVal) * 0.4), // sec 2
    hVal, // sec 3 (Hook Val)
    Math.round(hVal - (hVal - rVal) * 0.15), // sec 4
    Math.round(hVal - (hVal - rVal) * 0.35), // sec 5
    73, // sec 6 (drop start)
    60, // sec 7
    54, // sec 8 (drop end: 73 -> 54 = 19% drop!)
    rVal, // sec 9 (Body Val)
    Math.round(rVal - (rVal - cVal) * 0.2), // sec 10
    Math.round(rVal - (rVal - cVal) * 0.4), // sec 11
    Math.round(rVal - (rVal - cVal) * 0.6), // sec 12
    Math.round(rVal - (rVal - cVal) * 0.8), // sec 13
    Math.round(cVal + 2), // sec 14
    cVal // sec 15 (Completion Val)
  ];

  // Timeline Phases Data
  const phases = [
    {
      id: 0,
      name: "Hook Phase (0-3s)",
      metric: "Scroll-Stop Rate",
      score: hookVal,
      color: "text-brand-accent bg-brand-accent/10 border-brand-accent/25",
      accentColor: "#F97316",
      desc: "Capturing user attention before they swipe. The first 3 seconds dictate the organic reach distribution multiplier.",
      suggestions: [
        "Incorporate highly-legible text overlays stating the core promise in the first 0.5s.",
        "Change the opening scene to show dynamic, high-momentum movement rather than a static intro.",
        "Avoid slow intro transitions or branding frames that cause immediate swipe-away behavior."
      ]
    },
    {
      id: 1,
      name: "Body Phase (3-15s)",
      metric: "Pacing & Retention Velocity",
      score: retentionVal,
      color: "text-brand-primary bg-brand-primary/10 border-brand-primary/25",
      accentColor: "#4F46E5",
      desc: "Holding viewer interest after the initial scroll-stop. A stable decay rate signals high-value, engaging storytelling.",
      suggestions: [
        "Deliver visual pacing shifts (cuts, zooms, or B-roll injection) every 2.5s to maintain focus.",
        "Align storytelling arcs directly with background audio beats for satisfying sensory pacing.",
        "Remove fluff segments or dead air immediately to prevent sudden watch drop-offs."
      ]
    },
    {
      id: 2,
      name: "End Phase (15s+)",
      metric: "Completion & Exit Resistance",
      score: completionVal,
      color: "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/25",
      accentColor: "#14B8A6",
      desc: "Maximizing the percentage of viewers who complete the video. High completion signals the algorithm to boost search and explore delivery.",
      suggestions: [
        "Use a seamless loop style where the end of the video connects perfectly back to the hook.",
        "Deliver a punchy Call-to-Action (CTA) inside the last 2s, paired with high-contrast text instructions.",
        "Avoid long wrap-up segments that signal to the viewer that the value delivery is over."
      ]
    }
  ];

  const activePhaseInfo = (phases[activePhase] || phases[0]) as {
    id: number;
    name: string;
    metric: string;
    score: number;
    color: string;
    accentColor: string;
    desc: string;
    suggestions: string[];
  };

  // 1. Morphing / Wave Animation Loop
  useEffect(() => {
    if (!animeLoaded || !animeInstance.current || !pathRef.current || isReducedMotion) return;

    const anime = animeInstance.current;
    const path = pathRef.current;

    // Reset path dash offsets
    const pathLength = path.getTotalLength();
    path.setAttribute("stroke-dasharray", pathLength.toString());
    path.setAttribute("stroke-dashoffset", pathLength.toString());

    if (mode === "scoring") {
      // Gentle breathing wave motion for scoring/loading state
      anime.remove(path);
      anime({
        targets: path,
        d: [
          { value: "M 10 50 C 200 25, 400 75, 790 50" },
          { value: "M 10 50 C 200 75, 400 25, 790 50" },
          { value: "M 10 50 C 200 25, 400 75, 790 50" }
        ],
        strokeDashoffset: 0,
        duration: 4000,
        easing: "easeInOutSine",
        loop: true,
      });
    } else {
      // Crisp strategy cockpit reveal
      anime.remove(path);
      anime({
        targets: path,
        strokeDashoffset: [pathLength, 0],
        duration: 1600,
        easing: "easeOutCubic",
      });
    }

    const currentPath = pathRef.current;
    return () => {
      if (animeInstance.current && currentPath) {
        animeInstance.current.remove(currentPath);
      }
    };
  }, [mode, animeLoaded, isReducedMotion]);

  // Handler for phase click
  const handlePhaseSelect = (idx: number) => {
    setActivePhase(idx);
    const phase = phases[idx];
    if (phase) {
      onCellClick?.(phase.name, phase.score);
    }

    // Apply soft scale spring animation to selected interactive node
    if (animeLoaded && animeInstance.current && !isReducedMotion) {
      const anime = animeInstance.current;
      anime({
        targets: `#node-${idx}`,
        scale: [1, 1.3, 1],
        duration: 500,
        easing: "easeOutElastic(1, .6)"
      });
    }
  };

  // Score badge color helper
  const getEfficacyLevel = (score: number) => {
    if (score >= 80) return { label: "Elite", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> };
    if (score >= 60) return { label: "Strong", color: "text-brand-primary bg-brand-primary/10 border-brand-primary/20", icon: <TrendingUp className="w-3.5 h-3.5 text-brand-primary" /> };
    return { label: "Needs Tuning", color: "text-brand-accent bg-brand-accent/10 border-brand-accent/20", icon: <AlertCircle className="w-3.5 h-3.5 text-brand-accent" /> };
  };

  const efficacy = getEfficacyLevel(activePhaseInfo.score);

  return (
    <div className="flex flex-col gap-6 w-full select-none font-sans">
      {/* Visual Header */}
      <div className="flex justify-between items-center bg-white/5 border border-glass rounded-2xl p-4">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-brand-primary animate-pulse" />
          <div>
            <h4 className="text-sm font-heading font-extrabold text-white">
              {mode === "scoring" ? "Calculating Video Strategy Profile" : "Scroll Retention Curve Analyzer"}
            </h4>
            <p className="text-[10px] text-muted-foreground font-medium">
              {mode === "scoring" ? "Simulating scroll drop-offs and exit velocity..." : "Select milestones along the curve to inspect strategic optimization advice."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mode === "scoring" ? "bg-brand-accent" : "bg-brand-secondary"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${mode === "scoring" ? "bg-brand-accent" : "bg-brand-secondary"}`}></span>
          </span>
          <span className="text-[9px] uppercase font-bold tracking-widest text-gray-300">
            {mode === "scoring" ? "Creator Intelligence Pipeline" : "Analysis Complete"}
          </span>
        </div>
      </div>

      {/* Main Graph Card */}
      <div className="w-full border border-glass bg-glass rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-glow">
        
        <div className="flex justify-between items-center z-10">
          <span className="text-[10px] font-mono uppercase font-bold text-brand-primary tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-secondary" />
            Viewer Attention Decay Heatmap
          </span>
          {mode === "interactive" && (
            <span className="text-[10px] font-mono text-white/70 font-semibold px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">
              Selected Phase: <strong className="text-white">{activePhaseInfo.name}</strong>
            </span>
          )}
        </div>

        {/* Heatmap Timeline Grid */}
        <div className="relative w-full flex flex-col pt-12 pb-6 my-4 min-h-[140px] justify-center">
          {/* 1. Warning Flags Layer (placed above the cells) */}
          <div className="absolute top-0 left-0 w-full h-8 grid grid-cols-15 gap-1 md:gap-1.5 pointer-events-none z-20">
            {(() => {
              const drops: React.ReactNode[] = [];
              for (let i = 2; i < seconds.length; i++) {
                const val1 = seconds[i - 2] ?? 0;
                const val2 = seconds[i] ?? 0;
                const diff = val1 - val2;
                if (diff > 15) {
                  const startSec = i - 1; // Second 6
                  const endSec = i + 1;   // Second 8
                  drops.push(
                    <div 
                      key={i} 
                      className="flex justify-center items-center pointer-events-auto"
                      style={{
                        gridColumnStart: startSec,
                        gridColumnEnd: endSec + 1,
                      }}
                    >
                      <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[8px] sm:text-[9px] font-sans font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5 shadow-glow whitespace-nowrap animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span>Major drop at {startSec}–{endSec}s — review this cut</span>
                      </div>
                    </div>
                  );
                  i += 1; // prevent overlapping flags
                }
              }
              return drops;
            })()}
          </div>

          {/* 2. Heatmap Timeline Bar */}
          <div className="grid grid-cols-15 gap-1 md:gap-1.5 h-12 w-full bg-white/5 border border-white/10 rounded-xl p-1 relative z-10">
            {seconds.map((val: number, idx: number) => {
              const sec = idx + 1;
              // Color buckets
              // Above 80% → Neon Jade (bg-emerald-500)
              // 60–80% → Electric Cobalt (bg-indigo-600)
              // 40–60% → Sunset Rose (bg-orange-500)
              // Below 40% → deep red (bg-red-800)
              let cellBg = "bg-red-800 border-red-700/30";
              if (val > 80) cellBg = "bg-emerald-500 border-emerald-400/30";
              else if (val >= 60) cellBg = "bg-indigo-600 border-indigo-500/30";
              else if (val >= 40) cellBg = "bg-orange-500 border-orange-400/30";

              return (
                <div
                  key={idx}
                  className={`group relative h-full rounded-lg border flex flex-col items-center justify-center transition-all hover:scale-105 hover:brightness-110 cursor-pointer ${cellBg}`}
                >
                  <span className="text-[9px] font-black text-white/80 font-mono hidden sm:inline">
                    {val}%
                  </span>

                  {/* Premium CSS Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-black/90 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-white font-mono whitespace-nowrap shadow-glow pointer-events-none">
                    Second {sec} — {val}% of viewers still watching.
                  </div>

                  {/* 3. Milestone Anchors overlays */}
                  {mode === "interactive" && sec === 3 && (
                    <button
                      id="node-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePhaseSelect(0);
                      }}
                      className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-30 w-6 h-6 rounded-full bg-orange-500 border border-white flex items-center justify-center shadow-glow active:scale-90 transition-transform cursor-pointer"
                    >
                      <span className="text-[9px] font-black text-white font-mono">H</span>
                      {activePhase === 0 && (
                        <span className="absolute -inset-1 rounded-full border border-orange-500 animate-ping opacity-75" />
                      )}
                    </button>
                  )}

                  {mode === "interactive" && sec === 9 && (
                    <button
                      id="node-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePhaseSelect(1);
                      }}
                      className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-30 w-6 h-6 rounded-full bg-indigo-600 border border-white flex items-center justify-center shadow-glow active:scale-90 transition-transform cursor-pointer"
                    >
                      <span className="text-[9px] font-black text-white font-mono">B</span>
                      {activePhase === 1 && (
                        <span className="absolute -inset-1 rounded-full border border-indigo-600 animate-ping opacity-75" />
                      )}
                    </button>
                  )}

                  {mode === "interactive" && sec === 15 && (
                    <button
                      id="node-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePhaseSelect(2);
                      }}
                      className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-30 w-6 h-6 rounded-full bg-teal-500 border border-white flex items-center justify-center shadow-glow active:scale-90 transition-transform cursor-pointer"
                    >
                      <span className="text-[9px] font-black text-white font-mono">E</span>
                      {activePhase === 2 && (
                        <span className="absolute -inset-1 rounded-full border border-teal-500 animate-ping opacity-75" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="z-10 flex justify-between items-center text-[9px] text-gray-500 font-bold uppercase mt-2">
          <span>0s / Start</span>
          <span>15s+ / End</span>
        </div>
      </div>

      {/* Strategy Detail Viewer & Advice Drawer */}
      {mode === "interactive" && (
        <div className="flex flex-col gap-5">
          {/* Phase Navigation Tabs */}
          <div className="grid grid-cols-3 gap-2 select-none">
            {phases.map((phase) => (
              <button
                key={phase.id}
                onClick={() => handlePhaseSelect(phase.id)}
                className={`py-3 px-2 rounded-xl text-left border transition-all active:scale-98 cursor-pointer flex flex-col justify-between gap-1.5 ${
                  activePhase === phase.id
                    ? "bg-white/5 border-white/20 text-white font-bold"
                    : "bg-glass border-glass text-muted-foreground hover:text-white"
                }`}
              >
                <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-75">
                  Phase 0{phase.id + 1}
                </span>
                <span className="text-[11px] font-heading font-extrabold truncate w-full">
                  {phase.name.split(" ")[0]} {phase.name.split(" ")[1]}
                </span>
                <div className="flex justify-between items-center w-full mt-1 border-t border-white/5 pt-1.5">
                  <span className="text-[8px] uppercase tracking-wide opacity-50 truncate max-w-[50px] sm:max-w-[100px]">
                    {phase.metric}
                  </span>
                  <span className="text-xs font-black text-white shrink-0">
                    {phase.score}%
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Dynamic Advice Panel */}
          <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-full blur-xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-primary" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Strategy Guide: {activePhaseInfo.name}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase">
                  Efficacy Index: <strong className="text-white font-black">{activePhaseInfo.score}%</strong>
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${efficacy.color}`}>
                  {efficacy.icon}
                  {efficacy.label}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed font-semibold">
              {activePhaseInfo.desc}
            </p>

            <div className="border-t border-white/5 pt-4">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-brand-primary mb-3.5 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-secondary" />
                Actionable Growth Recommendations:
              </span>

              <ul className="flex flex-col gap-2.5">
                {activePhaseInfo.suggestions.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span 
                      className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" 
                      style={{ backgroundColor: activePhaseInfo.accentColor }} 
                    />
                    <p className="text-[10px] text-gray-400 leading-normal font-semibold">
                      {tip}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
