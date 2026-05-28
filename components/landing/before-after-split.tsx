"use client";

import React, { useEffect, useRef, useState } from "react";
import { m, useInView, useReducedMotion } from "framer-motion";
import anime from "animejs";
import { Play, TrendingUp, AlertTriangle, Eye, RefreshCw } from "lucide-react";

export function BeforeAfterSplit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  
  const [sequenceStarted, setSequenceStarted] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const isMobileQuery = window.matchMedia("(pointer: coarse)");
    setIsMobileDevice(isMobileQuery.matches);
  }, []);

  // Refs for AnimeJS targets
  const shakyGridRef = useRef<HTMLDivElement>(null);
  const viewsCountRef = useRef<HTMLSpanElement>(null);
  const engagementCountRef = useRef<HTMLSpanElement>(null);
  const hookRetentionRef = useRef<HTMLDivElement>(null);
  const skipRateTextRef = useRef<HTMLSpanElement>(null);
  const retentionCurveRef = useRef<SVGPathElement>(null);

  const shakeAnimationRef = useRef<any>(null);

  // Left Side Shake Animation (IntersectionObserver Paced)
  useEffect(() => {
    if (!shakyGridRef.current) return;

    shakeAnimationRef.current = anime({
      targets: shakyGridRef.current.children,
      translateX: () => anime.random(-2, 2),
      translateY: () => anime.random(-2, 2),
      rotate: () => anime.random(-1, 1),
      duration: 200,
      direction: "alternate",
      loop: true,
      easing: "easeInOutSine",
      autoplay: false,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          shakeAnimationRef.current?.play();
        } else if (shakeAnimationRef.current) {
          shakeAnimationRef.current.pause();
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (shakeAnimationRef.current) {
        shakeAnimationRef.current.pause();
      }
    };
  }, []);

  const startSimulation = () => {
    if (simulating || sequenceStarted) return;
    setSimulating(true);
    
    // Simulate thinking delay
    setTimeout(() => {
      setSequenceStarted(true);
      setSimulating(false);
      
      // Right Side Animations
      
      // 1. Metric Counter
      anime({
        targets: [viewsCountRef.current, engagementCountRef.current],
        innerHTML: [
          function(el: any) { return el.dataset.start; },
          function(el: any) { return el.dataset.end; }
        ],
        round: 1,
        easing: "easeOutExpo",
        duration: 2000,
        update: function(a) {
          if (viewsCountRef.current) viewsCountRef.current.innerHTML = (a.animations[0]?.currentValue || 0) + "K";
          if (engagementCountRef.current) engagementCountRef.current.innerHTML = (a.animations[1]?.currentValue || 0) + "%";
        }
      });

      // 2. Retention Curve Draw
      anime({
        targets: retentionCurveRef.current,
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: "easeInOutSine",
        duration: 1500,
        delay: 500
      });

      // 3. Skip Rate Inversion glow
      anime({
        targets: hookRetentionRef.current,
        backgroundColor: ["rgba(253, 121, 168, 0.1)", "rgba(0, 184, 148, 0.15)"],
        borderColor: ["rgba(253, 121, 168, 0.3)", "rgba(0, 184, 148, 0.4)"],
        duration: 1000,
        delay: 300,
        easing: "easeOutQuad"
      });
      
    }, 600);
  };

  // Trigger on scroll if not clicked
  useEffect(() => {
    if (inView && !sequenceStarted && !simulating) {
      // Auto start after a short delay when scrolled into view
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
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-4">
            Stop Guessing. <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">Start Engineering.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See exactly where you lose your audience and how to fix it before you even post.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-stretch">
          {/* LEFT: Old Way */}
          <div className="flex flex-col h-full border border-red-500/20 bg-[#1A1515]/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-500/10 text-red-400 text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
              The Old Way
            </div>
            
            <h3 className="text-xl font-display font-bold text-white mb-2 mt-4">Post & Pray</h3>
            <p className="text-red-400/80 text-sm mb-8 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> 
              High skip rate detected. Algorithm penalty active.
            </p>

            {/* Messy Grid */}
            <div ref={shakyGridRef} className="grid grid-cols-2 gap-4 mb-8 flex-1 content-center relative">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[9/16] bg-[#2A1F1F] border border-red-500/10 rounded-xl relative overflow-hidden flex items-center justify-center opacity-70">
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
                </div>
              ))}
            </div>

            <div className="text-center">
              <span className="font-display italic text-white/40 text-lg">&quot;Why did this flop??&quot;</span>
            </div>
          </div>

          {/* RIGHT: Trendoraa Way */}
          <m.div
            style={{ 
              transformStyle: "preserve-3d", 
              perspective: "1000px",
              rotateX: (shouldReduceMotion || isMobileDevice) ? 0 : 2
            }}
            whileHover={(shouldReduceMotion || isMobileDevice) ? {} : { rotateX: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="flex flex-col h-full border border-white/10 bg-white/[0.03] backdrop-blur-[8px] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-glow before-after-glass"
          >
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

            <div className="absolute top-0 right-0 bg-brand-primary/20 text-brand-primary text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider z-10">
              Trendoraa Way
            </div>

            <div className="flex justify-between items-start mt-4 mb-8 z-10 relative">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-2">Deep Post Analysis</h3>
                <p className="text-brand-secondary text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Actual metrics, unmasked.
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
                } transition-colors flex items-center gap-2 relative z-25`}
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
                    <span ref={viewsCountRef} data-start="0" data-end="84.5">{sequenceStarted ? "84.5K" : "0"}</span>
                  </div>
                </div>
                <div 
                  ref={hookRetentionRef}
                  className="bg-black/30 border border-white/5 rounded-lg p-3 transition-colors"
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {sequenceStarted ? "Hook Retention" : "Skip Rate"}
                  </div>
                  <div className="text-xl font-mono font-bold text-white">
                    <span ref={engagementCountRef} data-start="68" data-end="87">{sequenceStarted ? "87%" : "68%"}</span>
                  </div>
                </div>
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
                  <path 
                    ref={retentionCurveRef}
                    d="M 0 5 Q 20 5, 40 15 T 100 20" 
                    fill="none" 
                    stroke="rgba(0, 184, 148, 1)" 
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={!sequenceStarted ? { strokeDasharray: 200, strokeDashoffset: 200 } : {}}
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
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
