import React from "react";

/**
 * SectionSkeletons
 * Provides premium, high-craft, dark-mode skeleton loaders matching Trendora's design aesthetic.
 * These act as loading placeholders for Next.js dynamic bundle splitting, keeping heights
 * accurate to prevent Cumulative Layout Shift (CLS) while delivering a silky-smooth transitional flow.
 */

// Simple CSS rules injected inline to support beautiful hardware-accelerated shimmer sweeps
const SHIMMER_STYLE = `
  @keyframes shimmer-sweep {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .shimmer-glow {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.01) 25%,
      rgba(255, 255, 255, 0.04) 50%,
      rgba(255, 255, 255, 0.01) 75-percent
    );
    background-size: 200% 100%;
    animation: shimmer-sweep 2.4s infinite linear;
  }
  .shimmer-glow-dark {
    background: linear-gradient(
      90deg,
      rgba(79, 70, 229, 0.01) 25%,
      rgba(79, 70, 229, 0.05) 50%,
      rgba(79, 70, 229, 0.01) 75-percent
    );
    background-size: 200% 100%;
    animation: shimmer-sweep 3s infinite linear;
  }
`;

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: SHIMMER_STYLE.replace(/75-percent/g, "75%"),
      }}
    />
  );
}

export function BentoFeatureGridSkeleton() {
  return (
    <section className="py-32 md:py-48 relative overflow-hidden border-t border-white/[0.03] min-h-[900px] flex items-center justify-center">
      <Styles />
      <div className="max-w-6xl w-full mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {/* Section Header Placeholder */}
        <div className="flex flex-col items-center text-center mb-16 max-w-2xl w-full">
          <div className="w-28 h-5 rounded-full border border-brand-secondary/20 bg-brand-secondary/5 mb-4 shimmer-glow" />
          <div className="w-3/4 h-12 bg-white/5 rounded-2xl mb-4 shimmer-glow" />
          <div className="w-1/2 h-4 bg-white/5 rounded-lg shimmer-glow" />
        </div>

        {/* 12-Column Grid Layout matching BentoFeatureGrid */}
        <div className="grid grid-cols-12 gap-6 w-full items-stretch">
          {/* Cell 1: Hook Moat Placeholder (col-8, row-2) */}
          <div className="col-span-12 lg:col-span-8 h-[420px] rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 flex flex-col justify-between shimmer-glow-dark" />

          {/* Cell 2: Stats Placeholder (col-4) */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 h-[420px] rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 shimmer-glow" />

          {/* Cell 3: Score Placeholder (col-4) */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 h-[260px] rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 shimmer-glow" />

          {/* Cell 4: Calendar Placeholder (col-4) */}
          <div className="col-span-12 md:col-span-5 lg:col-span-4 h-[260px] rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 shimmer-glow" />

          {/* Cell 5: Retention Curve Placeholder (col-8) */}
          <div className="col-span-12 md:col-span-7 lg:col-span-8 h-[260px] rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 shimmer-glow-dark" />
        </div>
      </div>
    </section>
  );
}

export function BeforeAfterSplitSkeleton() {
  return (
    <section className="py-24 relative w-full overflow-hidden min-h-[600px] flex items-center justify-center">
      <Styles />
      <div className="max-w-6xl mx-auto px-6 relative z-10 w-full">
        {/* Header Placeholder */}
        <div className="text-center mb-16 flex flex-col items-center justify-center">
          <div className="w-2/3 h-12 bg-white/5 rounded-2xl mb-4 shimmer-glow" />
          <div className="w-1/2 h-5 bg-white/5 rounded-lg shimmer-glow" />
        </div>

        {/* Side-by-side Layout Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-stretch">
          {/* Left Old Way */}
          <div className="h-[520px] border border-red-500/10 bg-[#1A1515]/20 rounded-3xl p-6 md:p-8 relative overflow-hidden shimmer-glow" />
          {/* Right Trendoraa Way */}
          <div className="h-[520px] border border-white/10 bg-white/[0.02] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-glow shimmer-glow-dark" />
        </div>
      </div>
    </section>
  );
}

export function TestimonialCarouselSkeleton() {
  return (
    <section className="py-32 relative overflow-hidden border-t border-white/[0.03] min-h-[580px] flex items-center justify-center">
      <Styles />
      <div className="max-w-6xl w-full mx-auto px-6 relative z-10 flex flex-col items-center">
        {/* Header Placeholder */}
        <div className="flex flex-col items-center text-center mb-16 max-w-2xl w-full">
          <div className="w-28 h-5 rounded-full border border-brand-primary/20 bg-brand-primary/5 mb-4 shimmer-glow" />
          <div className="w-3/4 h-12 bg-white/5 rounded-2xl mb-4 shimmer-glow" />
          <div className="w-1/2 h-4 bg-white/5 rounded-lg shimmer-glow" />
        </div>

        {/* Carousel Cards Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-center py-6">
          <div className="h-[380px] rounded-[20px] bg-white/[0.02] border border-white/5 p-8 shimmer-glow" />
          <div className="h-[400px] rounded-[20px] bg-white/[0.03] border border-[#4F46E5]/15 p-8 shadow-glow shimmer-glow-dark" />
          <div className="h-[380px] rounded-[20px] bg-white/[0.02] border border-white/5 p-8 shimmer-glow" />
        </div>
      </div>
    </section>
  );
}

export function PricingSectionSkeleton() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden border-t border-white/[0.03] min-h-[750px] flex items-center justify-center">
      <Styles />
      <div className="max-w-6xl w-full mx-auto px-6 relative z-10 flex flex-col items-center">
        {/* Header Placeholder */}
        <div className="flex flex-col items-center text-center mb-12 max-w-2xl w-full">
          <div className="w-28 h-5 rounded-full border border-brand-primary/20 bg-brand-primary/5 mb-4 shimmer-glow" />
          <div className="w-3/4 h-12 bg-white/5 rounded-2xl mb-4 shimmer-glow" />
          <div className="w-1/2 h-4 bg-white/5 rounded-lg shimmer-glow" />
        </div>

        {/* Toggle Placeholder */}
        <div className="w-48 h-10 bg-white/5 border border-white/10 rounded-full mb-16 shimmer-glow" />

        {/* 3-Plan Grid Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 w-full items-stretch">
          <div className="h-[520px] rounded-[20px] bg-white/[0.02] border border-white/10 p-8 shimmer-glow" />
          <div className="h-[520px] rounded-[20px] bg-white/[0.03] border border-[#4F46E5]/30 shadow-glow p-8 shimmer-glow-dark" />
          <div className="h-[520px] rounded-[20px] bg-white/[0.02] border border-white/10 p-8 shimmer-glow" />
        </div>
      </div>
    </section>
  );
}
