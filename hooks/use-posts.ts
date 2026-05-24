"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useToast } from "@/components/shared/toast";

export interface PostDetails {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  permalink: string | null;
  timestamp: string;
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
}

export function usePosts(platformFilter: "all" | "instagram" | "tiktok" = "all") {
  const { activeAccount } = useActiveAccount();
  const toast = useToast();
  
  const [bulkScoringInProgress, setBulkScoringInProgress] = useState(false);
  const [bulkScoreProgress, setBulkScoreProgress] = useState("");
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // SWR scoping to active account
  const {
    data: posts = [],
    error,
    isLoading,
    mutate,
  } = useSWR<PostDetails[]>(
    activeAccount ? `/api/accounts/${activeAccount.id}/reels?platform=${platformFilter}` : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Poll progress helper
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Poll active queue status of scores
  const pollScoringStatus = useCallback(async () => {
    if (!activeAccount) return;
    
    try {
      const res = await fetch(`/api/accounts/${activeAccount.id}/reels?platform=${platformFilter}`);
      const json = await res.json();
      
      if (json.success && Array.isArray(json.data)) {
        const postsList: PostDetails[] = json.data;
        const totalPosts = postsList.length;
        const scoredPosts = postsList.filter((p) => p.overallScore !== null).length;
        
        if (scoredPosts === totalPosts || totalPosts === 0) {
          setBulkScoringInProgress(false);
          setBulkScoreProgress("");
          stopPolling();
          mutate(postsList, false); // force local state update
          toast.success("Successfully completed AI scoring for all posts!");
        } else {
          setBulkScoreProgress(`${scoredPosts} of ${totalPosts} scored`);
          mutate(postsList, false); // update list incrementally in UI
        }
      }
    } catch (err) {
      console.error("Error polling scoring progress:", err);
    }
  }, [activeAccount, platformFilter, mutate, stopPolling, toast]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Bulk score trigger
  const scoreAllPosts = useCallback(async () => {
    if (!activeAccount || posts.length === 0) return;
    
    const unscored = posts.filter((p) => p.overallScore === null);
    if (unscored.length === 0) {
      toast.info("All posts have already been scored by AI.");
      return;
    }

    try {
      setBulkScoringInProgress(true);
      setBulkScoreProgress(`0 of ${posts.length} scored`);
      
      toast.info(`Enqueuing ${unscored.length} posts for AI evaluation...`);

      // Trigger POST score for all unscored posts
      await Promise.all(
        unscored.map((post) =>
          fetch(`/api/reels/${post.id}/score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      // Start custom interval polling to check scoring states incrementally
      stopPolling();
      pollIntervalRef.current = setInterval(pollScoringStatus, 4000);
      
    } catch (err) {
      console.error("Bulk scoring trigger failed:", err);
      setBulkScoringInProgress(false);
      setBulkScoreProgress("");
      toast.error("Failed to trigger bulk post scoring.");
    }
  }, [activeAccount, posts, pollScoringStatus, stopPolling, toast]);

  return {
    posts,
    error,
    isLoading: isLoading && activeAccount !== null,
    mutate,
    scoreAllPosts,
    bulkScoringInProgress,
    bulkScoreProgress,
  };
}
