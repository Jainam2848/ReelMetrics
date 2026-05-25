"use client";

import React, { useState } from "react";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useToast } from "@/components/shared/toast";
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton";
import { m, AnimatePresence } from "framer-motion";
import { 
  Users, 
  RefreshCw, 
  Video, 
  Link2, 
  Check, 
  Sparkles, 
  Calendar, 
  Trash2,
  AlertCircle
} from "lucide-react";
import { Instagram } from "@/components/shared/icons";
import { InstagramConnectButton } from "@/components/shared/instagram-connect";
import { SyncStatusChip } from "@/components/dashboard/sync-status-chip";
import { LoadError } from "@/components/shared/load-error";
import { syncErrorToast } from "@/lib/client/sync-toast";

export default function AccountsPage() {
  const { 
    accounts = [], 
    activeAccount, 
    setActiveAccount, 
    isLoading,
    error,
    mutate 
  } = useActiveAccount();
  const toast = useToast();
  
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleManualSync = async (accountId: string) => {
    setSyncingId(accountId);
    try {
      const res = await fetch(`/api/accounts/${accountId}/sync`, { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.data?.message || "Sync enqueued — processing in background.");
        await mutate();
      } else {
        const { variant, message } = syncErrorToast(data.error);
        if (variant === "info") toast.info(message);
        else toast.error(message);
      }
    } catch (err) {
      toast.error("Failed to run manual account sync.");
    } finally {
      setSyncingId(null);
    }
  };

  const linkDemoSandbox = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/accounts/demo", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Sandbox Demo Account connected!");
        await mutate();
      } else {
        toast.error("Failed to claim demo sandbox.");
      }
    } catch (err) {
      toast.error("Error setting up demo sandbox.");
    } finally {
      setDemoLoading(false);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this account? All synchronized posts and evaluations will be deleted from the server.")) return;
    try {
      const res = await fetch(`/api/accounts/${accountId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Account disconnected successfully!");
        await mutate();
      } else {
        toast.error("Failed to disconnect account.");
      }
    } catch (err) {
      toast.error("Error disconnecting account.");
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-white mb-1">
            Linked Profiles Matrix
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage your connected Instagram and TikTok channels, monitor sync limits, and refresh post data.
          </p>
        </div>

        {/* Sync all / seed sandbox */}
        {accounts.length === 0 && (
          <button
            onClick={linkDemoSandbox}
            disabled={demoLoading}
            className={`min-h-[44px] px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-glow active:scale-95 hover:opacity-90`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{demoLoading ? "Connecting..." : "Link Sandbox Demo"}</span>
          </button>
        )}
      </div>

      {error && (
        <LoadError
          title="Couldn't load accounts"
          error={error}
          onRetry={() => mutate()}
          variant="inline"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* ── LEFT PANEL: Connected profiles list ── */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground select-none">
            Active Connected Accounts
          </h3>

          {isLoading ? (
            <LoadingSkeleton variant="list" count={2} />
          ) : accounts.length > 0 ? (
            <div className="flex flex-col gap-4 select-none">
              {accounts.map((acct) => {
                const isActive = activeAccount?.id === acct.id;
                const isSyncing = syncingId === acct.id;
                const isIg = acct.username.includes("alice") || acct.username.includes("instagram") || !acct.username.includes("tiktok");

                return (
                  <div
                    key={acct.id}
                    className={`border rounded-2xl p-5 bg-glass backdrop-blur-xl relative transition-all duration-300 ${
                      isActive
                        ? "border-brand-primary shadow-glow"
                        : "border-glass hover:bg-white/5"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      {/* Avatar & Username */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-glass flex items-center justify-center relative">
                          {isIg ? (
                            <Instagram className="w-6 h-6 text-brand-accent animate-pulse" />
                          ) : (
                            <Video className="w-6 h-6 text-brand-secondary" />
                          )}
                        </div>

                        <div>
                          <h4 className="font-display font-extrabold text-sm text-white flex flex-wrap items-center gap-2">
                            <span>@{acct.username}</span>
                            {isActive && (
                              <span className="px-2 py-0.5 bg-brand-primary/10 border border-brand-primary/30 rounded-full text-[8px] font-bold text-brand-primary uppercase tracking-wider">
                                ACTIVE
                              </span>
                            )}
                            <SyncStatusChip status={acct.syncStatus} />
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {acct.followersCount.toLocaleString()} Followers
                          </p>
                        </div>
                      </div>

                      {/* Disconnect button */}
                      <button
                        onClick={() => handleRemoveAccount(acct.id)}
                        className="p-2 border border-glass bg-white/5 rounded-lg text-gray-500 hover:text-red-500 transition-colors cursor-pointer active:scale-95"
                        aria-label="Remove profile link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Meta Row */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center gap-3">
                      <span className="text-[10px] text-gray-500 font-semibold font-mono">
                        Synced: {acct.lastSyncedAt ? new Date(acct.lastSyncedAt).toLocaleString() : "Never"}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Switch Account */}
                        {!isActive && (
                          <button
                            onClick={() => setActiveAccount(acct)}
                            className="px-3 min-h-[32px] rounded-lg border border-glass bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300 active:scale-95"
                          >
                            Switch Profile
                          </button>
                        )}

                        {/* Sync Trigger */}
                        <button
                          onClick={() => handleManualSync(acct.id)}
                          disabled={isSyncing}
                          className="px-3 min-h-[32px] rounded-lg bg-brand-primary text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                          <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-glass bg-glass rounded-2xl select-none">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <h4 className="font-display font-extrabold text-white text-sm">No Connected Accounts</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 mb-6">
                You have not connected any Instagram or TikTok channels. Link the demo sandbox profile to view metrics immediately!
              </p>
              <button
                onClick={linkDemoSandbox}
                className="px-6 py-2 bg-brand-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-glow active:scale-95"
              >
                Explore Demo Sandbox
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Social link buttons ── */}
        <div className="md:col-span-1 flex flex-col gap-6 select-none">
          <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Connect Channels
            </h3>

            <div className="flex flex-col gap-3">
              <InstagramConnectButton
                label="Connect Instagram Profile"
                className="min-h-[48px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 flex items-center justify-center gap-2.5 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              />

              <button
                onClick={() => toast.info("TikTok OAuth connector is currently in beta review. Explore using Sandbox Demo!")}
                className="min-h-[48px] rounded-xl border border-glass bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 flex items-center justify-center gap-2.5 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Video className="w-5 h-5 text-brand-secondary" />
                <span>Connect TikTok Profile</span>
              </button>
            </div>
          </div>

          {/* Sync Help Panel */}
          <div className="border border-glass bg-glass rounded-2xl p-5 shadow-glow">
            <div className="flex items-center gap-2 text-brand-primary mb-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <h4 className="font-display font-extrabold text-xs uppercase tracking-wider">Sync Safeguards</h4>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
              Trendoraa limits automated API connections to prevent platform bans. Manual sync triggers have a <strong>5-minute cooldown</strong> constraint per linked profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
