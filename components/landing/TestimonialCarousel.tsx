"use client";

import React, { useRef, useState, useEffect } from "react";
import { m, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";

interface Testimonial {
  name: string;
  handle: string;
  initials: string;
  quote: React.ReactNode;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah Jenkins",
    handle: "@sarahcreativ",
    initials: "SJ",
    rating: 5,
    quote: (
      <>
        Our 3-second hook skip rate was killing our organic reach. After running Trendoraa&apos;s diagnostics, we{" "}
        <strong className="text-[#4F46E5] font-bold">went from 8% to 31% retention</strong> in under a week. Our views exploded!
      </>
    ),
  },
  {
    name: "Marcus Chen",
    handle: "@marcus.lens",
    initials: "MC",
    rating: 5,
    quote: (
      <>
        Analyzing pacing trigger frames used to take hours of guessing. Trendoraa automated the audit, showing our pacing score was 45%. We re-paced our video and{" "}
        <strong className="text-[#4F46E5] font-bold">unlocked 2.3× avg retention lift</strong> instantly!
      </>
    ),
  },
  {
    name: "Elene Rostova",
    handle: "@elene_creates",
    initials: "ER",
    rating: 5,
    quote: (
      <>
        As a power creator, guessing what hook works is a recipe for creative burnout. Trendoraa&apos;s{" "}
        <strong className="text-[#4F46E5] font-bold">94% hook score accuracy</strong> gives us the exact formula before posting. We scaled to 2M followers.
      </>
    ),
  },
  {
    name: "David Kovic",
    handle: "@davidkov.ai",
    initials: "DK",
    rating: 5,
    quote: (
      <>
        Our creative agency was struggling to prove short-form video ROI to clients. Trendoraa gave us clear, data-driven retention overlays that{" "}
        <strong className="text-[#4F46E5] font-bold">delivered 3.5× client conversion growth</strong>.
      </>
    ),
  },
];

function TestimonialCard({ testimonial, isActive }: { testimonial: Testimonial; isActive: boolean }) {
  // Motion values for local mouse coordinates relative to the card's center
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Map coordinate offsets to rotation degrees (-8 to 8)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  // Spring smooth the rotations as specified: { stiffness: 150, damping: 20 }
  const rotateXSpring = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const rotateYSpring = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    
    // Normalize coordinates: -0.5 is left/top, 0.5 is right/bottom
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    
    mouseX.set(normX);
    mouseY.set(normY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <m.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
        transformPerspective: 1000,
        willChange: "transform",
      }}
      className={`relative flex flex-col justify-between h-[380px] p-8 rounded-[20px] bg-white/[0.04] border border-[#4F46E5]/25 backdrop-blur-[16px] transition-all duration-500 hover:shadow-[inset_0_0_32px_rgba(79,70,229,0.18),0_20px_50px_rgba(0,0,0,0.5)] select-none text-left cursor-grab active:cursor-grabbing w-full ${
        isActive ? "scale-100 md:scale-105 opacity-100 z-10" : "scale-100 md:scale-95 opacity-100 md:opacity-40"
      }`}
    >
      {/* Top: 5-star rating */}
      <div className="flex items-center gap-1">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <svg key={i} className="w-4 h-4 text-[#4F46E5] fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Middle: Quote text */}
      <p className="text-[15px] font-satoshi text-white/90 leading-[1.75] font-medium my-6 flex-grow">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Bottom: Avatar + details */}
      <div className="flex items-center gap-3.5 border-t border-white/5 pt-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#14B8A6] flex items-center justify-center font-cabinet font-bold text-white text-sm shadow-glow shrink-0">
          {testimonial.initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-cabinet font-bold text-white text-sm tracking-wide truncate">
            {testimonial.name}
          </span>
          <span className="font-satoshi text-[11px] font-semibold text-white/40 tracking-wider uppercase mt-0.5 truncate">
            {testimonial.handle}
          </span>
        </div>
      </div>
    </m.div>
  );
}

export function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Custom drag swipe physics implementation
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      // Swiped right (previous card)
      setActiveIndex((prev) => (prev - 1 + 4) % 4);
    } else if (info.offset.x < -swipeThreshold) {
      // Swiped left (next card)
      setActiveIndex((prev) => (prev + 1) % 4);
    }
  };

  return (
    <section id="testimonials" className="py-32 relative overflow-hidden select-none border-t border-white/[0.03]">
      {/* Background glowing lights */}
      <div className="absolute top-[20%] left-[-15%] w-[40vw] h-[40vw] max-w-[500px] rounded-full bg-[#4F46E5]/3 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-15%] w-[40vw] h-[40vw] max-w-[500px] rounded-full bg-[#14B8A6]/3 blur-[140px] pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-primary">
            Creator Proof
          </div>
          
          <h2 className="text-3xl md:text-5xl font-satoshi font-black tracking-tight text-white leading-tight">
            Loved by 14,000+ Creators.
          </h2>
          
          <p className="mt-4 text-base text-gray-400 font-satoshi font-medium leading-relaxed">
            See how short-form strategy changes when you stop guessing and start engineering retention.
          </p>
        </div>

        {/* Carousel Drag Container */}
        <m.div 
          ref={containerRef}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="w-full flex justify-center items-center relative overflow-visible cursor-grab active:cursor-grabbing"
        >
          {/* Desktop Grid Layout (3 cards visible, center active) */}
          <div className="hidden md:grid grid-cols-3 gap-8 w-full items-center py-6">
            <TestimonialCard 
              testimonial={TESTIMONIALS[(activeIndex - 1 + 4) % 4]!} 
              isActive={false} 
            />
            <TestimonialCard 
              testimonial={TESTIMONIALS[activeIndex]!} 
              isActive={true} 
            />
            <TestimonialCard 
              testimonial={TESTIMONIALS[(activeIndex + 1) % 4]!} 
              isActive={false} 
            />
          </div>

          {/* Mobile Layout (1 card visible at full width) */}
          <div className="flex md:hidden w-full py-4 justify-center">
            <TestimonialCard 
              testimonial={TESTIMONIALS[activeIndex]!} 
              isActive={true} 
            />
          </div>
        </m.div>

        {/* Dot Navigation */}
        <div className="flex justify-center gap-3.5 mt-10">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className="relative w-3 h-3 rounded-full bg-white/20 transition-colors duration-300 focus:outline-none cursor-pointer"
              aria-label={`Go to slide ${index + 1}`}
            >
              {activeIndex === index && (
                <m.div
                  layoutId="active-testimonial-dot"
                  className="absolute inset-0 bg-[#4F46E5] rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
