"use client";

import React, { useEffect, useRef } from "react";
import { performanceMotion as m } from "@/components/shared/performance-motion";
import { useReducedMotion } from "framer-motion";

export function AmbientIntelligenceBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // If user prefers reduced motion or is on mobile (coarse pointer), skip mouse tracking
    const isMobileQuery = window.matchMedia("(pointer: coarse)");
    if (isMobileQuery.matches || prefersReducedMotion) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Use requestAnimationFrame for performance
      requestAnimationFrame(() => {
        // Calculate percentages for the background position
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        
        containerRef.current?.style.setProperty('--mouse-x', `${x}%`);
        containerRef.current?.style.setProperty('--mouse-y', `${y}%`);
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[-1] bg-[#08090D] overflow-hidden pointer-events-none select-none"
      style={{
        "--mouse-x": "50%",
        "--mouse-y": "50%",
      } as React.CSSProperties}
    >
      {/* Base Noise Texture for premium minimal depth */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />
      
      {/* Unified Ambient Glow - Extremely low opacity (0.08), no particle physics */}
      <div 
        className="absolute inset-0 opacity-[0.08] transition-opacity duration-1000"
        style={{
          background: "radial-gradient(circle 800px at var(--mouse-x) var(--mouse-y), rgba(79, 70, 229, 0.4) 0%, rgba(20, 184, 166, 0.1) 40%, transparent 80%)",
        }}
      />
      
      {/* Brand Signature - Very slow breathing aura in the corner */}
      <m.div 
        className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] max-w-[800px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(79, 70, 229, 0.05)" }}
        animate={{ 
          scale: prefersReducedMotion ? 1 : [1, 1.05, 1],
          opacity: prefersReducedMotion ? 1 : [0.6, 0.8, 0.6]
        }}
        transition={{ 
          duration: 15, 
          ease: "easeInOut", 
          repeat: Infinity 
        }}
      />
      
      <m.div 
        className="absolute bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] max-w-[600px] rounded-full blur-[130px] pointer-events-none"
        style={{ background: "rgba(20, 184, 166, 0.04)" }}
        animate={{ 
          scale: prefersReducedMotion ? 1 : [1, 1.1, 1],
          opacity: prefersReducedMotion ? 1 : [0.5, 0.7, 0.5]
        }}
        transition={{ 
          duration: 20, 
          ease: "easeInOut", 
          repeat: Infinity,
          delay: 2
        }}
      />
    </div>
  );
}
