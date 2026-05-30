"use client";

import React, { useState, useEffect } from "react";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useStrategy } from "@/hooks/use-strategy";
import { StrategyCard } from "@/components/dashboard/strategy-card";
import { ReelPreviewPlayer } from "@/components/dashboard/reel-preview-player";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LoadError } from "@/components/shared/load-error";
import { useToast } from "@/components/shared/toast";
import { m, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Calendar, 
  CheckSquare, 
  Target, 
  Zap, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Video,
  Smartphone
} from "lucide-react";

export default function StrategyPage() {
  const { activeAccount } = useActiveAccount();
  const toast = useToast();

  const {
    strategy,
    isLoading,
    error,
    isGenerating,
    generateStrategy,
    mutate,
  } = useStrategy();

  // Active checkable priorities list for high creator engagement
  const [todos, setTodos] = useState<Array<{ id: number; text: string; checked: boolean }>>([]);
  
  // Track active sub-tab for Trend Detection / Niche Gap radar
  const [strategyTab, setStrategyTab] = useState<"trends" | "gaps">("trends");

  // Synchronize experiment changes to PATCH endpoint for real-time DB persistence
  const handleUpdateExperiment = async (expId: string, updates: Partial<any>) => {
    if (!strategy) return;
    try {
      const activeExps = (strategy.content as any).experimentQueue?.active || [];
      const historyExps = (strategy.content as any).experimentQueue?.history || [];
      const allExps = [...activeExps, ...historyExps];

      const updatedExps = allExps.map((e: any) => {
        if (e.id === expId) {
          return { ...e, ...updates };
        }
        return e;
      });

      // Split back into active and history
      const newActive = updatedExps.filter((e: any) => e.status !== "Complete" && e.status !== "Skipped");
      const newHistory = updatedExps.filter((e: any) => e.status === "Complete" || e.status === "Skipped");

      const newContent = {
        ...strategy.content,
        experimentQueue: {
          active: newActive,
          history: newHistory,
        },
      };

      // Pessimistic update to UI first for sub-second reactive state switches
      mutate({ ...strategy, content: newContent }, false);

      const res = await fetch(`/api/strategies/${strategy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });

      if (!res.ok) {
        throw new Error("Failed to save experiment updates");
      }

      // Refresh SWR cache
      mutate();
      toast.success("Experiment queue synchronized!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync experiments with database.");
    }
  };

  
  // Track selected calendar timeline item for interactive preview player
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  // Reset checkable priorities whenever strategy ID changes to align with real API tactics
  useEffect(() => {
    if (strategy?.content?.tactics) {
      setTodos(
        strategy.content.tactics.map((tactic: string, idx: number) => ({
          id: idx + 1,
          text: tactic,
          checked: false,
        }))
      );
    } else {
      setTodos([]);
    }
    setSelectedItemIndex(0); // reset preview pointer
  }, [strategy?.id, strategy?.content?.tactics]);

  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  const handleGenerateStrategy = async () => {
    if (!activeAccount) return;
    try {
      await generateStrategy();
    } catch (err) {
      // generateStrategy already surfaces its own toast on error
      console.error("Strategy generation failed:", err);
    }
  };

  if (!activeAccount) {
    return (
      <EmptyState
        context="accounts"
        actionLabel="Connect an account"
        onActionClick={() => {
          window.location.assign("/accounts");
        }}
      />
    );
  }

  // Parse strategy content
  const content = strategy?.content;
  const calendarItems = content?.contentCalendar || [];
  const selectedItem = calendarItems[selectedItemIndex];

  const focusNiche = isLoading
    ? "Analyzing profile focus..."
    : content?.focus || "Connect your account and sync reels to generate a data-driven strategy";

  const recommendationIndex = isLoading
    ? "Generating key recommendations..."
    : content?.keyInsight || "No strategy blueprint has been generated yet. Click generate below to construct your weekly calendar.";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white mb-1">
            Weekly Content Strategy matrix
          </h2>
          <p className="text-xs text-muted-foreground">
            Get personalized scheduling, formats, and hook recommendations calculated by the Trendoraa AI engine.
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateStrategy}
          disabled={isGenerating}
          className={`min-h-[44px] px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isGenerating
              ? "bg-white/10 text-gray-500 border border-white/5 cursor-not-allowed"
              : "bg-brand-primary text-white shadow-glow active:scale-95 hover:opacity-90"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isGenerating ? "AI Strategy Engine Active" : "Generate Strategy Plan"}</span>
        </button>
      </div>

      {/* Generation Loader overlay */}
      <AnimatePresence>
        {isGenerating && (
          <m.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-6 border border-glass bg-glass backdrop-blur-2xl rounded-2xl shadow-glow text-center py-12 flex flex-col items-center justify-center gap-4 select-none z-30 relative"
          >
            <div className="w-10 h-10 rounded-full border-4 border-white/5 border-t-brand-primary animate-spin" />
            <div>
              <h4 className="font-display font-extrabold text-white text-base">
                Compiling Strategic Insights
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                Trendoraa AI is parsing your last 30 posts, scanning commute heatmaps, and generating your custom calendar calendar matrix.
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* CHANGE 1 — "What to replicate" winning template panel */}
      {strategy && (
        <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow relative overflow-hidden transition-all duration-300 select-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl animate-pulse" />
          
          <div className="flex justify-between items-center mb-6 select-none">
            <div>
              <h3 className="text-base font-display font-extrabold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                "What to Replicate" Winning Template
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Structural factors extracted from your top-performing posts that drive feed momentum.
              </p>
            </div>
            <span className="px-3 py-1 border border-amber-400/30 bg-amber-400/10 text-[9px] font-black text-amber-400 rounded-full uppercase tracking-wider">
              SUCCESS PLAYBOOK
            </span>
          </div>

          {!strategy.content?.winningTemplate ? (
            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-black/10 select-none">
              <Sparkles className="w-6 h-6 text-gray-500 mx-auto mb-2 animate-pulse" />
              <p className="text-xs text-muted-foreground font-semibold">
                Score at least 3 reels to unlock your winning template.
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                Calibrate more reels in your Creator Catalog to identify shared retention patterns.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Row Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(strategy.content.winningTemplate as any).factors.map((factor: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-4 bg-white/5 border border-glass rounded-xl flex flex-col gap-2 transition-all duration-300 hover:bg-white/10 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{factor.name}</span>
                      <span className="px-2 py-0.5 border border-brand-secondary/30 bg-brand-secondary/15 text-[8px] font-extrabold text-brand-secondary rounded-md uppercase">
                        {factor.confidence}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-white font-heading group-hover:text-brand-secondary transition-colors">
                      {factor.value}
                    </div>
                    <div className="text-[11px] text-gray-400 leading-normal border-t border-white/5 pt-2 mt-1 italic">
                      {factor.applyInstruction}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom CTAs */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-white/5 select-none">
                <div className="flex items-center gap-2 text-xs text-gray-400 group relative">
                  <span>Based on your top posts from the last 60 days</span>
                  <div className="cursor-pointer text-brand-secondary p-0.5 hover:scale-110 transition-transform">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-8 left-0 hidden group-hover:flex flex-col w-72 p-3 bg-[#06060A]/95 border border-glass rounded-xl shadow-2xl z-50 text-[10px] text-gray-300 gap-2 leading-relaxed">
                    <strong className="text-white uppercase tracking-wider text-[9px] block border-b border-white/10 pb-1 mb-1">Source Reels Analyzed:</strong>
                    {(strategy.content.winningTemplate as any).sourcePosts.map((post: any, pidx: number) => (
                      <div key={pidx} className="flex justify-between items-start gap-3">
                        <span className="truncate max-w-[180px] font-medium text-gray-200">"{post.caption}"</span>
                        <span className="shrink-0 text-brand-secondary font-bold font-mono">{post.engagementRate}% ER</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const template = strategy.content?.winningTemplate as any;
                    const factorsText = template?.factors?.map((f: any) => `${f.name}: ${f.value}`).join(", ");
                    toast.success(`Brief pre-populated: locked in constraints (${factorsText})!`);
                  }}
                  className="bg-brand-secondary text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-glow hover:opacity-90 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Use as my next brief →</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT COLUMN: Focus Card & Checkable Priorities (3/12 width) ── */}
        <div className="lg:col-span-3 flex flex-col gap-6 select-none sticky top-24">
          {/* Active week focus card */}
          <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl animate-pulse" />
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-brand-primary" />
              <h3 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">
                Weekly Moat Focus
              </h3>
            </div>
            
            <div className="p-3 bg-white/5 border border-glass rounded-xl mb-4">
              <strong className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wide">Target Niche Focus:</strong>
              <span className="text-xs text-brand-primary font-bold">{focusNiche}</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {recommendationIndex}
            </p>
          </div>

          {/* Action Priorities checklist */}
          <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="w-5 h-5 text-brand-secondary" />
              <h3 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">
                Creator Priority Matrix
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {todos.length > 0 ? (
                todos.map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => toggleTodo(todo.id)}
                    className="flex gap-3 text-left items-start p-3 bg-white/5 rounded-xl border border-glass transition-colors hover:bg-white/10 active:scale-98"
                  >
                    <div
                      className={`w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                        todo.checked
                          ? "bg-brand-secondary border-brand-secondary text-white"
                          : "border-glass bg-black/35"
                      }`}
                    >
                      {todo.checked && <span className="text-[9px]">✔</span>}
                    </div>
                    <span
                      className={`text-xs font-semibold leading-normal ${
                        todo.checked ? "text-gray-500 line-through" : "text-gray-200"
                      }`}
                    >
                      {todo.text}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4 select-none">
                  {isLoading ? "Loading creator priorities..." : "No active priorities set."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── MIDDLE COLUMN: Vertical Timeline Scheduler (6/12 width) ── */}
        <div className="lg:col-span-5 xl:col-span-6 flex flex-col gap-6">
          <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow relative">
            <div className="flex justify-between items-center mb-6 select-none">
              <div>
                <h3 className="text-base font-display font-extrabold text-white">
                  Content Timeline Matrix
                </h3>
                <p className="text-xs text-muted-foreground">
                  Click a strategy card to preview its output inside the active phone mockup
                </p>
              </div>
              <div className="px-2 py-0.5 border border-brand-accent/30 bg-brand-accent/10 text-[9px] font-bold text-brand-accent rounded-full uppercase tracking-wider">
                COMMUTE OPTIMIZED
              </div>
            </div>

            {error ? (
              <LoadError
                title="Couldn't load your strategy"
                error={error}
                onRetry={() => mutate()}
              />
            ) : isLoading ? (
              <LoadingSkeleton variant="strategy" count={3} />
            ) : calendarItems.length > 0 ? (
              <div className="flex flex-col gap-6 pl-4 border-l border-white/5 relative">
                {calendarItems.map((item: any, idx: number) => {
                  const isSelected = selectedItemIndex === idx;
                  return (
                    <div 
                      key={idx} 
                      className="relative cursor-pointer"
                      onClick={() => {
                        setSelectedItemIndex(idx);
                        toast.info(`Swapped preview video to ${item.day} topic blueprint!`);
                      }}
                    >
                      {/* Circle Node point */}
                      <div className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-4 border-[#1E1E2A] box-content shadow-glow transition-all duration-300 ${
                        isSelected ? "bg-brand-accent scale-125" : "bg-brand-primary"
                      }`} />
                      
                      <div className={`rounded-2xl transition-all duration-300 ${
                        isSelected 
                          ? "ring-2 ring-brand-primary shadow-glow bg-brand-primary/5 scale-[1.01]" 
                          : "hover:scale-[1.005] hover:bg-white/5"
                      }`}>
                        <StrategyCard
                          day={item.day}
                          time={item.time}
                          topic={item.topic}
                          contentType={item.contentType || "Reel"}
                          hookSuggestion={item.hookSuggestion || "Open with a visual pattern disrupt..."}
                          estEngagement={
                            typeof item.estEngagement === "string"
                              ? item.estEngagement.charAt(0).toUpperCase() + item.estEngagement.slice(1)
                              : "Medium"
                          }
                          audio={item.audio || "Trending Developer Lo-Fi Beat"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                context="strategy"
                actionLabel={isGenerating ? "Generating…" : "Generate strategy"}
                isLoading={isGenerating}
                onActionClick={handleGenerateStrategy}
              />
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Interactive Simulated Phone Mockup Reel Preview (3/12 width) ── */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 sticky top-24">
          <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow relative select-none">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4 text-brand-primary animate-pulse" />
                Live Reel Simulator
              </h3>
              <span className="px-2 py-0.5 border border-brand-primary/30 bg-brand-primary/10 text-[8px] font-black uppercase text-brand-primary rounded-full tracking-widest">
                Mockup Player
              </span>
            </div>

            {selectedItem ? (
              <ReelPreviewPlayer
                day={selectedItem.day}
                time={selectedItem.time}
                contentType={selectedItem.contentType || "Reel"}
                topic={selectedItem.topic}
                hookSuggestion={selectedItem.hookSuggestion}
                audio={selectedItem.audio || "Trending Lo-Fi Audio Track"}
                estEngagement={selectedItem.estEngagement}
                niche={focusNiche}
              />
            ) : (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                <Smartphone className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground px-4">
                  Initialize a weekly content plan to activate the interactive short-form video mockup previewer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHANGE 2 — Trend Detection & Niche Gap Radar Panel */}
      {strategy && (
        <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow relative select-none">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-display font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-primary" />
                Trend Detection & Gap Analyzer
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Identify high-momentum patterns and untracked competitive opportunities in your niche.
              </p>
            </div>
            
            {/* Tabs Selector */}
            <div className="flex border border-glass bg-black/40 rounded-xl p-1 select-none">
              <button 
                onClick={() => setStrategyTab("trends")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  strategyTab === "trends"
                    ? "bg-brand-primary text-white shadow-glow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Trend Insights
              </button>
              <button 
                onClick={() => setStrategyTab("gaps")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  strategyTab === "gaps"
                    ? "bg-brand-primary text-white shadow-glow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Niche gaps
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {strategyTab === "trends" ? (
              <m.div
                key="trends-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Mock Trend Insight 1 */}
                  <div className="p-4 bg-white/5 border border-glass rounded-xl flex flex-col gap-3 transition-colors hover:bg-white/10">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 border border-brand-primary/30 bg-brand-primary/10 text-[8px] font-black uppercase text-brand-primary rounded">Visual Pacing</span>
                      <span className="text-[10px] text-emerald-400 font-bold">2.4x Reach Lift</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white font-heading">Dynamic 1.8s cuts with talking-head sync</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Audience skip rates dropped by 18% when visual pacing cuts were synchronized exactly to micro-transitions rather than long, static talking shots.
                    </p>
                  </div>
                  {/* Mock Trend Insight 2 */}
                  <div className="p-4 bg-white/5 border border-glass rounded-xl flex flex-col gap-3 transition-colors hover:bg-white/10">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 border border-amber-400/30 bg-amber-400/10 text-[8px] font-black uppercase text-amber-400 rounded">Hook Opener</span>
                      <span className="text-[10px] text-emerald-400 font-bold">3.1x Saves Lift</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white font-heading">"POV: You are building your first LLC"</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      First-person narrative perspective hooks combined with an immediate on-screen bullet-checklist generated a high rewatch rate across accounts.
                    </p>
                  </div>
                  {/* Mock Trend Insight 3 */}
                  <div className="p-4 bg-white/5 border border-glass rounded-xl flex flex-col gap-3 transition-colors hover:bg-white/10">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 border border-brand-secondary/30 bg-brand-secondary/10 text-[8px] font-black uppercase text-brand-secondary rounded">Audio Hook</span>
                      <span className="text-[10px] text-emerald-400 font-bold">1.9x Share Lift</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white font-heading">Low-Fi Chill Acoustic beats drops</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Background audio with smooth acoustic loops kept viewers watching past 10 seconds, especially when audio level ducked automatically under speech.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 text-right mt-2 font-mono">
                  Weekly calibration refreshed: 3 days ago.
                </div>
              </m.div>
            ) : (
              <m.div
                key="gaps-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col gap-4"
              >
                {!strategy.content?.nicheGaps ? (
                  <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-black/10 select-none">
                    <AlertCircle className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground font-semibold">
                      More niche data needed — available once 5+ accounts in your niche have been tracked for 14+ days.
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Link competitive peer accounts to begin mapping competitive content voids.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(strategy.content.nicheGaps as any).opportunities.map((gap: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="p-4 bg-white/5 border border-glass rounded-xl flex flex-col justify-between gap-4 transition-colors hover:bg-white/10"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                              <strong className="text-xs font-extrabold text-brand-accent uppercase tracking-wider">UNTAPPED GAP OPPORTUNITY</strong>
                            </div>
                            <h4 className="text-sm font-extrabold text-white font-heading">{gap.topic}</h4>
                            <p className="text-[10px] font-mono text-brand-secondary bg-brand-secondary/5 border border-brand-secondary/15 rounded-lg p-2 leading-relaxed">
                              {gap.evidence}
                            </p>
                            <p className="text-xs text-gray-300 leading-relaxed border-t border-white/5 pt-2 mt-1">
                              {gap.suggestedAngle}
                            </p>
                          </div>

                          <button 
                            onClick={() => {
                              toast.success(`Added "${gap.topic}" to your Content Priorities list!`);
                              setTodos(prev => [
                                ...prev,
                                { id: Date.now() + idx, text: `Test Gap Angle: ${gap.topic}`, checked: false }
                              ]);
                            }}
                            className="w-full bg-white/5 border border-glass hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider py-2 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>Add to my content plan →</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 text-[10px] text-gray-500 font-mono">
                      <span>Updated weekly — next refresh in 3 days.</span>
                      <span>Benchmarking active: 12 niche profiles matched</span>
                    </div>
                  </div>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* CHANGE 3 — Persisted Experiment Queue */}
      {strategy && (
        <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow relative select-none">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-display font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-accent animate-pulse" />
                Strategic A/B Experiment Queue
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Concrete testing playbooks generated automatically for dimensions averaging below 5.0 in your last 5 posts.
              </p>
            </div>
            <span className="px-3 py-1 border border-brand-accent/30 bg-brand-accent/10 text-[9px] font-black text-brand-accent rounded-full uppercase tracking-wider">
              ACTIVE LIMIT: 3 CONCURRENTLY
            </span>
          </div>

          {!strategy.content?.experimentQueue || 
           ((strategy.content.experimentQueue as any).active?.length === 0 && 
            (strategy.content.experimentQueue as any).history?.length === 0) ? (
            <div className="py-8 text-center border border-dashed border-emerald-400/20 rounded-xl bg-emerald-400/5 select-none">
              <CheckSquare className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-emerald-400 font-semibold">
                All dimensions are above threshold — no experiments queued. Revisit after your next 5 posts.
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                Outstanding average metric consistency! Maintain your current scripting blueprints and B-roll tempos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Active Stack */}
              {((strategy.content.experimentQueue as any).active || []).length === 0 ? (
                <div className="py-6 text-center border border-dashed border-white/10 rounded-xl bg-black/10 text-xs text-gray-400">
                  No active experiments running currently. View your history below or score more posts to discover gaps.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {((strategy.content.experimentQueue as any).active || []).slice(0, 3).map((exp: any, idx: number) => {
                    return (
                      <div 
                        key={exp.id || idx} 
                        className="p-5 bg-white/5 border border-glass rounded-xl flex flex-col lg:flex-row justify-between gap-6 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex flex-col gap-2 max-w-3xl">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 border rounded-lg text-[9px] font-mono font-bold uppercase ${exp.badgeColor}`}>
                              {exp.dimension}
                            </span>
                            <span className="px-2 py-0.5 border border-white/10 bg-black/40 text-[8px] font-mono text-gray-400 rounded-md">
                              ⏱ {exp.postsNeeded}
                            </span>
                          </div>
                          <p className="text-xs text-gray-200 font-semibold leading-relaxed">
                            {exp.description}
                          </p>
                          <div className="text-[10px] text-brand-secondary font-mono flex items-center gap-1 mt-1">
                            <strong>Success Metric Target:</strong> {exp.successMetric} (+20% vs baseline)
                          </div>
                        </div>

                        {/* Status Selectors */}
                        <div className="flex flex-col gap-3 shrink-0 justify-center select-none">
                          <div className="flex items-center border border-glass bg-black/50 rounded-xl p-1 w-fit">
                            {["Queued", "In Progress", "Complete", "Skipped"].map((status) => (
                              <button 
                                key={status}
                                onClick={() => handleUpdateExperiment(exp.id, { status })}
                                className={`px-3 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                                  exp.status === status
                                    ? status === "In Progress"
                                      ? "bg-brand-primary text-white shadow-glow"
                                      : status === "Complete"
                                      ? "bg-emerald-400 text-black font-bold"
                                      : status === "Skipped"
                                      ? "bg-gray-600 text-white"
                                      : "bg-brand-secondary text-white"
                                    : "text-gray-400 hover:text-white"
                                }`}
                              >
                                {status === "In Progress" ? "Start" : status}
                              </button>
                            ))}
                          </div>

                          {/* Outcome log text field visible only when status is changed to Complete */}
                          {exp.status === "Complete" && (
                            <div className="flex flex-col gap-1.5 mt-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Log Experiment Outcome:</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="E.g., Comment rate grew 25%! Adopting..."
                                  value={exp.outcome || ""}
                                  onChange={(e) => {
                                    // Local state update first
                                    mutate({
                                      ...strategy,
                                      content: {
                                        ...strategy.content,
                                        experimentQueue: {
                                          ...strategy.content.experimentQueue,
                                          active: (strategy.content.experimentQueue as any).active.map((item: any) => 
                                            item.id === exp.id ? { ...item, outcome: e.target.value } : item
                                          )
                                        }
                                      }
                                    }, false);
                                  }}
                                  className="bg-black/50 border border-glass rounded-lg text-xs px-3 py-1.5 text-white max-w-[240px] focus:outline-none focus:border-brand-primary"
                                />
                                <button 
                                  onClick={() => handleUpdateExperiment(exp.id, { outcome: exp.outcome || "", status: "Complete" })}
                                  className="bg-emerald-400 text-black text-[9px] font-extrabold uppercase px-3 rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                                >
                                  Save Log
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {((strategy.content.experimentQueue as any).active || []).length > 3 && (
                    <div className="text-[10px] text-gray-500 font-mono italic">
                      + {((strategy.content.experimentQueue as any).active || []).length - 3} other experiments deferred to preserve active focus limits.
                    </div>
                  )}
                </div>
              )}

              {/* History collapsible section */}
              {((strategy.content.experimentQueue as any).history || []).length > 0 && (
                <details className="group border border-glass bg-black/35 rounded-2xl select-none mt-4 transition-all">
                  <summary className="cursor-pointer p-4 font-display font-extrabold text-xs uppercase tracking-wider text-gray-400 hover:text-white flex items-center justify-between">
                    <span>View Closed Experiment History ({((strategy.content.experimentQueue as any).history || []).length})</span>
                    <span className="text-[10px] text-brand-secondary select-none font-sans group-open:rotate-180 transition-transform duration-300">▼</span>
                  </summary>

                  <div className="p-4 border-t border-white/5 flex flex-col gap-3 bg-black/10">
                    {((strategy.content.experimentQueue as any).history || []).map((exp: any, idx: number) => (
                      <div 
                        key={exp.id || idx} 
                        className="p-4 bg-white/[0.02] border border-glass rounded-xl flex flex-col md:flex-row justify-between gap-4 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 border rounded-md text-[8px] font-mono font-bold uppercase ${exp.badgeColor}`}>
                              {exp.dimension}
                            </span>
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              exp.status === 'Complete' 
                                ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/20' 
                                : 'bg-gray-600/20 text-gray-400 border border-gray-600/20'
                            }`}>
                              {exp.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed mt-1">
                            {exp.description}
                          </p>
                          {exp.outcome && (
                            <div className="text-xs text-emerald-400 bg-emerald-400/5 border border-emerald-400/10 rounded-lg p-2 mt-2 leading-normal">
                              <strong>Logged Outcome:</strong> {exp.outcome}
                            </div>
                          )}
                        </div>

                        {/* Reset action in history */}
                        <div className="flex items-center shrink-0">
                          <button 
                            onClick={() => handleUpdateExperiment(exp.id, { status: "Queued", outcome: "" })}
                            className="text-[9px] font-bold uppercase tracking-wider text-brand-secondary border border-brand-secondary/20 bg-brand-secondary/5 px-3 py-1.5 rounded-lg hover:bg-brand-secondary/15 active:scale-95 transition-all cursor-pointer"
                          >
                            Restore to Queue
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


