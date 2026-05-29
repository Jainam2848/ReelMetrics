"use client";

import React, { useRef, useState, useEffect } from "react";
import { m, useMotionValue, useSpring, useTransform } from "framer-motion";

export function RetentionCurve() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragLineRef = useRef<HTMLDivElement>(null);
  
  const [containerWidth, setContainerWidth] = useState(300);
  const [scrubPercent, setScrubPercent] = useState(25); // default at 25% (3s Hook)
  const [retentionVal, setRetentionVal] = useState(87);

  // Motion value for cursor dragging
  const cursorX = useMotionValue(75); // initial X at 25% of 300px
  const smoothCursorX = useSpring(cursorX, { stiffness: 300, damping: 30 });

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      cursorX.set(containerRef.current.offsetWidth * 0.25);
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [cursorX]);

  // Track drag position and update stats
  useEffect(() => {
    return cursorX.on("change", (latest) => {
      const pct = Math.max(0, Math.min(100, (latest / containerWidth) * 100));
      setScrubPercent(Math.round(pct));

      // Mathematically estimate retention value along a curve: Q 20 5, 40 15 T 100 20 (success curve)
      // We map the X progression to a realistic retention profile
      let ret = 98;
      if (pct < 20) {
        // First 3 seconds hook drop
        ret = 98 - (pct / 20) * 11; // 98% to 87%
      } else if (pct < 50) {
        // Midpoint linear drop
        ret = 87 - ((pct - 20) / 30) * 25; // 87% to 62%
      } else {
        // Outro stabilization
        ret = 62 - ((pct - 50) / 50) * 24; // 62% to 38%
      }
      setRetentionVal(Math.round(ret));
    });
  }, [cursorX, containerWidth]);

  // Viewport trigger for stroke drawing
  const cardRef = useRef<HTMLDivElement>(null);
  const isCardInView = React.useRef(false);
  const [drawCurve, setDrawCurve] = useState(false);

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setDrawCurve(true);
          isCardInView.current = true;
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef} className="w-full flex flex-col gap-4">
      {/* HUD Info Header */}
      <div className="flex justify-between items-center text-xs font-mono select-none">
        <span className="text-white/40 font-bold uppercase tracking-widest">Interactive scrub diagnostics</span>
        <div className="flex items-center gap-4 bg-black/35 px-3 py-1.5 border border-white/5 rounded-lg">
          <span className="text-white/60">Timeline: <strong className="text-white font-extrabold">{Math.floor((scrubPercent * 12) / 100)}s</strong></span>
          <span className="h-3 w-[1px] bg-white/10" />
          <span className="text-white/60">Retention: <strong className="text-brand-secondary font-extrabold">{retentionVal}%</strong></span>
        </div>
      </div>

      {/* SVG Graph Container */}
      <div ref={containerRef} className="h-44 bg-black/25 rounded-2xl border border-white/5 p-6 relative overflow-hidden flex items-end">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="25" y1="0" x2="25" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="50" y1="0" x2="50" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="75" y1="0" x2="75" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />

          {/* Under-curve gradient fill */}
          <defs>
            <linearGradient id="bento-curve-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <m.path
            d="M 0 5 Q 20 5, 40 15 T 100 20 L 100 40 L 0 40 Z"
            fill="url(#bento-curve-fill)"
            initial={{ opacity: 0 }}
            animate={drawCurve ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          {/* Base retention line (Flop) */}
          <path 
            d="M 0 5 Q 10 35, 100 38" 
            fill="none" 
            stroke="rgba(253, 121, 168, 0.15)" 
            strokeWidth="1"
          />

          {/* Core dynamic retention path */}
          <m.path
            d="M 0 5 Q 20 5, 40 15 T 100 20"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={drawCurve ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>

        {/* Draggable scrub line */}
        <m.div
          ref={dragLineRef}
          drag="x"
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{ left: 0, right: containerWidth - 2 }}
          style={{ x: cursorX }}
          className="absolute top-0 bottom-0 w-0.5 bg-brand-primary z-20 cursor-col-resize origin-center flex items-center justify-center group"
        >
          {/* Drag Handle Indicator Pill */}
          <div className="absolute w-4 h-8 rounded-full bg-brand-primary border border-white/20 shadow-glow flex flex-col justify-around py-1.5 px-0.5 items-center select-none group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
            <span className="w-[1.5px] h-3 bg-white/60 rounded" />
            <span className="w-[1.5px] h-3 bg-white/60 rounded" />
          </div>
          
          {/* Overlay active highlight beacon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#4F46E5]/10 rounded-full animate-ping pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </m.div>

        {/* Dynamic benchmark dots */}
        <div className="absolute left-[25%] bottom-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#10B981] select-none pointer-events-none" />
        <div className="absolute left-[50%] bottom-[35%] translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#10B981] select-none pointer-events-none" />
      </div>
    </div>
  );
}
