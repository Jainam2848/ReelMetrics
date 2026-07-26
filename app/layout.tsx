import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";

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

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trendoraa.com";

export const metadata: Metadata = {
  title: "Trendoraa | Cinematic Intelligence",
  description: "AI-powered short-form video strategy & analytics (Instagram & TikTok)",
  metadataBase: new URL(appUrl),
  openGraph: {
    title: "Trendoraa | Cinematic Intelligence",
    description: "AI-powered short-form video strategy & analytics (Instagram & TikTok)",
    url: appUrl,
    siteName: "Trendoraa",
    images: [
      {
        url: "/images/dashboard-mockup.png",
        width: 1200,
        height: 630,
        alt: "Trendoraa Analytics Engine Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trendoraa | Cinematic Intelligence",
    description: "AI-powered short-form video strategy & analytics (Instagram & TikTok)",
    images: ["/images/dashboard-mockup.png"],
    creator: "@trendoraa",
  },
};

import { Providers } from "@/app/providers";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased dark`}
      style={{ backgroundColor: "#08090D" }}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#08090D] text-foreground relative"
        style={{ backgroundColor: "#08090D" }}
      >
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RY10KD8ZC6"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RY10KD8ZC6');
          `}
        </Script>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
