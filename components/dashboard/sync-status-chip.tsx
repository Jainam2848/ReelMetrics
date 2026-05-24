"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PauseCircle,
  PowerOff,
} from "lucide-react";

type SyncStatus =
  | "completed"
  | "syncing"
  | "error"
  | "disconnected"
  | "rate_limited"
  | "active"
  | "pending_sync"
  | null;

interface SyncStatusChipProps {
  status: SyncStatus;
  className?: string;
}

interface StatusVisual {
  label: string;
  tone: string;
  icon: React.ReactNode;
}

function visualFor(status: SyncStatus): StatusVisual {
  switch (status) {
    case "syncing":
    case "pending_sync":
      return {
        label: "Syncing",
        tone: "bg-blue-500/10 text-blue-300 border-blue-500/30",
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
      };
    case "error":
      return {
        label: "Sync error",
        tone: "bg-red-500/10 text-red-300 border-red-500/30",
        icon: <AlertTriangle className="w-3 h-3" />,
      };
    case "disconnected":
      return {
        label: "Disconnected",
        tone: "bg-red-500/10 text-red-300 border-red-500/30",
        icon: <PowerOff className="w-3 h-3" />,
      };
    case "rate_limited":
      return {
        label: "Rate limited",
        tone: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        icon: <PauseCircle className="w-3 h-3" />,
      };
    case "completed":
    case "active":
      return {
        label: "Healthy",
        tone: "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/30",
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    default:
      return {
        label: "Not synced",
        tone: "bg-white/5 text-gray-400 border-white/10",
        icon: <PauseCircle className="w-3 h-3" />,
      };
  }
}

export function SyncStatusChip({ status, className }: SyncStatusChipProps) {
  const visual = visualFor(status);
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${visual.tone} ${className ?? ""}`}
    >
      {visual.icon}
      <span>{visual.label}</span>
    </span>
  );
}
