"use client";

import React, { useState } from "react";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { usePosts } from "@/hooks/use-posts";
import { PostCard } from "@/components/dashboard/post-card";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LoadError } from "@/components/shared/load-error";
import Link from "next/link";
import { useToast } from "@/components/shared/toast";
import { m, AnimatePresence } from "framer-motion";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import { 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  Play, 
  Check, 
  AlertCircle,
  Clock,
  Flame,
  Eye,
  Award
} from "lucide-react";

const gridContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    }
  }
} as const;

const gridCardVariants = {
  hidden: { opacity: 0, scale: 0.96, filter: "blur(6px)" },
  show: { 
    opacity: 1, 
    scale: 1, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 20 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.96, 
    filter: "blur(6px)",
    transition: { duration: 0.2 }
  }
} as const;

export default function PostsPage() {
  const { activeAccount } = useActiveAccount();
  const toast = useToast();
  
  // States
  const [platformFilter, setPlatformFilter] = useState<"all" | "instagram" | "tiktok">("all");
  const [sortBy, setSortBy] = useState<"date" | "views" | "engagement" | "score">("date");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 6;

  // SWR Hook for posts
  const { 
    posts = [], 
    isLoading, 
    error, 
    mutate,
    scoreAllPosts,
    bulkScoringInProgress,
    bulkScoreProgress 
  } = usePosts(platformFilter);

  // Filter and Sort in client memory for blazing fast feel
  const filteredPosts = React.useMemo(() => {
    let result = [...posts];

    // Filter by platform
    if (platformFilter !== "all") {
      result = result.filter(p => p.platform === platformFilter);
    }

    // Filter by search caption
    if (searchTerm) {
      result = result.filter(p => p.caption?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === "views") {
        return b.displayViews - a.displayViews;
      }
      if (sortBy === "engagement") {
        return Number(b.engagementRate || 0) - Number(a.engagementRate || 0);
      }
      if (sortBy === "score") {
        return (b.overallScore || 0) - (a.overallScore || 0);
      }
      return 0;
    });

    return result;
  }, [posts, platformFilter, searchTerm, sortBy]);

  // Paginated chunk
  const paginatedPosts = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filteredPosts.slice(start, start + limit);
  }, [filteredPosts, page]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / limit));

  // Reset page if filters change
  React.useEffect(() => {
    setPage(1);
  }, [platformFilter, searchTerm, sortBy]);

  const handleScoreAll = async () => {
    if (!activeAccount) return;
    try {
      await scoreAllPosts();
    } catch (err) {
      // scoreAllPosts already surfaces its own toast; only handle unexpected throws here
      console.error("Bulk AI scoring failed:", err);
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

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white mb-1">
            Short-Form Content Catalog
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage, evaluate, and extract key hooks from your linked Reels and TikTok videos.
          </p>
        </div>

        {/* Bulk Action Button */}
        <m.button
          onClick={handleScoreAll}
          disabled={bulkScoringInProgress || posts.length === 0}
          whileHover={bulkScoringInProgress || posts.length === 0 ? {} : { scale: 1.02 }}
          whileTap={bulkScoringInProgress || posts.length === 0 ? {} : { scale: 0.98, transition: { type: "spring", stiffness: 500, damping: 15 } }}
          className={`min-h-[44px] px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            bulkScoringInProgress
              ? "bg-white/10 text-gray-500 border border-white/5 cursor-not-allowed"
              : "bg-brand-primary text-white shadow-glow hover:bg-brand-primary/90"
          }`}
        >
          {bulkScoringInProgress ? (
            <div className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-white animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{bulkScoringInProgress ? "Scoring Progress Active" : "Score All Unrated"}</span>
        </m.button>
      </div>

      {/* Bulk Scoring Floating Panel */}
      <AnimatePresence>
        {bulkScoringInProgress && (
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 border border-glass bg-glass backdrop-blur-xl rounded-xl shadow-glow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-white/5 border-t-brand-primary animate-spin shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-white">Bulk Evaluation Running</h4>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {bulkScoreProgress || "Scanning queue status..."}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary animate-pulse w-2/3" />
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Filters Bar */}
      <div className="border border-glass bg-glass rounded-xl p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by caption keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[40px] pl-10 pr-4 bg-white/5 rounded-lg border border-glass text-xs font-semibold text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors"
          />
        </div>

        {/* Platform tabs */}
        <SlidingTabs
          options={[
            { value: "all", label: "All" },
            { value: "instagram", label: "Instagram" },
            { value: "tiktok", label: "TikTok" },
          ]}
          selectedValue={platformFilter}
          onChange={setPlatformFilter}
          layoutId="posts-platform-filter"
          activeClassName="bg-brand-primary/80"
        />

        {/* Sort selector */}
        <div className="relative min-w-[160px] select-none">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full min-h-[40px] pl-9 pr-4 bg-white/5 rounded-lg border border-glass text-xs font-bold text-gray-200 appearance-none focus:outline-none cursor-pointer"
          >
            <option value="date" className="bg-[#1E1E2A]">Sort by: Date</option>
            <option value="views" className="bg-[#1E1E2A]">Sort by: Views</option>
            <option value="engagement" className="bg-[#1E1E2A]">Sort by: Engagement</option>
            <option value="score" className="bg-[#1E1E2A]">Sort by: AI Score</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {error ? (
        <LoadError
          title="Couldn't load your posts"
          error={error}
          onRetry={() => mutate()}
        />
      ) : isLoading ? (
        <LoadingSkeleton variant="posts" count={6} />
      ) : filteredPosts.length > 0 ? (
        <div className="flex flex-col gap-6">
          <m.div 
            layout
            variants={gridContainerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {paginatedPosts.map((post) => (
                <m.div
                  key={post.id}
                  layout
                  variants={gridCardVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  style={{ originY: 0.5 }}
                >
                  <PostCard post={post} />
                </m.div>
              ))}
            </AnimatePresence>
          </m.div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <EmptyState
          context="posts"
          actionLabel="Sync this account"
          onActionClick={() => {
            window.location.assign("/accounts");
          }}
        />
      )}
    </div>
  );
}
