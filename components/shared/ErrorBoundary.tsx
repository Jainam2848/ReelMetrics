"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full p-8 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-[12px] flex flex-col items-center justify-center text-center my-6 max-w-lg mx-auto select-none">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight mb-2">
            Failed to Load Section
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-6 max-w-[32ch]">
            An unexpected error occurred while loading this interactive component.
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
