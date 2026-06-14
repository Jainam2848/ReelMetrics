"use client";

import React, { useEffect, useRef, useState } from "react";
import { m, useInView, useReducedMotion, useMotionValue, useMotionTemplate } from "framer-motion";
import { Play, TrendingUp, AlertTriangle, Eye, RefreshCw } from "lucide-react";

export function BeforeAfterSplit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  
  const [sequenceStarted, setSequenceStarted] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Mouse coordinate values for spotlight hover spell
  const mouseLeftX = useMotionValue(0);
  const mouseLeftY = useMotionValue(0);
  const mouseRightX = useMotionValue(0);
  const mouseRightY = useMotionValue(0);

  function handleMouseLeftMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseLeftX.set(e.clientX - rect.left);
    mouseLeftY.set(e.clientY - rect.top);
  }

  function handleMouseRightMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRightX.set(e.clientX - rect.left);
    mouseRightY.set(e.clientY - rect.top);
  }

  // Counter states
  const [viewsCount, setViewsCount] = useState(0);
  const [engagementCount, setEngagementCount] = useState(68);

  useEffect(() => {
    const isMobileQuery = window.matchMedia("(pointer: coarse)");
    setIsMobileDevice(isMobileQuery.matches);
  }, []);

  const startSimulation = () => {
    if (simulating || sequenceStarted) return;
    setSimulating(true);
    
    // Simulate thinking delay
    setTimeout(() => {
      setSequenceStarted(true);
      setSimulating(false);
      
      // Animate numbers using a simple requestAnimationFrame loop
      const startTime = performance.now();
      const duration = 2000;

      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        // easeOutExpo
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        setViewsCount(Number((easeProgress * 84.5).toFixed(1)));
        setEngagementCount(Math.round(68 + easeProgress * (87 - 68)));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, 600);
  };

  // Trigger on scroll if not clicked
  useEffect(() => {
    if (inView && !sequenceStarted && !simulating) {
      const t = setTimeout(() => {
        startSimulation();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [inView, sequenceStarted, simulating]);

  return (
    <section id="transformation" className="py-24 relative w-full overflow-hidden" ref={containerRef}>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-4 font-cabinet">
            Stop Guessing. <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">Engineer Retention.</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto font-outfit">
            Our analytical engine evaluates your hooks, visual pacing, and CTA strength to predict and improve distribution before you hit publish.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-stretch">
          {/* LEFT: Old Way */}
          <div 
            onMouseMove={handleMouseLeftMove}
            className="flex flex-col h-full border border-red-500/20 bg-[#1A1515]/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 relative overflow-hidden group"
          >
            {/* Localized Spotlight Hover Reaction */}
            <m.div
              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
              style={{
                background: useMotionTemplate`radial-gradient(350px circle at ${mouseLeftX}px ${mouseLeftY}px, rgba(239, 68, 68, 0.05), transparent 80%)`,
              }}
            />

            <div className="absolute top-0 right-0 bg-red-500/10 text-red-400 text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider z-10 font-mono">
              The Old Way
            </div>
            
            <h3 className="text-xl font-display font-bold text-white mb-2 mt-4 z-10 font-cabinet">Post & Pray</h3>
            <p className="text-red-400/80 text-xs mb-8 flex items-center gap-2 z-10 font-outfit">
              <AlertTriangle className="w-4 h-4" /> 
              Blind distribution. High scroll-away rates trigger immediate reach limits.
            </p>

            {/* Messy Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 flex-1 content-center relative">
              {[1, 2, 3, 4].map((i) => (
                <m.div 
                  key={i} 
                  animate={shouldReduceMotion ? {} : {
                    x: [0, -1, 1, -1, 0],
                    y: [0, 1, -1, 1, 0]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: i * 0.1
                  }}
                  className="aspect-[9/16] bg-[#2A1F1F] border border-red-500/10 rounded-xl relative overflow-hidden flex items-center justify-center opacity-70"
                >
                  <video 
                    src={`/videos/sample${i === 4 ? 2 : i}.mp4`}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity"
                    autoPlay muted loop playsInline
                  />
                  {i === 1 && (
                    <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md rounded border border-red-500/30 p-2 z-10">
                      <div className="text-red-400 text-xs font-mono font-bold">SKIP: 68%</div>
                    </div>
                  )}
                </m.div>
              ))}
            </div>

            <div className="text-center">
              <span className="font-display italic text-white/40 text-lg">&quot;Why did this flop??&quot;</span>
            </div>
          </div>

          {/* RIGHT: Trendoraa Way */}
          <m.div
            onMouseMove={handleMouseRightMove}
            style={{ 
              transformStyle: "preserve-3d", 
              perspective: "1000px",
              rotateX: (shouldReduceMotion || isMobileDevice) ? 0 : 2
            }}
            whileHover={(shouldReduceMotion || isMobileDevice) ? {} : { rotateX: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="flex flex-col h-full border border-white/10 bg-white/[0.03] backdrop-blur-[8px] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-glow before-after-glass group"
          >
            {/* Localized Spotlight Hover Reaction */}
            <m.div
              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
              style={{
                background: useMotionTemplate`radial-gradient(350px circle at ${mouseRightX}px ${mouseRightY}px, rgba(99, 102, 241, 0.08), transparent 80%)`,
              }}
            />

            {/* Stacked backdrop-filter layer for premium glass depth */}
            <div className="absolute inset-0 bg-black/[0.15] backdrop-blur-[20px] pointer-events-none z-0 before-after-glass-inner" />

            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes analysis-ring-pulse {
                0% {
                  transform: scale(0.95);
                  opacity: 0.5;
                }
                50% {
                  opacity: 0.25;
                }
                100% {
                  transform: scale(1.25);
                  opacity: 0;
                }
              }
              
              @supports not (backdrop-filter: blur(8px)) {
                .before-after-glass {
                  background-color: #0F1015 !important;
                }
                .before-after-glass-inner {
                  display: none !important;
                }
              }
              
              @media (prefers-reduced-motion: no-preference) {
                .analysis-pulse-btn {
                  position: relative;
                }
                .analysis-pulse-btn::after {
                  content: '';
                  position: absolute;
                  inset: 0;
                  border-radius: inherit;
                  border: 2px solid #4F46E5;
                  animation: analysis-ring-pulse 3.5s cubic-bezier(0.16, 1, 0.3, 1) infinite;
                  pointer-events: none;
                  z-index: 1;
                }
              }
            `}} />

            <div className="absolute top-0 right-0 bg-brand-primary/20 text-brand-primary text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider z-10 font-mono">
              Trendoraa Way
            </div>

            <div className="flex justify-between items-start mt-4 mb-8 z-10 relative">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-2 font-cabinet">Deep Post Analysis</h3>
                <p className="text-brand-secondary text-xs flex items-center gap-2 font-outfit">
                  <TrendingUp className="w-4 h-4" />
                  Audit your visual and audio structure frame-by-frame.
                </p>
              </div>
              <button 
                onClick={startSimulation}
                disabled={sequenceStarted || simulating}
                className={`px-4 py-2 text-sm font-bold rounded-lg border ${
                  !sequenceStarted && !simulating ? "analysis-pulse-btn" : ""
                } ${
                  sequenceStarted 
                    ? "border-brand-primary/50 text-brand-primary bg-brand-primary/10" 
                    : "border-white/10 text-white bg-white/5 hover:bg-white/10"
                } transition-colors flex items-center gap-2 relative z-25 cursor-pointer`}
              >
                {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {sequenceStarted ? 'Analysis Complete' : 'Run Analysis'}
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center relative z-10">
              <div className="relative aspect-[9/16] w-full max-w-[220px] mx-auto bg-[#1A1B23] rounded-xl border border-white/10 overflow-hidden mb-6 flex items-center justify-center">
                <video 
                  src="/videos/sample1.mp4"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${sequenceStarted ? 'opacity-100' : 'opacity-40 grayscale'}`}
                  autoPlay muted loop playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/40 to-transparent z-10" />
                
                {/* Frame lines overlay */}
                <div className="absolute inset-0 z-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                
                {sequenceStarted ? (
                  <div className="z-30 text-center">
                    <div className="text-brand-primary font-bold text-xs uppercase tracking-widest mb-1">Status</div>
                    <div className="text-white font-display text-xl">Analyzed</div>
                  </div>
                ) : (
                  <div className="z-30 text-center opacity-50">
                    <div className="text-white font-display text-sm">Awaiting Analysis</div>
                  </div>
                )}
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Eye className="w-3 h-3"/> Total Views</div>
                  <div className="text-xl font-mono font-bold text-white">
                    <span>{sequenceStarted ? `${viewsCount}K` : "0"}</span>
                  </div>
                </div>
                <m.div 
                  animate={sequenceStarted ? {
                    backgroundColor: "rgba(0, 184, 148, 0.15)",
                    borderColor: "rgba(0, 184, 148, 0.4)"
                  } : {
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    borderColor: "rgba(255, 255, 255, 0.05)"
                  }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="bg-black/30 border border-white/5 rounded-lg p-3 transition-colors"
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {sequenceStarted ? "Hook Retention" : "Skip Rate"}
                  </div>
                  <div className="text-xl font-mono font-bold text-white">
                    <span>{sequenceStarted ? `${engagementCount}%` : "68%"}</span>
                  </div>
                </m.div>
              </div>

              {/* SVG Retention Curve */}
              <div className="h-24 bg-black/20 rounded-lg border border-white/5 p-4 relative overflow-hidden">
                <div className="text-[10px] font-mono text-white/40 absolute top-2 left-3">RETENTION_CURVE</div>
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                  {/* Background Grid */}
                  <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
                  
                  {/* Flop Curve (Faint) */}
                  <path 
                    d="M 0 5 Q 10 35, 100 38" 
                    fill="none" 
                    stroke="rgba(253, 121, 168, 0.3)" 
                    strokeWidth="1.5"
                  />
                  
                  {/* Success Curve (Animated) */}
                  <m.path 
                    initial={{ pathLength: 0 }}
                    animate={sequenceStarted ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                    d="M 0 5 Q 20 5, 40 15 T 100 20" 
                    fill="none" 
                    stroke="rgba(0, 184, 148, 1)" 
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                
                {sequenceStarted && (
                  <m.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="absolute bottom-2 right-3 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary shadow-[0_0_10px_#00B894]"></span>
                    <span className="text-[10px] font-bold text-brand-secondary tracking-wider">RETENTION: STRONG</span>
                  </m.div>
                )}
              </div>

              {/* Insightful Detailed Diagnostic Panel */}
              {sequenceStarted && (
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.2, duration: 0.6, ease: "easeOut" }}
                  className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-3 text-left font-outfit z-10 relative animate-fade-in"
                >
                  <div className="text-[10px] font-bold tracking-widest text-brand-secondary uppercase font-mono">
                    Diagnostic Analysis Engine
                  </div>
                  
                  <div className="space-y-3 text-[11px] leading-relaxed text-white/70">
                    <div className="flex gap-2.5 items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-white">Visual Pacing Index:</strong> Scans the video file frame-by-frame to identify edit cut markers and transition pacing. Compares visual velocity to target niches (e.g. tech, finance) to suggest transition density.
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-secondary mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-white">Audio Hook Sync:</strong> Cross-references background audio momentum and voiceover clarity against the opening 3 seconds of the clip to optimize retention velocity.
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6] mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-white">CTA Conversion Scoring:</strong> Parses caption and verbal instructions to evaluate call-to-action effectiveness, projecting saves and shares rates instead of vanity likes.
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
