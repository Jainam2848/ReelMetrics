import { useReducer, useRef, useEffect, useCallback } from "react";

export type AnalysisStatus = "idle" | "scanning" | "analyzing" | "complete";

export interface AnalysisState {
  status: AnalysisStatus;
  url: string;
  typingStep: number;
  activeDimensionIndex: number;
}

type AnalysisAction =
  | { type: "START_SCANNING"; payload: { url: string } }
  | { type: "SET_TYPING_STEP"; payload: number }
  | { type: "START_ANALYZING" }
  | { type: "SET_ACTIVE_DIMENSION"; payload: number }
  | { type: "SET_COMPLETE" }
  | { type: "RESET" }
  | { type: "SET_URL"; payload: string };

const initialState: AnalysisState = {
  status: "idle",
  url: "",
  typingStep: 0,
  activeDimensionIndex: -1,
};

function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case "START_SCANNING":
      return {
        ...state,
        status: "scanning",
        url: action.payload.url,
        typingStep: 0,
        activeDimensionIndex: -1,
      };
    case "SET_TYPING_STEP":
      return {
        ...state,
        typingStep: action.payload,
      };
    case "START_ANALYZING":
      return {
        ...state,
        status: "analyzing",
        activeDimensionIndex: -1,
      };
    case "SET_ACTIVE_DIMENSION":
      return {
        ...state,
        activeDimensionIndex: action.payload,
      };
    case "SET_COMPLETE":
      return {
        ...state,
        status: "complete",
        activeDimensionIndex: 8, // All dimensions are fully complete
      };
    case "SET_URL":
      return {
        ...state,
        url: action.payload,
      };
    case "RESET":
      return {
        ...initialState,
      };
    default:
      return state;
  }
}

export function useAnalysisTimeline() {
  const [state, dispatch] = useReducer(analysisReducer, initialState);
  const timeoutsRef = useRef<number[]>([]);

  // Safely clear all choreographed timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];
  }, []);

  // Make sure we clear timeouts on component unmount
  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  const startAnalysis = useCallback((inputUrl: string) => {
    if (!inputUrl) return;

    clearAllTimeouts();

    // 1. Immediately initiate scanning (Phase 1)
    dispatch({ type: "START_SCANNING", payload: { url: inputUrl } });

    // Choreograph typing of fake resolution/duration specs staggered over the scanning duration (0ms - 1200ms)
    const t1 = window.setTimeout(() => {
      dispatch({ type: "SET_TYPING_STEP", payload: 1 });
    }, 300);

    const t2 = window.setTimeout(() => {
      dispatch({ type: "SET_TYPING_STEP", payload: 2 });
    }, 600);

    const t3 = window.setTimeout(() => {
      dispatch({ type: "SET_TYPING_STEP", payload: 3 });
    }, 900);

    // 2. Transition to Analyzing (Phase 2) at 1200ms
    const t4 = window.setTimeout(() => {
      dispatch({ type: "START_ANALYZING" });
    }, 1200);

    timeoutsRef.current.push(t1, t2, t3, t4);

    // Choreograph the 9 dimension rows appearing/filling staggered by 180ms each.
    // Each row's width starts expanding as soon as its index becomes active.
    for (let i = 0; i < 9; i++) {
      const tDim = window.setTimeout(() => {
        dispatch({ type: "SET_ACTIVE_DIMENSION", payload: i });
      }, 1200 + i * 180);
      timeoutsRef.current.push(tDim);
    }

    // 3. Transition to Complete (Phase 3) at 3200ms
    const tComplete = window.setTimeout(() => {
      dispatch({ type: "SET_COMPLETE" });
    }, 3200);

    timeoutsRef.current.push(tComplete);
  }, [clearAllTimeouts]);

  const reset = useCallback(() => {
    clearAllTimeouts();
    dispatch({ type: "RESET" });
  }, [clearAllTimeouts]);

  const loadDemo = useCallback(() => {
    const demoUrl = "instagram.com/reel/demo_trendoraa_example";
    dispatch({ type: "SET_URL", payload: demoUrl });

    clearAllTimeouts();

    // Small delay (600ms) to let the user see the URL fill in before starting analysis
    const tDemoStart = window.setTimeout(() => {
      startAnalysis(demoUrl);
    }, 600);

    timeoutsRef.current.push(tDemoStart);
  }, [startAnalysis, clearAllTimeouts]);

  const setUrl = useCallback((newUrl: string) => {
    dispatch({ type: "SET_URL", payload: newUrl });
  }, []);

  return {
    state,
    startAnalysis,
    reset,
    loadDemo,
    setUrl,
  };
}
