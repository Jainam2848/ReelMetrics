/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Activity, CheckCircle } from "lucide-react";

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
  const gridRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [animeLoaded, setAnimeLoaded] = useState(false);
  const animeInstance = useRef<any>(null);

  // Dynamic import of AnimeJS to satisfy Next.js SSR boundaries safely
  useEffect(() => {
    import("animejs").then((module) => {
      animeInstance.current = (module as any).default || module;
      setAnimeLoaded(true);
    });
  }, []);

  const dimensions = [
    { name: "Hook Execution", score: scores?.hook ?? 82, color: "from-[#6C5CE7] to-[#8F82FF]", desc: "Scroll-stop efficacy within initial 3s." },
    { name: "Scroll-Stop Velocity", score: scores?.retention ?? 74, color: "from-[#FD79A8] to-[#FF9ECA]", desc: "Resistance to swipe behaviors." },
    { name: "Watch-Through Completion", score: scores?.completion ?? 68, color: "from-[#00B894] to-[#55EFC4]", desc: "End-to-end retention profile." },
    { name: "CTA Value Index", score: scores?.cta ?? 85, color: "from-[#6C5CE7] to-[#FD79A8]", desc: "Conversion trigger alignment." },
    { name: "Visual Pacing Peak", score: scores?.visual ?? 90, color: "from-[#00B894] to-[#6C5CE7]", desc: "Cut-density and frame variations." },
    { name: "Audio Match Moat", score: scores?.audio ?? 77, color: "from-[#FD79A8] to-[#00B894]", desc: "Trend audio and track integration." },
    { name: "Trend Relevance Matrix", score: scores?.trend ?? 88, color: "from-[#6C5CE7] to-[#00B894]", desc: "Algorithmic amplification indexing." },
    { name: "Caption Structure", score: scores?.caption ?? 65, color: "from-[#FD79A8] to-[#6C5CE7]", desc: "Keyword weight and read duration." },
    { name: "Timing Efficiency", score: scores?.timing ?? 80, color: "from-[#00B894] to-[#FD79A8]", desc: "Audience activity overlap indexing." },
  ];

  // 1. Grid Stagger Animation Loop (Scoring vs Display Mode)
  useEffect(() => {
    if (!animeLoaded || !animeInstance.current || !gridRef.current || isReducedMotion) return;

    const anime = animeInstance.current;
    // Scoped query: target only the cells INSIDE this component's grid ref,
    // not every .matrix-cell in the entire document. This avoids expensive
    // document-wide DOM traversal and prevents cross-component style thrashing.
    const cells = gridRef.current.querySelectorAll(".matrix-cell");
    
    // Clear any previous animations scoped to these exact nodes
    anime.remove(cells);

    if (mode === "scoring") {
      // Dynamic pulsating matrix wave to signify active evaluation
      anime({
        targets: cells,
        scale: [0.96, 1.04, 0.96],
        opacity: [0.6, 1, 0.6],
        borderColor: ["rgba(255, 255, 255, 0.08)", "rgba(108, 92, 231, 0.4)", "rgba(255, 255, 255, 0.08)"],
        delay: anime.stagger(120, { grid: [3, 3], from: "center" }),
        loop: true,
        duration: 2000,
        easing: "easeInOutSine",
      });
    } else {
      // Staggered reveal upon load for display mode
      anime({
        targets: cells,
        scale: [0.3, 1],
        opacity: [0, 1],
        delay: anime.stagger(80, { grid: [3, 3], from: "first" }),
        duration: 1200,
        easing: "spring(1, 80, 10, 0)", // Bespoke spring physics
      });
    }

    return () => {
      if (animeInstance.current) {
        animeInstance.current.remove(cells);
      }
    };
  }, [mode, animeLoaded, isReducedMotion]);

  // 2. SVG Path Drawing / Morphing Animation Loop
  useEffect(() => {
    if (!animeLoaded || !animeInstance.current || !pathRef.current || isReducedMotion) return;

    const anime = animeInstance.current;
    const path = pathRef.current;
    
    // Reset path dash offsets
    const pathLength = path.getTotalLength();
    path.setAttribute("stroke-dasharray", pathLength.toString());
    path.setAttribute("stroke-dashoffset", pathLength.toString());

    if (mode === "scoring") {
      // Endless morphing/drawing wave for AI processing loop
      anime({
        targets: path,
        strokeDashoffset: [pathLength, 0],
        duration: 3000,
        easing: "easeInOutQuad",
        loop: true,
        direction: "alternate",
      });
    } else {
      // Crisp custom elastic growth reveal for finalized charts
      anime({
        targets: path,
        strokeDashoffset: [pathLength, 0],
        duration: 2000,
        easing: "easeOutElastic(1, .6)",
      });
    }

    // Add radar sweep animation
    anime({
      targets: "#radar-sweep",
      translateX: ["-100%", "800px"],
      opacity: [0, 1, 0],
      duration: 3500,
      loop: true,
      easing: "linear",
    });

    const currentPath = pathRef.current;
    return () => {
      if (animeInstance.current && currentPath) {
        animeInstance.current.remove(currentPath);
        animeInstance.current.remove("#radar-sweep");
      }
    };
  }, [mode, animeLoaded, isReducedMotion]);

  // Handler for cell clicks with elastic physics pop
  const handleCellClick = (idx: number, name: string, score: number) => {
    if (!animeLoaded || !animeInstance.current || isReducedMotion) {
      setActiveCell(idx);
      onCellClick?.(name, score);
      return;
    }

    const anime = animeInstance.current;
    setActiveCell(idx);

    // Dynamic scale-pop on selection
    anime({
      targets: `#cell-${idx}`,
      scale: [1, 1.1, 1],
      rotateZ: [0, idx % 2 === 0 ? 2 : -2, 0],
      duration: 600,
      easing: "spring(1, 75, 8, 0)",
    });

    onCellClick?.(name, score);
  };

  // Retention profile bezier curves: morph path during loading vs display
  // scoring path: wavy fluctuating curve
  // interactive path: smooth growth curve representing stable skip resistance
  const currentPathD = mode === "scoring" 
    ? "M 10 90 C 80 10, 120 180, 200 40 C 280 160, 320 10, 390 70" 
    : "M 10 90 C 100 80, 150 15, 200 25 C 250 35, 300 5, 390 10";

  return (
    <div className="flex flex-col gap-6 w-full select-none">
      {/* Visual Header */}
      <div className="flex justify-between items-center bg-white/5 border border-glass rounded-2xl p-4">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-brand-primary animate-pulse" />
          <div>
            <h4 className="text-sm font-display font-extrabold text-white">
              {mode === "scoring" ? "Algorithmic Moat Evaluation Matrix" : "Skip Resistance Graph & Scores"}
            </h4>
            <p className="text-[10px] text-muted-foreground">
              {mode === "scoring" ? "Simulating hook skipped boundaries..." : "Select dimensions to inspect targeted advice."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mode === "scoring" ? "bg-brand-accent" : "bg-brand-secondary"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${mode === "scoring" ? "bg-brand-accent" : "bg-brand-secondary"}`}></span>
          </span>
          <span className="text-[9px] uppercase font-bold tracking-widest text-gray-300">
            {mode === "scoring" ? "AI Pipeline Active" : "Scored"}
          </span>
        </div>
      </div>

      <div className="w-full border border-glass bg-glass rounded-2xl p-5 md:h-64 flex flex-col justify-between relative overflow-hidden shadow-glow">
        {/* Radar Sweep Overlay (AnimeJS animated) */}
        <div id="radar-sweep" className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-transparent via-brand-primary/20 to-brand-primary/50 border-r-2 border-brand-primary/60 blur-[1px] z-20 mix-blend-screen opacity-0" />

        {/* Overlay grid lines for dashboard theme */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-10 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="border border-brand-primary/20" />
          ))}
        </div>

        <div className="flex justify-between items-center z-10">
          <span className="text-[10px] font-mono uppercase font-bold text-brand-primary tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-accent animate-pulse" />
            Retention Profile Analysis
          </span>
          {activeCell !== null && mode === "interactive" && (
            <span className="text-[10px] font-mono text-brand-accent font-bold px-2 py-0.5 bg-brand-accent/15 border border-brand-accent/25 rounded-md">
              Active Index: {dimensions[activeCell]?.score}%
            </span>
          )}
        </div>

        {/* Canvas-Like SVG Container */}
        <div className="relative w-full h-full flex flex-col items-center justify-center my-4">
          <svg 
            viewBox="0 0 800 100" 
            className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(0,240,255,0.25)]"
          >
            {/* Reference Grid lines */}
            <line x1="0" y1="90" x2="800" y2="90" stroke="rgba(0,240,255,0.15)" strokeWidth="1" />
            <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(0,240,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="10" x2="800" y2="10" stroke="rgba(0,240,255,0.15)" strokeWidth="1" />

            {/* SVG <defs> */}
            <defs>
              <linearGradient id={gradientGlowId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="50%" stopColor="#0080FF" />
                <stop offset="100%" stopColor="#FF003C" />
              </linearGradient>
              <linearGradient id={gradientAreaId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Shaded Area underneath the dynamic path */}
            <path
              d={`${currentPathD} L 800 90 L 0 90 Z`}
              fill={`url(#${gradientAreaId})`}
              className="transition-all duration-700 ease-in-out"
            />

            {/* Dynamic Retention Line */}
            <path
              ref={pathRef}
              d={currentPathD}
              fill="none"
              stroke={`url(#${gradientGlowId})`}
              strokeWidth="3"
              strokeLinecap="round"
              style={{ willChange: "stroke-dashoffset" }}
              className="transition-all duration-700 ease-in-out"
            />
          </svg>
        </div>
          <div className="z-10 flex flex-col gap-1 mt-4">
            <span className="text-[10px] text-gray-200 font-extrabold truncate">
              {activeCell !== null && mode === "interactive"
                ? dimensions[activeCell]?.name
                : mode === "scoring"
                  ? "Evaluating Hook skipped margins..."
                  : "Skip Resistance Diagnostics"}
            </span>
            <p className="text-[9px] text-muted-foreground leading-normal line-clamp-2">
              {activeCell !== null && mode === "interactive"
                ? dimensions[activeCell]?.desc
                : "The graph renders real-time scroll-stop velocity points. High indices represent elite skip resistance (retaining viewers beyond the initial 3 seconds)."}
            </p>
          </div>
        </div>
      </div>
  );
}
