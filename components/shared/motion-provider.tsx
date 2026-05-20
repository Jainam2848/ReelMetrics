"use client";

import React from "react";
import { LazyMotion, domAnimation } from "framer-motion";

interface MotionProviderProps {
  children: React.ReactNode;
}

/**
 * MotionProvider wraps the app or layout using Framer Motion's LazyMotion.
 * This guarantees that only the lightweight domAnimation subset (transforms and opacity)
 * is loaded, preventing synchronous bundling of heavy features like drag, gestures, or layout layout animations.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
