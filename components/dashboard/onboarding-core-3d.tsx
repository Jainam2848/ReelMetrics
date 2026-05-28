"use client";

import React, { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";

interface OnboardingCore3DProps {
  niche: string;
  goal: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  speed: number;
  baseX: number;
  baseY: number;
}

const NICHE_PALETTES = {
  tech: { primary: "#6366F1", secondary: "#8B5CF6", glow: "rgba(99, 102, 241, 0.15)" },
  comedy: { primary: "#F43F5E", secondary: "#EC4899", glow: "rgba(244, 63, 94, 0.15)" },
  finance: { primary: "#F59E0B", secondary: "#10B981", glow: "rgba(245, 158, 11, 0.15)" },
  education: { primary: "#0EA5E9", secondary: "#14B8A6", glow: "rgba(14, 165, 233, 0.15)" },
  lifestyle: { primary: "#A78BFA", secondary: "#FDBA74", glow: "rgba(167, 139, 250, 0.15)" },
  fashion: { primary: "#FDA4AF", secondary: "#FDE047", glow: "rgba(253, 164, 175, 0.15)" },
};

export default function OnboardingCore3D({ niche, goal }: OnboardingCore3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  
  const [mouse, setMouse] = useState({ x: 0, y: 0, active: false });
  const mouseRef = useRef(mouse);

  useEffect(() => {
    mouseRef.current = mouse;
  }, [mouse]);

  // Extract visual configuration based on niche/goal parameters
  const palette = NICHE_PALETTES[niche as keyof typeof NICHE_PALETTES] || NICHE_PALETTES.tech;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = containerRef.current?.clientWidth || 240;
    let height = canvas.height = containerRef.current?.clientHeight || 220;

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      width = canvas.width = containerRef.current.clientWidth;
      height = canvas.height = containerRef.current.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Initializing high-density particle swarm
    const particles: Particle[] = [];
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 25 + Math.random() * 40;
      particles.push({
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: 3 + Math.random() * 5,
        angle: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.02,
        baseX: radius,
        baseY: radius,
      });
    }

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      const targetPalette = NICHE_PALETTES[niche as keyof typeof NICHE_PALETTES] || NICHE_PALETTES.tech;
      const mState = mouseRef.current;

      // ── Determine Dynamic Wave/Vortex Variables based on Niche & Goal ──
      let swirlSpeed = 1.0;
      let centerGravity = 0.08;
      let mouseGravity = 0.12;
      let liquidComplexity = 3;

      if (goal === "retention") {
        // Hypnotic concentric hold curve behavior
        swirlSpeed = 0.5;
        centerGravity = 0.15;
        liquidComplexity = 2;
      } else if (goal === "engagement") {
        // Highly kinetic, rapid swirling vortex
        swirlSpeed = 2.4;
        centerGravity = 0.05;
        mouseGravity = 0.22;
        liquidComplexity = 5;
      } else if (goal === "followers") {
        // Expansive floaters
        swirlSpeed = 0.8;
        centerGravity = 0.03;
        liquidComplexity = 4;
      }

      // Draw elegant glowing fluid blob background
      const centerGradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        5,
        width / 2,
        height / 2,
        90 + Math.sin(frame * 0.02) * 15
      );
      centerGradient.addColorStop(0, targetPalette.glow);
      centerGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2);
      ctx.fill();

      // Render flowing sine-wave ribbons representing strategy pacing
      ctx.lineWidth = 1.5;
      for (let w = 0; w < liquidComplexity; w++) {
        ctx.strokeStyle = w === 0 ? targetPalette.primary : targetPalette.secondary;
        ctx.globalAlpha = 0.15 + (1 - w / liquidComplexity) * 0.45;
        
        ctx.beginPath();
        for (let x = 0; x < width; x += 5) {
          const wavePhase = frame * 0.03 * swirlSpeed + w * 1.5;
          const y = height / 2 + 
            Math.sin(x * 0.015 + wavePhase) * (20 + w * 6) * Math.sin(frame * 0.01 + w) + 
            Math.cos(x * 0.006 - wavePhase * 0.5) * 10;
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Render & Update Fluid Particles
      ctx.globalAlpha = 1.0;
      particles.forEach((p, idx) => {
        p.angle += p.speed * swirlSpeed;

        // Base orbiting paths around central coordinate
        const orbitRadius = p.baseX + Math.sin(frame * 0.01 + idx) * 8;
        let targetX = width / 2 + Math.cos(p.angle) * orbitRadius;
        let targetY = height / 2 + Math.sin(p.angle) * orbitRadius;

        // Drag particles toward active pointer coordinates
        if (mState.active) {
          const dx = mState.x - p.x;
          const dy = mState.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 110) {
            const force = (110 - distance) / 110;
            targetX += (mState.x - targetX) * force * mouseGravity;
            targetY += (mState.y - targetY) * force * mouseGravity;
          }
        }

        // Apply smooth spring forces
        p.vx += (targetX - p.x) * centerGravity;
        p.vy += (targetY - p.y) * centerGravity;
        
        // Dampen velocities
        p.vx *= 0.82;
        p.vy *= 0.82;

        p.x += p.vx;
        p.y += p.vy;

        // Render particle with niche-specific gradient glow
        const radGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        radGradient.addColorStop(0, "#FFFFFF");
        radGradient.addColorStop(0.3, targetPalette.primary);
        radGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = radGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [niche, goal]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    setMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setMouse((prev) => ({ ...prev, active: false }));
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[200px] relative select-none"
    >
      {/* Background soft ambient matching current niche */}
      <AnimatePresence mode="wait">
        <m.div
          key={niche}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 blur-2xl -z-10 rounded-full scale-75 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${palette.primary} 0%, ${palette.secondary} 100%)`,
          }}
        />
      </AnimatePresence>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full block cursor-crosshair relative z-10"
      />
    </div>
  );
}
