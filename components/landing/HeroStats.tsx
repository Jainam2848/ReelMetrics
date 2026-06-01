"use client";

import React, { useRef, useEffect, useState } from "react";
import { useMotionValue, useSpring, useInView, m } from "framer-motion";

interface StatItemProps {
  value: number;
  label: string;
  subLabel: string;
  delay: number; // staggered delay in seconds
  isInView: boolean;
  formatter: (val: number) => string;
  align?: "center" | "left";
}

function AnimatedStat({ value, label, subLabel, delay, isInView, formatter, align = "left" }: StatItemProps) {
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [displayVal, setDisplayVal] = useState("0");

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionVal.set(value);
      }, delay * 1000);
      return () => clearTimeout(timer);
    } else {
      motionVal.set(0);
    }
  }, [isInView, value, delay, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on("change", (latest) => {
      setDisplayVal(formatter(latest));
    });
    return unsubscribe;
  }, [springVal, formatter]);

  const isCenter = align === "center";

  return (
    <div className={`flex flex-col select-none ${isCenter ? "items-center sm:items-start text-center sm:text-left" : "items-start text-left"}`}>
      <div className={`inline-block border-b-2 border-[#4F46E5] pb-1.5 mb-2 ${isCenter ? "mx-auto sm:mx-0" : ""}`}>
        <span className="font-outfit font-semibold text-white tracking-tight" style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}>
          {displayVal}
        </span>
      </div>
      <span className="text-[13px] font-outfit font-semibold text-white/55 leading-tight mb-1">
        {label}
      </span>
      <m.span
        initial={{ opacity: 0, y: 4 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
        transition={{
          delay: delay + 1.15,
          duration: 0.4,
          ease: "easeOut"
        }}
        className="text-[10px] font-outfit font-medium text-white/35 leading-tight"
      >
        {subLabel}
      </m.span>
    </div>
  );
}

export function HeroStats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });

  return (
    <div 
      ref={containerRef}
      className="mt-12 grid grid-cols-2 sm:flex sm:flex-row items-center gap-x-8 gap-y-6 sm:gap-8 md:gap-12 w-full max-w-xl border-t border-white/5 pt-8 select-none"
    >
      <div className="flex flex-col items-start justify-center">
        <AnimatedStat
          value={14200}
          label="Reels analyzed"
          subLabel="via creator sandbox ingestion"
          delay={0.0}
          isInView={isInView}
          formatter={(val) => Math.round(val).toLocaleString()}
        />
      </div>
      
      <div className="hidden sm:block h-10 w-[1px] bg-white/12 self-center shrink-0" />
      
      <div className="flex flex-col items-start justify-center">
        <AnimatedStat
          value={2.3}
          label="× avg retention lift"
          subLabel="vs organic baseline distribution"
          delay={0.2}
          isInView={isInView}
          formatter={(val) => val.toFixed(1) + "×"}
        />
      </div>
      
      <div className="hidden sm:block h-10 w-[1px] bg-white/12 self-center shrink-0" />
      
      <div className="col-span-2 sm:col-span-1 justify-self-center sm:justify-self-start flex flex-col items-center sm:items-start text-center sm:text-left">
        <AnimatedStat
          value={94}
          label="% hook score accuracy"
          subLabel="vs Meta Graph API skip rate data"
          delay={0.4}
          isInView={isInView}
          formatter={(val) => Math.round(val) + "%"}
          align="center"
        />
      </div>
    </div>
  );
}
