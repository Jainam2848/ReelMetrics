import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// Validate critical env vars at boot. This import has the side-effect of
// throwing if any required variable in the Zod schema (lib/env.ts) is missing
// or malformed. See spec §5.5.
import "@/lib/env";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trendoraa",
  description: "AI-powered short-form video strategy & analytics (Instagram & TikTok)",
};

import { Providers } from "@/app/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

