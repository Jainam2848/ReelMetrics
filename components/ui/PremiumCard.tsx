"use client";

import { HTMLMotionProps, m, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface PremiumCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glowColor?: "blue" | "green" | "pink" | "none";
  delay?: number;
}

export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  (
    { children, className, glowColor = "none", delay = 0, ...props },
    ref
  ) => {
    // Glassmorphism classes + tailored shadow hover
    const baseClasses =
      "relative overflow-hidden rounded-[var(--radius-lg)] border border-glass bg-glass backdrop-blur-md transition-all duration-500 ease-out bg-[#14141A]/60";
    
    let glowHoverClass = "";
    if (glowColor === "blue") glowHoverClass = "hover:shadow-glow";
    if (glowColor === "green") glowHoverClass = "hover:shadow-glow-green";
    if (glowColor === "pink") glowHoverClass = "hover:shadow-glow-pink";

    const defaultVariants: Variants = {
      hidden: { opacity: 0, y: 8 },
      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20, delay } }
    };

    return (
      <m.div
        ref={ref}
        variants={props.variants || defaultVariants}
        // Let the parent define initial/animate, or rely on explicit props passed down

        whileHover={{
          y: -2,
          transition: { duration: 0.2 },
        }}
        className={cn(baseClasses, glowHoverClass, className)}
        {...props}
      >
        {/* Subtle top highlight for 3D depth */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10">{children}</div>
      </m.div>
    );
  }
);
PremiumCard.displayName = "PremiumCard";
