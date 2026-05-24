"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useToast } from "@/components/shared/toast";
import { useActiveAccount, SocialAccountDetails } from "@/components/shared/active-account-context";

export function useAccounts() {
  const toast = useToast();
  const { accounts, error, isLoading, mutate } = useActiveAccount();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Trigger manual sync
  const syncAccount = useCallback(
    async (accountId: string) => {
      try {
        setIsSyncing(true);
        toast.info("Ingesting raw social media metrics. Syncing your reels in background...");

        const res = await fetch(`/api/accounts/${accountId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (json.success) {
          await mutate(); // Refresh active account metadata
          toast.success("Social metrics sync successfully completed!");
        } else {
          // Map sync active error
          if (json.error?.code === "SYNC_COOLDOWN_ACTIVE") {
            toast.info("Sync cooldown active. Please wait 5 minutes between manual syncs.");
          } else {
            throw new Error(json.error?.message || "Sync failed");
          }
        }
      } catch (err) {
        console.error("Manual sync failed:", err);
        toast.error("An unexpected error occurred during sync ingestion.");
      } finally {
        setIsSyncing(false);
      }
    },
    [mutate, toast]
  );

  // Disconnect social account
  const disconnectAccount = useCallback(
    async (accountId: string) => {
      try {
        setIsDisconnecting(true);
        toast.info("Disconnecting profile and deleting tokens...");

        const res = await fetch(`/api/accounts/${accountId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (json.success) {
          await mutate(); // Refresh accounts list
          toast.success("Account disconnected. Sensitive tokens have been purged.");
        } else {
          throw new Error(json.error?.message || "Disconnect failed");
        }
      } catch (err) {
        console.error("Disconnection failed:", err);
        toast.error("Failed to disconnect social account.");
      } finally {
        setIsDisconnecting(false);
      }
    },
    [mutate, toast]
  );

  return {
    accounts,
    error,
    isLoading,
    syncAccount,
    disconnectAccount,
    isSyncing,
    isDisconnecting,
    mutate,
  };
}
