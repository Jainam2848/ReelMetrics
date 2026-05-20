"use client";

import React from "react";
import { m, useReducedMotion, HTMLMotionProps } from "framer-motion";

// Standardized, high-performance spring equations from §10.5 spec
export const SPRING_PRESETS = {
  gentle: {
    type: "spring" as const,
    stiffness: 80,
    damping: 15,
    mass: 1,
  },
  bouncy: {
    type: "spring" as const,
    stiffness: 150,
    damping: 12,
    mass: 1,
  },
  snappy: {
    type: "spring" as const,
    stiffness: 200,
    damping: 20,
    mass: 0.8,
  },
};

// Re-export AnimatePresence for exit animations
export { AnimatePresence } from "framer-motion";

/**
 * Re-export 'm' under strict dynamic loading guidelines.
 * Note: Developers MUST import from this file instead of synchronously importing 'motion' from 'framer-motion'.
 */
export { m as performanceMotion } from "framer-motion";

interface PerformanceWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

/**
 * A highly optimized page transition wrapper that translates only y and opacity.
 */
export function FadeInPage({ children, ...props }: PerformanceWrapperProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: shouldReduceMotion ? 0 : -10 },
  };

  return (
    <m.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={SPRING_PRESETS.gentle}
      style={{ willChange: "transform, opacity" }}
      {...props}
    >
      {children}
    </m.div>
  );
}

/**
 * High-performance Bento Grid stat card wrapper.
 * Employs scale-only and translate-y transitions for ultra-smooth 60/120fps feel.
 * Promotes rendering to GPU layer via willChange style to avoid painting bottlenecks.
 */
export function BentoCardMotion({ children, ...props }: PerformanceWrapperProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <m.div
      whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -4 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      transition={SPRING_PRESETS.snappy}
      style={{ willChange: "transform" }}
      {...props}
    >
      {children}
    </m.div>
  );
}

/**
 * StaggerContainer coordinates staggered entrances of children grid elements.
 */
export function StaggerContainer({ children, ...props }: PerformanceWrapperProps) {
  const variants = {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <m.div
      animate="animate"
      variants={variants}
      {...props}
    >
      {children}
    </m.div>
  );
}

/**
 * StaggerItem represents a grid cell or list element inside a StaggerContainer.
 */
export function StaggerItem({ children, ...props }: PerformanceWrapperProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <m.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={SPRING_PRESETS.gentle}
      style={{ willChange: "transform, opacity" }}
      {...props}
    >
      {children}
    </m.div>
  );
}

interface AnimatedGaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * High-performance, hardware-accelerated animated arc fill gauge.
 * Uses a pure CSS transition or SVG dynamic stroke pathLength animation
 * to fill the circular gauge correctly. Avoids heavy canvas/main thread logic.
 */
export function AnimatedGauge({
  score,
  size = 120,
  strokeWidth = 10,
  className = "",
}: AnimatedGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const shouldReduceMotion = useReducedMotion();

  // Color code based on score: green >70, yellow >40, red <=40
  const getColor = (val: number) => {
    if (val > 70) return "#00B894"; // green
    if (val > 40) return "#FFEAA7"; // yellow
    return "#FF7675"; // red
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        {/* Background Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#2D3436"
          strokeWidth={strokeWidth}
        />
        {/* Foreground Animated Score Arc */}
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 1.2, ease: [0.16, 1, 0.3, 1] } // Custom easeOutExpo
          }
          strokeLinecap="round"
        />
      </svg>
      {/* Visual Text Indicator to comply with color accessibility */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight text-white">{score}</span>
        <span className="text-[10px] uppercase font-semibold text-gray-400">Score</span>
      </div>
    </div>
  );
}
