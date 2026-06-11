"use client";

import React from "react";
import { m, useReducedMotion } from "framer-motion";
import { Sparkles, Activity, Target } from "lucide-react";

interface Props {
  niche: string;
  goal: string;
}

export default function OnboardingCore3D({ niche, goal }: Props) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central Core Rings */}
      <m.div
        animate={shouldReduceMotion ? {} : { 
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        className="absolute w-24 h-24 rounded-full border border-indigo-500/30 flex items-center justify-center"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 blur-md" />
      </m.div>
      
      <m.div
        animate={shouldReduceMotion ? {} : { 
          rotate: [360, 270, 180, 90, 0],
        }}
        transition={{ duration: 25, ease: "linear", repeat: Infinity }}
        className="absolute w-32 h-32 rounded-full border border-dashed border-teal-500/20"
      />

      {/* Inner pulsing jewel */}
      <m.div
        animate={shouldReduceMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
        className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]"
      >
        <Sparkles className="w-5 h-5 text-white" />
      </m.div>

      {/* Orbiting data points to represent AI Intelligence scanning */}
      {!shouldReduceMotion && (
        <>
          <m.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
            className="absolute w-32 h-32 pointer-events-none"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#08090D] border border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] flex items-center justify-center">
               <Activity className="w-3 h-3 text-indigo-400" />
            </div>
          </m.div>
          <m.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, ease: "linear", repeat: Infinity }}
            className="absolute w-40 h-40 pointer-events-none"
          >
            <div className="absolute bottom-0 right-1/4 w-4 h-4 rounded-full bg-[#08090D] border border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)] flex items-center justify-center">
              <Target className="w-2.5 h-2.5 text-teal-400" />
            </div>
          </m.div>
        </>
      )}
    </div>
  );
}
