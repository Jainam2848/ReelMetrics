"use client";

import React from "react";
import { m } from "framer-motion";
import { Settings, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/shared/toast";

interface DashboardCustomizerProps {
  layoutOrder: string[];
  hiddenBlocks: string[];
  isCustomizing: boolean;
  setIsCustomizing: (v: boolean) => void;
  setLayoutOrder: (order: string[]) => void;
  setHiddenBlocks: (blocks: string[]) => void;
}

const BLOCK_LABELS: Record<string, string> = {
  metrics: "Bento Metric Cards",
  charts: "Engagement Trend",
  strategy: "Content Strategy",
  posts: "Peak Performers",
};

/**
 * Dashboard customizer toolbar — shows edit/save/reset controls, and renders
 * per-block move/hide controls when in customizing mode.
 */
export function DashboardCustomizer({
  layoutOrder,
  hiddenBlocks,
  isCustomizing,
  setIsCustomizing,
  setLayoutOrder,
  setHiddenBlocks,
}: DashboardCustomizerProps) {
  const toast = useToast();

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newOrder = [...layoutOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index]!;
      newOrder[index] = newOrder[targetIndex]!;
      newOrder[targetIndex] = temp;
      setLayoutOrder(newOrder);
    }
  };

  const toggleHideBlock = (blockId: string) => {
    if (hiddenBlocks.includes(blockId)) {
      setHiddenBlocks(hiddenBlocks.filter((id) => id !== blockId));
    } else {
      setHiddenBlocks([...hiddenBlocks, blockId]);
    }
  };

  const saveLayout = () => {
    localStorage.setItem("trendoraa_layout_order", JSON.stringify(layoutOrder));
    localStorage.setItem("trendoraa_hidden_blocks", JSON.stringify(hiddenBlocks));
    setIsCustomizing(false);
    toast.success("Dashboard layout saved successfully!");
  };

  const resetLayout = () => {
    setLayoutOrder(["metrics", "charts", "strategy", "posts"]);
    setHiddenBlocks([]);
    localStorage.removeItem("trendoraa_layout_order");
    localStorage.removeItem("trendoraa_hidden_blocks");
    toast.success("Dashboard layout reset to defaults!");
  };

  /**
   * Returns the per-block controls overlay element when customizing.
   * Called from the parent's wrapBlock helper to layer controls over each section.
   */
  const getBlockControls = (blockId: string, index: number) => {
    if (!isCustomizing) return null;
    const isHidden = hiddenBlocks.includes(blockId);
    return (
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-brand-primary/30 select-none">
        <span className="text-[9px] font-black text-brand-primary uppercase mr-2">
          {BLOCK_LABELS[blockId] ?? blockId}
        </span>
        <button
          onClick={() => moveBlock(index, "up")}
          disabled={index === 0}
          className="p-1 text-gray-400 hover:text-brand-primary disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer transition-colors"
          title="Move Up"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => moveBlock(index, "down")}
          disabled={index === layoutOrder.length - 1}
          className="p-1 text-gray-400 hover:text-brand-primary disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer transition-colors"
          title="Move Down"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => toggleHideBlock(blockId)}
          className={`p-1 cursor-pointer transition-colors ${
            isHidden ? "text-brand-primary" : "text-gray-400 hover:text-white"
          }`}
          title={isHidden ? "Show Section" : "Hide Section"}
        >
          {isHidden ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    );
  };

  return {
    toolbar: (
      <div className="flex justify-end gap-3 select-none relative z-20 -mb-2">
        {isCustomizing ? (
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-glass">
            <button
              onClick={saveLayout}
              className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-brand-primary text-white shadow-glow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all"
            >
              Save Layout
            </button>
            <button
              onClick={resetLayout}
              className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            >
              Reset
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCustomizing(true)}
            className="px-4 py-2 border border-glass bg-glass hover:bg-white/5 rounded-xl text-xs font-bold text-gray-300 hover:text-white cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Settings
              className="w-4 h-4 text-brand-primary animate-spin"
              style={{ animationDuration: "6s" }}
            />
            <span>Customize Dashboard</span>
          </button>
        )}
      </div>
    ),
    getBlockControls,
  };
}
