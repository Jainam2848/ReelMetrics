"use client";

import React, { createContext, useContext, useMemo } from "react";
import { MotionValue, useMotionValue } from "framer-motion";

interface GridDistortionContextValue {
  normalizedX: MotionValue<number>;
  normalizedY: MotionValue<number>;
}

const GridDistortionContext = createContext<GridDistortionContextValue | null>(null);

export function GridDistortionProvider({ children }: { children: React.ReactNode }) {
  const normalizedX = useMotionValue(0.5);
  const normalizedY = useMotionValue(0.5);

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
      normalizedX: { get: () => 0.5, set: () => {} } as unknown as MotionValue<number>,
      normalizedY: { get: () => 0.5, set: () => {} } as unknown as MotionValue<number>,
    };
  }
  return ctx;
}
