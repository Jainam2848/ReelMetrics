"use client";

import React from "react";
import { m } from "framer-motion";

interface InsightRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function InsightReveal({ text, className, delay = 0 }: InsightRevealProps) {
  // Split text into words to wrap them in spans
  const words = text.split(" ");

  // Container variants for clean, fast stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
        delayChildren: delay / 1000,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 3 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1] as const, // easeOutExponential
      },
    },
  };

  return (
    <m.p
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`font-sans leading-relaxed tracking-wide ${className}`}
    >
      {words.map((word, index) => (
        <m.span
          key={index}
          variants={wordVariants}
          className="inline-block"
          style={{ marginRight: "0.25em" }}
        >
          {word}
        </m.span>
      ))}
    </m.p>
  );
}
