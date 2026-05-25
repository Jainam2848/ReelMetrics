"use client";

import React, { useState, useEffect } from "react";
import { useActiveAccount } from "@/components/shared/active-account-context";
import { useToast } from "@/components/shared/toast";
import { m, AnimatePresence } from "framer-motion";
import { 
  Check, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  X,
  BookOpen,
  ArrowRight,
  Info,
  Tv
} from "lucide-react";
import { Instagram } from "@/components/shared/icons";

interface InstagramConnectionGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectStart: () => Promise<void>;
  isConnectLoading: boolean;
}

export function InstagramConnectionGuide({
  isOpen,
  onClose,
  onConnectStart,
  isConnectLoading,
}: InstagramConnectionGuideProps) {
  const { mutate: mutateAccounts } = useActiveAccount();
  const toast = useToast();

  // Pre-flight Checklist states
  const [isProfessional, setIsProfessional] = useState(false);
  const [isLinkedToPage, setIsLinkedToPage] = useState(false);

  // Setup Guide expanded and active tab state
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<"switch" | "link">("switch");

  // Sandbox Demo seeding state inside the modal (First-win fallback)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncProgress, setSyncProgress] = useState("");

  const isFormValid = isProfessional && isLinkedToPage;

  // Listen to escape key to close modal for good UX accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && syncStatus !== "syncing") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, syncStatus]);

  const triggerSandboxSeeding = async () => {
    setSyncStatus("syncing");
    
    // Ingestion pipeline step logging simulation
    const steps = [
      "Establishing isolated virtual sandbox...",
      "Mapping Trendoraa AI ingestion pathways...",
      "Syncing reels from pre-seeded profile '@alice_reels'...",
      "Calculating proprietary retention skip rates...",
      "Formulating personalized weekly strategy metrics...",
    ];

    for (let i = 0; i < steps.length; i++) {
      setSyncProgress(steps[i] || "");
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      const res = await fetch("/api/accounts/demo", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setSyncStatus("success");
        toast.success("Sandbox demo account connected! Welcome to Trendoraa.");
        await mutateAccounts();
        // Wait a brief moment to show success state before closing
        setTimeout(() => {
          onClose();
          // Reset modal states
          setSyncStatus("idle");
          setSyncProgress("");
        }, 1500);
      } else {
        setSyncStatus("error");
        toast.error(data.error?.message || "Failed to link sandbox profile.");
      }
    } catch (err) {
      setSyncStatus("error");
      toast.error("Unexpected error occurred during sandbox seeding.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop Blur Overlay */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => syncStatus !== "syncing" && onClose()}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg bg-glass border border-glass rounded-2xl overflow-hidden shadow-glow z-10 my-8 flex flex-col max-h-[85vh]"
          >
            {/* Ambient Background Accents */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-brand-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-accent/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center">
                  <Instagram className="w-4.5 h-4.5 text-brand-primary" />
                </div>
                <h3 className="text-base font-display font-extrabold text-white">
                  Link Instagram Profile
                </h3>
              </div>
              
              {syncStatus !== "syncing" && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg border border-glass bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content Body (Scrollable if guide is expanded) */}
            <div className="p-6 overflow-y-auto flex-grow scrollbar-thin">
              {syncStatus === "idle" && (
                <div className="flex flex-col gap-6">
                  {/* Step Info */}
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-3 items-start select-none">
                    <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Meta uses unified Facebook Page logins to manage external analytics. To complete the connect process, your account must satisfy the two pre-flight checks below.
                    </p>
                  </div>

                  {/* Pre-Flight Checklist */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase select-none">
                      Pre-Flight Validation Check
                    </h4>

                    {/* Checkbox 1 */}
                    <button
                      type="button"
                      onClick={() => setIsProfessional(!isProfessional)}
                      className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all duration-300 active:scale-[0.99] cursor-pointer min-h-[48px] ${
                        isProfessional
                          ? "border-brand-primary/50 bg-brand-primary/5 shadow-glow"
                          : "border-glass bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isProfessional 
                          ? "bg-brand-primary border-brand-primary text-white" 
                          : "border-gray-600 bg-black/20"
                      }`}>
                        {isProfessional && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="select-none">
                        <h5 className="font-bold text-xs text-white mb-0.5">
                          Professional Profile Enabled
                        </h5>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          Your profile is switched to a **Business** or **Creator** account. Meta&apos;s Graph API does not support standard Personal profiles.
                        </p>
                      </div>
                    </button>

                    {/* Checkbox 2 */}
                    <button
                      type="button"
                      onClick={() => setIsLinkedToPage(!isLinkedToPage)}
                      className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all duration-300 active:scale-[0.99] cursor-pointer min-h-[48px] ${
                        isLinkedToPage
                          ? "border-brand-primary/50 bg-brand-primary/5 shadow-glow"
                          : "border-glass bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isLinkedToPage 
                          ? "bg-brand-primary border-brand-primary text-white" 
                          : "border-gray-600 bg-black/20"
                      }`}>
                        {isLinkedToPage && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="select-none">
                        <h5 className="font-bold text-xs text-white mb-0.5">
                          Connected to a Facebook Page
                        </h5>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          Your Instagram professional account is linked to an active Facebook Page that you manage.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Expandable Linkage Setup Instructions */}
                  <div className="border border-glass bg-white/5 rounded-xl overflow-hidden transition-all duration-300">
                    <button
                      type="button"
                      onClick={() => setShowGuide(!showGuide)}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-gray-200 hover:text-white cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-brand-accent animate-pulse" />
                        <span>How do I set this up? View Guide</span>
                      </div>
                      {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showGuide && (
                      <div className="p-4 pt-0 border-t border-white/5 bg-black/10 flex flex-col gap-4">
                        {/* Tab Switcher */}
                        <div className="flex rounded-lg bg-black/30 p-1 select-none">
                          <button
                            type="button"
                            onClick={() => setActiveTab("switch")}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              activeTab === "switch"
                                ? "bg-brand-primary text-white shadow"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
                            1. Switch Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("link")}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              activeTab === "link"
                                ? "bg-brand-primary text-white shadow"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
                            2. Link Facebook Page
                          </button>
                        </div>

                        {/* Switch Tab Content */}
                        {activeTab === "switch" && (
                          <div className="text-[11px] text-gray-300 leading-relaxed flex flex-col gap-2.5">
                            <p className="font-semibold text-gray-200">Convert your Instagram to a Creator or Business profile in 4 steps:</p>
                            <ol className="list-decimal pl-4 flex flex-col gap-2">
                              <li>Open the <strong className="text-white">Instagram App</strong> on your mobile device.</li>
                              <li>Go to your profile, tap the <strong className="text-white">Menu (three lines)</strong> in the top-right, and choose <strong className="text-white">Settings and activity</strong>.</li>
                              <li>Scroll down to the <strong className="text-white">For professionals</strong> section and tap <strong className="text-white">Account type and tools</strong>.</li>
                              <li>Select <strong className="text-white">Switch to professional account</strong>, choose your niche categories, and finalize as either a **Creator** or **Business**.</li>
                            </ol>
                            <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-lg p-2.5 flex items-start gap-2 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                              <span className="text-[9px] text-brand-accent uppercase font-bold tracking-wider leading-relaxed">
                                Note: This switch is free and can be toggled back to personal at any time.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Link Tab Content */}
                        {activeTab === "link" && (
                          <div className="text-[11px] text-gray-300 leading-relaxed flex flex-col gap-3">
                            <div>
                              <p className="font-semibold text-gray-200 mb-1.5">Method A: From Facebook settings (Desktop Recommended)</p>
                              <ol className="list-decimal pl-4 flex flex-col gap-1.5">
                                <li>Navigate to the <strong className="text-white">Facebook Page</strong> you own or manage.</li>
                                <li>Click <strong className="text-white">Settings</strong> from the management toolbar or sidebar.</li>
                                <li>Select <strong className="text-white">Linked Accounts</strong>, then click <strong className="text-white">Instagram</strong>.</li>
                                <li>Click <strong className="text-white">Connect Account</strong>, and log in to authorize the link.</li>
                              </ol>
                            </div>

                            <div className="border-t border-white/5 pt-2.5">
                              <p className="font-semibold text-gray-200 mb-1.5">Method B: Directly within Instagram App (Mobile)</p>
                              <ol className="list-decimal pl-4 flex flex-col gap-1.5">
                                <li>Go to your Instagram profile and tap <strong className="text-white">Edit Profile</strong>.</li>
                                <li>Under <strong className="text-white">Public business information</strong>, tap <strong className="text-white">Page</strong>.</li>
                                <li>Tap <strong className="text-white">Link or Create Facebook Page</strong> and select your page.</li>
                              </ol>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Seeding Ingestion Seeder UI state */}
              {syncStatus === "syncing" && (
                <div className="py-12 flex flex-col items-center justify-center gap-6 select-none text-center">
                  <div className="relative w-16 h-16 rounded-full border-4 border-white/5 border-t-brand-primary animate-spin" />
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-sm text-white animate-pulse">
                      Generating Sandbox Metrics...
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono tracking-wide">
                      {syncProgress}
                    </p>
                  </div>
                </div>
              )}

              {syncStatus === "success" && (
                <div className="py-12 flex flex-col items-center justify-center gap-3 select-none text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-secondary/15 border border-brand-secondary flex items-center justify-center text-brand-secondary mb-2 animate-bounce">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-extrabold text-white text-lg">
                    Sandbox Ready!
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    We connected your test credentials and imported mock data. Instantly launching your dashboard!
                  </p>
                </div>
              )}

              {syncStatus === "error" && (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500 flex items-center justify-center text-red-500 mb-2">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-extrabold text-white text-lg">
                    Demo Seeding Failed
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    There was an issue claiming Alice&apos;s pre-seeded data. Ensure database migrations were run.
                  </p>
                  <button
                    onClick={() => setSyncStatus("idle")}
                    className="mt-4 px-4 py-2 border border-glass bg-white/5 rounded-lg text-xs font-semibold text-white hover:bg-white/10"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            {/* Footer Actions (Locked until checked) */}
            {syncStatus === "idle" && (
              <div className="p-6 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row items-center gap-4 justify-between shrink-0">
                {/* Sandbox Exit Option */}
                <button
                  type="button"
                  onClick={triggerSandboxSeeding}
                  className="w-full sm:w-auto text-xs font-bold text-gray-400 hover:text-brand-accent flex items-center gap-1.5 transition-colors cursor-pointer select-none order-2 sm:order-1 justify-center"
                >
                  <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
                  <span>Skip: Use Sandbox Demo</span>
                </button>

                {/* Primary Meta Connect button */}
                <div className="w-full sm:w-auto order-1 sm:order-2 flex flex-col items-end gap-1.5">
                  <button
                    type="button"
                    onClick={onConnectStart}
                    disabled={!isFormValid || isConnectLoading}
                    className={`w-full sm:w-auto min-h-[40px] px-6 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isFormValid
                        ? "bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-glow hover:opacity-90 active:scale-95"
                        : "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <Instagram className="w-4 h-4" />
                    <span>{isConnectLoading ? "Connecting..." : "Connect with Meta"}</span>
                  </button>
                  
                  {!isFormValid && (
                    <span className="text-[9px] text-gray-500 font-semibold select-none hidden sm:block">
                      Validate checklist to connect Meta
                    </span>
                  )}
                </div>
              </div>
            )}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
