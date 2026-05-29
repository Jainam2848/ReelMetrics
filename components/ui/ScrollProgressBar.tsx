"use client";

import React from "react";
import { m, useScroll, useSpring } from "framer-motion";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] bg-white/5 z-[9999] pointer-events-none select-none">
      <m.div
        className="h-full w-full bg-gradient-to-r from-[#4F46E5] to-[#EC4899] origin-left"
        style={{
          scaleX: smoothProgress,
          willChange: "transform",
        }}
      />
    </div>
  );
}
