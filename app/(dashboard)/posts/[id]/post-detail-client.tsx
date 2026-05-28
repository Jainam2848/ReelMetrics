"use client";

import React, { use } from "react";
import { usePostDetail } from "@/hooks/use-post-detail";
import { ScoreGauge } from "@/components/dashboard/score-gauge";
import { DimensionBar } from "@/components/dashboard/dimension-bar";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { useToast } from "@/components/shared/toast";
import { GrowthMatrix } from "@/components/dashboard/growth-matrix";
import { AnimeScoringSequence } from "@/components/dashboard/anime-scoring-sequence";
import { MediaReviewPreview } from "@/components/dashboard/media-review-preview";
import { 
  ArrowLeft, 
  Sparkles, 
  ExternalLink, 
  ThumbsUp, 
  MessageSquare, 
  Bookmark, 
  TrendingUp,
  AlertCircle,
  Video,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Instagram } from "@/components/shared/icons";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPageClient({ params }: PageProps) {
  const { id: postId } = use(params);
  const toast = useToast();

  const {
    post,
    scores,
    isLoading,
    error,
    triggerScoring,
    isScoring,
  } = usePostDetail(postId);

  const isUnrated = !scores || scores.overallScore === null;
  const revealedScoredState = !isUnrated;

  const analysis = scores?.aiAnalysis;

  const hookScore = scores?.dimensions?.hook?.score || 0;
  const skipRateScore = scores?.dimensions?.retention_metric?.score || 0;
  const retentionScore = scores?.dimensions?.retention_proxy?.score || 0;
  const ctaScore = scores?.dimensions?.cta?.score || 0;
  const visualScore = scores?.dimensions?.visual?.score || 0;
  const audioScore = scores?.dimensions?.audio?.score || 0;
  const trendScore = scores?.dimensions?.trend?.score || 0;
  const captionScore = scores?.dimensions?.caption?.score || 0;
  const timingScore = scores?.dimensions?.timing?.score || 0;

  const handleTriggerScoring = async () => {
    try {
      await triggerScoring();
      toast.info("AI evaluation enqueued. We'll update this view as the score lands.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start evaluation."
      );
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (error || !post) {
    const isNotFound =
      error instanceof Error && /not found/i.test(error.message);
    return (
      <div className="max-w-md mx-auto text-center py-12 border border-glass bg-glass rounded-2xl px-6">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-display font-extrabold text-white mb-2">
          {isNotFound ? "Post not found" : "Couldn't load this post"}
        </h3>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          {isNotFound
            ? "This post is not associated with any of your connected accounts. Switch accounts or resync to refresh your catalog."
            : (error as Error | undefined)?.message ||
              "We hit an unexpected error retrieving this post. Please try again in a moment."}
        </p>
        <Link
          href="/posts"
          className="inline-flex items-center px-6 py-2 bg-brand-primary rounded-xl text-xs font-bold uppercase tracking-wider text-white active:scale-95"
        >
          Back to catalog
        </Link>
      </div>
    );
  }

  const isInstagram = post.platform === "instagram";

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation link back */}
      <div className="select-none">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Content Catalog</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── LEFT PANEL: Media metadata & Stats ── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Post Visual Shield */}
          <div className="border border-glass bg-glass rounded-2xl overflow-hidden shadow-glow">
            {/* Creator media preview */}
            <div className="relative">
              <MediaReviewPreview
                mediaUrl={post.mediaUrl}
                score={scores?.overallScore ?? null}
                metrics={{
                  views: post.displayViews || post.viewsCount || 0,
                  likes: post.likesCount,
                  comments: post.commentsCount,
                  saves: post.savesCount,
                  shares: post.sharesCount,
                  engagementRate: post.engagementRate,
                  hookRetention: post.skipRate == null ? null : 100 - post.skipRate,
                }}
              />
              
              {/* Badge Platform */}
              <div className="absolute top-4 left-4 z-30">
                {isInstagram ? (
                  <span className="px-3 py-1 rounded-full bg-black/55 border border-white/15 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                    <Instagram className="w-3.5 h-3.5" />
                    <span>INSTAGRAM</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-black/55 border border-white/15 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                    <Video className="w-3.5 h-3.5" />
                    <span>TIKTOK</span>
                  </span>
                )}
              </div>

              {post.permalink && (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-4 px-4 py-2 rounded-full bg-black/55 border border-white/15 hover:bg-white/10 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider transition-all z-30 flex items-center gap-1.5 cursor-pointer active:scale-95 group"
                >
                  <span>Open post</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Caption Area */}
            <div className="p-5 border-t border-white/10 bg-black/25">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-brand-primary" />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                  Caption & Context
                </h3>
              </div>
              <div className="text-xs text-gray-300 leading-relaxed p-4 bg-white/5 border border-white/10 rounded-xl">
                {post.caption ? (
                  <span className="break-words">{post.caption}</span>
                ) : (
                  <span className="text-gray-600 italic">No caption text supplied for this content.</span>
                )}
              </div>
            </div>
          </div>

          {/* Engagement counts */}
          <div className="border border-glass bg-glass rounded-2xl p-5 select-none">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Engagement Counts
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Views", count: post.displayViews, icon: <TrendingUp className="w-4 h-4 text-brand-primary" /> },
                { label: "Likes", count: post.likesCount, icon: <ThumbsUp className="w-4 h-4 text-brand-accent" /> },
                { label: "Comments", count: post.commentsCount, icon: <MessageSquare className="w-4 h-4 text-brand-secondary" /> },
                { label: "Saves", count: post.savesCount, icon: <Bookmark className="w-4 h-4 text-brand-primary" /> },
                { label: "Shares", count: post.sharesCount, icon: <TrendingUp className="w-4 h-4 text-brand-secondary" /> },
              ].map((stat, idx) => (
                <div key={idx} className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {stat.icon}
                    <span>{stat.label}</span>
                  </div>
                  <strong className="text-base font-extrabold text-white">
                    {stat.count.toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Evaluation Gauge, Dimensions, Advice ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {!revealedScoredState ? (
            /* Unrated / Active scoring state overlay */
            <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow flex flex-col items-center justify-center text-center relative overflow-hidden">
              {isScoring ? (
                <AnimeScoringSequence />
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <Sparkles className="w-14 h-14 text-brand-primary mb-4 animate-pulse" />
                  <h3 className="text-xl font-display font-extrabold text-white mb-2">
                    Evaluate Engagement Moat
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
                    This short-form video has not been processed by the Trendoraa AI engine yet. Click below to analyze hook density and cta structures.
                  </p>
                  <button
                    onClick={handleTriggerScoring}
                    className="min-h-[44px] px-8 bg-brand-primary hover:opacity-90 text-white rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 shadow-glow cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Execute AI Evaluation</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Scored state widgets */
            <>
              {/* Score summary with circle gauge */}
              <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="flex justify-center md:border-r md:border-white/5 md:pr-6">
                  <ScoreGauge score={scores?.overallScore || 0} />
                </div>
                
                <div className="md:col-span-2 select-none">
                  <div className="inline-flex px-2 py-0.5 border border-brand-secondary/30 bg-brand-secondary/10 text-[9px] font-bold text-brand-secondary rounded-full uppercase tracking-wider mb-3">
                    Moat Authenticated
                  </div>
                  <h3 className="text-lg font-display font-extrabold text-white mb-2">
                    AI Evaluation Complete
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This post achieves an overall Engagement Moat rating of <strong>{scores?.overallScore}/100</strong>. Analysis of visual pace and commuter interest indicates robust scroll-stopping potential.
                  </p>
                </div>
              </div>

              {/* Algorithmic Growth Matrix & Retention Curve */}
              <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow">
                <GrowthMatrix
                  mode="interactive"
                  scores={{
                    hook: hookScore * 10,
                    retention: skipRateScore * 10,
                    completion: retentionScore * 10,
                    cta: ctaScore * 10,
                    visual: visualScore * 10,
                    audio: audioScore * 10,
                    trend: trendScore * 10,
                    caption: captionScore * 10,
                    timing: timingScore * 10,
                  }}
                />
              </div>

              {/* 9 Dimensions Bar */}
              <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow">
                <h3 className="text-base font-display font-extrabold text-white mb-6 select-none">
                  Evaluation Dimensions
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                  {/* Primary Metrics */}
                  <DimensionBar
                    label="Hook Execution"
                    score={hookScore}
                    reasoning={scores?.dimensions?.hook?.reasoning}
                    improvement={scores?.dimensions?.hook?.improvement}
                    importance="primary"
                  />
                  <DimensionBar
                    label="Scroll-Stop Velocity"
                    score={skipRateScore}
                    reasoning={scores?.dimensions?.retention_metric?.reasoning}
                    improvement={scores?.dimensions?.retention_metric?.improvement}
                    importance="primary"
                  />
                  <DimensionBar
                    label="Watch-Through Completion"
                    score={retentionScore}
                    reasoning={scores?.dimensions?.retention_proxy?.reasoning}
                    improvement={scores?.dimensions?.retention_proxy?.improvement}
                    importance="primary"
                  />
                  
                  {/* Secondary Metrics */}
                  <DimensionBar
                    label="CTA Value"
                    score={ctaScore}
                    reasoning={scores?.dimensions?.cta?.reasoning}
                    improvement={scores?.dimensions?.cta?.improvement}
                    importance="secondary"
                  />
                  <DimensionBar
                    label="Visual Pacings"
                    score={visualScore}
                    reasoning={scores?.dimensions?.visual?.reasoning}
                    improvement={scores?.dimensions?.visual?.improvement}
                    importance="secondary"
                  />
                  <DimensionBar
                    label="Audio Matching"
                    score={audioScore}
                    reasoning={scores?.dimensions?.audio?.reasoning}
                    improvement={scores?.dimensions?.audio?.improvement}
                    importance="secondary"
                  />
                  
                  {/* Tertiary Metrics */}
                  <DimensionBar
                    label="Trend Relevance"
                    score={trendScore}
                    reasoning={scores?.dimensions?.trend?.reasoning}
                    improvement={scores?.dimensions?.trend?.improvement}
                    importance="tertiary"
                  />
                  <DimensionBar
                    label="Caption Structure"
                    score={captionScore}
                    reasoning={scores?.dimensions?.caption?.reasoning}
                    improvement={scores?.dimensions?.caption?.improvement}
                    importance="tertiary"
                  />
                  <DimensionBar
                    label="Timing Efficiency"
                    score={timingScore}
                    reasoning={scores?.dimensions?.timing?.reasoning}
                    improvement={scores?.dimensions?.timing?.improvement}
                    importance="tertiary"
                  />
                </div>
              </div>

              {/* AI Strategic recommendations / analysis */}
              {analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
                  {/* Strengths */}
                  <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-full blur-2xl" />
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-secondary" />
                      <h4 className="font-display font-extrabold text-white text-sm">Key Strengths</h4>
                    </div>
                    <ul className="flex flex-col gap-2.5">
                      {Array.isArray(analysis.strengths) ? (
                        analysis.strengths.map((st: string, i: number) => (
                           <li key={i} className="text-xs text-gray-300 leading-relaxed font-semibold">
                            • {st}
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-gray-400">Audio synchronization and hook metrics perform above baseline creator index.</li>
                      )}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl" />
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-brand-accent" />
                      <h4 className="font-display font-extrabold text-white text-sm">Growth Opportunities</h4>
                    </div>
                    <ul className="flex flex-col gap-2.5">
                      {Array.isArray(analysis.opportunities) ? (
                        analysis.opportunities.map((op: string, i: number) => (
                          <li key={i} className="text-xs text-gray-300 leading-relaxed font-semibold">
                            • {op}
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-gray-400">Shift CTA placement to second 3. Timing could be shifted to early morning slot.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
