import React from "react";
import Link from "next/link";
import { HeroSection } from "@/components/landing/HeroSection";
import { InfiniteTicker } from "@/components/landing/InfiniteTicker";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { BentoFeatureGrid } from "@/components/landing/BentoFeatureGrid";
import { BeforeAfterSplit } from "@/components/landing/before-after-split";
import { FeatureTicker } from "@/components/landing/FeatureTicker";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";
import { PricingSection } from "@/components/landing/PricingSection";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { GridDistortionProvider } from "@/lib/contexts/GridDistortionContext";
import { AnalysisStateProvider } from "@/lib/contexts/AnalysisStateContext";
import { GridDistortionBackground } from "@/components/landing/GridDistortionBackgroundClient";
import { ScrollReveal } from "@/components/landing/ScrollReveal";


import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const hasSession = !!session;

  return (
    /**
     * Both contexts are scoped to marketing pages only.
     * They are NOT in app/layout.tsx to avoid polluting the dashboard.
     *
     * GridDistortionProvider — shares normalizedX/Y MotionValues for
     *   cursor-reactive effects without extra event listeners.
     *
     * AnalysisStateProvider — bridges ReelScoreSimulator → GridDistortionBackground
     *   so the background can react to the analysis phase.
     */
    <GridDistortionProvider>
      <AnalysisStateProvider>
        <div
          className="min-h-screen bg-[#08090D] text-[#F8F8FC] dark text-foreground overflow-hidden selection:bg-brand-primary/30 relative flex flex-col"
          style={{ backgroundColor: "#08090D" }}
        >
          {/* WebGL grid distortion — state-reactive & smooth transitions */}
          <GridDistortionBackground />

          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/50 backdrop-blur-md border-b border-white/5">
            <div data-magnetic className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-display font-black text-white text-sm shadow-glow">
                T
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-white">
                Trendoraa
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {hasSession ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-brand-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-glow active:scale-95 transition-all hover:opacity-90"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 border border-glass bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 uppercase tracking-wider rounded-xl transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>

          <div id="section-hero" className="relative z-10">
            <HeroSection hasSession={hasSession} />
          </div>

          <main className="relative z-10 flex-1 flex flex-col">
            {/* Infinite Logo Marquee (Social Proof) */}
            <ScrollReveal>
              <InfiniteTicker />
            </ScrollReveal>

            {/* How It Works Section */}
            <div id="section-how-it-works">
              <ScrollReveal>
                <HowItWorksSection />
              </ScrollReveal>
            </div>

            {/* Dynamic Bento Grid Feature Showcase */}
            <div id="section-features">
              <ScrollReveal>
                <BentoFeatureGrid />
              </ScrollReveal>
            </div>

            {/* Cinematic Transformation Sequence */}
            <ScrollReveal>
              <BeforeAfterSplit />
            </ScrollReveal>
            
            {/* Buzzwords Rotated Statement Marquee */}
            <ScrollReveal>
              <FeatureTicker />
            </ScrollReveal>
            
            {/* Full Testimonial Glassmorphism Carousel */}
            <div id="section-testimonials">
              <ScrollReveal>
                <TestimonialCarousel />
              </ScrollReveal>
            </div>

            {/* Pricing Tiers Section */}
            <div id="section-pricing">
              <ScrollReveal>
                <PricingSection />
              </ScrollReveal>
            </div>
            
            {/* Cinematic Parallax Scroll Reveal Footer */}
            <div id="section-footer">
              <CinematicFooter />
            </div>
          </main>
        </div>
      </AnalysisStateProvider>
    </GridDistortionProvider>
  );
}
