"use client";

import React from "react";
import { Bookmark, Eye, MessageSquare, Play, Share2, ThumbsUp, TrendingUp } from "lucide-react";

interface MediaReviewPreviewProps {
  mediaUrl: string | null;
  score: number | null;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
    engagementRate: number;
    hookRetention: number | null;
  };
}

function formatCompact(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function MediaReviewPreview({ mediaUrl, score, metrics }: MediaReviewPreviewProps) {
  const intentCount = metrics.saves + metrics.shares;
  const hookLabel = metrics.hookRetention == null ? "-" : `${metrics.hookRetention.toFixed(1)}%`;

  return (
    <div className="relative min-h-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#101114]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.18),transparent_34%)]" />

      <div className="relative z-10 flex min-h-[400px] flex-col p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Media Review
            </p>
            <h3 className="mt-1 text-sm font-display font-extrabold text-white">
              Creator performance snapshot
            </h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-md">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">AI score</p>
            <p className="text-lg font-black text-white">{score ?? "-"}</p>
          </div>
        </div>

        <div className="relative mx-auto aspect-[9/16] w-full max-w-[245px] flex-1 overflow-hidden rounded-[18px] border border-white/15 bg-black shadow-2xl">
          {mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt="Synced post media preview"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#17171c] to-[#0b0c10] text-gray-500">
              <Play className="h-10 w-10" />
              <span className="text-xs font-bold uppercase tracking-wider">No media</span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Views", value: formatCompact(metrics.views), icon: <Eye className="h-3.5 w-3.5" /> },
                { label: "Intent", value: formatCompact(intentCount), icon: <Bookmark className="h-3.5 w-3.5" /> },
                { label: "Hook", value: hookLabel, icon: <TrendingUp className="h-3.5 w-3.5" /> },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/10 px-2 py-2 backdrop-blur-md">
                  <div className="mb-1 flex items-center gap-1 text-gray-300">{item.icon}</div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                  <p className="text-xs font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { label: "Likes", value: metrics.likes, icon: <ThumbsUp className="h-3.5 w-3.5 text-brand-accent" /> },
            { label: "Comments", value: metrics.comments, icon: <MessageSquare className="h-3.5 w-3.5 text-brand-secondary" /> },
            { label: "Saves", value: metrics.saves, icon: <Bookmark className="h-3.5 w-3.5 text-brand-primary" /> },
            { label: "Shares", value: metrics.shares, icon: <Share2 className="h-3.5 w-3.5 text-brand-secondary" /> },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-2">
              {item.icon}
              <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
              <p className="text-xs font-black text-white">{formatCompact(item.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
