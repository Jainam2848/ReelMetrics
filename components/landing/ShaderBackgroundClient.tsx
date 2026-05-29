"use client";

import dynamic from "next/dynamic";

/**
 * Client-component wrapper for ShaderBackground.
 *
 * `ssr: false` is only valid inside Client Components.
 * This wrapper guarantees that WebGL code never runs on the server,
 * and renders a seamless, high-performance dark skeleton fallback.
 */
const ShaderBackground = dynamic(
  () => import("@/components/landing/ShaderBackground"),
  {
    ssr: false,
    loading: () => (
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "#08090D",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    ),
  }
);

export { ShaderBackground };
