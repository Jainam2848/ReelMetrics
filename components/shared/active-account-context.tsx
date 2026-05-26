"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import useSWR, { KeyedMutator } from "swr";
import { apiFetcher } from "@/lib/api/client-fetcher";

export interface SocialAccountDetails {
  id: string;
  igUserId: string;
  username: string;
  followersCount: number;
  lastSyncedAt: string | null;
  syncStatus:
    | "completed"
    | "active"
    | "pending_sync"
    | "syncing"
    | "error"
    | "disconnected"
    | "rate_limited"
    | null;
  platform: "instagram" | "tiktok";
  niche?: string | null;
  goal?: string | null;
}

interface ActiveAccountContextType {
  activeAccount: SocialAccountDetails | null;
  setActiveAccount: (account: SocialAccountDetails) => void;
  accounts: SocialAccountDetails[];
  isLoading: boolean;
  error: Error | null;
  mutate: KeyedMutator<SocialAccountDetails[]>;
}

const ActiveAccountContext = createContext<ActiveAccountContextType | undefined>(undefined);

const fetcher = async (url: string): Promise<SocialAccountDetails[]> => {
  const items = await apiFetcher<
    Array<Omit<SocialAccountDetails, "platform">>
  >(url);

  return items.map((acc) => ({
    ...acc,
    platform:
      acc.username.includes("tiktok") || acc.username.includes("bob")
        ? ("tiktok" as const)
        : ("instagram" as const),
  }));
};

export function ActiveAccountProvider({ children }: { children: React.ReactNode }) {
  const { data: accounts = [], error, isLoading, mutate } = useSWR<SocialAccountDetails[], Error>("/api/accounts", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const [activeAccount, setActiveAccountState] = useState<SocialAccountDetails | null>(null);

  // Sync state when accounts list finishes loading
  useEffect(() => {
    requestAnimationFrame(() => {
      if (accounts.length > 0) {
        // Keep the current active account if it still exists in the newly fetched list
        const matches = activeAccount ? accounts.find((a) => a.id === activeAccount.id) : null;
        if (matches) {
          setActiveAccountState(matches);
        } else {
          // Automatically default to the first connected account
          const firstAccount = accounts[0];
          if (firstAccount) {
            setActiveAccountState(firstAccount);
          }
        }
      } else {
        setActiveAccountState(null);
      }
    });
  }, [accounts, activeAccount]);

  const setActiveAccount = useCallback((account: SocialAccountDetails) => {
    setActiveAccountState(account);
  }, []);

  return (
    <ActiveAccountContext.Provider
      value={{
        activeAccount,
        setActiveAccount,
        accounts,
        isLoading,
        error: error || null,
        mutate,
      }}
    >
      {children}
    </ActiveAccountContext.Provider>
  );
}

export function useActiveAccount() {
  const context = useContext(ActiveAccountContext);
  if (!context) {
    throw new Error("useActiveAccount must be used within an ActiveAccountProvider");
  }
  return context;
}
