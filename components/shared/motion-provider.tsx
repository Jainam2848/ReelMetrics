"use client";

import React from "react";
import { LazyMotion, domMax } from "framer-motion";

interface MotionProviderProps {
  children: React.ReactNode;
}

/**
 * MotionProvider wraps the app or layout using Framer Motion's LazyMotion.
 * Upgraded to domMax to support interactive drag and dynamic gestures
 * (e.g. for the scrubbing retention curve and testimonial swipe features).
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  );
}
