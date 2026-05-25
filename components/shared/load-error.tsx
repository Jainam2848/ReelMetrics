"use client";

import React, { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { describeApiError } from "@/lib/api/client-fetcher";

interface LoadErrorProps {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void | Promise<unknown>;
  variant?: "card" | "inline";
}

/**
 * Standard "we couldn't load this" state with retry. Use whenever a query/SWR
 * call returns an error so the UI never silently falls back to an empty state
 * (which would otherwise look identical to "no data").
 */
export function LoadError({
  title = "Couldn't load this view",
  description,
  error,
  onRetry,
  variant = "card",
}: LoadErrorProps) {
  const [retrying, setRetrying] = useState(false);

  const errorMessage =
    description ||
    (error ? describeApiError(error) : null) ||
    "The request to our API failed. Check your connection or try again.";

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  if (variant === "inline") {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-100"
      >
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-grow">
          <p className="font-bold text-white">{title}</p>
          <p className="text-red-100/80 mt-0.5">{errorMessage}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="shrink-0 px-3 py-1 rounded-lg border border-red-500/30 bg-red-500/15 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-red-500/25 active:scale-95 disabled:opacity-50"
          >
            {retrying ? "Retrying…" : "Retry"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="w-full p-6 sm:p-8 rounded-2xl border border-red-500/30 bg-red-500/5 backdrop-blur-md flex flex-col items-center text-center"
    >
      <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="text-base font-display font-extrabold text-white mb-2">
        {title}
      </h3>
      <p className="text-xs text-red-100/80 leading-relaxed max-w-md mb-6">
        {errorMessage}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="min-h-[40px] px-5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
          <span>{retrying ? "Retrying…" : "Try again"}</span>
        </button>
      )}
    </div>
  );
}
