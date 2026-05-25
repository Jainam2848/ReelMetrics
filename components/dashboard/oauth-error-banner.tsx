"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, X, ExternalLink, BookOpen } from "lucide-react";

interface ErrorCopy {
  title: string;
  description: string;
  action?: { label: string; href: string };
}

/**
 * Translates the discrete `error` codes emitted by
 * `/api/auth/social/[platform]/callback/route.ts` into human-readable copy.
 * Unknown codes fall back to a generic message; an optional `message` query
 * param (set by `oauth_denied`) is appended for additional context.
 */
function resolveCopy(code: string, message: string | null): ErrorCopy {
  switch (code) {
    case "oauth_denied":
      return {
        title: "Instagram authorization cancelled",
        description:
          message ||
          "You closed Instagram's consent screen before granting access. You can try again or use the sandbox demo to explore Trendoraa.",
      };
    case "not_business_account":
      return {
        title: "Instagram Business or Creator Profile Required",
        description:
          "Trendoraa requires an Instagram Professional account (Business or Creator) linked to a managed Facebook Page. If you don't have this linkage set up yet, don't worry! Expand our step-by-step connection guide below or skip it instantly using our Sandbox Demo.",
      };
    case "account_already_linked":
      return {
        title: "This Instagram account is already linked to another user",
        description:
          "For security, an Instagram account can only be connected to one Trendoraa workspace at a time. Disconnect it from the other workspace before linking it here.",
      };
    case "account_limit_reached": {
      const max = message?.replace(/^max=/, "") || "your plan";
      return {
        title: "Account limit reached for your plan",
        description: `You have reached the maximum number of Instagram accounts (${max}) allowed on your current subscription. Upgrade your plan on Billing or disconnect an existing account before connecting another.`,
        action: { label: "View plans", href: "/billing" },
      };
    }
    case "token_exchange_failed":
    case "pages_api_failed":
      return {
        title: "Meta did not return a valid response",
        description:
          "We could not exchange your Instagram authorization for an access token. This is usually a temporary Meta API issue — please retry in a few minutes.",
      };
    case "invalid_state":
    case "missing_oauth_params":
      return {
        title: "Authorization session expired",
        description:
          "Your Instagram connect attempt took too long or was tampered with. Start the connect flow again from this page.",
      };
    case "connection_failed":
      return {
        title: "Could not save your Instagram connection",
        description:
          "Authorization succeeded with Meta, but we hit a database error while saving the connection. Please retry — if the issue persists, contact support.",
      };
    case "platform_not_supported":
      return {
        title: "Platform not supported yet",
        description:
          "TikTok and other platforms are coming soon. For now, link an Instagram Business/Creator profile or use the sandbox demo.",
      };
    default:
      return {
        title: "Something went wrong connecting your account",
        description:
          message ||
          "We did not recognise the response from the authorization provider. Please try connecting again.",
      };
  }
}

export function OAuthErrorBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Capture the error code/message lazily on mount. `useState`'s initializer
  // runs once so the banner is stable even after we strip the query params.
  const [snapshot] = useState<{ code: string; message: string | null } | null>(() => {
    const code = searchParams.get("error");
    if (!code) return null;
    const max = searchParams.get("max");
    const message =
      code === "account_limit_reached" && max
        ? `max=${max}`
        : searchParams.get("message");
    return { code, message };
  });

  const [dismissed, setDismissed] = useState(false);

  // Clean the URL so a refresh doesn't re-show the banner.
  useEffect(() => {
    if (!snapshot) return;
    const next = new URLSearchParams(searchParams.toString());
    if (!next.has("error")) return; // already cleaned
    next.delete("error");
    next.delete("message");
    next.delete("max");
    next.delete("platform");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [snapshot, pathname, router, searchParams]);

  const copy = useMemo(
    () => (snapshot ? resolveCopy(snapshot.code, snapshot.message) : null),
    [snapshot]
  );

  if (!snapshot || dismissed || !copy) return null;

  return (
    <div
      role="alert"
      className="mb-6 border border-red-500/40 bg-red-500/10 backdrop-blur-xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start select-none"
    >
      <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>

      <div className="flex-grow min-w-0">
        <h4 className="font-display font-extrabold text-sm text-white mb-1">
          {copy.title}
        </h4>
        <p className="text-xs text-red-100/80 leading-relaxed">
          {copy.description}
        </p>

        {snapshot.code === "not_business_account" ? (
          <div className="flex flex-wrap gap-4 mt-4 items-center">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-instagram-connect-guide"));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/20 text-xs font-bold text-white hover:bg-red-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-brand-accent animate-pulse" />
              <span>Open Linkage Guide & Sandbox Demo</span>
            </button>
            
            <a
              href="https://help.instagram.com/502981923235522"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-200 hover:text-white underline underline-offset-2"
            >
              <span>Meta Help Page</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          copy.action && (
            <a
              href={copy.action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-red-200 hover:text-white underline underline-offset-2"
            >
              <span>{copy.action.label}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss notification"
        className="shrink-0 p-1.5 rounded-lg border border-glass bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
