"use client";

import React from "react";
import { m } from "framer-motion";

interface GraphAnimatorProps {
  children: React.ReactNode;
  delay?: number;
}

export function GraphAnimator({ children, delay = 0 }: GraphAnimatorProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full"
    >
      {children}
    </m.div>
  );
}
