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

  // Map 0-100 scores to SVG Y coordinates (15 = 100%, 85 = 0%)
  const getCurveY = (score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    return 85 - (clamped / 100) * 70;
  };

  const hookY = getCurveY(hookVal);
  const retentionY = getCurveY(retentionVal);
  const completionY = getCurveY(completionVal);

  // Generate smooth cubic bezier representing typical decay curve using real scores
  const currentPathD = mode === "scoring"
    ? "M 10 50 C 200 25, 400 75, 790 50" // Loading state wave A
    : `M 10 15 C 100 15, 170 ${hookY}, 240 ${hookY} C 360 ${hookY}, 440 ${retentionY}, 520 ${retentionY} C 620 ${retentionY}, 710 ${completionY}, 790 ${completionY}`;

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
      <div className="w-full border border-glass bg-glass rounded-2xl p-5 md:h-64 flex flex-col justify-between relative overflow-hidden shadow-glow">
        
        <div className="flex justify-between items-center z-10">
          <span className="text-[10px] font-mono uppercase font-bold text-brand-primary tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-secondary" />
            Viewer Attention Decay Timeline
          </span>
          {mode === "interactive" && (
            <span className="text-[10px] font-mono text-white/70 font-semibold px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">
              Selected Phase: <strong className="text-white">{activePhaseInfo.name}</strong>
            </span>
          )}
        </div>

        {/* Canvas-Like SVG Container */}
        <div className="relative w-full h-full flex flex-col items-center justify-center my-4 min-h-[120px]">
          <svg 
            viewBox="0 0 800 100" 
            className="w-full h-full overflow-visible"
          >
            {/* SVG Defs */}
            <defs>
              {/* Dot Matrix Background Pattern */}
              <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.08)" />
              </pattern>

              {/* Shaded Area Underneath the dynamic path */}
              <linearGradient id={gradientAreaId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
              </linearGradient>

              {/* Strategy Indigo to Growth Teal stroke gradient */}
              <linearGradient id={gradientGlowId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F97316" />   {/* Orange (Hook) */}
                <stop offset="40%" stopColor="#4F46E5" />  {/* Indigo (Body) */}
                <stop offset="100%" stopColor="#14B8A6" /> {/* Teal (End) */}
              </linearGradient>
            </defs>

            {/* Pattern Background Fill */}
            <rect width="800" height="100" fill={`url(#${patternId})`} rx="8" />

            {/* Timeline Vertical Markers & Labels */}
            {mode === "interactive" && (
              <>
                {/* Boundary lines */}
                <line x1="240" y1="0" x2="240" y2="100" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="520" y1="0" x2="520" y2="100" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="3 3" />

                {/* Grid timeline zones */}
                <text x="120" y="93" fill="rgba(255, 255, 255, 0.2)" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.05em">HOOK (0-3s)</text>
                <text x="380" y="93" fill="rgba(255, 255, 255, 0.2)" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.05em">PACE & BODY (3-15s)</text>
                <text x="655" y="93" fill="rgba(255, 255, 255, 0.2)" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.05em">WATCH-THROUGH (15s+)</text>
              </>
            )}

            {/* Shaded Area Under Curve */}
            <path
              d={`${currentPathD} L 790 90 L 10 90 Z`}
              fill={`url(#${gradientAreaId})`}
              className="transition-all duration-700 ease-in-out"
            />

            {/* Dynamic Retention Line */}
            <path
              ref={pathRef}
              d={currentPathD}
              fill="none"
              stroke={`url(#${gradientGlowId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ willChange: "stroke-dashoffset" }}
              className="transition-all duration-700 ease-in-out"
            />

            {/* Interactive Milestone Nodes (Only visible in interactive mode) */}
            {mode === "interactive" && (
              <>
                {/* Node 1: Hook (Orange) */}
                <g 
                  className="cursor-pointer group/node"
                  onClick={() => handlePhaseSelect(0)}
                >
                  <circle cx="240" cy={hookY} r="8" fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="1" className="group-hover/node:scale-125 transition-transform" />
                  <circle id="node-0" cx="240" cy={hookY} r="4.5" fill="#F97316" className="transition-all" />
                  {activePhase === 0 && <circle cx="240" cy={hookY} r="9" fill="none" stroke="#F97316" strokeWidth="1.5" className="animate-pulse" />}
                </g>

                {/* Node 2: Body (Indigo) */}
                <g 
                  className="cursor-pointer group/node"
                  onClick={() => handlePhaseSelect(1)}
                >
                  <circle cx="520" cy={retentionY} r="8" fill="rgba(79, 70, 229, 0.15)" stroke="rgba(79, 70, 229, 0.4)" strokeWidth="1" className="group-hover/node:scale-125 transition-transform" />
                  <circle id="node-1" cx="520" cy={retentionY} r="4.5" fill="#4F46E5" className="transition-all" />
                  {activePhase === 1 && <circle cx="520" cy={retentionY} r="9" fill="none" stroke="#4F46E5" strokeWidth="1.5" className="animate-pulse" />}
                </g>

                {/* Node 3: Completion (Teal) */}
                <g 
                  className="cursor-pointer group/node"
                  onClick={() => handlePhaseSelect(2)}
                >
                  <circle cx="790" cy={completionY} r="8" fill="rgba(20, 184, 166, 0.15)" stroke="rgba(20, 184, 166, 0.4)" strokeWidth="1" className="group-hover/node:scale-125 transition-transform" />
                  <circle id="node-2" cx="790" cy={completionY} r="4.5" fill="#14B8A6" className="transition-all" />
                  {activePhase === 2 && <circle cx="790" cy={completionY} r="9" fill="none" stroke="#14B8A6" strokeWidth="1.5" className="animate-pulse" />}
                </g>
              </>
            )}
          </svg>
        </div>

        {/* Bottom Legend */}
        <div className="z-10 flex justify-between items-center text-[9px] text-gray-500 font-bold uppercase">
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
