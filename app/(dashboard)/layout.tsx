"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Film,
  Calendar,
  BarChart2,
  Users,
  CreditCard,
  Settings,
  Bell,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Zap,
  TrendingUp,
} from "lucide-react";

import { AccountSwitcher } from "@/components/shared/account-switcher";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { m, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/shared/toast";
import dynamic from "next/dynamic";
import { RetentionArc } from "@/components/dashboard/RetentionArc";
import { ScoreRing } from "@/components/dashboard/ScoreRing";

const DashboardBackground = dynamic(
  () => import("@/components/dashboard/DashboardBackground"),
  { ssr: false }
);


interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_GROUPS: { title: string; items: SidebarItem[] }[] = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
      { label: "My Reels", href: "/posts", icon: <Film className="w-[18px] h-[18px]" /> },
      { label: "Strategy", href: "/strategy", icon: <TrendingUp className="w-[18px] h-[18px]" />, badge: "AI" },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: <BarChart2 className="w-[18px] h-[18px]" /> },
      { label: "Accounts", href: "/accounts", icon: <Users className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Billing", href: "/billing", icon: <CreditCard className="w-[18px] h-[18px]" /> },
      { label: "Settings", href: "/settings", icon: <Settings className="w-[18px] h-[18px]" /> },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Auth Guard + fetch user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUserEmail(session.user.email ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/");
      } else if (!session) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully.");
  };

  const mobilePrimaryItems = [
    { label: "Home", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Reels", href: "/posts", icon: <Film className="w-5 h-5" /> },
    { label: "Strategy", href: "/strategy", icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const getBreadcrumbTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";
    if (parts[0] === "posts" && parts.length > 1) return "Post Analysis";
    const firstSegment = parts[0] || "";
    return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
  };

  const userInitial = userEmail?.charAt(0).toUpperCase() || "U";

  const handleNotificationClick = () => {
    toast.info("No new notifications. You're on top of your game!");
  };

  return (
    <div className="min-h-screen flex bg-transparent text-foreground relative pb-20 md:pb-0">
      {/* ── REDESIGNED DARK BLUEPRINT BACKGROUND STACK ──────────────── */}
      {/* z-index stack:
         0  — .dashboard-bg (CSS dot grid, position: fixed)
         1  — .depth-haze (CSS radial gradients, position: fixed)
         1  — RetentionArc SVG (position: fixed, top-right)
         1  — ScoreRing SVG (position: fixed, bottom-left)
         2  — DashboardBackground canvas (Three.js, position: fixed)
         10 — Dashboard card components (glassmorphic, z: 10)
         20 — Sidebar / navigation (z: 20)
         30 — Modals / tooltips (z: 30)
      */}
      <div className="dashboard-bg" />
      <div className="depth-haze-primary" />
      <div className="depth-haze-secondary" />
      <RetentionArc />
      <ScoreRing />
      <DashboardBackground />

      {/* ── DESKTOP SIDEBAR ──────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/[0.06] bg-[#0c0d12]/80 backdrop-blur-2xl z-40 relative select-none">

        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-black text-[15px] tracking-tight text-white" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
            Trendoraa
          </span>
        </div>

        {/* Nav Groups */}
        <nav className="flex-grow flex flex-col gap-5 mt-5 px-3 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 px-3 mb-2">
                {group.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative min-h-[40px] flex items-center gap-3 px-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-indigo-600/15 text-white"
                          : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-500" />
                      )}
                      <span className={isActive ? "text-indigo-400" : "text-white/30 group-hover:text-white/50 transition-colors"}>
                        {item.icon}
                      </span>
                      <span className="flex-grow">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer — user profile + sign out */}
        <div className="mt-auto px-3 pb-4 pt-3 border-t border-white/[0.06] flex flex-col gap-2 shrink-0">
          {/* User avatar row */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-[11px] font-black text-white shrink-0">
              {userInitial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-white truncate leading-tight">
                {userEmail ?? "Loading…"}
              </span>
              <span className="text-[9px] text-white/30 font-semibold uppercase tracking-widest leading-tight">
                Beta Member
              </span>
            </div>
          </div>
          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/35 hover:text-red-400 hover:bg-red-500/[0.07] active:scale-95 transition-all w-full text-left text-sm font-medium"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="flex-grow flex flex-col min-w-0 relative z-10">

        {/* ── TOP HEADER BAR ──────────────────────────────────────────── */}
        <header className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0a0b10]/60 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-white/25 font-bold uppercase tracking-widest hidden sm:block">
              Workspace
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/20 hidden sm:block shrink-0" />
            <h1 className="text-sm font-bold tracking-wide text-white/90" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
              {getBreadcrumbTitle()}
            </h1>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <AccountSwitcher />

            {/* Notifications */}
            <button
              onClick={handleNotificationClick}
              className="relative w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] flex items-center justify-center text-white/40 hover:text-white/80 transition-all active:scale-95"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {/* Notification pulse dot */}
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-fuchsia-500">
                <span className="absolute inset-0 rounded-full bg-fuchsia-500 animate-ping opacity-75" />
              </span>
            </button>
          </div>
        </header>

        {/* ── PAGE CONTENT ─────────────────────────────────────────────── */}
        <main className="flex-grow p-5 md:p-7 overflow-y-auto">
          <ErrorBoundary>
            <React.Suspense
              fallback={
                <div className="animate-pulse h-96 rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
              }
            >
              {children}
            </React.Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-[60px] border-t border-white/[0.08] bg-[#0a0b10]/90 backdrop-blur-2xl px-4 flex justify-between items-center select-none">
        {mobilePrimaryItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-grow h-full gap-1 active:scale-90 transition-all ${
                isActive ? "text-indigo-400" : "text-white/35"
              }`}
            >
              {item.icon}
              <span className="text-[9px] tracking-wider uppercase font-bold">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More drawer trigger */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center justify-center flex-grow h-full gap-1 active:scale-90 transition-all text-white/35"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-bold">More</span>
        </button>
      </nav>

      {/* ── MOBILE MORE DRAWER ───────────────────────────────────────── */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="md:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-2xl border-t border-white/[0.08] bg-[#0d0e15]/95 backdrop-blur-2xl p-5 flex flex-col gap-5"
            >
              {/* Drawer header */}
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white/30">
                  More
                </span>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Analytics", href: "/analytics", icon: <BarChart2 className="w-5 h-5" /> },
                  { label: "Accounts", href: "/accounts", icon: <Users className="w-5 h-5" /> },
                  { label: "Billing", href: "/billing", icon: <CreditCard className="w-5 h-5" /> },
                  { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
                ].map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={`min-h-[52px] flex items-center gap-3 px-4 rounded-xl font-semibold text-sm border transition-colors ${
                        isActive
                          ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
                          : "bg-white/[0.03] border-white/[0.07] text-white/60 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    handleLogout();
                  }}
                  className="col-span-2 min-h-[52px] flex justify-center items-center gap-3 px-4 rounded-xl font-semibold text-sm border border-red-500/15 bg-red-500/[0.07] text-red-400 hover:bg-red-500/[0.12] active:scale-95 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* User info at bottom of drawer */}
              {userEmail && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-[11px] font-black text-white shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{userEmail}</p>
                    <p className="text-[9px] text-white/30 font-semibold uppercase tracking-widest">Beta Member</p>
                  </div>
                </div>
              )}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
