"use client";

import React, { useRef, useState } from "react";
import { m, Variants, useInView, useReducedMotion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { CTAButton } from "./CTAButton";

// Framer Motion spring physics definitions
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
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

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const shouldReduceMotion = useReducedMotion();

  const plans = [
    {
      name: "Starter",
      subheading: "Start engineering your hooks",
      priceMonthly: 0,
      priceAnnual: 0,
      ctaLabel: "Start Free",
      ctaHref: "/signup?plan=starter",
      ctaVariant: "ghost" as const,
      popular: false,
      features: [
        { text: "Analyze up to 5 Reels/month", included: true },
        { text: "Unlock skip resistance diagnostic score", included: true },
        { text: "Generate basic retention curve visual map", included: true },
        { text: "Parse full 9-dimension diagnostic vectors", included: false },
        { text: "Auto-schedule calendar script recommendations", included: false }
      ]
    },
    {
      name: "Pro",
      subheading: "For creators serious about growth",
      priceMonthly: 29,
      priceAnnual: 23, // 20% discount
      ctaLabel: "Get Pro",
      ctaHref: "/signup?plan=pro",
      ctaVariant: "primary" as const,
      popular: true,
      features: [
        { text: "Analyze up to 50 Reels/month", included: true },
        { text: "Parse full 9-dimension diagnostic vectors", included: true },
        { text: "Auto-schedule calendar script recommendations", included: true },
        { text: "Unlock skip resistance diagnostic score", included: true },
        { text: "Generate comprehensive retention curve overlays", included: true },
        { text: "Add multiple team seat accounts", included: false },
        { text: "Export custom PDF diagnostic reports", included: false }
      ]
    },
    {
      name: "Studio",
      subheading: "For agencies and power creators",
      priceMonthly: 79,
      priceAnnual: 63, // 20% discount
      ctaLabel: "Go Studio",
      ctaHref: "/signup?plan=studio",
      ctaVariant: "ghost" as const,
      popular: false,
      features: [
        { text: "Analyze unlimited Reels/month", included: true },
        { text: "Add multiple team seat accounts", included: true },
        { text: "Unlock priority processing queue speeds", included: true },
        { text: "Integrate direct developer API tokens", included: true },
        { text: "Export custom PDF diagnostic reports", included: true },
        { text: "Auto-schedule calendar script recommendations", included: true }
      ]
    }
  ];

  return (
    <section id="pricing" className="relative py-28 md:py-36 bg-[#08090D] overflow-hidden select-none border-t border-white/[0.03]">
      {/* Background ambient radial lights */}
      <div className="absolute top-[30%] left-[-15%] w-[40vw] h-[40vw] max-w-[500px] rounded-full bg-[#4F46E5]/4 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[30%] right-[-15%] w-[40vw] h-[40vw] max-w-[500px] rounded-full bg-[#10B981]/3 blur-[130px] pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-12 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-primary">
            Flexible Plans
          </div>
          
          <h2 className="text-3xl md:text-5xl font-satoshi font-black tracking-tight text-white leading-tight">
            Predictable Growth. Engineered Pricing.
          </h2>
          
          <p className="mt-4 text-base text-gray-400 font-satoshi font-medium leading-relaxed">
            Choose the speed of your retention optimization. Staged to support solo creators, full-time professionals, and creative agencies.
          </p>
        </div>

        {/* 1. Monthly / Annual Sliding Toggle */}
        <div className="relative flex p-1 bg-white/5 border border-white/10 rounded-full select-none mb-16 z-10 max-w-[280px]">
          <button
            onClick={() => setIsAnnual(false)}
            className={`relative px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors duration-200 cursor-pointer ${
              !isAnnual ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {!isAnnual && !shouldReduceMotion && (
              <m.div
                layoutId="active-toggle"
                className="absolute inset-0 bg-[#4F46E5] rounded-full z-0"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}
            {!isAnnual && shouldReduceMotion && (
              <div className="absolute inset-0 bg-[#4F46E5] rounded-full z-0" />
            )}
            <span className="relative z-10">Monthly</span>
          </button>
          
          <button
            onClick={() => setIsAnnual(true)}
            className={`relative px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors duration-200 cursor-pointer ${
              isAnnual ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {isAnnual && !shouldReduceMotion && (
              <m.div
                layoutId="active-toggle"
                className="absolute inset-0 bg-[#4F46E5] rounded-full z-0"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}
            {isAnnual && shouldReduceMotion && (
              <div className="absolute inset-0 bg-[#4F46E5] rounded-full z-0" />
            )}
            <span className="relative z-10">Annual (-20%)</span>
          </button>
        </div>

        {/* 2. 3-Plan Grid Container */}
        <m.div
          ref={containerRef}
          variants={shouldReduceMotion ? {} : containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 w-full relative z-10 items-stretch"
        >
          {plans.map((plan) => {
            const activePrice = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            const originalPrice = plan.priceMonthly;
            
            return (
              <m.div
                key={plan.name}
                variants={shouldReduceMotion ? {} : cardVariants}
                className={`flex flex-col justify-between bg-white/[0.03] border rounded-[20px] p-8 min-h-[500px] relative overflow-hidden transition-all duration-300 ${
                  plan.popular 
                    ? "border-[#4F46E5] shadow-[0_0_40px_rgba(79,70,229,0.25)] border-2" 
                    : "border-white/10"
                }`}
              >
                {/* Popularity Badge */}
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-[#4F46E5] text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Card Header */}
                <div className="relative z-10">
                  <span className="text-gray-400 font-satoshi font-semibold text-sm uppercase tracking-widest block">
                    {plan.name}
                  </span>
                  
                  <span className="text-white font-satoshi font-bold text-lg mt-1.5 block">
                    {plan.subheading}
                  </span>
                  
                  {/* Price readout */}
                  <div className="mt-6 flex items-baseline gap-2.5">
                    <span className="text-white font-satoshi font-black leading-none" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                      ${activePrice}
                    </span>
                    <span className="text-gray-500 font-satoshi font-semibold text-sm">
                      /mo
                    </span>
                    
                    {/* Annual strike-through indicator */}
                    {isAnnual && originalPrice > 0 && (
                      <span className="text-gray-600 font-satoshi font-bold text-sm line-through ml-1.5">
                        ${originalPrice}
                      </span>
                    )}
                  </div>
                  
                  {/* Feature Lists */}
                  <ul className="mt-8 flex flex-col gap-4">
                    {plan.features.map((feature, i) => (
                      <li 
                        key={i} 
                        className={`flex items-start gap-3 text-sm font-satoshi font-medium ${
                          feature.included ? "text-gray-200" : "text-gray-400"
                        }`}
                      >
                        <CheckCircle 
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            feature.included ? "text-[#4F46E5]" : "text-gray-500"
                          }`} 
                        />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action CTA Button */}
                <div className="mt-8 relative z-10 pt-6 border-t border-white/5 w-full">
                  <CTAButton
                    label={plan.ctaLabel}
                    href={plan.ctaHref}
                    variant={plan.ctaVariant}
                    className="w-full text-center"
                  />
                </div>

              </m.div>
            );
          })}
        </m.div>

      </div>
    </section>
  );
}
