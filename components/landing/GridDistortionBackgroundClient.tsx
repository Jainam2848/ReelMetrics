"use client";

import dynamic from "next/dynamic";

/**
 * Client-component wrapper for GridDistortionBackground.
 *
 * `ssr: false` is only valid inside Client Components.
 * This file is intentionally minimal — it exists solely to satisfy
 * that constraint without making the entire page a client component.
 */
const GridDistortionBackground = dynamic(
  () => import("@/components/landing/GridDistortionBackground"),
  {
    ssr: false,
    loading: () => (
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "#08090D",
          backgroundImage:
            "radial-gradient(circle at 82% 10%, rgba(79,70,229,0.14), transparent 34%), radial-gradient(circle at 8% 88%, rgba(20,184,166,0.12), transparent 30%), linear-gradient(135deg, rgba(79,70,229,0.08), transparent 44%, rgba(20,184,166,0.07))",
          backgroundSize: "cover",
        }}
      />
    ),
  }
);

export { GridDistortionBackground };
