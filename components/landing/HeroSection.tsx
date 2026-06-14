"use client";

import React from "react";
import dynamic from "next/dynamic";
import { m } from "framer-motion";
import { CTAButton } from "./CTAButton";
import { FlipWords } from "@/components/ui/flip-words";
import { HeroStats } from "./HeroStats";
import GrowthCalculator from "./GrowthCalculator";

export function HeroSection({ hasSession = false }: { hasSession?: boolean }) {

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700&display=swap');
        
        .font-satoshi {
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .font-cabinet {
          font-family: 'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .font-outfit {
          font-family: var(--font-outfit), 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        @keyframes shimmer-sweep {
          0% { transform: translate3d(-120%, 0, 0) skewX(-15deg); }
          100% { transform: translate3d(220%, 0, 0) skewX(-15deg); }
        }
        
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1.2; }
        }
        
        .animate-orb-pulse {
          animation: orb-pulse 2s ease-in-out infinite;
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

      {/* Hero Section */}
      <section className="relative flex min-h-[95dvh] flex-col justify-center px-6 pt-28 pb-16 z-10">
        {/* Asymmetric wide layout grid */}
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center z-10">
          
          {/* Left Column: Headline and CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-accent select-none font-outfit">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
              Creator Engine Active
            </div>
            
            <h1 
              style={{ 
                fontSize: "clamp(2.8rem, 4.5vw, 4.8rem)",
                textShadow: "0 0 40px rgba(79,70,229,0.3)",
              }}
              className="mb-6 font-outfit font-black tracking-tight text-white leading-[1.1] select-none text-left max-w-6xl w-full"
            >
              <span className="block min-h-[1.25em] flex items-center flex-wrap">
                Engineer
                <FlipWords 
                  words={["Viral Hooks", "Reel Growth", "Massive Views", "Super Fans"]} 
                  className="text-brand-secondary px-2" 
                />
              </span>
              <span className="block text-white/90">Not Hope.</span>
            </h1>
            
            <m.p 
              initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="mb-8 max-w-xl text-lg md:text-xl text-gray-400 font-medium leading-relaxed font-outfit"
            >
              Stop guessing why your Reels get stuck at 200 views. Trendoraa scans your video in seconds to show you exactly how to hook your audience and keep them watching—so you can scale your reach without the creative burnout.
            </m.p>
            
            {/* Primary CTA and Secondary Link */}
            <m.div
              initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 w-full sm:w-auto z-10"
            >
              <CTAButton 
                label={hasSession ? "Launch Dashboard Cockpit →" : "Analyze My First Reel Free →"} 
                href={hasSession ? "/dashboard" : "/login"} 
                variant="primary" 
                data-magnetic
              />
              
              <CTAButton 
                label="See how it works" 
                href="#how-it-works" 
                variant="ghost" 
              />
            </m.div>

            {/* Dynamic Animated Inline Stats Bar */}
            <HeroStats />
          </div>

          {/* Right Column: Dynamic Growth Calculator Widget */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full relative z-20">
            {/* Ambient Background Glowing Orb */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none select-none z-0 bg-indigo-500/6 transition-all duration-[1200ms] ease-out"
            />
            <GrowthCalculator />
          </div>
          
        </div>
      </section>
    </>
  );
}
