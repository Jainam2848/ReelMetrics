"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/components/shared/toast";
import { TeleprompterModal } from "@/components/dashboard/teleprompter-modal";
import { Button } from "@/components/ui/button";
import { m, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Play,
  Lock,
  Copy,
  Check,
  RotateCcw,
  Zap,
  TrendingUp,
  AlertCircle,
  Video,
  ArrowUpRight
} from "lucide-react";

interface StoryboardItem {
  time_start_sec: number;
  time_end_sec: number;
  visual_action: string;
  spoken_script: string;
  on_screen_text: string;
  sound_sync_note: string;
}

interface RewriterResult {
  curiosity_audit: string;
  psychological_lever: string;
  rewritten_script: StoryboardItem[];
  metadata?: {
    modelUsed: string;
    costUsd: number;
    latencyMs: number;
  };
}

const LOADING_STEPS = [
  "Auditing original script hook for skip triggers...",
  "Selecting optimal copywriting psychology model...",
  "Engineering high-retention curiosity loops...",
  "Structuring visual pacing & transition cues...",
  "Generating final storyboard & loop hook..."
];

export default function ScriptRewriterPage() {
  const { activeAccount } = useActiveAccount();
  const { subscription, isLoading: subLoading } = useSubscription();
  const toast = useToast();

  const [rawScript, setRawScript] = useState("");
  const [growthGoal, setGrowthGoal] = useState<"followers" | "engagement" | "conversions">("followers");
  const [niche, setNiche] = useState("");

  const [isRewriting, setIsRewriting] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [result, setResult] = useState<RewriterResult | null>(null);

  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedOverlays, setCopiedOverlays] = useState(false);

  // Sync niche from active account initially
  useEffect(() => {
    const accountNiche = activeAccount?.niche || "";
    if (accountNiche) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNiche((prev) => (prev === accountNiche ? prev : accountNiche));
    }
  }, [activeAccount]);

  // Handle loading steps animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRewriting) {
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => {
          if (prev < LOADING_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isRewriting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawScript || rawScript.trim().length < 10) {
      toast.error("Please enter a script draft with at least 10 characters.");
      return;
    }

    setIsRewriting(true);
    setLoadingStepIdx(0);
    setResult(null);

    try {
      const res = await fetch("/api/scripts/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawScript,
          growthGoal,
          niche: niche || "general",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to rewrite script.");
      }

      setResult(data.data);
      toast.success("Script rewritten successfully with viral frameworks!");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "An error occurred during script rewriting.";
      toast.error(msg);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopySpokenScript = () => {
    if (!result) return;
    const spoken = result.rewritten_script
      .map((item) => item.spoken_script)
      .filter(Boolean)
      .join(" ");
    navigator.clipboard.writeText(spoken);
    setCopiedScript(true);
    toast.success("Spoken script copied to clipboard!");
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyOverlays = () => {
    if (!result) return;
    const overlays = result.rewritten_script
      .map((item) => item.on_screen_text)
      .filter(Boolean)
      .join(" | ");
    navigator.clipboard.writeText(overlays);
    setCopiedOverlays(true);
    toast.success("Text overlays copied to clipboard!");
    setTimeout(() => setCopiedOverlays(false), 2000);
  };

  const fullSpokenScriptText = result?.rewritten_script
    ? result.rewritten_script.map((item) => item.spoken_script).join(" ")
    : "";

  // 1. Loading active account state
  if (!activeAccount) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none bg-transparent">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
          <Zap className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Connect Instagram Account</h3>
        <p className="text-sm text-[#82889E] max-w-sm mb-6 leading-relaxed">
          Please link your Instagram Business or Creator account to start using {"Trendoraa's"} Script Rewriting engine.
        </p>
        <Link href="/accounts" passHref legacyBehavior>
          <Button variant="default" size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
            Go to Accounts
          </Button>
        </Link>
      </div>
    );
  }

  // 2. Subscription/Plan Guard check
  if (!subLoading && subscription?.planId === "free") {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6">
        <div className="relative p-8 rounded-2xl border border-white/[0.06] bg-[#0c0d12]/60 backdrop-blur-2xl overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#CCF381]/10 border border-[#CCF381]/20 flex items-center justify-center text-[#CCF381] mb-6">
              <Lock className="w-6 h-6" />
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
              Unlock the Viral Script Rewriter
            </h2>
            <p className="text-sm text-[#82889E] max-w-md mt-3 leading-relaxed">
              Upgrade to a paid tier (Creator, Pro, or Agency) to psychologically engineer your short-form hooks, visual pacing cuts, and CTAs for maximum organic reach.
            </p>

            {/* Premium feature highlight list */}
            <div className="w-full max-w-md my-8 space-y-3.5 text-left border-y border-white/[0.06] py-6">
              <div className="flex items-start gap-3 text-sm">
                <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">DeepSeek Reasoner Engine</span>
                  <span className="text-[#82889E] text-xs">Access advanced reasoning model strategy mapping.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Skip Resistance Mutation</span>
                  <span className="text-[#82889E] text-xs">Force viewers past the 3-second hook with psychological hooks.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <Video className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Teleprompter Mode</span>
                  <span className="text-[#82889E] text-xs">Smooth auto-scrolling mobile script view for easy filming.</span>
                </div>
              </div>
            </div>

            <Link href="/billing" passHref legacyBehavior>
              <Button variant="default" size="lg" className="bg-[#CCF381] text-[#08090D] hover:bg-[#bce66c] font-black uppercase tracking-wider px-8 py-4 shadow-glow-sm">
                Upgrade Subscription <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 select-none">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
            Viral Script Rewriter
          </h2>
          <p className="text-sm text-[#82889E] mt-1 leading-relaxed max-w-xl">
            Input your raw video ideas or talking points, select your growth goal, and obtain a ready-to-shoot storyboard optimized for high viewer retention.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Loading State */}
        {isRewriting && (
          <m.div
            key="loading"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-8 rounded-2xl border border-white/[0.06] bg-[#0c0d12]/50 backdrop-blur-2xl flex flex-col items-center justify-center min-h-[400px] text-center"
          >
            <div className="relative w-16 h-16 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-white">Engineering Viral Mechanics</h3>
            <p className="text-xs text-[#82889E] mt-2 font-mono h-5 animate-pulse max-w-md">
              {LOADING_STEPS[loadingStepIdx]}
            </p>

            <div className="w-48 h-1 bg-[#212330] rounded-full mt-6 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500 rounded-full" 
                style={{ width: `${((loadingStepIdx + 1) / LOADING_STEPS.length) * 100}%` }}
              />
            </div>
          </m.div>
        )}

        {/* Form State */}
        {!isRewriting && !result && (
          <m.form
            key="form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            onSubmit={handleSubmit}
            className="p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-[#0c0d12]/60 backdrop-blur-2xl shadow-xl flex flex-col gap-6"
          >
            
            {/* Input Script Draft */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/80">
                Paste Raw Script or Talking Points
              </label>
              <textarea
                value={rawScript}
                onChange={(e) => setRawScript(e.target.value)}
                placeholder="Example: Hey guys, in this video I'm going to tell you how to negotiate your salary. Most people just accept the first offer, but you shouldn't do that. First, research the market..."
                className="w-full h-44 bg-[#14151f]/60 border border-white/[0.08] hover:border-white/[0.12] focus:border-indigo-500 rounded-xl p-4 text-sm text-white placeholder-[#515668] outline-none transition-all resize-none leading-relaxed"
                required
              />
              <span className="text-[10px] text-[#82889E] text-right font-mono">
                {rawScript.length} / 3000 chars
              </span>
            </div>

            {/* Growth Goal Selector */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-white/80">
                Strategic Growth Goal
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                <button
                  type="button"
                  onClick={() => setGrowthGoal("followers")}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    growthGoal === "followers"
                      ? "border-indigo-500/40 bg-indigo-500/5 text-white"
                      : "border-white/[0.06] bg-[#14151f]/30 text-white/70 hover:bg-[#14151f]/50 hover:text-white"
                  }`}
                >
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Gain Followers
                  </span>
                  <span className="text-[11px] text-[#82889E] leading-relaxed">
                    Uses open-ended serial formats and subscriber CTAs.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrowthGoal("engagement")}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    growthGoal === "engagement"
                      ? "border-indigo-500/40 bg-indigo-500/5 text-white"
                      : "border-white/[0.06] bg-[#14151f]/30 text-white/70 hover:bg-[#14151f]/50 hover:text-white"
                  }`}
                >
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Boost Engagement
                  </span>
                  <span className="text-[11px] text-[#82889E] leading-relaxed">
                    Maximizes shares and saves with high utility checklists.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrowthGoal("conversions")}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    growthGoal === "conversions"
                      ? "border-indigo-500/40 bg-indigo-500/5 text-white"
                      : "border-white/[0.06] bg-[#14151f]/30 text-white/70 hover:bg-[#14151f]/50 hover:text-white"
                  }`}
                >
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Drive Conversions
                  </span>
                  <span className="text-[11px] text-[#82889E] leading-relaxed">
                    Integrates problem-solution framing with trigger links.
                  </span>
                </button>

              </div>
            </div>

            {/* Custom Niche Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white/80">
                Niche Domain
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Finance, Tech, Fitness, Food"
                className="w-full h-10 bg-[#14151f]/60 border border-white/[0.08] hover:border-white/[0.12] focus:border-indigo-500 rounded-xl px-4 text-sm text-white placeholder-[#515668] outline-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full bg-[#CCF381] text-[#08090D] hover:bg-[#bce66c] py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-glow-sm mt-2"
            >
              <Sparkles className="w-4 h-4 fill-current" /> Rewrite For Virality
            </Button>

          </m.form>
        )}

        {/* Output/Result State */}
        {result && (
          <m.div
            key="result"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-6"
          >
            
            {/* Top Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-5 rounded-xl border border-[#CCF381]/20 bg-[#CCF381]/5 backdrop-blur-2xl">
                <div className="flex items-center gap-2 text-[#CCF381] text-xs font-bold uppercase tracking-wider mb-2">
                  <AlertCircle className="w-4 h-4" /> Curiosity Hook Audit
                </div>
                <p className="text-sm text-white/90 leading-relaxed font-semibold">
                  {result.curiosity_audit}
                </p>
              </div>

              <div className="p-5 rounded-xl border border-indigo-500/25 bg-[#0e1019]/60 backdrop-blur-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Zap className="w-4 h-4" /> Psychological Lever Activated
                  </div>
                  <h4 className="text-lg font-black text-white capitalize leading-tight">
                    {result.psychological_lever}
                  </h4>
                </div>
                <div className="text-[10px] text-[#82889E] font-mono mt-4">
                  Engine: {result.metadata?.modelUsed.replace("deepseek-", "DeepSeek ")} • Cost: ${(result.metadata?.costUsd ?? 0).toFixed(4)}
                </div>
              </div>

            </div>

            {/* Actions Bar */}
            <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0c0d12]/40 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySpokenScript}
                  className="px-4 py-2 rounded-lg bg-[#14151f] hover:bg-[#1E2030] text-xs font-bold text-white border border-white/[0.06] transition flex items-center gap-2"
                >
                  {copiedScript ? <Check size={14} className="text-[#CCF381]" /> : <Copy size={14} />}
                  Copy Spoken Script
                </button>
                <button
                  onClick={handleCopyOverlays}
                  className="px-4 py-2 rounded-lg bg-[#14151f] hover:bg-[#1E2030] text-xs font-bold text-white border border-white/[0.06] transition flex items-center gap-2"
                >
                  {copiedOverlays ? <Check size={14} className="text-[#CCF381]" /> : <Copy size={14} />}
                  Copy Overlays
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTeleprompterOpen(true)}
                  className="px-5 py-2.5 rounded-lg bg-[#CCF381] hover:bg-[#bce66c] text-xs font-extrabold text-[#08090D] transition flex items-center gap-2 shadow-glow-sm"
                >
                  <Play size={14} fill="currentColor" /> Start Teleprompter
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="p-2.5 rounded-lg bg-[#14151f] hover:bg-[#1E2030] border border-white/[0.06] text-[#82889E] hover:text-white transition"
                  title="Rewrite New Script"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Storyboard Table */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0d12]/60 backdrop-blur-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-[#82889E]">
                  <thead className="bg-[#12131A] text-xs font-bold uppercase tracking-wider text-white border-b border-white/[0.06]">
                    <tr>
                      <th className="px-5 py-4 w-24">Time</th>
                      <th className="px-5 py-4 w-1/3">Spoken Script</th>
                      <th className="px-5 py-4 w-1/3">Visual Action & Pacing</th>
                      <th className="px-5 py-4">Text Overlays</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] bg-[#0c0d12]/30">
                    {result.rewritten_script.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01] transition duration-150">
                        <td className="px-5 py-5 font-mono text-xs text-[#CCF381] font-bold">
                          {item.time_start_sec.toFixed(1)}s - {item.time_end_sec.toFixed(1)}s
                        </td>
                        <td className="px-5 py-5 text-white/95 font-semibold leading-relaxed">
                          {item.spoken_script || <span className="text-[#515668] italic font-normal">(No audio / music only)</span>}
                        </td>
                        <td className="px-5 py-5 leading-relaxed text-white/80">
                          {item.visual_action}
                          {item.sound_sync_note && (
                            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide mt-1.5 flex items-center gap-1 select-none">
                              <Zap size={10} fill="currentColor" /> {item.sound_sync_note}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-5">
                          {item.on_screen_text ? (
                            <span className="inline-block px-2.5 py-1.5 rounded-lg border border-[#CCF381]/20 bg-[#CCF381]/5 text-white font-mono text-xs font-bold shadow-sm">
                              &quot;{item.on_screen_text}&quot;
                            </span>
                          ) : (
                            <span className="text-[#515668] text-xs italic">(None)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </m.div>
        )}

      </AnimatePresence>

      {/* Teleprompter Modal */}
      <TeleprompterModal
        isOpen={isTeleprompterOpen}
        onClose={() => setIsTeleprompterOpen(false)}
        title={growthGoal.toUpperCase() + " Optimization • " + (niche || "General")}
        spokenScript={fullSpokenScriptText}
      />

    </div>
  );
}
