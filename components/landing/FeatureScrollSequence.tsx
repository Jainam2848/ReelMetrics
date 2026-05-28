"use client";

import React, { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// ==========================================
// 1. DIMENSION MINI-VISUALIZATION SUB-COMPONENTS
// ==========================================

// Step 1: Hook Strength (Waveform)
function HookStrengthViz({ isActive }: { isActive: boolean }) {
  return (
    <svg className="w-full h-full max-w-[200px]" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <path 
        d="M 10 50 Q 20 20 30 50 T 50 50 T 70 50 T 90 50" 
        stroke="url(#wave-grad)" 
        strokeWidth="3.5" 
        strokeLinecap="round"
        strokeDasharray="140"
        strokeDashoffset={isActive ? 0 : 140}
        style={{
          transition: "stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)",
          animation: isActive ? "wave-pulse 1.8s ease-in-out infinite alternate" : "none"
        }}
      />
      <style>{`
        @keyframes wave-pulse {
          0% { transform: scaleY(0.9); }
          100% { transform: scaleY(1.25); }
        }
      `}</style>
    </svg>
  );
}

// Step 2: Visual Pacing (Timeline blocks)
function VisualPacingViz({ isActive }: { isActive: boolean }) {
  const blocks = [0.4, 0.8, 0.5, 0.9, 0.6];
  return (
    <div className="flex items-center justify-center gap-2.5 w-full h-24 max-w-[280px]">
      {blocks.map((scale, i) => (
        <div
          key={i}
          className="h-16 w-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 transition-all duration-700 ease-out origin-center"
          style={{
            transform: isActive ? `scaleX(${scale * 1.3})` : "scaleX(1)",
            backgroundColor: isActive ? "rgba(79, 70, 229, 0.35)" : "rgba(79, 70, 229, 0.15)",
            borderColor: isActive ? "rgba(79, 70, 229, 0.6)" : "rgba(79, 70, 229, 0.3)"
          }}
        />
      ))}
    </div>
  );
}

// Step 3: Skip Resistance (Bar gradient fill)
function SkipResistanceViz({ isActive }: { isActive: boolean }) {
  return (
    <div className="w-full max-w-[280px] flex flex-col gap-4">
      <div className="flex justify-between items-center text-[10px] font-mono font-bold tracking-wider">
        <span className="text-gray-500">RESISTANCE LEVEL</span>
        <span className={isActive ? "text-[#10B981] transition-colors duration-1000" : "text-rose-500"}>
          {isActive ? "94% (EXCELLENT)" : "42% (CRITICAL)"}
        </span>
      </div>
      <div className="w-full h-4 bg-white/5 border border-white/10 rounded-full p-0.5 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: isActive ? "94%" : "42%",
            background: isActive 
              ? "linear-gradient(to right, #EF4444, #F97316, #10B981)" 
              : "linear-gradient(to right, #EF4444, #F97316)",
          }}
        />
      </div>
    </div>
  );
}

// Step 4: Retention Curve (SVG graph draw-in)
function RetentionCurveViz({ isActive }: { isActive: boolean }) {
  return (
    <svg className="w-full h-full max-w-[260px] max-h-[140px]" viewBox="0 0 100 40" fill="none">
      <defs>
        <linearGradient id="ret-grad-seq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path 
        d="M0,5 Q10,12 25,6 T50,22 T75,4 T100,10 L100,40 L0,40 Z" 
        fill="url(#ret-grad-seq)"
      />
      <path 
        d="M0,5 Q10,12 25,6 T50,22 T75,4 T100,10" 
        fill="none" 
        stroke="#10B981" 
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="140"
        strokeDashoffset={isActive ? 0 : 140}
        style={{
          transition: "stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      {isActive && (
        <circle cx="25" cy="6" r="3.5" fill="#FF2E93" className="animate-pulse" />
      )}
    </svg>
  );
}

// Step 5: Caption Layout (Word highlighter)
function CaptionLayoutViz({ isActive }: { isActive: boolean }) {
  const words = ["Micro-pacing", "triggers", "scale", "viral", "retention", "metrics", "by", "2.3x."];
  return (
    <div className="flex flex-wrap gap-2.5 w-full max-w-[280px] justify-center text-center">
      {words.map((word, i) => (
        <span
          key={i}
          className="text-base font-satoshi font-black px-2 py-1 rounded transition-all duration-300"
          style={{
            color: isActive ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.15)",
            backgroundColor: isActive ? "rgba(79, 70, 229, 0.2)" : "transparent",
            borderColor: isActive ? "rgba(79, 70, 229, 0.4)" : "transparent",
            borderWidth: "1px",
            transform: isActive ? "scale(1.05)" : "scale(1)",
            transitionDelay: `${i * 100}ms`
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

// Step 6: Emotional Triggers (Spider chart scale)
function EmotionalTriggersViz({ isActive }: { isActive: boolean }) {
  return (
    <svg className="w-full h-full max-w-[200px]" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <circle cx="50" cy="50" r="25" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <circle cx="50" cy="50" r="10" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <polygon 
        points={isActive ? "50,22 82,50 50,75 25,50" : "50,50 50,50 50,50 50,50"}
        fill="rgba(79, 70, 229, 0.25)" 
        stroke="#4F46E5" 
        strokeWidth="2" 
        style={{
          transition: "all 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      <circle cx="50" cy="22" r="2.5" fill="#FF2E93" style={{ opacity: isActive ? 1 : 0, transition: "opacity 1s" }} />
      <circle cx="82" cy="50" r="2.5" fill="#FF2E93" style={{ opacity: isActive ? 1 : 0, transition: "opacity 1s" }} />
      <circle cx="50" cy="75" r="2.5" fill="#FF2E93" style={{ opacity: isActive ? 1 : 0, transition: "opacity 1s" }} />
      <circle cx="25" cy="50" r="2.5" fill="#FF2E93" style={{ opacity: isActive ? 1 : 0, transition: "opacity 1s" }} />
    </svg>
  );
}

// Step 7: Audio Hook (Frequency bars equalizer)
function AudioHookViz({ isActive }: { isActive: boolean }) {
  const barsCount = 8;
  return (
    <div className="flex items-end justify-center gap-2 w-full h-24 max-w-[200px]">
      {Array.from({ length: barsCount }).map((_, i) => {
        const height = [40, 70, 30, 90, 50, 80, 20, 60][i];
        return (
          <div
            key={i}
            className="w-2.5 rounded-full transition-all duration-700 ease-out origin-bottom"
            style={{
              height: isActive ? `${height}%` : "10%",
              backgroundColor: isActive ? "#10B981" : "rgba(16, 185, 129, 0.2)",
              animation: isActive ? `eq-bounce-seq 1s ease-in-out infinite alternate` : "none",
              animationDelay: `${i * 80}ms`
            }}
          />
        );
      })}
      <style>{`
        @keyframes eq-bounce-seq {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(0.35); }
        }
      `}</style>
    </div>
  );
}

// Step 8: Structural Flow (Vertical nodes connecting)
function StructuralFlowViz({ isActive }: { isActive: boolean }) {
  return (
    <svg className="w-full h-full max-w-[160px]" viewBox="0 0 80 120" fill="none">
      <path d="M 40 10 L 40 110" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" strokeDasharray="4 3" />
      <path 
        d="M 40 10 L 40 110" 
        stroke="#4F46E5" 
        strokeWidth="2" 
        strokeDasharray="100"
        strokeDashoffset={isActive ? 0 : 100}
        style={{
          transition: "stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      />
      <circle cx="40" cy="15" r="7" fill={isActive ? "#4F46E5" : "#1a1c23"} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" style={{ transition: "fill 0.5s" }} />
      <circle cx="40" cy="60" r="7" fill={isActive ? "#FF2E93" : "#1a1c23"} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" style={{ transition: "fill 0.5s 0.6s" }} />
      <circle cx="40" cy="105" r="7" fill={isActive ? "#10B981" : "#1a1c23"} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" style={{ transition: "fill 0.5s 1.2s" }} />
    </svg>
  );
}

// Step 9: Trend Alignment (Filling clock circle)
function TrendAlignmentViz({ isActive }: { isActive: boolean }) {
  const circ = 188.5;
  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="30" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" />
        <circle 
          cx="40" cy="40" r="30" 
          stroke="#10B981" 
          strokeWidth="6" 
          strokeDasharray={circ}
          strokeDashoffset={isActive ? circ * 0.08 : circ}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: "drop-shadow(0 0 6px rgba(16, 185, 129, 0.3))"
          }}
        />
      </svg>
      <span className="absolute text-2xl font-black font-mono text-white leading-none">
        {isActive ? "92%" : "0%"}
      </span>
    </div>
  );
}

// ==========================================
// 2. MAIN SEQUENCE CONTAINER COMPONENT
// ==========================================

export function FeatureScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activePanel, setActivePanel] = useState(0);
  
  // Set first panel to true immediately, lazy load others when scrolled
  const [hasBeenActive, setHasBeenActive] = useState<boolean[]>([
    true,
    ...Array(8).fill(false)
  ]);

  const panels = [
    {
      title: "Hook Strength",
      description: "We analyze the first three seconds of audio levels, frame transitions, and visual stimuli to guarantee your content grabs instant attention.",
      viz: <HookStrengthViz isActive={activePanel === 0} />
    },
    {
      title: "Visual Pacing",
      description: "Our pacing clocks dynamic cuts and transition delays, aligning beat structures to establish optimal video flow.",
      viz: <VisualPacingViz isActive={activePanel === 1} />
    },
    {
      title: "Skip Resistance",
      description: "Continuous frame tracking identifies the exact visual fatigue drop-offs, improving scroll-stop thresholds.",
      viz: <SkipResistanceViz isActive={activePanel === 2} />
    },
    {
      title: "Retention Curve",
      description: "We map real-time viewer retention graphs directly against specific script sentences, indicating what causes drop-offs.",
      viz: <RetentionCurveViz isActive={activePanel === 3} />
    },
    {
      title: "Caption Layout",
      description: "Optimizes screen copy placement and subtitle rhythm to guarantee readability without blocking key visuals.",
      viz: <CaptionLayoutViz isActive={activePanel === 4} />
    },
    {
      title: "Emotional Triggers",
      description: "Semantic analysis evaluates faces, typography cues, and sound scopes to map emotional retention arcs.",
      viz: <EmotionalTriggersViz isActive={activePanel === 5} />
    },
    {
      title: "Audio Hook",
      description: "Synthesizes viral frequency parameters and evaluates exact transition overlays to match audio hook markers.",
      viz: <AudioHookViz isActive={activePanel === 6} />
    },
    {
      title: "Structural Flow",
      description: "Checks node connectivity across script intros, mid-sections, and CTAs to establish a cohesive storytelling structure.",
      viz: <StructuralFlowViz isActive={activePanel === 7} />
    },
    {
      title: "Trend Alignment",
      description: "Compares visual elements and audio signals with top-trending content dynamically to maximize platform virality.",
      viz: <TrendAlignmentViz isActive={activePanel === 8} />
    }
  ];

  useEffect(() => {
    // 1. Evaluate mobile viewport threshold to disable heavy scroll triggers
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile || typeof window === "undefined" || !containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    // 2. Set up the fullscreen pinning ScrollTrigger sequence
    const triggerInstance = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "+=4000",
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        // Map 0-1 progress range across the 9 virtual pages
        const index = Math.min(Math.floor(progress * 9), 8);
        setActivePanel(index);

        // Lazy initialize the active panels to save rendering budget
        setHasBeenActive((prev) => {
          if (prev[index]) return prev;
          const next = [...prev];
          next[index] = true;
          return next;
        });
      },
      // Performant will-change injection to isolate GPU composites on screen pinning
      onEnter: () => {
        if (containerRef.current) {
          containerRef.current.style.willChange = "transform";
        }
      },
      onLeave: () => {
        if (containerRef.current) {
          containerRef.current.style.willChange = "";
        }
      },
      onEnterBack: () => {
        if (containerRef.current) {
          containerRef.current.style.willChange = "transform";
        }
      },
      onLeaveBack: () => {
        if (containerRef.current) {
          containerRef.current.style.willChange = "";
        }
      }
    });

    return () => {
      // 3. Clear ScrollTrigger pinning states and variables on unmount
      triggerInstance.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [isMobile]);

  // RENDER FALLBACK: Mobile responsive stacked list
  if (isMobile) {
    return (
      <div className="w-full bg-[#08090D] py-20 px-6 flex flex-col gap-20 select-none font-satoshi border-t border-white/[0.03]">
        {/* Mobile Header */}
        <div className="max-w-md mx-auto text-center flex flex-col items-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
            Diagnostic Core
          </div>
          <h2 className="text-3xl font-black text-white leading-tight tracking-tight mb-4">
            The 9 Dimensions of Viral Strategy
          </h2>
        </div>

        <div className="flex flex-col gap-12 max-w-lg mx-auto w-full">
          {panels.map((panel, idx) => (
            <m.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.1 }}
              className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 flex flex-col gap-6 shadow-md relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.04),transparent_70%)] pointer-events-none" />
              <div className="flex items-center justify-between z-10 relative">
                <span className="text-[10px] font-mono font-bold text-brand-secondary tracking-widest uppercase">
                  DIMENSION 0{idx + 1}
                </span>
                <span className="text-xl font-bold font-satoshi text-white leading-none">
                  {panel.title}
                </span>
              </div>
              <p className="text-sm text-gray-400 font-satoshi font-medium leading-relaxed z-10 relative">
                {panel.description}
              </p>
              <div className="w-full h-44 flex items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/5 relative z-10">
                {panel.viz}
              </div>
            </m.div>
          ))}
        </div>
      </div>
    );
  }

  // STANDARD DESKTOP VIEW: Fullscreen pinned scroll cross-fader
  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-[#08090D] select-none font-satoshi overflow-hidden border-t border-white/[0.03]"
      style={{ height: "400vh" }}
    >
      <div className="sticky top-0 left-0 w-full h-screen flex items-center overflow-hidden">
        {/* Left 40% Panel details */}
        <div className="w-[40%] h-full flex flex-col justify-center pl-16 pr-8 z-10 relative bg-[#08090D]">
          {panels.map((panel, idx) => (
            <div 
              key={idx}
              className={`absolute left-16 right-8 transition-all duration-500 ease-out flex flex-col items-start ${
                activePanel === idx ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-8 pointer-events-none"
              }`}
            >
              <span className="text-[10px] font-mono font-bold text-brand-secondary tracking-widest uppercase mb-3 bg-brand-secondary/10 border border-brand-secondary/20 px-2.5 py-0.5 rounded-full">
                Dimension 0{idx + 1}
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4 font-satoshi">
                {panel.title}
              </h2>
              <p className="text-base text-gray-400 font-medium leading-relaxed max-w-[32ch]">
                {panel.description}
              </p>
            </div>
          ))}
        </div>

        {/* Right 60% Visualization elements */}
        <div className="w-[60%] h-full relative bg-[#090A0E] border-l border-white/[0.03] flex items-center justify-center overflow-hidden">
          {panels.map((panel, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                activePanel === idx ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div className="w-full max-w-[450px] aspect-square flex items-center justify-center p-6 bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
                {/* Soft glow wash overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.06),transparent_70%)] pointer-events-none" />
                
                {/* Lazy-initialize: only mount visualizer when the index becomes active */}
                {hasBeenActive[idx] && panel.viz}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
