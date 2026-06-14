import React from "react";
import { HowItWorksCards } from "./HowItWorksCards";
import { HowItWorksConnector } from "./HowItWorksConnector";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-28 md:py-36 overflow-hidden select-none border-t border-white/[0.03]">
      {/* Background ambient radial lights inside the section */}
      <div className="absolute top-[20%] left-[-10%] w-[35vw] h-[35vw] max-w-[400px] rounded-full bg-[#4F46E5]/3 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[35vw] h-[35vw] max-w-[400px] rounded-full bg-[#10B981]/3 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col items-start text-left mb-16 md:mb-20 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#10B981]">
            Workflow Pipeline
          </div>
          
          <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-white leading-tight">
            Predict Viewer Swipes. Audit Real Feed Performance.
          </h2>
          
          <p className="mt-4 text-base text-gray-400 font-sans font-medium leading-relaxed">
            From pre-publish diagnostics to continuous feed tracking. Three integrated steps to lock in viewer attention and scale your organic reach.
          </p>
        </div>

        {/* Step Cards Row & Connecting Scroll Indicator */}
        <div className="relative w-full">
          <HowItWorksConnector />
          <HowItWorksCards />
        </div>

      </div>
    </section>
  );
}
