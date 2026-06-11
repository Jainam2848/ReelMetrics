"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { GridDistortionProvider } from "@/lib/contexts/GridDistortionContext";
import { AnalysisStateProvider } from "@/lib/contexts/AnalysisStateContext";
import { AmbientIntelligenceBackground } from "@/components/shared/AmbientIntelligenceBackground";
import { FlipWords } from "@/components/ui/flip-words";
import { HeroStats } from "@/components/landing/HeroStats";
import { RetentionCurve } from "@/components/landing/RetentionCurve";

export default function WaitlistPage() {
  return (
    <GridDistortionProvider>
      <AnalysisStateProvider>
        <WaitlistContent />
      </AnalysisStateProvider>
    </GridDistortionProvider>
  );
}

function RetentionCurveWithNarrative() {
  const [playheadPercent, setPlayheadPercent] = useState(25);
  const [mounted, setMounted] = useState(false);

  // Poll playhead transform position from DOM to avoid modifying RetentionCurve internals
  React.useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const playhead = document.querySelector(".cursor-col-resize") as HTMLDivElement | null;
      const graphContainer = playhead?.parentElement;
      if (playhead && graphContainer) {
        const style = window.getComputedStyle(playhead);
        const matrix = new DOMMatrix(style.transform);
        const x = matrix.m41;
        const width = graphContainer.offsetWidth;
        if (width > 0) {
          const pct = Math.max(0, Math.min(100, (x / width) * 100));
          setPlayheadPercent(Math.round(pct));
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const isZone1Active = playheadPercent >= 0 && playheadPercent < 25;
  const isZone2Active = playheadPercent >= 25 && playheadPercent < 75;
  const isZone3Active = playheadPercent >= 75 && playheadPercent <= 100;

  return (
    <div className="w-full flex flex-col gap-2 relative">
      {/* 1. Above the component — instruction line */}
      <span className="text-[12px] text-gray-500 font-outfit text-center italic leading-tight select-none mb-1">
        Drag the playhead to see how drop-off kills algorithmic reach.
      </span>

      {/* Relative container for Zone Labels positioned above the timeline */}
      <div className="relative w-full pt-10">
        {/* Absolute Zone Labels overlay */}
        <div className="absolute top-0 left-0 right-0 h-10 pointer-events-none z-30 select-none">
          {/* Zone 1 Label at 10% */}
          <div 
            className="absolute flex flex-col items-center text-center -translate-x-1/2 transition-colors duration-200"
            style={{ left: "10%" }}
          >
            <span className={`text-[11px] font-bold font-outfit tracking-wide uppercase ${isZone1Active ? "text-[#F97316]" : "text-gray-600"}`}>
              Hook window
            </span>
            <span className="hidden min-[480px]:inline-block text-[9px] text-gray-500 font-outfit mt-0.5 leading-none max-w-[80px]">
              Lose them here = algorithm buries the post.
            </span>
          </div>

          {/* Zone 2 Label at 45% */}
          <div 
            className="absolute flex flex-col items-center text-center -translate-x-1/2 transition-colors duration-200"
            style={{ left: "45%" }}
          >
            <span className={`text-[11px] font-bold font-outfit tracking-wide uppercase ${isZone2Active ? "text-[#4F46E5]" : "text-gray-600"}`}>
              Body drop zone
            </span>
            <span className="hidden min-[480px]:inline-block text-[9px] text-gray-500 font-outfit mt-0.5 leading-none max-w-[100px]">
              Where most creators hemorrhage viewers.
            </span>
          </div>

          {/* Zone 3 Label at 85% */}
          <div 
            className="absolute flex flex-col items-center text-center -translate-x-1/2 transition-colors duration-200"
            style={{ left: "85%" }}
          >
            <span className={`text-[11px] font-bold font-outfit tracking-wide uppercase ${isZone3Active ? "text-[#14B8A6]" : "text-gray-600"}`}>
              Completion signal
            </span>
            <span className="hidden min-[480px]:inline-block text-[9px] text-gray-500 font-outfit mt-0.5 leading-none max-w-[90px]">
              Finishing = algorithm pushes it further.
            </span>
          </div>
        </div>

        {/* Render actual RetentionCurve */}
        <RetentionCurve />
      </div>

      {/* 3. Below the component — single outcome line */}
      <m.div
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="text-[13px] text-gray-400 font-outfit text-center mt-1 select-none"
      >
        Trendoraa shows you this for every post you&apos;ve published.
      </m.div>
    </div>
  );
}

function WaitlistContent() {
  const [email, setEmail] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [followersCount, setFollowersCount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"scoring" | "strategy">("scoring");
  
  const [realCount, setRealCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState<number | null>(null);

  const [myPosition, setMyPosition] = useState<number | null>(null);
  const [successDisplayCount, setSuccessDisplayCount] = useState<number | null>(null);
  const [posAnimationFinished, setPosAnimationFinished] = useState(false);

  // Fetch real count from waitlist API on page load
  React.useEffect(() => {
    async function fetchWaitlistCount() {
      try {
        const response = await fetch("/api/waitlist");
        if (!response.ok) throw new Error("Failed to fetch waitlist count");
        const data = await response.json();
        if (data && typeof data.count === "number") {
          setRealCount(data.count);
        } else {
          setRealCount(null);
        }
      } catch (err) {
        console.error("Waitlist count load warning:", err);
        setRealCount(null);
      }
    }
    fetchWaitlistCount();
  }, []);

  // Animate count up from 0 to realCount over 800ms
  React.useEffect(() => {
    if (realCount === null || realCount <= 0) return;

    let startTimestamp: number | null = null;
    const duration = 800;

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress); // Ease out quad

      setDisplayCount(Math.floor(eased * realCount));

      if (progress < 1) {
        window.requestAnimationFrame(animate);
      } else {
        setDisplayCount(realCount);
      }
    };

    window.requestAnimationFrame(animate);
  }, [realCount]);

  // Animate success waitlist position count up from 0 to myPosition over 600ms
  React.useEffect(() => {
    if (myPosition === null || myPosition <= 0) return;

    let startTimestamp: number | null = null;
    const duration = 600;
    setPosAnimationFinished(true);

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress); // Ease out quad

      setSuccessDisplayCount(Math.floor(eased * myPosition));

      if (progress < 1) {
        window.requestAnimationFrame(animate);
      } else {
        setSuccessDisplayCount(myPosition);
      }
    };

    window.requestAnimationFrame(animate);
  }, [myPosition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Instagram Handle
    if (!instagramHandle || instagramHandle.trim() === "") {
      setStatus("error");
      setErrorMessage("Please enter your Instagram ID.");
      return;
    }

    // Validate Followers Range
    if (!followersCount) {
      setStatus("error");
      setErrorMessage("Please select your followers count range.");
      return;
    }

    // Validate Email Address
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, instagramHandle, followersCount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMyPosition(data.position || null);
      setStatus("success");
      setEmail("");
      setInstagramHandle("");
      setFollowersCount("");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "That didn't work — try again or use a different email.");
    }
  };

  return (
    <>
      {/* Satoshi and Cabinet Grotesk Fonts */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700&display=swap');
        
        .font-satoshi {
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .font-cabinet {
          font-family: 'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}} />

      <div className="min-h-screen bg-[#08090D] text-[#F8F8FC] dark text-foreground overflow-x-hidden selection:bg-brand-primary/30 relative flex flex-col items-center justify-center px-4 pt-8 sm:pt-16 lg:pt-24 pb-8 sm:pb-16 lg:pb-24">
        {/* Premium ambient intelligence background */}
        <AmbientIntelligenceBackground />

        {/* Floating Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 bg-background/20 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-display font-black text-white text-sm shadow-glow">
              T
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white font-outfit">
              Trendoraa
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-accent select-none font-outfit">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
              Early access — limited free slots
            </div>
          </div>
        </nav>

        {/* Main Content Layout Grid */}
        <div className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mt-16 sm:mt-20 md:mt-12">
          
          {/* Left Column: Heading and CRO Sign-up Form */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-3 order-1 sm:order-none"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-outfit font-black tracking-tight text-white leading-[1.1] select-none text-left">
                Escape the <br />
                <span className="text-brand-accent animate-pulse">200-View Jail.</span> <br />
                <span className="bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
                  With Math, Not Hope.
                </span>
              </h1>
              
              <p className="text-xs md:text-sm text-gray-400 font-medium leading-relaxed font-outfit max-w-xl">
                When your videos get stuck in the 200-view jail, posting consistently only accelerates your creative burnout. Trendoraa gives you a mathematical blueprint to diagnose exactly why viewers skip, track emerging niche trends, and auto-generate your weekly posting calendar.
              </p>
            </m.div>

            {/* Core Feature Pillars Callout */}
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col gap-4 border-y border-white/5 py-4 order-3 sm:order-none"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-brand-secondary uppercase tracking-widest font-outfit">01. Know exactly which second you lose them</span>
                  <span className="text-[11px] text-gray-400 font-outfit leading-relaxed">Pinpoint exactly when viewers scroll away. Analyze visual pacing and hooks alongside your Meta Graph API skip rate to engineer highly resistant openings.</span>
                </div>
                <div className="flex flex-col gap-1 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                  <span className="text-[9px] font-bold text-brand-accent uppercase tracking-widest font-outfit">02. Post the trend before it saturates your niche</span>
                  <span className="text-[11px] text-gray-400 font-outfit leading-relaxed">Intercept hashtags, audio, and format signals in your niche.</span>
                </div>
                <div className="flex flex-col gap-1 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                  <span className="text-[9px] font-bold text-brand-primary uppercase tracking-widest font-outfit">03. Your weekly posting calendar, written for you</span>
                  <span className="text-[11px] text-gray-400 font-outfit leading-relaxed">Auto-generate schedules, peak hours, and hook &amp; caption copy.</span>
                </div>
              </div>
            </m.div>

            {/* Waitlist Subscription Card (.dashboard-card and .bg-glass style) */}
            <m.div
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={
                status === "error"
                  ? { opacity: 1, x: [0, -8, 8, -4, 4, 0], scale: 1 }
                  : { opacity: 1, x: 0, scale: 1 }
              }
              transition={
                status === "error"
                  ? { duration: 0.4, ease: "easeInOut" }
                  : { duration: 0.5, delay: 0.2 }
              }
              className="px-4 py-5 sm:p-6 md:p-8 rounded-2xl bg-glass border-glass shadow-glow relative overflow-hidden order-2 sm:order-none"
              style={{ borderRadius: 16 }}
            >
              {/* Decorative background glows */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none" />

              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <m.div
                    key="success"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex flex-col items-center text-center py-4 gap-4"
                  >
                    {/* Phase 1 — Confirmation */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shadow-glow">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-base font-bold text-white font-outfit uppercase tracking-wider">
                        You&apos;re in.
                      </h3>
                      <p className="text-[14px] text-gray-400 max-w-sm font-outfit leading-relaxed">
                        Wait for the email on launch day.
                      </p>
                    </div>

                    {/* Phase 2 — Single share nudge (Staggered 200ms after Phase 1) */}
                    <m.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
                      className="flex flex-col items-center gap-3 w-full border-t border-white/5 pt-4 mt-2"
                    >
                      <span className="text-[13px] text-gray-500 font-outfit">
                        Share Trendoraa with a fellow creator.
                      </span>
                      <div className="flex gap-4">
                        <a
                          href="https://twitter.com/intent/tweet?text=Just+joined+the+Trendoraa+waitlist+—+finally+a+tool+that+diagnoses+why+your+Reels+die+in+3+seconds.+trendoraa.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Share on X (formerly Twitter)"
                          className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] transition-colors flex items-center justify-center shadow-glow"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </a>
                        <a
                          href="https://wa.me/?text=Just+joined+the+Trendoraa+waitlist.+Check+it+out%3A+trendoraa.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Share on WhatsApp"
                          className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] transition-colors flex items-center justify-center shadow-glow"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963-1.862-1.862-4.339-2.887-6.973-2.888-5.442 0-9.87 4.372-9.874 9.8.001 1.962.511 3.878 1.478 5.568l-.97 3.546 3.637-.954zm10.902-7.502c-.294-.148-1.74-.86-2.012-.96-.272-.098-.47-.148-.668.148-.198.297-.768.96-.941 1.158-.173.199-.347.223-.64.075-.294-.148-1.244-.46-2.37-1.465-.877-.784-1.47-1.753-1.642-2.051-.173-.297-.018-.458.13-.606.134-.133.294-.347.44-.52.148-.173.197-.297.296-.496.099-.198.05-.371-.025-.52-.075-.148-.668-1.61-.915-2.203-.242-.589-.487-.51-.668-.519-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.74-.71 1.987-1.396.248-.686.248-1.276.173-1.396-.074-.12-.272-.198-.567-.347z"/>
                          </svg>
                        </a>
                      </div>
                    </m.div>
                  </m.div>
                ) : (
                  <m.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5"
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-bold text-white font-outfit uppercase tracking-wider text-brand-secondary">
                        Secure Your Early Access Spot
                      </h3>
                      <p className="text-xs text-gray-400 font-outfit">
                        Secure your free early access slot today. No credit card required.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      {realCount !== null && realCount > 0 && displayCount !== null && (
                        <div className="flex flex-col gap-0.5 select-none text-left">
                          <span className="text-[13px] font-bold text-white font-outfit">
                            {displayCount.toLocaleString()} creators already waiting
                          </span>
                          <span className="text-[13px] text-gray-500 font-outfit">
                            Launch access closes when slots fill.
                          </span>
                        </div>
                      )}

                      {/* Qualification grid for IG Handle and Followers Count */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative group">
                          <input
                            type="text"
                            disabled={status === "loading"}
                            value={instagramHandle}
                            onChange={(e) => setInstagramHandle(e.target.value)}
                            placeholder="Instagram ID (e.g. @creator)"
                            className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-300 disabled:opacity-50 font-outfit"
                          />
                        </div>

                        <div className="relative group">
                          <select
                            disabled={status === "loading"}
                            value={followersCount}
                            onChange={(e) => setFollowersCount(e.target.value)}
                            className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-300 disabled:opacity-50 font-outfit appearance-none cursor-pointer"
                          >
                            <option value="" disabled className="text-gray-500 bg-[#08090D]">Followers count...</option>
                            <option value="Under 10k" className="bg-[#08090D]">Under 10k</option>
                            <option value="10k - 50k" className="bg-[#08090D]">10k - 50k</option>
                            <option value="50k - 250k" className="bg-[#08090D]">50k - 250k</option>
                            <option value="250k+" className="bg-[#08090D]">250k+</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative group flex-1">
                          <input
                            type="email"
                            disabled={status === "loading"}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-300 disabled:opacity-50 font-outfit"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={status === "loading"}
                          className="shimmer-btn w-full sm:w-auto min-h-[48px] px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-[0.98] shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 font-outfit relative overflow-hidden whitespace-nowrap shrink-0"
                        >
                          {status === "loading" ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Reserving your slot...
                            </>
                          ) : (
                            "Claim My Free Early Access →"
                          )}
                        </button>
                      </div>

                      <span className="text-[10px] text-gray-500 font-outfit select-none text-left">
                        No credit card. No spam. Free early access priority reserved on launch day.
                      </span>

                      {status === "error" && (
                        <m.span
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs font-semibold text-[#F97316] font-outfit"
                        >
                          {errorMessage}
                        </m.span>
                      )}
                    </div>
                  </m.form>
                )}
              </AnimatePresence>
            </m.div>

            {/* Dynamic trust counter statistics (from original website!) */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-2 order-last sm:order-none"
            >
              <HeroStats />
            </m.div>
          </div>

          {/* Right Column: Dynamic Interactive Showcase (Bridges Ingestion & Strategy Features) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            
            {/* Tab Controller */}
            <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-xl backdrop-blur-md self-center lg:self-start z-10">
              <button
                onClick={() => setActiveTab("scoring")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 font-outfit ${
                  activeTab === "scoring"
                    ? "bg-brand-primary text-white shadow-glow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                01. Interactive Analytics
              </button>
              <button
                onClick={() => setActiveTab("strategy")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 font-outfit ${
                  activeTab === "strategy"
                    ? "bg-brand-secondary text-white shadow-glow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                02. Strategy Calendar
              </button>
            </div>

            {/* Interactive Widget Frame with CRT Scanline Effect */}
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl border-glass bg-[#101114]/50 backdrop-blur-md p-6 shadow-glow relative overflow-hidden flex items-center justify-center min-h-[380px] lg:min-h-[480px]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(79,70,229,0.06),rgba(20,184,166,0.02),rgba(249,115,22,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none opacity-20" />
              
              <AnimatePresence mode="wait">
                {activeTab === "scoring" ? (
                  <m.div
                    key="scoring"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="w-full flex flex-col gap-6"
                  >
                    {/* Live Header Interface Mockup */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider font-outfit">LIVE PACING DIAGNOSTICS</span>
                        <span className="text-[10px] text-gray-500 font-mono mt-0.5">@creatorprofile/reels_skip_rate</span>
                      </div>
                      <div className="px-2.5 py-1 bg-brand-primary/10 border border-brand-primary/30 rounded-lg text-xs font-bold text-brand-secondary font-mono">
                        HOOK SCORING: 8.7/10
                      </div>
                    </div>

                    {/* Interactive Draggable Retention Curve Component with guided narrative layer */}
                    <RetentionCurveWithNarrative />

                    {/* Dashboard Visual Thumbnail */}
                    <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                      <div className="w-12 h-12 bg-black/40 rounded-lg border border-white/5 shrink-0 overflow-hidden flex items-center justify-center">
                        <img 
                          src="/images/dashboard-mockup.png" 
                          alt="AI Dashboard Thumbnail"
                          className="w-full h-full object-cover opacity-80" 
                        />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-bold text-white uppercase font-outfit tracking-wider">9-Dimension Metric Engine</span>
                        <span className="text-[10px] text-gray-400 font-outfit leading-relaxed mt-0.5">
                          Calculates hook skipped rates, pacing structures, visual flow, and outlines script adjustments automatically.
                        </span>
                      </div>
                    </div>
                  </m.div>
                ) : (
                  <m.div
                    key="strategy"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="w-full flex flex-col gap-6"
                  >
                    {/* Live Header Interface Mockup for Calendar */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider font-outfit">Weekly Strategy Calendar</span>
                        <span className="text-[10px] text-gray-500 font-mono mt-0.5">Generated Content Schedule & Posting Hours</span>
                      </div>
                      <div className="px-2.5 py-1 bg-brand-secondary/10 border border-brand-secondary/30 rounded-lg text-xs font-bold text-brand-secondary font-mono uppercase tracking-widest">
                        Week 22
                      </div>
                    </div>

                    {/* Strategy Mockup Image */}
                    <img
                      src="/images/strategy-mockup.png"
                      alt="Trendoraa Automated Niche Calendar Mockup"
                      className="w-full h-auto rounded-xl object-contain shadow-2xl border border-white/5"
                    />
                    
                    <div className="bg-black/60 border border-white/5 p-3 rounded-lg backdrop-blur-md text-left">
                      <p className="text-[10px] text-gray-300 font-outfit leading-relaxed">
                        <strong className="text-white uppercase tracking-wider text-brand-primary">Automated Scheduling:</strong> Identifies your account&apos;s peak organic watch hours, generates structured copywriting hooks, and provides daily niche trend alerts.
                      </p>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          </div>

        </div>

        {/* Cinematic Parallax Scroll Footer */}
        <footer className="mt-16 md:mt-24 z-10 text-[9px] text-gray-600 font-mono tracking-widest uppercase text-center border-t border-white/5 w-full max-w-5xl pt-6">
          © 2026 Trendoraa Inc. • built with cinematic intelligence
        </footer>
      </div>
    </>
  );
}
