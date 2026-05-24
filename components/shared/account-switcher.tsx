"use client";

import React, { useState, useRef, useEffect } from "react";
import { useActiveAccount } from "./active-account-context";
import { ChevronDown, Check, RefreshCw } from "lucide-react";
import { Instagram } from "@/components/shared/icons";
import { m, AnimatePresence } from "framer-motion";

export function AccountSwitcher() {
  const { activeAccount, setActiveAccount, accounts, isLoading } = useActiveAccount();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-glass bg-white/5 animate-pulse min-w-[150px]">
        <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />
        <div className="w-16 h-3.5 bg-white/10 rounded" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-xs font-semibold text-gray-500 border border-dashed border-glass rounded-xl px-4 py-2 bg-white/5">
        No accounts connected
      </div>
    );
  }

  const isTikTok = activeAccount?.username.includes("tiktok") || activeAccount?.username.includes("bob");

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="min-h-[44px] flex items-center justify-between gap-3 px-4 rounded-xl border border-glass bg-glass hover:bg-white/5 text-white text-sm font-semibold tracking-wide transition-all cursor-pointer active:scale-95"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Switch Active Social Account"
      >
        <div className="flex items-center gap-2">
          {/* Custom Platform Icon */}
          <div className={`p-1.5 rounded-lg flex items-center justify-center ${isTikTok ? "bg-gradient-to-tr from-cyan-500 to-pink-500" : "bg-gradient-to-tr from-brand-primary to-brand-accent"}`}>
            {isTikTok ? (
              <span className="text-[10px] leading-none font-bold text-white tracking-tighter">TT</span>
            ) : (
              <Instagram className="w-3.5 h-3.5 text-white" />
            )}
          </div>
          <span>@{activeAccount?.username || "Select Account"}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute top-full mt-2 left-0 z-50 w-64 rounded-xl border border-glass bg-glass backdrop-blur-xl shadow-glow overflow-hidden py-1.5"
            style={{ willChange: "transform, opacity" }}
            role="listbox"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-4 py-2 border-b border-white/5">
              Connected Profiles
            </div>
            
            <div className="flex flex-col gap-0.5 mt-1.5 max-h-60 overflow-y-auto">
              {accounts.map((account) => {
                const isItemTikTok = account.username.includes("tiktok") || account.username.includes("bob");
                const isSelected = activeAccount?.id === account.id;

                return (
                  <button
                    key={account.id}
                    onClick={() => {
                      setActiveAccount(account);
                      setIsOpen(false);
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 text-left text-sm text-gray-300 hover:text-white transition-colors cursor-pointer group active:bg-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg flex items-center justify-center ${isItemTikTok ? "bg-gradient-to-tr from-cyan-500 to-pink-500" : "bg-gradient-to-tr from-brand-primary to-brand-accent"}`}>
                        {isItemTikTok ? (
                          <span className="text-[10px] leading-none font-bold text-white tracking-tighter">TT</span>
                        ) : (
                          <Instagram className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold tracking-wide">@{account.username}</span>
                        <span className="text-[10px] text-gray-500">
                          {account.followersCount.toLocaleString()} followers
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-secondary" />
                    )}
                  </button>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
