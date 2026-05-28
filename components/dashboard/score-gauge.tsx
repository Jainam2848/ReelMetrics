"use client";

import React, { useState, useEffect } from "react";
import { m, useReducedMotion } from "framer-motion";

interface ScoreGaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreGauge({
  score,
  size = 140,
  strokeWidth = 12,
  className = "",
}: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Circle dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;


  // Numerical Count-up Animation
  useEffect(() => {
    if (shouldReduceMotion) {
      const handle = requestAnimationFrame(() => {
        setDisplayScore(score);
      });
      return () => cancelAnimationFrame(handle);
    }

    let start = 0;
    const end = Math.min(100, Math.max(0, score));
    if (end === 0) {
      const handle = requestAnimationFrame(() => {
        setDisplayScore(0);
      });
      return () => cancelAnimationFrame(handle);
    }

    const duration = 1200; // 1.2 seconds to match spec §10.5
    const stepTime = Math.max(10, Math.floor(duration / end));
    
    const timer = setInterval(() => {
      start += 1;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score, shouldReduceMotion]);

  // Color thresholding: green > 70, yellow > 40, red <= 40
  const getColors = (val: number) => {
    if (val > 70) {
      return {
        stroke: "url(#green-gradient)",
        text: "text-emerald-400",
        label: "Excellent",
      };
    }
    if (val > 40) {
      return {
        stroke: "url(#yellow-gradient)",
        text: "text-yellow-400",
        label: "Average",
      };
    }
    return {
      stroke: "url(#red-gradient)",
      text: "text-destructive",
      label: "Critical",
    };
  };

  const themeColors = getColors(score);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`AI Evaluation Score: ${score} out of 100 — Rated ${themeColors.label}.`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
      >
        {/* SVG Gradients for beautiful visual premium gradients */}
        <defs>
          <linearGradient id="green-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00B894" />
            <stop offset="100%" stopColor="#55EFC4" />
          </linearGradient>
          <linearGradient id="yellow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDCB6E" />
            <stop offset="100%" stopColor="#FFEAA7" />
          </linearGradient>
          <linearGradient id="red-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E17055" />
            <stop offset="100%" stopColor="#FAB1A0" />
          </linearGradient>
        </defs>

        {/* Outer Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#252530"
          strokeWidth={strokeWidth}
        />

        {/* Inner Colored Animated Fill Arc */}
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={themeColors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 1.5, ease: [0.16, 1, 0.3, 1] } // custom easeOutExpo (1.5s per spec)
          }
          strokeLinecap="round"
          style={{ willChange: "transform" }}
        />
      </svg>

      {/* Central Value Indicators */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-bold font-display tracking-tighter text-white">
          {displayScore}
        </span>
        <span className={`text-[9px] uppercase font-bold tracking-widest ${themeColors.text} mt-0.5`}>
          {themeColors.label}
        </span>
      </div>
    </div>
  );
}
