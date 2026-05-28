"use client";

import React, { useEffect, useRef } from "react";
import anime from "animejs";

interface GraphAnimatorProps {
  children: React.ReactNode;
  delay?: number;
}

export function GraphAnimator({ children, delay = 0 }: GraphAnimatorProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgContainerRef.current) return;

    // Find all paths inside the SVG that we might want to draw
    const paths = svgContainerRef.current.querySelectorAll("path");
    
    // Smooth line drawing animation
    anime({
      targets: paths,
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: "easeInOutSine",
      duration: 1500,
      delay: function (el, i) {
        return delay + i * 250;
      },
      opacity: [0, 1],
    });
    
    // Also find any dots/circles representing data points
    const points = svgContainerRef.current.querySelectorAll("circle");
    if (points.length > 0) {
      anime({
        targets: points,
        opacity: [0, 1],
        scale: [0, 1],
        easing: "easeOutElastic(1, .8)",
        duration: 800,
        delay: anime.stagger(100, { start: delay + 500 }),
      });
    }

    return () => {
      anime.remove(paths);
      if (points.length > 0) anime.remove(points);
    };
  }, [delay]);

  return (
    <div ref={svgContainerRef} className="w-full h-full">
      {children}
    </div>
  );
}
