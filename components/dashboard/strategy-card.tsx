"use client";

import React from "react";
import { Calendar, Clock, Music, Lightbulb, MessageSquare } from "lucide-react";
import { BentoCardMotion } from "@/components/shared/performance-motion";

interface StrategyCardProps {
  day: string;
  time: string;
  contentType: string;
  topic: string;
  hookSuggestion: string;
  audio?: string;
  estEngagement: "High" | "Medium" | "Low" | string;
}

export function StrategyCard({
  day,
  time,
  contentType,
  topic,
  hookSuggestion,
  audio,
  estEngagement,
}: StrategyCardProps) {
  const isHigh = estEngagement === "High";

  return (
    <BentoCardMotion className="p-6 rounded-2xl border border-glass bg-glass hover:shadow-glow transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden group">
      {/* Visual Day Frame */}
      <div className="flex-shrink-0 flex md:flex-col justify-between items-center md:items-start p-4 rounded-xl border border-glass bg-white/5 min-w-[120px] md:h-full select-none">
        <div className="flex items-center gap-2 text-white font-bold text-lg font-heading">
          <Calendar className="w-5 h-5 text-brand-primary" />
          <span>{day}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold mt-1">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>{time}</span>
        </div>
      </div>

      {/* Main strategy content */}
      <div className="flex-grow flex flex-col gap-3 justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2 select-none">
            {/* Content Type badge */}
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
              {contentType}
            </span>

            {/* Estimated Engagement badge */}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                isHigh
                  ? "bg-brand-secondary/10 border-brand-secondary/20 text-brand-secondary"
                  : "bg-yellow-400/10 border-yellow-500/20 text-yellow-400"
              }`}
            >
              Est: {estEngagement}
            </span>
          </div>

          {/* Topic Title */}
          <h4 className="text-base font-bold text-white tracking-wide leading-relaxed group-hover:text-brand-primary transition-colors select-text">
            {topic}
          </h4>

          {/* Hook suggestion box */}
          <div className="flex gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 mt-3 select-text text-xs leading-relaxed text-gray-300">
            <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5 select-none" />
            <p>
              <strong className="text-white font-semibold select-none">Hook Option:</strong> {hookSuggestion}
            </p>
          </div>
        </div>

        {/* Audio choice cue */}
        {audio && (
          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium border-t border-white/5 pt-3 select-text">
            <Music className="w-4 h-4 text-brand-accent flex-shrink-0 select-none" />
            <span>
              <strong className="text-white font-semibold select-none">Trending Audio:</strong> {audio}
            </span>
          </div>
        )}
      </div>
    </BentoCardMotion>
  );
}
