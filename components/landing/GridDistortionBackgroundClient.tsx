"use client";

import React, { useEffect, useState } from "react";

export function GridDistortionBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize position to percentage
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background: "#08090D",
        backgroundSize: "cover",
      }}
    >
      {/* Primary Ambient Glows */}
      <div 
        className="absolute top-[-10%] right-[10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full opacity-30 blur-[120px] transition-transform duration-[8000ms] animate-pulse"
        style={{
          background: "radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)",
        }}
      />
      <div 
        className="absolute bottom-[-10%] left-[5%] w-[45vw] h-[45vw] max-w-[500px] rounded-full opacity-25 blur-[100px] transition-transform duration-[10000ms] animate-pulse"
        style={{
          background: "radial-gradient(circle, rgba(20,184,166,0.25) 0%, transparent 70%)",
          animationDelay: "2s",
        }}
      />

      {/* Interactive Cursor Spotlight */}
      {mounted && (
        <div
          className="absolute inset-0 transition-opacity duration-500 opacity-60 mix-blend-screen"
          style={{
            background: `radial-gradient(circle 400px at ${mousePosition.x}% ${mousePosition.y}%, rgba(99,102,241,0.08) 0%, rgba(20,184,166,0.03) 50%, transparent 100%)`,
          }}
        />
      )}

      {/* Cyberpunk Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      
      {/* Subtle Scanline Lines Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.5) 50%)",
          backgroundSize: "100% 4px",
        }}
      />
    </div>
  );
}
