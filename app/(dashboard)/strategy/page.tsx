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
    </div>
  );
}

