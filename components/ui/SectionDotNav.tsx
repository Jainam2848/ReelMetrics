"use client";

import React, { useEffect, useState } from "react";
import { m } from "framer-motion";

const SECTIONS = [
  { id: "section-hero", label: "Hero" },
  { id: "section-how-it-works", label: "How It Works" },
  { id: "section-features", label: "Features" },
  { id: "section-testimonials", label: "Testimonials" },
  { id: "section-pricing", label: "Pricing" },
  { id: "section-footer", label: "Footer" },
];

export function SectionDotNav() {
  const [activeSection, setActiveSection] = useState("section-hero");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Media Query check for mobile viewports or touch interfaces
    const mediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    setIsMobile(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;

    // Use IntersectionObserver with optimized margins to focus on center viewport area
    const observerOptions = {
      root: null,
      rootMargin: "-25% 0px -25% 0px",
      threshold: 0.2, // optimized trigger for sections of varying vertical heights
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // Find the entry currently crossing/entering viewport with focus
      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        setActiveSection(visibleEntry.target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isMobile]);

  const handleDotClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isMobile) return null;

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 select-none pointer-events-auto">
      {SECTIONS.map((sec) => {
        const isActive = activeSection === sec.id;
        
        return (
          <div key={sec.id} className="relative flex items-center justify-end group">
            {/* Tooltip containing the section label */}
            <span className="mr-4 px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-white font-mono text-[11px] font-bold tracking-wider tracking-tight uppercase opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
              {sec.label}
            </span>
            
            {/* Dot Button */}
            <button
              onClick={() => handleDotClick(sec.id)}
              className="relative flex items-center justify-center w-6 h-6 focus:outline-none cursor-pointer"
              aria-label={`Scroll to ${sec.label}`}
            >
              <m.div
                animate={{
                  scale: isActive ? 1.8 : 1,
                  backgroundColor: isActive ? "#4F46E5" : "rgba(255,255,255,0.2)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                style={{
                  width: "6px",
                  height: "6px",
                }}
                className="rounded-full shadow-glow"
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
