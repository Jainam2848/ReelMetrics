"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/shared/toast";
import { Instagram } from "@/components/shared/icons";
import { InstagramConnectionGuide } from "./instagram-connection-guide";

interface InstagramConnectButtonProps {
  variant?: "primary" | "secondary";
  className?: string;
  label?: string;
  onError?: (message: string) => void;
}

/**
 * Initiates Instagram OAuth correctly.
 *
 * Refactored to mount the InstagramConnectionGuide checklist modal first.
 * The backend exposes POST /api/auth/social/instagram which returns a JSON
 * payload containing the Meta auth URL plus an HTTP-only CSRF cookie.
 */
export function InstagramConnectButton({
  variant = "secondary",
  className,
  label = "Connect Instagram",
  onError,
}: InstagramConnectButtonProps) {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Global event listener to support triggering the linkage guide modal from
  // the OAuthErrorBanner when a 'not_business_account' redirection error occurs.
  useEffect(() => {
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };
    window.addEventListener("open-instagram-connect-guide", handleOpenModal);
    return () => {
      window.removeEventListener("open-instagram-connect-guide", handleOpenModal);
    };
  }, []);

  const handleConnectStart = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/social/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();

      if (!res.ok || !json?.success || !json?.data?.authUrl) {
        const message =
          json?.error?.message || "Could not start Instagram authorization.";
        if (onError) onError(message);
        else toast.error(message);
        return;
      }

      // Hand off the browser to Meta's OAuth dialog.
      window.location.assign(json.data.authUrl as string);
    } catch (err) {
      const message =
        "Network error reaching the Instagram authorization endpoint.";
      console.error("[instagram-connect]", err);
      if (onError) onError(message);
      else toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const baseClasses =
    variant === "primary"
      ? "bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-glow hover:opacity-90"
      : "border border-glass bg-white/5 hover:bg-white/10 text-gray-200";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={
          className ??
          `min-h-[46px] rounded-xl ${baseClasses} font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`
        }
      >
        <Instagram className="w-4 h-4 text-brand-accent" />
        <span>{label}</span>
      </button>

      {/* Reusable Pre-Flight & Setup Linkage Wizard Guide */}
      <InstagramConnectionGuide
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnectStart={handleConnectStart}
        isConnectLoading={loading}
      />
    </>
  );
}
