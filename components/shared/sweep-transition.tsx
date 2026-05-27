/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface SweepTransitionProps {
  isActive: boolean;
  onHalfway?: () => void;
  onComplete?: () => void;
}

export function SweepTransition({
  isActive,
  onHalfway,
  onComplete,
}: SweepTransitionProps) {
  const isReducedMotion = useReducedMotion();
  const [shouldRender, setShouldRender] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animeLoaded = useRef(false);
  const animeInstance = useRef<any>(null);

  // Dynamic import of AnimeJS to avoid SSR bundle errors
  useEffect(() => {
    import("animejs").then((module) => {
      animeInstance.current = (module as any).default || module;
      animeLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (shouldRender) {
        requestAnimationFrame(() => {
          setShouldRender(false);
        });
      }
      return;
    }

    if (!shouldRender) {
      requestAnimationFrame(() => {
        setShouldRender(true);
      });
    }

    // Bypassing animations for reduced motion accessibility
    if (isReducedMotion) {
      const timerHalf = setTimeout(() => {
        onHalfway?.();
      }, 300);

      const timerEnd = setTimeout(() => {
        onComplete?.();
        setShouldRender(false);
      }, 600);

      return () => {
        clearTimeout(timerHalf);
        clearTimeout(timerEnd);
      };
    }

    // Standard high-fidelity liquid animation timeline
    const runAnimation = async () => {
      // Small delay to ensure AnimeJS is loaded and component has mounted
      while (!animeLoaded.current || !pathRef.current) {
        await new Promise((r) => setTimeout(r, 50));
      }

      const anime = animeInstance.current;
      const path = pathRef.current;

      // Reset path to top flat state
      path.setAttribute("d", "M 0 0 L 100 0 L 100 0 Q 50 0 0 0 Z");

      const timeline = anime.timeline({
        complete: () => {
          onComplete?.();
          setShouldRender(false);
        },
      });

      // Liquid SVG Waves coordinate specs
      const flatTop = "M 0 0 L 100 0 L 100 0 Q 50 0 0 0 Z";
      const curvedSweepIn = "M 0 0 L 100 0 L 100 40 Q 50 90 0 40 Z";
      const fullScreen = "M 0 0 L 100 0 L 100 100 L 0 100 Z";
      const curvedSweepOut = "M 0 100 L 100 100 L 100 65 Q 50 10 0 65 Z";
      const flatBottom = "M 0 100 L 100 100 L 100 100 Q 50 100 0 100 Z";

      timeline
        // 1. Sweep In: flat top -> dynamic curvy wave -> fully cover
        .add({
          targets: path,
          d: [flatTop, curvedSweepIn],
          duration: 450,
          easing: "easeInQuad",
        })
        .add({
          targets: path,
          d: [curvedSweepIn, fullScreen],
          duration: 350,
          easing: "easeOutQuad",
          changeBegin: () => {
            // Trigger halfway callback (perfect layout swap masking point)
            setTimeout(() => {
              onHalfway?.();
            }, 100);
          },
        })
        // 2. Short pause when covered
        .add({
          targets: containerRef.current,
          opacity: [1, 1],
          duration: 150,
        })
        // 3. Sweep Out: fully cover -> reverse curvy wave -> clear bottom
        .add({
          targets: path,
          d: [fullScreen, curvedSweepOut],
          duration: 400,
          easing: "easeInSine",
        })
        .add({
          targets: path,
          d: [curvedSweepOut, flatBottom],
          duration: 350,
          easing: "easeOutSine",
        });
    };

    runAnimation();

    const currentPath = pathRef.current;
    return () => {
      if (animeInstance.current && currentPath) {
        animeInstance.current.remove(currentPath);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isReducedMotion, onHalfway, onComplete]);

  if (!shouldRender) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none select-none z-50 flex items-center justify-center"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sweep-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6C5CE7" />
            <stop offset="50%" stopColor="#FD79A8" />
            <stop offset="100%" stopColor="#00B894" />
          </linearGradient>
        </defs>

        <path
          ref={pathRef}
          fill="url(#sweep-gradient)"
          className="w-full h-full"
        />
      </svg>
    </div>
  );
}
