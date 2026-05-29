"use client";

import React, { useRef } from "react";
import { m, useInView, useReducedMotion } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
}

/**
 * ScrollReveal Component
 * Fades and glides page sections upward into view using GPU-accelerated transforms.
 * Integrates perfectly with LazyMotion strict rules, automatically bypassing
 * animation properties on browsers with prefers-reduced-motion active.
 */
export function ScrollReveal({ children }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  
  // Triggers once the section top hits 100px into the viewport
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  if (shouldReduceMotion) {
    return <div ref={ref}>{children}</div>;
  }

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 40, filter: "blur(6px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </m.div>
  );
}
