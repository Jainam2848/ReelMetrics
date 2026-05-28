"use client";

import React from "react";
import { m, useMotionValue, useMotionTemplate, useReducedMotion, HTMLMotionProps } from "framer-motion";
import { SPRING_PRESETS } from "./performance-motion";

interface SpotlightCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightRadius?: number;
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(79, 70, 229, 0.12)", // Elegant Indigo/Brand primary light reflection
  spotlightRadius = 300,
  ...props
}: SpotlightCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    if (shouldReduceMotion) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = useMotionTemplate`
    radial-gradient(
      ${spotlightRadius}px circle at ${mouseX}px ${mouseY}px,
      ${spotlightColor},
      transparent 80%
    )
  `;

  const borderBackground = useMotionTemplate`
    radial-gradient(
      ${spotlightRadius * 0.6}px circle at ${mouseX}px ${mouseY}px,
      rgba(255, 255, 255, 0.15),
      transparent 80%
    )
  `;

  return (
    <m.div
      onMouseMove={handleMouseMove}
      whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -4 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      transition={SPRING_PRESETS.snappy}
      style={{ willChange: "transform" }}
      className={`group relative overflow-hidden rounded-2xl border border-glass bg-[#08090D] flex flex-col h-full transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Spotlight Border (only visible on hover) */}
      {!shouldReduceMotion && (
        <m.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
          style={{
            background: borderBackground,
          }}
        />
      )}

      {/* Card Content container (with subtle overlay background) */}
      <div className="relative rounded-[15px] bg-[#0c0d12]/95 flex-grow flex flex-col z-10 overflow-hidden">
        {/* Soft center shine (following mouse) */}
        {!shouldReduceMotion && (
          <m.div
            className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
            style={{
              background,
            }}
          />
        )}
        <div className="relative z-10 flex flex-col flex-grow w-full">
          {children}
        </div>
      </div>
    </m.div>
  );
}
