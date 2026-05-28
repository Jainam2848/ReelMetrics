"use client";

import React, { useEffect, useRef } from "react";

export function ViralBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use refs to keep track of mouse state without causing React re-renders
  const targetX = useRef<number>(0);
  const targetY = useRef<number>(0);
  const currentX = useRef<number>(0);
  const currentY = useRef<number>(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // 1. Detect pointer: coarse (mobile / touchscreen devices) and skip JS loops
    const isMobileQuery = window.matchMedia("(pointer: coarse)");
    if (isMobileQuery.matches) {
      return;
    }

    // Set initial center coordinates to avoid sudden jumps
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    targetX.current = centerX;
    targetY.current = centerY;
    currentX.current = centerX;
    currentY.current = centerY;

    const handleMouseMove = (e: MouseEvent) => {
      targetX.current = e.clientX;
      targetY.current = e.clientY;
    };

    const updateCSSVariables = () => {
      // Smooth lerp (linear interpolation) for organic float feel
      currentX.current += (targetX.current - currentX.current) * 0.08;
      currentY.current += (targetY.current - currentY.current) * 0.08;

      if (containerRef.current) {
        containerRef.current.style.setProperty("--mouse-x", `${currentX.current}px`);
        containerRef.current.style.setProperty("--mouse-y", `${currentY.current}px`);
      }

      rafId.current = requestAnimationFrame(updateCSSVariables);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafId.current = requestAnimationFrame(updateCSSVariables);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 bg-[#08090D] overflow-hidden pointer-events-none select-none"
      style={{
        "--mouse-x": "50vw",
        "--mouse-y": "50vh",
      } as React.CSSProperties}
    >
      {/* 1. Ambient Hot Pink and Emerald glows matching dark theme (#08090D) */}
      <div className="absolute top-[-10%] left-[15%] w-[45vw] h-[45vw] max-w-[600px] rounded-full bg-[#FF2E93]/4 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[15%] w-[45vw] h-[45vw] max-w-[500px] rounded-full bg-[#10B981]/4 blur-[135px] pointer-events-none" />

      {/* 2. CSS Variable Grid cell structure */}
      <div className="absolute inset-0 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 xl:grid-cols-20 gap-[1px] bg-white/[0.015] p-[1px] opacity-40">
        {Array.from({ length: 160 }).map((_, i) => (
          <div key={i} className="bg-[#08090D]" />
        ))}
      </div>

      {/* 3. Radial-gradient spotlight reacting to mouse coordinates (hidden on coarse touch via media query fallback) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 opacity-0 md:opacity-100"
        style={{
          background: "radial-gradient(circle 450px at var(--mouse-x) var(--mouse-y), rgba(79, 70, 229, 0.12) 0%, rgba(20, 184, 166, 0.02) 50%, transparent 100%)",
        }}
      />

      {/* 4. Soft ambient center light reflection for overall warmth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(79,70,229,0.04),transparent_55%)]" />
    </div>
  );
}
