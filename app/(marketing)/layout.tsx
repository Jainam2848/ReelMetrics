import React from "react";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";
import { SectionDotNav } from "@/components/ui/SectionDotNav";

/**
 * Marketing layout — wraps all (marketing) routes only.
 * Injects landing-page-specific chrome:
 *   • ScrollProgressBar — 2px top bar tracking page scroll progress
 *   • SectionDotNav     — right-side dot navigation for hero/features/pricing sections
 *
 * Dashboard routes live under (dashboard)/layout.tsx and do NOT get these.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgressBar />
      <SectionDotNav />
      {children}
    </>
  );
}
