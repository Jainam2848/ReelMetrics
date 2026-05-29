"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { m, useMotionValue, useSpring } from "framer-motion";

interface MagneticCursorProps {
  children: React.ReactNode;
}

export function MagneticCursor({ children }: MagneticCursorProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Motion values for target mouse coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Motion value for cursor size (32px resting, 64px on hover)
  const size = useMotionValue(32);
  
  // Spring configurations as specified: { stiffness: 400, damping: 28, mass: 0.5 }
  const springConfig = { stiffness: 400, damping: 28, mass: 0.5 };
  
  // Smooth out coordinate and size tracking
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);
  const cursorSize = useSpring(size, springConfig);

  const [hoveredEl, setHoveredEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check mobile using matchMedia for pointer: coarse
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    setIsMobile(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (isMobile || !mounted) return;

    // Track mouse coordinates globally
    const handleMouseMove = (e: PointerEvent) => {
      if (hoveredEl) {
        const rect = hoveredEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 35% magnetic pull towards center of element, 65% follows mouse pointer
        const pullX = centerX + (e.clientX - centerX) * 0.35;
        const pullY = centerY + (e.clientY - centerY) * 0.35;
        
        mouseX.set(pullX);
        mouseY.set(pullY);
      } else {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }
    };

    window.addEventListener("pointermove", handleMouseMove);
    return () => {
      window.removeEventListener("pointermove", handleMouseMove);
    };
  }, [isMobile, mounted, hoveredEl]);

  useEffect(() => {
    if (isMobile || !mounted) return;

    // Monitor additions of elements tagged with data-magnetic and add magnetic behavior
    const updateMagneticListeners = () => {
      const magneticElements = document.querySelectorAll("[data-magnetic]");

      const handlePointerEnter = (e: Event) => {
        const el = e.currentTarget as HTMLElement;
        setHoveredEl(el);
        size.set(64); // Expand to 64px on hover
      };

      const handlePointerLeave = (e: Event) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "";
        el.style.transition = "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
        setHoveredEl(null);
        size.set(32); // Shrink back to 32px
      };

      const handlePointerMove = (e: Event) => {
        const pe = e as PointerEvent;
        const el = e.currentTarget as HTMLElement;
        
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 25% pull fuerza on the magnetic element towards the cursor
        const pullFactor = 0.25;
        const pullX = (pe.clientX - centerX) * pullFactor;
        const pullY = (pe.clientY - centerY) * pullFactor;
        
        el.style.transform = `translate3d(${pullX}px, ${pullY}px, 0)`;
        el.style.transition = "transform 0.1s ease-out";
      };

      magneticElements.forEach((el) => {
        // Prevent duplicate listener additions
        if (el.getAttribute("data-magnetic-bound") === "true") return;
        el.setAttribute("data-magnetic-bound", "true");

        el.addEventListener("pointerenter", handlePointerEnter);
        el.addEventListener("pointerleave", handlePointerLeave);
        el.addEventListener("pointermove", handlePointerMove);
      });

      return () => {
        magneticElements.forEach((el) => {
          el.removeEventListener("pointerenter", handlePointerEnter);
          el.removeEventListener("pointerleave", handlePointerLeave);
          el.removeEventListener("pointermove", handlePointerMove);
          el.removeAttribute("data-magnetic-bound");
        });
      };
    };

    // Initialize and observe document for any DOM updates (ensures client SPA transitions don't break listeners)
    const cleanup = updateMagneticListeners();
    
    const observer = new MutationObserver(() => {
      updateMagneticListeners();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cleanup();
      observer.disconnect();
    };
  }, [isMobile, mounted, hoveredEl]);

  if (!mounted || isMobile) return <>{children}</>;

  return (
    <>
      {createPortal(
        <m.div
          className="fixed pointer-events-none rounded-full"
          style={{
            x: cursorX,
            y: cursorY,
            width: cursorSize,
            height: cursorSize,
            translateX: "-50%",
            translateY: "-50%",
            backgroundColor: "rgba(79, 70, 229, 0.8)", // Indigo #4F46E5 at 80% opacity
            mixBlendMode: "difference",
            zIndex: 99999,
            willChange: "transform, width, height",
          }}
        />,
        document.body
      )}
      {children}
    </>
  );
}
