"use client";

import React from "react";
import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";

interface CTAButtonProps {
  label: string;
  href?: string;
  variant?: "primary" | "ghost";
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  className?: string;
}

export function CTAButton({
  label,
  href,
  variant = "primary",
  onClick,
  className = ""
}: CTAButtonProps) {
  const shouldReduceMotion = useReducedMotion();

  const isPrimary = variant === "primary";
  
  const baseClasses = "relative overflow-hidden inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors duration-300 z-10 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090D]";
  
  const variantClasses = isPrimary
    ? "text-white bg-[#4F46E5] hover:bg-[#4F46E5]/90 border border-transparent shadow-glow"
    : "text-white bg-transparent hover:bg-[#4F46E5]/10 border border-[#4F46E5]";

  const buttonContent = (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cta-shimmer {
          0% { transform: translate3d(-100%, 0, 0) skewX(-15deg); }
          100% { transform: translate3d(200%, 0, 0) skewX(-15deg); }
        }
        
        @keyframes cta-pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.45;
          }
          50% {
            opacity: 0.25;
          }
          100% {
            transform: scale(1.22);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          .cta-btn-wrapper::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 50%;
            height: 100%;
            background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.3) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: translate3d(-100%, 0, 0) skewX(-15deg);
            transition: none;
            pointer-events: none;
            z-index: 1;
          }
          
          .cta-btn-wrapper:hover::after {
            animation: cta-shimmer 0.5s linear;
          }

          .cta-btn-wrapper::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: inherit;
            border: 2px solid #4F46E5;
            animation: cta-pulse 4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
            pointer-events: none;
            z-index: -1;
            transition: opacity 0.3s;
          }
          
          .cta-btn-wrapper:hover::before {
            opacity: 0;
          }
        }
      `}} />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-block w-full sm:w-auto">
        <m.div
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`${baseClasses} ${variantClasses} cta-btn-wrapper w-full sm:w-auto ${className}`}
        >
          {buttonContent}
        </m.div>
      </Link>
    );
  }

  return (
    <m.button
      onClick={onClick}
      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`${baseClasses} ${variantClasses} cta-btn-wrapper w-full sm:w-auto ${className}`}
    >
      {buttonContent}
    </m.button>
  );
}
