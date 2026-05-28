"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { m, Variants } from "framer-motion";
import anime from "animejs";
import { BeforeAfterSplit } from "@/components/landing/before-after-split";
import { SocialProofTicker } from "@/components/landing/social-proof";
import { ScanlineOverlay } from "@/components/landing/scanline-overlay";
import { CinematicFooter } from "@/components/ui/motion-footer";

// Dynamic import with SSR disabled for Three.js
const ViralBackground = dynamic(
  () => import("@/components/landing/viral-background").then(mod => mod.ViralBackground),
  { ssr: false }
);

// Framer Motion Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.2 }
  }
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", damping: 12, stiffness: 100 }
  }
};

export default function LandingPage() {
  const glitchRef = useRef<HTMLSpanElement>(null);

  // Anime.js Glitch effect on "losing"
  useEffect(() => {
    if (glitchRef.current) {
      anime({
        targets: glitchRef.current,
        skewX: [0, -20, 20, -10, 10, 0],
        opacity: [1, 0.4, 1, 0.2, 1],
        translateX: [0, -5, 5, -2, 2, 0],
        duration: 600,
        delay: 1500, // Trigger after Framer Motion fade-in
        easing: 'easeInOutQuad',
      });
    }
  }, []);

  const handleRipple = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Dispatch global event for the R3F canvas to pick up
    window.dispatchEvent(new CustomEvent("viral-ripple", { 
      detail: { x: e.clientX, y: e.clientY } 
    }));
  };

  const headline = "Guessing the algorithm is a ".split(" ");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-brand-primary/30 relative flex flex-col">
      <ScanlineOverlay />
      <ViralBackground />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-display font-black text-white text-sm shadow-glow">
            T
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            Trendoraa
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="px-4 py-2 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-xl transition-all shadow-glow active:scale-95"
          >
            Get Early Access
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col">
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center pt-20">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-brand-primary/10 blur-[120px]" />
          
          <div className="max-w-4xl mx-auto flex flex-col items-center z-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
              Engine Online
            </div>
            
            <m.h1 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mb-6 text-5xl font-display font-black tracking-tight text-white md:text-7xl leading-[1.1] flex flex-wrap justify-center gap-x-3 gap-y-2"
            >
              {headline.map((word, i) => (
                <m.span key={i} variants={wordVariants}>{word}</m.span>
              ))}
              <m.span variants={wordVariants} className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent relative inline-block">
                <span ref={glitchRef} className="inline-block">losing</span>
              </m.span>
              <m.span variants={wordVariants}>game.</m.span>
            </m.h1>
            
            <m.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mx-auto mb-10 max-w-2xl text-lg md:text-xl text-gray-400 font-medium leading-relaxed"
            >
              Trendoraa shows you exactly why your Reels stop the scroll — or die in 3 seconds.
            </m.p>
            
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.5, type: "spring" }}
            >
              <Link 
                href="/login"
                onClick={handleRipple}
                className="relative inline-flex px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider text-white overflow-hidden transition-transform hover:scale-[1.08] active:scale-95 group"
                aria-label="Score My First Reel Free"
              >
                {/* Background Gradient */}
                <span className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-accent rounded-xl" />
                
                {/* Inner Glow Pulse */}
                <span className="absolute inset-0 rounded-xl shadow-[inset_0_0_20px_rgba(255,255,255,0.5)] animate-pulse opacity-50" />
                
                {/* Content */}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Score My First Reel Free
                </span>
              </Link>
            </m.div>
          </div>
        </section>

        {/* Cinematic Transformation Sequence */}
        <BeforeAfterSplit />
        
        {/* Social Proof */}
        <SocialProofTicker />
        
        {/* Cinematic Parallax Scroll Reveal Footer */}
        <CinematicFooter />
      </main>
    </div>
  );
}
