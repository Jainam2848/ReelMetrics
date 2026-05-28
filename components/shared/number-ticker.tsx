"use client";

import React, { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useInView } from "framer-motion";

interface NumberTickerProps {
  value: number;
  className?: string;
  delay?: number;
}

export function NumberTicker({
  value,
  className = "",
  delay = 0,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 60,
    damping: 15,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(value);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [motionValue, isInView, value, delay]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-US").format(
          Math.round(latest)
        );
      }
    });
  }, [springValue]);

  return (
    <span 
      ref={ref} 
      className={`inline-block tabular-nums text-white font-bold ${className}`}
    >
      0
    </span>
  );
}
