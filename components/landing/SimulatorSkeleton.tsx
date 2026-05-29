import React from "react";

/**
 * SimulatorSkeleton - Renders the exact glassmorphic visual card of the Reel Simulator
 * in its idle state. Used for Next.js SSR (Server-Side Rendering) loading fallback
 * to prevent any hydration mismatch or layout shifts.
 */
export function SimulatorSkeleton() {
  return (
    <div 
      style={{
        width: "clamp(340px, 38vw, 500px)",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "24px",
        boxShadow: "0 32px 80px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
      }}
      className="p-6 flex flex-col gap-5 w-full select-none"
    >
      {/* Chrome Window Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">
          TRENDORAA AI
        </span>
      </div>

      {/* Input Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider">
            Reel Source
          </label>
          <div 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] font-mono text-white/20 select-none"
          >
            Paste your Instagram Reel URL...
          </div>
        </div>

        {/* Buttons Split */}
        <div className="grid grid-cols-2 gap-3.5 mt-1">
          <div 
            className="w-full bg-[#4F46E5] text-white/80 font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center tracking-wider uppercase border border-transparent shadow-glow"
          >
            Analyze Reel →
          </div>
          <div 
            className="w-full bg-transparent text-white/80 font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center tracking-wider uppercase border border-white/15"
          >
            Use Demo Reel
          </div>
        </div>

        {/* Reassurance text */}
        <p className="text-[11px] font-medium text-white/30 text-center mt-1">
          No account needed · Analysis runs in ~4 seconds
        </p>
      </div>
    </div>
  );
}
