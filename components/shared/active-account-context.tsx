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
  // Only enable the SWR key once we confirm an authenticated session exists.
  // Passing null as the SWR key prevents any fetch — this is the standard SWR
  // pattern for conditional fetching. Without this guard, the landing page
  // (which has no session) would fire GET /api/accounts and receive a 401,
  // which Lighthouse flags as a console error.
  const [swrKey, setSwrKey] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically import to avoid shipping the Supabase client in the SSR bundle
    // for pages that never need it (public marketing pages).
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      // Check the current session; onAuthStateChange keeps it in sync.
      supabase.auth.getSession().then(({ data }) => {
        setSwrKey(data.session ? "/api/accounts" : null);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSwrKey(session ? "/api/accounts" : null);
      });
      return () => listener.subscription.unsubscribe();
    });
  }, []);

  const { data: accounts = [], error, isLoading, mutate } = useSWR<SocialAccountDetails[], Error>(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const [activeAccount, setActiveAccountState] = useState<SocialAccountDetails | null>(null);

  // Sync state when accounts list finishes loading
  useEffect(() => {
    let active = true;
    requestAnimationFrame(() => {
      if (!active) return;
      if (accounts.length > 0) {
        // Keep the current active account if it still exists in the newly fetched list.
        // We only auto-switch if our current activeAccount is null or has been removed from the connected accounts list.
        const stillExists = activeAccount ? accounts.some((a) => a.id === activeAccount.id) : false;
        if (!stillExists) {
          const firstAccount = accounts[0];
          if (firstAccount) {
            setActiveAccountState(firstAccount);
          }
        } else {
          // Update the active account reference to match the newly fetched item in the list
          // so that the UI can instantly display updated synced statuses/followers count.
          // We only do this if the reference itself changed to prevent rendering loops.
          const currentMatch = accounts.find((a) => a.id === activeAccount!.id);
          if (currentMatch && currentMatch !== activeAccount) {
            setActiveAccountState(currentMatch);
          }
        }
      } else {
        setActiveAccountState(null);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

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
