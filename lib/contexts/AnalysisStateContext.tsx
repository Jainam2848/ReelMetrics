"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type AnalysisStatus = "idle" | "scanning" | "analyzing" | "complete";

interface AnalysisStateContextValue {
  analysisState: AnalysisStatus;
  setAnalysisState: (state: AnalysisStatus) => void;
}

const AnalysisStateContext = createContext<AnalysisStateContextValue | null>(null);

export function AnalysisStateProvider({ children }: { children: React.ReactNode }) {
  const [analysisState, setAnalysisStateRaw] = useState<AnalysisStatus>("idle");

  const setAnalysisState = useCallback((state: AnalysisStatus) => {
    setAnalysisStateRaw(state);
  }, []);

  return (
    <AnalysisStateContext.Provider value={{ analysisState, setAnalysisState }}>
      {children}
    </AnalysisStateContext.Provider>
  );
}

export function useAnalysisState() {
  const ctx = useContext(AnalysisStateContext);
  if (!ctx) {
    // Graceful degradation — return inert values if used outside the provider
    return {
      analysisState: "idle" as AnalysisStatus,
      setAnalysisState: (_: AnalysisStatus) => {},
    };
  }
  return ctx;
}
