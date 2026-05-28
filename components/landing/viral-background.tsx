"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  size: number;
  targetSize: number;
  color: string;
  targetColor: string;
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  isIgnited: boolean;
  ignitionTime: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
}

export function ViralBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const ripples = useRef<Ripple[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initialize particles
    const initParticles = () => {
      particles.current = [];
      const density = 0.00005; // Adjust count based on screen area
      const count = Math.min(100, Math.floor(width * height * density));

      const colors = ["#4F46E5", "#14B8A6", "#F97316"]; // strategy palette

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          baseX: x,
          baseY: y,
          size: Math.random() * 2 + 1.5,
          targetSize: Math.random() * 2 + 1.5,
          color: "rgba(255, 255, 255, 0.12)",
          targetColor: "rgba(255, 255, 255, 0.12)",
          alpha: Math.random() * 0.4 + 0.2,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.015 + 0.005,
          isIgnited: false,
          ignitionTime: 0,
        });
      }
    };

    initParticles();

    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    // Custom Event Listener for Global Ripples
    const handleGlobalRipple = (e: any) => {
      const x = e.detail?.x ?? width / 2;
      const y = e.detail?.y ?? height / 2;

      ripples.current.push({
        x,
        y,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.6,
        speed: 10,
        alpha: 0.8,
      });

      // Ignite nearby nodes initially
      particles.current.forEach((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist < 150) {
          p.isIgnited = true;
          p.ignitionTime = 1.0;
          p.targetColor = Math.random() > 0.5 ? "#4F46E5" : "#F97316";
          p.targetSize = p.size * 2.2;
          p.vx += (dx / dist) * 1.5;
          p.vy += (dy / dist) * 1.5;
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("viral-ripple", handleGlobalRipple);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    const render = () => {
      // Cockpit Dark background color
      ctx.fillStyle = "#08090D";
      ctx.fillRect(0, 0, width, height);

      // Draw active ripples
      ripples.current.forEach((rip, idx) => {
        rip.radius += rip.speed;
        rip.alpha -= 0.015;

        // Draw soft expanding strategic ring
        ctx.strokeStyle = `rgba(79, 70, 229, ${rip.alpha * 0.15})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(20, 184, 166, ${rip.alpha * 0.08})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius + 15, 0, Math.PI * 2);
        ctx.stroke();

        // Remove dead ripples
        if (rip.alpha <= 0 || rip.radius > rip.maxRadius) {
          ripples.current.splice(idx, 1);
        }
      });

      const maxDistance = 140; // Max connecting distance
      const activeColors = ["#4F46E5", "#14B8A6", "#F97316"];

      // Update and draw nodes
      particles.current.forEach((p) => {
        // Drift movement
        p.x += p.vx;
        p.y += p.vy;

        // Bounce boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Interactive mouse physics: gentle push
        if (mouse.current.x > 0) {
          const dx = p.x - mouse.current.x;
          const dy = p.y - mouse.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            p.x += (dx / dist) * force * 1.5;
            p.y += (dy / dist) * force * 1.5;

            // Ignite on hover
            if (!p.isIgnited && Math.random() > 0.98) {
              p.isIgnited = true;
              p.ignitionTime = 1.0;
              p.targetColor = activeColors[Math.floor(Math.random() * activeColors.length)]!;
              p.targetSize = p.size * 2.0;
            }
          }
        }

        // Ripple collision detection
        ripples.current.forEach((rip) => {
          const dx = p.x - rip.x;
          const dy = p.y - rip.y;
          const dist = Math.hypot(dx, dy);
          if (Math.abs(dist - rip.radius) < 20) {
            p.isIgnited = true;
            p.ignitionTime = 1.0;
            p.targetColor = activeColors[Math.floor(Math.random() * activeColors.length)]!;
            p.targetSize = p.size * 2.5;
            p.vx += (dx / dist) * 0.8;
            p.vy += (dy / dist) * 0.8;
          }
        });

        // Breathing/pulsing scale phase
        p.pulsePhase += p.pulseSpeed;
        const pulseFactor = Math.sin(p.pulsePhase) * 0.2 + 0.9;

        // Ignition cooling down
        if (p.isIgnited) {
          p.ignitionTime -= 0.01;
          if (p.ignitionTime <= 0) {
            p.isIgnited = false;
            p.targetColor = "rgba(255, 255, 255, 0.12)";
            p.targetSize = p.size;
          }
        }

        // Smooth size and color interpolation
        const currentSize = p.isIgnited 
          ? p.targetSize * pulseFactor 
          : p.size * pulseFactor;

        // Draw connecting mesh lines (restrained & gorgeous)
        particles.current.forEach((other) => {
          if (p === other) return;
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.06;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();

            // Active strategic glows between ignited nodes
            if (p.isIgnited && other.isIgnited) {
              const activeAlpha = (1 - dist / maxDistance) * 0.15;
              ctx.strokeStyle = `rgba(79, 70, 229, ${activeAlpha})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
            }
          }
        });

        // Draw particle node
        ctx.fillStyle = p.isIgnited ? p.targetColor : p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Ignited glow ring
        if (p.isIgnited) {
          ctx.strokeStyle = p.targetColor;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = p.ignitionTime * 0.4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize * 2.2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      });

      // Add a premium ambient radial gradient mesh overlay
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        10,
        width * 0.5,
        height * 0.3,
        Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, "rgba(79, 70, 229, 0.04)"); // strategies indigo
      gradient.addColorStop(0.5, "rgba(20, 184, 166, 0.01)"); // growth teal
      gradient.addColorStop(1, "rgba(8, 9, 13, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("viral-ripple", handleGlobalRipple);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-0 pointer-events-none w-full h-full bg-[#08090D] ${className || ""}`}
    />
  );
}
