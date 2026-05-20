import type { NextConfig } from "next";

// IMPORTANT: importing the env sentinel here causes a fast-fail at build/start
// time if any required environment variable is missing or malformed. See
// `lib/env.ts` and spec §5.5.
import "./lib/env";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    typedRoutes: true,
  },
  // Baseline security headers (defense-in-depth — see spec §11.9).
  // Granular per-route CSP and additional headers are layered on by
  // `middleware.ts` once it is introduced in a later phase.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
