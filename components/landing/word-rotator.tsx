"use client";

import React, { useEffect, useState } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";

const words = ["Growth Engine", "Revenue Driver", "Viral Machine"];

export function WordRotator() {
  const [index, setIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-flex justify-center items-center overflow-hidden min-w-[9.5em] h-[1.25em] align-middle">
      <AnimatePresence mode="wait">
        <m.span
          key={index}
          initial={shouldReduceMotion ? { opacity: 0 } : { y: 35, opacity: 0, filter: "blur(4px)" }}
          animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={shouldReduceMotion ? { opacity: 0 } : { y: -35, opacity: 0, filter: "blur(4px)" }}
          transition={shouldReduceMotion ? { duration: 0.25 } : { type: "spring", stiffness: 120, damping: 14 }}
          className="absolute text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent font-display font-black tracking-tight text-center whitespace-nowrap py-1"
        >
          {words[index]}
        </m.span>
      </AnimatePresence>
    </span>
  );
}
