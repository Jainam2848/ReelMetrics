/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";

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
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
    }
  }, [isActive]);

  const handleAnimationComplete = () => {
    if (isActive) {
      onComplete?.();
      setShouldRender(false);
    }
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {shouldRender && isActive && (
        <m.div
          initial={{ y: "-100%" }}
          animate={{ y: ["-100%", "0%", "100%"] }}
          transition={{
            times: [0, 0.45, 1],
            duration: 1.1,
            ease: [0.76, 0, 0.24, 1], // Custom cubic-bezier for a luxury slide feel
          }}
          onUpdate={(latest: any) => {
            // Check when the sweep covers the center (y is roughly between -5% and 5% or when it hits 0%)
            const yVal = parseFloat(latest.y);
            if (Math.abs(yVal) < 2) {
              onHalfway?.();
            }
          }}
          className="fixed inset-0 w-full h-full pointer-events-none select-none z-50 bg-gradient-to-b from-[#6C5CE7] via-[#FD79A8] to-[#00B894]"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}
