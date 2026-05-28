"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

export function HowItWorksConnector() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

    const ctx = gsap.context(() => {
      if (!pathRef.current || !dotRef.current || !containerRef.current) return;

      // Set initial centering offsets for SVG dot
      gsap.set(dotRef.current, {
        xPercent: -50,
        yPercent: -50,
        transformOrigin: "50% 50%"
      });

      // Animate the tracking dot precisely along the curved path on scroll entry
      gsap.to(dotRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          end: "bottom 40%",
          scrub: 1.5,
          onEnter: () => {
            if (dotRef.current) dotRef.current.style.willChange = "transform";
          },
          onLeave: () => {
            if (dotRef.current) dotRef.current.style.willChange = "";
          },
          onEnterBack: () => {
            if (dotRef.current) dotRef.current.style.willChange = "transform";
          },
          onLeaveBack: () => {
            if (dotRef.current) dotRef.current.style.willChange = "";
          }
        },
        motionPath: {
          path: pathRef.current,
          align: pathRef.current,
          alignOrigin: [0.5, 0.5],
        },
        ease: "none",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute top-1/2 left-[12%] right-[12%] -translate-y-1/2 h-20 pointer-events-none hidden lg:block z-0"
    >
      <svg 
        viewBox="0 0 1000 80" 
        className="w-full h-full overflow-visible" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Core Curved Dashed Connector Line */}
        <path
          ref={pathRef}
          d="M 20 40 C 250 -10, 250 90, 500 40 C 750 -10, 750 90, 980 40"
          stroke="rgba(79, 70, 229, 0.15)"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        
        {/* Glowing tracking indicator dot */}
        <circle
          ref={dotRef}
          r="6.5"
          fill="#10B981"
          style={{
            filter: "drop-shadow(0 0 6px #10B981) drop-shadow(0 0 12px #4F46E5)",
          }}
        />
      </svg>
    </div>
  );
}
