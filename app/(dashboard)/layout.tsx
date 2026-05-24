"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { AccountSwitcher } from "@/components/shared/account-switcher";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { m, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/shared/toast";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const toast = useToast();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Sidebar Items definitions
  const sidebarItems: SidebarItem[] = [
    { label: "Dashboard", href: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "My Posts", href: "/posts", icon: <Film className="w-5 h-5" /> },
    { label: "Strategy", href: "/strategy", icon: <Calendar className="w-5 h-5" /> },
    { label: "Analytics", href: "/analytics", icon: <BarChart2 className="w-5 h-5" /> },
    { label: "Accounts", href: "/accounts", icon: <Users className="w-5 h-5" /> },
    { label: "Billing", href: "/billing", icon: <CreditCard className="w-5 h-5" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  // 2. Mobile Primary Navigation items (4 items fit perfectly on 375px screens)
  const mobilePrimaryItems = [
    { label: "Home", href: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Posts", href: "/posts", icon: <Film className="w-5 h-5" /> },
    { label: "Strategy", href: "/strategy", icon: <Calendar className="w-5 h-5" /> },
  ];

  const getBreadcrumbTitle = () => {
    if (pathname === "/") return "Dashboard";
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";
    if (parts[0] === "posts" && parts.length > 1) return "Post Analysis";
    const firstSegment = parts[0] || "";
    return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
  };

  const handleNotificationClick = () => {
    toast.info("No new strategic notifications. You are riding peak commuter trend waves!");
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground relative pb-20 md:pb-0">
      {/* ── DESKTOP COLLAPSIBLE SIDEBAR (Hidden on mobile) ──────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-glass bg-glass backdrop-blur-xl shrink-0 p-5 z-40 select-none">
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-display font-black text-white text-lg shadow-glow">
            T
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-white">
            Trendoraa
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-grow flex flex-col gap-1.5 mt-8">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-[44px] flex items-center gap-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                  isActive
                    ? "bg-brand-primary text-white shadow-glow"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer details */}
        <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider select-none text-center pt-4 border-t border-white/5">
          MVP Rolling Beta v1.0
        </div>
      </aside>

      {/* ── MAIN CONTENT SHIELD AREA ───────────────────────────────────── */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* ── TOP HEADER BAR ───────────────────────────────────────────── */}
        <header className="min-h-[72px] flex items-center justify-between px-6 border-b border-glass bg-glass/30 backdrop-blur-md sticky top-0 z-30 select-none">
          {/* Left: Breadcrumbs info */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              Workspace
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <h1 className="text-sm font-bold tracking-wide text-white font-heading">
              {getBreadcrumbTitle()}
            </h1>
          </div>

          {/* Right: Switchers and notifications */}
          <div className="flex items-center gap-4">
            {/* Context active social account switcher dropdown */}
            <AccountSwitcher />

            {/* Notifications Bell */}
            <button
              onClick={handleNotificationClick}
              className="min-w-[44px] min-h-[44px] rounded-xl border border-glass bg-glass hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 relative"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              <div className="absolute top-3 right-3.5 w-2 h-2 rounded-full bg-brand-accent animate-ping" />
              <div className="absolute top-3 right-3.5 w-2 h-2 rounded-full bg-brand-accent" />
            </button>
          </div>
        </header>

        {/* ── CONTENT PORT ────────────────────────────────────────────── */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* ── MOBILE BOTTOM BAR NAVIGATION (Hidden on Desktop, optimized for 375px) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-glass bg-glass/85 backdrop-blur-xl px-4 flex justify-between items-center select-none shadow-glow">
        {mobilePrimaryItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-grow h-full gap-1 active:scale-95 transition-all ${
                isActive ? "text-brand-primary font-bold" : "text-muted-foreground"
              }`}
            >
              {item.icon}
              <span className="text-[10px] tracking-wider uppercase font-semibold">{item.label}</span>
            </Link>
          );
        })}

        {/* More slide-up drawer trigger */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center flex-grow h-full gap-1 active:scale-95 transition-all text-muted-foreground`}
          aria-label="Open More Menu Options"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-wider uppercase font-semibold">More</span>
        </button>
      </nav>

      {/* ── MOBILE "MORE" GLASS DRAWER OVERLAY ───────────────────────── */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop blur */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Bottom Drawer container */}
            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-glass bg-glass backdrop-blur-2xl p-6 flex flex-col gap-6 shadow-glow"
              style={{ willChange: "transform" }}
            >
              <div className="flex justify-between items-center select-none">
                <span className="font-display font-black text-sm uppercase tracking-widest text-muted-foreground">
                  Navigation Matrix
                </span>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1 rounded-lg border border-glass bg-white/5 text-gray-400 hover:text-white"
                  aria-label="Close menu drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid of drawer sub items */}
              <div className="grid grid-cols-2 gap-4">
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
                      className={`min-h-[48px] flex items-center gap-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider border border-glass transition-colors ${
                        isActive
                          ? "bg-brand-primary border-brand-primary text-white shadow-glow"
                          : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
