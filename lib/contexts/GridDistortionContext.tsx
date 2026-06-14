"use client";

import React, { createContext, useContext, useMemo } from "react";
import { MotionValue, useMotionValue } from "framer-motion";

interface GridDistortionContextValue {
  normalizedX: MotionValue<number>;
  normalizedY: MotionValue<number>;
}

const GridDistortionContext = createContext<GridDistortionContextValue | null>(null);

export function GridDistortionProvider({ children }: { children: React.ReactNode }) {
  const normalizedX = useMotionValue(50);
  const normalizedY = useMotionValue(50);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      normalizedX.set(x);
      normalizedY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [normalizedX, normalizedY]);

  const value = useMemo(
    () => ({ normalizedX, normalizedY }),
    [normalizedX, normalizedY]
  );

  return (
    <GridDistortionContext.Provider value={value}>
      {children}
    </GridDistortionContext.Provider>
  );
}

export function useGridDistortion() {
  const ctx = useContext(GridDistortionContext);
  if (!ctx) {
    // Graceful degradation — return inert motion values if used outside the provider
    return {
      normalizedX: { get: () => 50, set: () => {} } as unknown as MotionValue<number>,
      normalizedY: { get: () => 50, set: () => {} } as unknown as MotionValue<number>,
    };
  }
  return ctx;
}
