"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { m, Variants, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { WordRotator } from "./word-rotator";
import { CTAButton } from "./CTAButton";

// Dynamic import with SSR disabled for cursor spotlight grid
const ViralBackground = dynamic(
  () => import("./viral-background").then(mod => mod.ViralBackground),
  { ssr: false }
);

// Framer Motion Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 }
  }
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 14, stiffness: 100 }
  }
};

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    return Math.round(latest).toLocaleString();
  });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    // Exponential ease out spring-like counting
    const controls = animate(count, 14200, {
      duration: 3.0,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [count]);

  const handleRipple = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    // Dispatch global event for the background ripple
    window.dispatchEvent(new CustomEvent("viral-ripple", { 
      detail: { x: e.clientX, y: e.clientY } 
    }));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap');
        
        .font-satoshi {
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        @keyframes shimmer-sweep {
          0% { transform: translate3d(-120%, 0, 0) skewX(-15deg); }
          100% { transform: translate3d(220%, 0, 0) skewX(-15deg); }
        }
        
        .shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.35) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: translate3d(-120%, 0, 0) skewX(-15deg);
          transition: none;
          pointer-events: none;
        }
        
        @media (prefers-reduced-motion: no-preference) {
          .shimmer-btn:hover::after {
            animation: shimmer-sweep 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          }
        }
      `}} />

      <ViralBackground />

      {/* Navigation - Distraction Free (No escape hatches above the fold) */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-display font-black text-white text-sm shadow-glow">
            T
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            Trendoraa
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-[95dvh] flex-col justify-center px-6 pt-28 pb-16 z-10">
        {/* Asymmetric wide layout grid */}
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center z-10">
          
          {/* Left Column: Headline and CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-accent select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
              Strategy Engine Active
            </div>
            
            <m.h1 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ fontSize: "clamp(3.2rem, 5.2vw, 5.5rem)" }}
              className="mb-6 font-satoshi font-black tracking-tight text-white leading-[1.05] flex flex-wrap gap-x-3 gap-y-2 select-none text-left"
            >
              <m.span variants={wordVariants}>Turn</m.span>
              <m.span variants={wordVariants}>short-form</m.span>
              <m.span variants={wordVariants}>video</m.span>
              <m.span variants={wordVariants}>into</m.span>
              <m.span variants={wordVariants}>your</m.span>
              <m.span variants={wordVariants} className="inline-block relative min-h-[1.25em] text-left">
                <WordRotator />
              </m.span>
            </m.h1>
            
            <m.p 
              initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="mb-8 max-w-xl text-lg md:text-xl text-gray-400 font-medium leading-relaxed"
            >
              Trendoraa evaluates retention triggers and pacing patterns, revealing exactly why your Reels capture the feed — or die in the first 3 seconds.
            </m.p>
            
            {/* Primary CTA and Secondary Link */}
            <m.div
              initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 w-full sm:w-auto z-10"
            >
              <CTAButton 
                label="Analyze My First Reel Free →" 
                href="/login" 
                onClick={handleRipple} 
                variant="primary" 
              />
              
              <CTAButton 
                label="See how it works" 
                href="#how-it-works" 
                variant="ghost" 
              />
            </m.div>

            {/* Inline Social Proof Bar - Upgraded text colors to text-gray-400 for WCAG AA compliance */}
            <m.div
              initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 1.3, duration: 0.6 }}
              className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-gray-400 border-t border-white/5 pt-6 w-full max-w-xl select-none"
            >
              <span className="text-gray-300 flex items-center gap-1 shrink-0 font-mono">
                {mounted ? <m.span className="text-white font-extrabold">{rounded}</m.span> : <span className="text-white font-extrabold">14,200</span>} Reels analyzed
              </span>
              <span className="text-gray-600 shrink-0">•</span>
              <span className="text-gray-300 shrink-0 font-mono">
                Avg <span className="text-brand-secondary font-extrabold">2.3×</span> retention
              </span>
              <span className="text-gray-600 shrink-0">•</span>
              <div className="flex items-center gap-2 text-gray-300 shrink-0">
                <span>Used by</span>
                <div className="flex items-center gap-1 ml-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[8px] font-bold text-gray-400 tracking-wider">CREATOR.AI</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[8px] font-bold text-gray-400 tracking-wider">VLOGR</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[8px] font-bold text-gray-400 tracking-wider">REELFY</span>
                </div>
              </div>
            </m.div>
          </div>

          {/* Right Column: Dynamic Live Reel Scoring Widget */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full relative z-20">
            <m.div
              initial={{ opacity: 0, y: 30, rotateY: 10, rotateX: 10 }}
              animate={shouldReduceMotion ? {
                opacity: 1,
                y: 0,
                rotateY: 0,
                rotateX: 0,
              } : {
                opacity: 1,
                y: [0, -12, 0],
                rotateY: [10, 8, 10],
                rotateX: [10, 12, 10],
              }}
              transition={shouldReduceMotion ? { duration: 0.5 } : {
                y: {
                  duration: 5,
                  ease: "easeInOut",
                  repeat: Infinity,
                },
                rotateY: {
                  duration: 6,
                  ease: "easeInOut",
                  repeat: Infinity,
                },
                rotateX: {
                  duration: 6,
                  ease: "easeInOut",
                  repeat: Infinity,
                },
                opacity: { duration: 0.8 }
              }}
              style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
              className="relative w-full max-w-[340px] aspect-[9/14.5] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 flex flex-col justify-between"
            >
              {/* Simulated Reel Preview Container */}
              <div className="relative w-full h-[62%] rounded-[1.8rem] bg-gradient-to-br from-indigo-500/10 via-neutral-950 to-pink-500/10 overflow-hidden border border-white/5 flex flex-col justify-end p-3.5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.12),transparent_70%)]" />
                
                {/* Glassy overlay element */}
                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[9px] font-bold text-gray-300 font-mono tracking-wider">AI EVALUATING</span>
                </div>

                {/* Creator details overlay */}
                <div className="relative z-10 flex justify-between items-end w-full">
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-500 flex items-center justify-center font-mono text-[9px] font-black text-white">T</div>
                      <span className="text-xs font-bold text-white tracking-tight">@trendoraa</span>
                    </div>
                    <p className="text-[10px] text-gray-200 leading-snug line-clamp-2">How we scale short-form hook retention with micro-pacing adjustments... 📈🔥</p>
                  </div>
                  
                  {/* Vertical action shortcuts */}
                  <div className="flex flex-col items-center gap-3.5 text-white/95 shrink-0">
                    <div className="flex flex-col items-center gap-0.5">
                      <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      <span className="text-[9px] font-bold font-mono">14.2K</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      <span className="text-[9px] font-bold font-mono">2.8K</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated AI Diagnostics block */}
              <div className="flex-1 flex flex-col justify-between pt-4">
                {/* Score readout */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Scroll-Stop Score</span>
                    <span className="text-2xl font-black font-mono text-white flex items-baseline gap-0.5 leading-none mt-1">
                      9.4<span className="text-xs text-brand-secondary font-bold font-sans">/10</span>
                    </span>
                  </div>
                  
                  {/* Performance percentage increase badge */}
                  <div className="flex items-center gap-1 bg-[#10B981]/15 px-2.5 py-1 rounded-full border border-[#10B981]/25 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <svg className="w-3 h-3 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"/></svg>
                    <span className="text-[10px] font-black text-[#10B981] font-mono leading-none">+2.3×</span>
                  </div>
                </div>

                {/* Retention Sparkline Graph */}
                <div className="my-2.5 p-2 rounded-2xl bg-black/45 border border-white/5 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black tracking-tight">
                    <span className="text-gray-400">RETENTION BENCHMARK</span>
                    <span className="text-[#10B981] font-sans">EXCELLENT</span>
                  </div>
                  
                  {/* Sparkline SVG */}
                  <div className="h-10 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="widget-sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path 
                        d="M0,5 Q10,12 25,6 T50,22 T75,4 T100,10 L100,40 L0,40 Z" 
                        fill="url(#widget-sparkline-grad)"
                      />
                      <path 
                        d="M0,5 Q10,12 25,6 T50,22 T75,4 T100,10" 
                        fill="none" 
                        stroke="#10B981" 
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="25" cy="6" r="3.5" fill="#FF2E93" className="animate-pulse" />
                      <circle cx="25" cy="6" r="2" fill="#FF2E93" />
                    </svg>
                    
                    <span className="absolute left-[25%] top-[-3px] text-[8px] bg-[#FF2E93] text-white px-1 rounded-sm font-bold scale-[0.8] tracking-tight shadow-md">
                      3s Hook
                    </span>
                  </div>
                </div>

                {/* Dynamic Metrics list */}
                <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-1.5 text-center">
                    <span className="text-gray-500 block leading-tight">Pacing</span>
                    <span className="text-white block font-mono font-black mt-0.5">94%</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-1.5 text-center">
                    <span className="text-gray-500 block leading-tight">Contrast</span>
                    <span className="text-white block font-mono font-black mt-0.5">89%</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-1.5 text-center">
                    <span className="text-gray-500 block leading-tight">Audio</span>
                    <span className="text-white block font-mono font-black mt-0.5">Trend</span>
                  </div>
                </div>
              </div>
            </m.div>
          </div>
          
        </div>
      </section>
    </>
  );
}
