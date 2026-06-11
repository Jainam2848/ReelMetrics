"use client";

import React, { useRef } from "react";
import { m, Variants, useInView, useReducedMotion } from "framer-motion";

// Framer Motion spring physics definitions
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    }
  }
};

const cardVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 20,
    }
  }
};

const iconPathVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1,
    transition: { duration: 1.6, ease: "easeInOut" }
  }
};

export function HowItWorksCards() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  // Cards definitions
  const steps = [
    {
      num: "1",
      title: "Sync Your Feed",
      description: "Safely sync your creator account in one tap. We pull your performance data directly from Meta with complete security.",
      badge: "One-Click Safe Sync →",
      icon: (
        <svg className="w-8 h-8 text-indigo-400 group-hover:text-indigo-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <m.path 
            variants={iconPathVariants}
            d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" 
          />
          <m.path 
            variants={iconPathVariants}
            d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" 
          />
        </svg>
      )
    },
    {
      num: "2",
      title: "Find retention leaks",
      description: "Our AI instantly scans your video styling, audio drops, editing pacing, and visual transitions to find exactly why viewers swipe away.",
      badge: "Smart Retention Audit →",
      icon: (
        <svg className="w-8 h-8 text-indigo-400 group-hover:text-indigo-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <m.path 
            variants={iconPathVariants}
            d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" 
          />
          <m.path 
            variants={iconPathVariants}
            d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" 
          />
        </svg>
      )
    },
    {
      num: "3",
      title: "Boost your reach",
      description: "Get a personalized creator playbook with fresh hook ideas, high-engagement pacing suggestions, and script tweaks to maximize retention.",
      badge: "Creator Playbook →",
      icon: (
        <svg className="w-8 h-8 text-indigo-400 group-hover:text-indigo-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <m.path 
            variants={iconPathVariants}
            d="M19 4H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" 
          />
          <m.path 
            variants={iconPathVariants}
            d="M16 2v4M8 2v4" 
          />
          <m.path 
            variants={iconPathVariants}
            d="M3 10h18" 
          />
          <m.path 
            variants={iconPathVariants}
            d="m13 14-4 4h3l-1 4 4-4h-3l1-4z" 
          />
        </svg>
      )
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent, stepTitle: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Simulates card interaction action
      const targetId = stepTitle.toLowerCase() === "connect" ? "/login" : "#transformation";
      if (typeof window !== "undefined") {
        window.location.assign(targetId);
      }
    }
  };

  return (
    <m.div
      ref={ref}
      variants={shouldReduceMotion ? {} : containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 w-full relative z-10"
    >
      {steps.map((step) => (
        <m.div
          key={step.num}
          variants={shouldReduceMotion ? {} : cardVariants}
          whileHover={shouldReduceMotion ? {} : { 
            y: -4, 
            borderColor: "rgba(79, 70, 229, 0.4)",
            backgroundColor: "rgba(255, 255, 255, 0.05)"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          tabIndex={0}
          role="button"
          aria-label={`Step ${step.num}: ${step.title}. ${step.description}`}
          onKeyDown={(e) => handleKeyDown(e, step.title)}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 relative flex flex-col justify-between min-h-[300px] overflow-hidden group cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090D] transition-all duration-300"
        >
          {/* Step Number Badge */}
          <span className="absolute top-2 left-4 text-[7rem] font-satoshi font-black text-[#4F46E5]/30 leading-none select-none pointer-events-none transition-colors group-hover:text-[#4F46E5]/40 duration-300">
            {step.num}
          </span>
          
          {/* Icon drawing and title wrapper */}
          <div className="relative z-10 flex flex-col items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-950/60 border border-white/5 flex items-center justify-center shadow-lg relative overflow-hidden">
              {/* Inner ambient light blur */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.2),transparent_70%)]" />
              {step.icon}
            </div>
            
            <h3 className="text-xl font-satoshi font-bold text-white tracking-tight leading-tight mt-2">
              {step.title}
            </h3>
            
            <p className="text-sm font-satoshi font-medium text-gray-400 leading-relaxed max-w-[32ch]">
              {step.description}
            </p>
          </div>

          {/* Action indicator tag */}
          <div className="relative z-10 text-[11px] font-satoshi font-bold text-[#10B981] group-hover:text-[#10B981]/80 transition-colors duration-200 mt-6 tracking-wide uppercase">
            {step.badge}
          </div>
        </m.div>
      ))}
    </m.div>
  );
}
