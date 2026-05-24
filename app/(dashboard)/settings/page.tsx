"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useToast } from "@/components/shared/toast";
import { m, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Download,
  Trash2,
  ShieldAlert,
  Check,
  AlertTriangle,
  X,
} from "lucide-react";

interface MeResponse {
  id: string;
  email: string;
  fullName: string | null;
}

interface ProfileFormProps {
  user: MeResponse;
  onSaved: () => Promise<unknown> | void;
}

/**
 * Inner controlled form. Receives the current user as a prop and seeds local
 * state via `useState`'s initializer so we never need a setState-in-effect to
 * mirror server data into the form. The parent rerenders this component with
 * a new `key` when the underlying record id changes.
 */
function ProfileForm({ user, onSaved }: ProfileFormProps) {
  const toast = useToast();
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        toast.error(json?.error?.message || "Could not save your profile.");
        return;
      }
      toast.success("Profile updated.");
      await onSaved();
    } catch (err) {
      console.error("Profile save failed:", err);
      toast.error("Network error saving your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
            Full Creator Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full min-h-[42px] pl-10 pr-4 bg-white/5 rounded-xl border border-glass text-xs font-semibold text-gray-200 focus:outline-none focus:border-brand-primary"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
            Primary Email Contact
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              value={user.email ?? ""}
              readOnly
              aria-readonly
              className="w-full min-h-[42px] pl-10 pr-4 bg-white/5 rounded-xl border border-glass text-xs font-semibold text-gray-400 focus:outline-none cursor-not-allowed"
            />
          </div>
          <p className="text-[10px] text-gray-500 pl-1">
            Email is managed by Supabase auth — contact support to change it.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 px-6 min-h-[40px] bg-brand-primary hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 max-w-[160px] active:scale-95 transition-all shadow-glow cursor-pointer self-end disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Check className="w-4 h-4" />
        <span>{isSaving ? "Saving…" : "Save changes"}</span>
      </button>
    </form>
  );
}

export default function SettingsPage() {
  const toast = useToast();

  const { data: me, mutate: mutateMe, isLoading: meLoading } = useSWR<MeResponse>(
    "/api/auth/me"
  );

  // GDPR export state
  const [exportLoading, setExportLoading] = useState(false);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmString, setConfirmString] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const triggerGdprExport = async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      const res = await fetch("/api/auth/me/data-export");
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(
          json?.error?.message ||
            "Could not generate your data export. Please try again."
        );
        return;
      }

      const payload = await res.json();
      const exportPayload = payload?.success ? payload.data : payload;

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const dlAnchor = document.createElement("a");
      dlAnchor.href = url;
      dlAnchor.download = `trendoraa-data-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
      URL.revokeObjectURL(url);

      toast.success("Your data export has been downloaded.");
    } catch (err) {
      console.error("GDPR export failed:", err);
      toast.error("Network error while requesting your data export.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (confirmString !== "DELETE PROFILE PERMANENTLY") {
      toast.error("Confirmation text doesn't match. Re-type exactly.");
      return;
    }
    if (deleteLoading) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/me", { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(
          json?.error?.message ||
            "We could not delete your account. Please contact support."
        );
        return;
      }
      toast.success("Account deleted. Signing you out…");
      window.location.assign("/login");
    } catch (err) {
      console.error("Account deletion failed:", err);
      toast.error("Network error while deleting your account.");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto select-none">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-extrabold tracking-tight text-white mb-1">
          Settings Manager
        </h2>
        <p className="text-xs text-muted-foreground">
          Update your creator profile, download a complete GDPR JSON data archive, and manage account credentials.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* ── PROFILE CARD ── */}
        <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-brand-primary" />
            <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">
              Creator Profile Settings
            </h3>
          </div>

          {meLoading || !me ? (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-brand-primary animate-spin" />
              <span>Loading your profile…</span>
            </div>
          ) : (
            <ProfileForm key={me.id} user={me} onSaved={() => mutateMe()} />
          )}
        </div>

        {/* ── SECURITY & GDPR DATA PRIVACY ── */}
        <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="w-5 h-5 text-brand-secondary" />
            <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">
              GDPR Compliance & Security
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-4 bg-white/5 border border-glass rounded-xl">
            <div>
              <h4 className="font-bold text-xs text-white mb-1">Download Creator Data Archive</h4>
              <p className="text-[10px] text-muted-foreground leading-normal max-w-sm">
                Get an instant JSON archive of all synchronized video assets, evaluation metrics, and account billing transactions.
              </p>
            </div>

            <button
              onClick={triggerGdprExport}
              disabled={exportLoading}
              className="min-h-[38px] px-5 rounded-lg border border-glass bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-2 shrink-0 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-brand-secondary" />
              <span>{exportLoading ? "Packaging JSON..." : "Export Data"}</span>
            </button>
          </div>
        </div>

        {/* ── DANGER ZONE ── */}
        <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 shadow-glow">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="font-display font-extrabold text-sm text-red-500 uppercase tracking-wider">
              Danger Zone
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h4 className="font-bold text-xs text-white mb-1">Delete Creator Profile</h4>
              <p className="text-[10px] text-red-400/80 leading-normal max-w-md">
                Permanently erase your linked credentials, synced video metrics, and billing logs. This action is irreversible.
              </p>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="min-h-[38px] px-5 rounded-lg bg-red-500 hover:bg-red-600 text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── ACCOUNT DELETION CONFIRMATION MODAL OVERLAY ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* Backdrop blur */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Body Container */}
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 rounded-2xl border border-red-500/30 bg-[#150505] shadow-glow flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-red-500/10">
                <span className="font-display font-black text-sm text-red-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Destroy Profile Matrix</span>
                </span>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 rounded-lg border border-glass bg-white/5 text-gray-400 hover:text-white"
                  aria-label="Cancel deletion"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-red-300 leading-relaxed font-semibold">
                  You are about to permanently purge your account settings and all associated metadata. This operation is irrevocable.
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2 pl-1">
                  Type the following to confirm:
                </p>
                <div className="p-3 bg-black/60 rounded-xl border border-glass font-mono text-center text-xs font-bold text-red-500 select-none">
                  DELETE PROFILE PERMANENTLY
                </div>
              </div>

              <input
                type="text"
                value={confirmString}
                onChange={(e) => setConfirmString(e.target.value)}
                placeholder="Type the red text block exactly..."
                className="w-full min-h-[42px] px-4 bg-white/5 rounded-xl border border-glass text-xs font-bold text-white text-center focus:outline-none focus:border-red-500"
              />

              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 min-h-[36px] border border-glass bg-white/5 rounded-lg text-[10px] font-bold text-gray-300 hover:bg-white/10 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccountDeletion}
                  disabled={deleteLoading || confirmString !== "DELETE PROFILE PERMANENTLY"}
                  className="px-5 min-h-[36px] bg-red-500 disabled:opacity-30 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleteLoading ? "Purging..." : "Confirm Purge"}</span>
                </button>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
