import React from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeatureScrollSequence } from "@/components/landing/FeatureScrollSequence";
import { BeforeAfterSplit } from "@/components/landing/before-after-split";
import { SocialProofTicker } from "@/components/landing/social-proof";
import { PricingSection } from "@/components/landing/PricingSection";
import { CinematicFooter } from "@/components/ui/motion-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-brand-primary/30 relative flex flex-col">
      <HeroSection />
      
      <main className="relative z-10 flex-1 flex flex-col">
        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Feature Scroll Sequence (GSAP Pinned Zone) */}
        <FeatureScrollSequence />

        {/* Cinematic Transformation Sequence */}
        <BeforeAfterSplit />
        
        {/* Social Proof */}
        <SocialProofTicker />

        {/* Pricing Tiers Section */}
        <PricingSection />
        
        {/* Cinematic Parallax Scroll Reveal Footer */}
        <CinematicFooter />
      </main>
    </div>
  );
}
