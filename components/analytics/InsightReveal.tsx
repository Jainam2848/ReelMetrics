"use client";

import React, { useEffect, useRef } from "react";
import anime from "animejs";

interface InsightRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function InsightReveal({ text, className, delay = 0 }: InsightRevealProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // We animate individual words for a premium storytelling effect
    const words = containerRef.current.querySelectorAll(".insight-word");
    
    // Anime.js cinematic reveal
    anime({
      targets: words,
      opacity: [0, 1],
      translateY: [4, 0],
      filter: ["blur(4px)", "blur(0px)"],
      easing: "easeOutExpo",
      duration: 800,
      delay: anime.stagger(40, { start: delay }), // Smooth staggered word appearance
    });

    return () => {
      anime.remove(words);
    };
  }, [text, delay]);

  // Split text into words to wrap them in spans
  const renderText = () => {
    return text.split(" ").map((word, index) => (
      <span
        key={index}
        className="insight-word inline-block opacity-0 filter blur-sm"
        style={{ marginRight: "0.25em" }}
      >
        {word}
      </span>
    ));
  };

  return (
    <p ref={containerRef} className={`font-sans leading-relaxed ${className}`}>
      {renderText()}
    </p>
  );
}
