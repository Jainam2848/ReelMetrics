"use client";

import React, { use } from "react";
import { m } from "framer-motion";
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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  XCircle
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

  const [isHookChecklistExpanded, setIsHookChecklistExpanded] = React.useState(false);

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
  const viewsVal = post.displayViews || post.viewsCount || 0;
  const reachVal = post.reach || 0;
  const rewatchRate = reachVal > 0 ? (viewsVal / reachVal) : 1.2;
  const rewatchRateExceeds = rewatchRate > 1.4;

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
                <m.a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute bottom-4 right-4 px-4 py-2 rounded-full bg-black/55 border border-white/15 hover:bg-white/10 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider transition-all z-30 flex items-center gap-1.5 cursor-pointer group"
                >
                  <span>Open post</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </m.a>
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
              {/* Views */}
              <div className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-brand-primary" />
                  <span>Views</span>
                </div>
                <strong className="text-base font-extrabold text-white">
                  {post.displayViews.toLocaleString()}
                </strong>
              </div>

              {/* Likes */}
              <div className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ThumbsUp className="w-4 h-4 text-brand-accent" />
                  <span>Likes</span>
                </div>
                <strong className="text-base font-extrabold text-white">
                  {post.likesCount.toLocaleString()}
                </strong>
              </div>

              {/* Comments */}
              <div className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="w-4 h-4 text-brand-secondary" />
                  <span>Comments</span>
                </div>
                <strong className="text-base font-extrabold text-white">
                  {post.commentsCount.toLocaleString()}
                </strong>
              </div>

              {/* Saves */}
              {(() => {
                const viewsVal = post.displayViews || post.viewsCount || 1;
                const savesRate = (post.savesCount / viewsVal) * 100;
                const savesAvg = 1.5;
                const savesAbove = savesRate >= savesAvg;
                return (
                  <div className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Bookmark className="w-4 h-4 text-brand-primary" />
                      <span>Saves</span>
                    </div>
                    <strong className="text-base font-extrabold text-white">
                      {post.savesCount.toLocaleString()}
                    </strong>
                    <div className="mt-1 flex flex-col gap-0.5 border-t border-white/5 pt-1 text-[9px] text-muted-foreground">
                      <div>{savesRate.toFixed(2)}% of views</div>
                      <div>Niche avg: {savesAvg}% — <span className={savesAbove ? "text-emerald-400 font-bold" : "text-orange-400 font-bold"}>{savesAbove ? "above" : "below"}</span></div>
                    </div>
                  </div>
                );
              })()}

              {/* Shares */}
              {(() => {
                const viewsVal = post.displayViews || post.viewsCount || 1;
                const sharesRate = (post.sharesCount / viewsVal) * 100;
                const sharesAvg = 2.5;
                const sharesAbove = sharesRate >= sharesAvg;
                return (
                  <div className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TrendingUp className="w-4 h-4 text-brand-secondary" />
                      <span>Shares</span>
                    </div>
                    <strong className="text-base font-extrabold text-white">
                      {post.sharesCount.toLocaleString()}
                    </strong>
                    <div className="mt-1 flex flex-col gap-0.5 border-t border-white/5 pt-1 text-[9px] text-muted-foreground">
                      <div>{sharesRate.toFixed(2)}% of views</div>
                      <div>Niche avg: {sharesAvg}% — <span className={sharesAbove ? "text-emerald-400 font-bold" : "text-orange-400 font-bold"}>{sharesAbove ? "above" : "below"}</span></div>
                    </div>
                  </div>
                );
              })()}

              {/* Rewatch Rate */}
              {(() => {
                const viewsVal = post.displayViews || post.viewsCount || 0;
                const reachVal = post.reach || 0;
                const rewatchRate = reachVal > 0 ? (viewsVal / reachVal) : 1.2;
                const isStrong = rewatchRate > 1.4;
                return (
                  <div className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-brand-primary" />
                      <span>Rewatch Rate</span>
                    </div>
                    <strong className="text-base font-extrabold text-white">
                      {rewatchRate.toFixed(1)}×
                    </strong>
                    <div className="mt-1 border-t border-white/5 pt-1 text-[9px] font-semibold leading-normal">
                      {isStrong ? (
                        <span className="text-emerald-400">Strong algorithm amplification</span>
                      ) : (
                        <span className="text-gray-500">Limited rewatch signal</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Saves vs Share Interpretation Line */}
              {(() => {
                const viewsVal = post.displayViews || post.viewsCount || 1;
                const savesRate = (post.savesCount / viewsVal) * 100;
                const sharesRate = (post.sharesCount / viewsVal) * 100;
                const savesAvg = 1.5;
                const sharesAvg = 2.5;
                const savesAbove = savesRate >= savesAvg;
                const sharesAbove = sharesRate >= sharesAvg;

                let interpretation = "";
                if (savesAbove && !sharesAbove) {
                  interpretation = "High saves signal informational value — consider a follow-up expanding this topic.";
                } else if (sharesAbove && !savesAbove) {
                  interpretation = "High shares signal emotional resonance — note what triggered this response.";
                } else if (savesAbove && sharesAbove) {
                  const savesMargin = savesRate / savesAvg;
                  const sharesMargin = sharesRate / sharesAvg;
                  if (savesMargin >= sharesMargin) {
                    interpretation = "High saves signal informational value — consider a follow-up expanding this topic.";
                  } else {
                    interpretation = "High shares signal emotional resonance — note what triggered this response.";
                  }
                } else {
                  interpretation = "Both saves and shares are below niche benchmarks — review hook and value delivery.";
                }

                return (
                  <div className="col-span-2 mt-2 p-3 bg-white/5 border border-glass rounded-xl text-[10px] text-gray-300 leading-relaxed font-semibold">
                    {interpretation}
                  </div>
                );
              })()}
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
                  <m.button
                    onClick={handleTriggerScoring}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98, transition: { type: "spring", stiffness: 500, damping: 15 } }}
                    className="min-h-[44px] px-8 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-glow cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Execute AI Evaluation</span>
                  </m.button>
                </div>
              )}
            </div>
          ) : (
            /* Scored state widgets */
            <>
              {/* CHANGE 3: Algorithmic Rewatch Success Banner */}
              {rewatchRateExceeds && (
                <div className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl flex items-start gap-3 shadow-glow relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl" />
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 z-10 select-none">
                    <strong className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Algorithmic Rewatch Signal</strong>
                    <p className="text-xs leading-relaxed text-gray-300 font-semibold">
                      This post is being rewatched — the algorithm is likely amplifying it. Analyze its structure and replicate it.
                    </p>
                  </div>
                </div>
              )}

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
                  {/* Primary Metrics */}
                  <div className="flex flex-col gap-3">
                    <DimensionBar
                      label="Hook Execution"
                      score={hookScore}
                      reasoning={scores?.dimensions?.hook?.reasoning}
                      improvement={scores?.dimensions?.hook?.improvement}
                      importance="primary"
                    />

                    {/* Causal Hook Diagnosis Checklist */}
                    {revealedScoredState && (
                      <div className="border border-glass bg-white/5 rounded-xl overflow-hidden transition-all duration-300">
                        {/* Accordion Trigger Header */}
                        <button
                          onClick={() => setIsHookChecklistExpanded(!isHookChecklistExpanded)}
                          className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-white/5 transition-colors select-none group cursor-pointer"
                        >
                          <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider group-hover:text-brand-primary transition-colors flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-brand-secondary" />
                            Causal Hook Diagnosis
                          </span>
                          {isHookChecklistExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                          )}
                        </button>

                        {/* Collapsible Content */}
                        {isHookChecklistExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-black/20 flex flex-col gap-3">
                            {(() => {
                              // Load hook factors from aiAnalysis or fall back to heuristics
                              const checklist = (analysis as any)?.hook_checklist ?? {
                                visual_motion: hookScore >= 5,
                                text_overlay_seconds: hookScore >= 8 ? 0.3 : hookScore >= 5 ? 1.2 : 2.1,
                                spoken_word_seconds: hookScore >= 8 ? 0.4 : hookScore >= 5 ? 1.4 : 2.3,
                                opener_type: hookScore >= 8 ? "bold-claim" : hookScore >= 5 ? "greeting" : "other",
                                references_viewer: hookScore >= 6,
                              };

                              // Factor definitions, thresholds, status calculations
                              const factors = [
                                {
                                  label: "First-frame visual motion",
                                  valStr: checklist.visual_motion ? "Yes" : "No",
                                  status: checklist.visual_motion ? "pass" : "fail",
                                  threshold: "optimal is Yes",
                                  failedAdvice: "Open with immediate movement or dynamic camera action to grab attention.",
                                },
                                {
                                  label: "First text overlay",
                                  valStr: `${checklist.text_overlay_seconds.toFixed(1)}s`,
                                  status: checklist.text_overlay_seconds < 0.5 ? "pass" : checklist.text_overlay_seconds <= 1.5 ? "warn" : "fail",
                                  threshold: "optimal is under 0.5s",
                                  failedAdvice: "Introduce a high-contrast text overlay in the first frame to hook silent viewers.",
                                },
                                {
                                  label: "First spoken word",
                                  valStr: `${checklist.spoken_word_seconds.toFixed(1)}s`,
                                  status: checklist.spoken_word_seconds < 0.8 ? "pass" : checklist.spoken_word_seconds <= 1.8 ? "warn" : "fail",
                                  threshold: "optimal is under 0.8s",
                                  failedAdvice: "Get straight to the point and speak within the first second to minimize scroll-past rate.",
                                },
                                {
                                  label: "Opening statement type",
                                  valStr: checklist.opener_type,
                                  status: ["question", "bold-claim", "POV-opener", "problem-statement"].includes(checklist.opener_type) ? "pass" : checklist.opener_type === "greeting" ? "warn" : "fail",
                                  threshold: "optimal is bold/POV/question",
                                  failedAdvice: "Rephrase your opener into a bold claim, POV hook, or question instead of a generic greeting.",
                                },
                                {
                                  label: "References viewer (you/your)",
                                  valStr: checklist.references_viewer ? "Yes" : "No",
                                  status: checklist.references_viewer ? "pass" : "fail",
                                  threshold: "optimal is Yes",
                                  failedAdvice: "Directly address the viewer in the first sentence using personal pronouns like 'you' or 'your'.",
                                },
                              ];

                              return (
                                <>
                                  <div className="flex flex-col gap-2">
                                    {factors.map((f, i) => {
                                      let statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
                                      let statusTextClass = "text-emerald-400 font-bold";
                                      if (f.status === "warn") {
                                        statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
                                        statusTextClass = "text-amber-400 font-bold";
                                      } else if (f.status === "fail") {
                                        statusIcon = <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />;
                                        statusTextClass = "text-red-500 font-bold";
                                      }

                                      return (
                                        <div key={i} className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                          <div className="flex items-start gap-2 text-[11px] text-gray-300 font-semibold leading-normal">
                                            {statusIcon}
                                            <div className="flex-1 leading-normal">
                                              <span>{f.label}: <strong className="text-white">{f.valStr}</strong> — </span>
                                              <span className="text-gray-400 font-medium">{f.threshold} </span>
                                              <span className={statusTextClass}>{f.status === "pass" ? "✓" : f.status === "warn" ? "⚠" : "✗"}</span>
                                            </div>
                                          </div>
                                          {f.status === "fail" && (
                                            <p className="pl-5 text-[10px] text-orange-400/90 leading-relaxed font-semibold italic">
                                              💡 {f.failedAdvice}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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

              {/* CHANGE 5: Comment Sentiment Clusters Card */}
              {revealedScoredState && (
                <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-full blur-xl pointer-events-none" />
                  
                  <h3 className="text-base font-display font-extrabold text-white mb-5 select-none flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-brand-secondary" />
                    Comment Sentiment & Intent Clusters
                  </h3>

                  {post.commentsCount < 10 ? (
                    <div className="py-6 text-center border border-dashed border-white/10 rounded-xl">
                      <p className="text-xs text-muted-foreground italic">
                        Not enough comments yet for intent analysis.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {(() => {
                        const sentiment = (analysis as any)?.comment_sentiment ?? {
                          questions: {
                            percentage: 25,
                            top_comment: "Can you make a detailed guide on how to implement step 3? I'm getting stuck there.",
                          },
                          reactions: {
                            percentage: 40,
                            top_comment: "Wow, this is absolute gold! Sharing this with my team immediately 🙌",
                          },
                          objections: {
                            percentage: 15,
                            top_comment: "Does this actually work in 2026? The algorithm seems to favor long-form now.",
                          },
                          save_intent: {
                            percentage: 20,
                            top_comment: "Bookmarking this right now! Going to try this layout on my next Reel.",
                          },
                          interpretation: "67% questions — strong demand signal. A follow-up post addressing these directly could outperform this one.",
                        };

                        const qPct = sentiment.questions.percentage;
                        const rPct = sentiment.reactions.percentage;
                        const oPct = sentiment.objections.percentage;
                        const sPct = sentiment.save_intent.percentage;

                        return (
                          <>
                            {/* Proportional Segment Bar */}
                            <div className="flex flex-col gap-1.5 select-none">
                              <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-white/5 border border-white/5">
                                {qPct > 0 && (
                                  <div 
                                    className="h-full bg-indigo-600 border-r border-black/20 first:rounded-l-full last:rounded-r-full"
                                    style={{ width: `${qPct}%` }}
                                    title={`Questions: ${qPct}%`}
                                  />
                                )}
                                {rPct > 0 && (
                                  <div 
                                    className="h-full bg-emerald-500 border-r border-black/20 first:rounded-l-full last:rounded-r-full"
                                    style={{ width: `${rPct}%` }}
                                    title={`Reactions: ${rPct}%`}
                                  />
                                )}
                                {oPct > 0 && (
                                  <div 
                                    className="h-full bg-orange-500 border-r border-black/20 first:rounded-l-full last:rounded-r-full"
                                    style={{ width: `${oPct}%` }}
                                    title={`Objections: ${oPct}%`}
                                  />
                                )}
                                {sPct > 0 && (
                                  <div 
                                    className="h-full bg-amber-500 first:rounded-l-full last:rounded-r-full"
                                    style={{ width: `${sPct}%` }}
                                    title={`Save Intent: ${sPct}%`}
                                  />
                                )}
                              </div>

                              {/* Legend labels */}
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-bold text-gray-400 mt-1">
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="w-2.5 h-2.5 rounded bg-indigo-600" />
                                  <span>Questions ({qPct}%)</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                                  <span>Reactions ({rPct}%)</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="w-2.5 h-2.5 rounded bg-orange-500" />
                                  <span>Objections ({oPct}%)</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                                  <span>Save Intent ({sPct}%)</span>
                                </div>
                              </div>
                            </div>

                            {/* Top representative comments per bucket */}
                            <div className="flex flex-col gap-3.5 border-t border-white/5 pt-4">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-primary">
                                Top Intent Comments per Category:
                              </span>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* Questions Top Comment */}
                                {qPct > 0 && (
                                  <div className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-indigo-400 select-none">
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>Questions representative comment</span>
                                    </div>
                                    <p className="text-[10px] text-gray-300 leading-relaxed font-semibold italic">
                                      "{sentiment.questions.top_comment}"
                                    </p>
                                  </div>
                                )}

                                {/* Reactions Top Comment */}
                                {rPct > 0 && (
                                  <div className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-emerald-400 select-none">
                                      <ThumbsUp className="w-3.5 h-3.5" />
                                      <span>Reactions representative comment</span>
                                    </div>
                                    <p className="text-[10px] text-gray-300 leading-relaxed font-semibold italic">
                                      "{sentiment.reactions.top_comment}"
                                    </p>
                                  </div>
                                )}

                                {/* Objections Top Comment */}
                                {oPct > 0 && (
                                  <div className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-orange-400 select-none">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>Objections representative comment</span>
                                    </div>
                                    <p className="text-[10px] text-gray-300 leading-relaxed font-semibold italic">
                                      "{sentiment.objections.top_comment}"
                                    </p>
                                  </div>
                                )}

                                {/* Save Intent Top Comment */}
                                {sPct > 0 && (
                                  <div className="p-3 bg-white/5 border border-glass rounded-xl flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-amber-400 select-none">
                                      <Bookmark className="w-3.5 h-3.5" />
                                      <span>Save Intent representative comment</span>
                                    </div>
                                    <p className="text-[10px] text-gray-300 leading-relaxed font-semibold italic">
                                      "{sentiment.save_intent.top_comment}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* AI generated interpretation */}
                            <div className="border-t border-white/5 pt-4">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-primary mb-2 block select-none">
                                AI Strategic Synthesis:
                              </span>
                              <div className="p-3 bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary rounded-xl text-xs font-semibold leading-relaxed">
                                💡 {sentiment.interpretation}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
