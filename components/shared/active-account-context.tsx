"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import useSWR from "swr";

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
}

interface ActiveAccountContextType {
  activeAccount: SocialAccountDetails | null;
  setActiveAccount: (account: SocialAccountDetails) => void;
  accounts: SocialAccountDetails[];
  isLoading: boolean;
  error: any;
  mutate: () => Promise<any>;
}

const ActiveAccountContext = createContext<ActiveAccountContextType | undefined>(undefined);

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      if (!json.success) throw new Error(json.error?.message || "An error occurred");
      
      // Inject standard platform attribute on response
      const items = json.data || [];
      return items.map((acc: any) => ({
        ...acc,
        platform: acc.username.includes("tiktok") || acc.username.includes("bob") ? ("tiktok" as const) : ("instagram" as const),
      })) as SocialAccountDetails[];
    });

export function ActiveAccountProvider({ children }: { children: React.ReactNode }) {
  const { data: accounts = [], error, isLoading, mutate } = useSWR<SocialAccountDetails[]>("/api/accounts", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const [activeAccount, setActiveAccountState] = useState<SocialAccountDetails | null>(null);

  // Sync state when accounts list finishes loading
  useEffect(() => {
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
        error,
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
