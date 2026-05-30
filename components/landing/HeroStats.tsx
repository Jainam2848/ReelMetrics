"use client";

import React, { useRef, useEffect, useState } from "react";
import { useMotionValue, useSpring, useInView } from "framer-motion";

interface StatItemProps {
  value: number;
  label: string;
  delay: number; // staggered delay in seconds
  isInView: boolean;
  formatter: (val: number) => string;
}

function AnimatedStat({ value, label, delay, isInView, formatter }: StatItemProps) {
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

  return (
    <div className="flex flex-col items-start select-none">
      <div className="inline-block border-b-2 border-[#4F46E5] pb-1.5 mb-2">
        <span className="font-outfit font-semibold text-white tracking-tight" style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}>
          {displayVal}
        </span>
      </div>
      <span className="text-[13px] font-outfit font-semibold text-white/55 leading-none">
        {label}
      </span>
    </div>
  );
}

export function HeroStats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });

  return (
    <div 
      ref={containerRef}
      className="mt-12 flex flex-row items-center gap-8 md:gap-12 w-full max-w-xl border-t border-white/5 pt-8 select-none"
    >
      <AnimatedStat
        value={14200}
        label="Reels analyzed"
        delay={0.0}
        isInView={isInView}
        formatter={(val) => Math.round(val).toLocaleString()}
      />
      
      <div className="h-10 w-[1px] bg-white/12 self-center shrink-0" />
      
      <AnimatedStat
        value={2.3}
        label="× avg retention lift"
        delay={0.2}
        isInView={isInView}
        formatter={(val) => val.toFixed(1) + "×"}
      />
      
      <div className="h-10 w-[1px] bg-white/12 self-center shrink-0" />
      
      <AnimatedStat
        value={94}
        label="% hook score accuracy"
        delay={0.4}
        isInView={isInView}
        formatter={(val) => Math.round(val) + "%"}
      />
    </div>
  );
}
