"use client";

import React from "react";
import Link from "next/link";
import { BentoCardMotion } from "@/components/shared/performance-motion";
import { Eye, ThumbsUp, Percent } from "lucide-react";

export interface PostCardProps {
  post: {
    id: string;
    caption: string | null;
    mediaUrl: string | null;
    permalink: string | null;
    timestamp: Date | string;
    viewsCount: number;
    displayViews: number;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    savesCount: number;
    skipRate: number | null;
    completionRate: number | null;
    engagementRate: number;
    overallScore: number | null;
    platform: "instagram" | "tiktok";
  };
}

export function PostCard({ post }: PostCardProps) {
  const isTikTok = post.platform === "tiktok";

  // Rebrand metrics for AI Moat strategy in UI
  const retentionLabel = isTikTok ? "Watch-Through" : "Hook Retention";
  
  // Safe division-by-zero checks and custom formatting
  const views = post.displayViews || post.viewsCount || 0;
  const erFormatted = views > 0 ? `${post.engagementRate.toFixed(1)}%` : "—";
  
  const getRetentionValue = () => {
    if (views === 0) return "—";
    
    if (isTikTok) {
      return post.completionRate !== null ? `${post.completionRate.toFixed(1)}%` : "—";
    } else {
      return post.skipRate !== null ? `${(100 - post.skipRate).toFixed(1)}%` : "—";
    }
  };

  const retentionValue = getRetentionValue();

  return (
    <Link href={`/posts/${post.id}`} className="block h-full">
      <BentoCardMotion className="h-full rounded-2xl border border-glass bg-glass hover:shadow-glow transition-all duration-300 flex flex-col overflow-hidden group">
        {/* Visual Media Frame */}
        <div className="relative aspect-video w-full bg-secondary/20 overflow-hidden flex-shrink-0">
          {post.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt={post.caption || "Social Post Thumbnail"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-600 font-display text-sm tracking-widest uppercase">
              No Thumbnail
            </div>
          )}

          {/* Platform Indicator Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg bg-black/40 backdrop-blur-md border border-white/10 select-none">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isTikTok ? "bg-cyan-400 animate-pulse" : "bg-brand-accent animate-pulse"
              }`}
            />
            {isTikTok ? "TikTok" : "Instagram"}
          </div>

          {/* Score Badge (Arc/Bubble Indicator) */}
          {post.overallScore !== null && (
            <div
              className={`absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border shadow-lg backdrop-blur-md ${
                post.overallScore > 70
                  ? "bg-brand-secondary/80 border-brand-secondary text-white shadow-glow-green"
                  : post.overallScore > 40
                  ? "bg-yellow-400/80 border-yellow-500 text-foreground"
                  : "bg-destructive/80 border-destructive text-white shadow-glow-pink"
              }`}
            >
              {post.overallScore}
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="p-5 flex-grow flex flex-col justify-between">
          <div>
            {/* Caption snippet */}
            <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors leading-relaxed line-clamp-2 select-text mb-4">
              {post.caption || <span className="text-gray-500 italic">No caption provided.</span>}
            </p>
          </div>

          {/* Key Metrics grid */}
          <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
            {/* Views */}
            <div className="flex flex-col gap-0.5 select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Eye className="w-3 h-3 text-gray-500" /> Views
              </span>
              <span className="text-sm font-bold text-white tracking-tight">
                {views > 0 ? (views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views) : "—"}
              </span>
            </div>

            {/* Engagement Rate */}
            <div className="flex flex-col gap-0.5 select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ThumbsUp className="w-3 h-3 text-gray-500" /> Eng. Rate
              </span>
              <span className="text-sm font-bold text-white tracking-tight">
                {erFormatted}
              </span>
            </div>

            {/* Hook Retention / Watch-Through Score */}
            <div className="flex flex-col gap-0.5 select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Percent className="w-3 h-3 text-gray-500" /> {retentionLabel}
              </span>
              <span className="text-sm font-bold text-white tracking-tight">
                {retentionValue}
              </span>
            </div>
          </div>
        </div>
      </BentoCardMotion>
    </Link>
  );
}
