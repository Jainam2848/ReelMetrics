"use client";

import React from "react";
import { m } from "framer-motion";

export interface TabOption<T extends string | number> {
  value: T;
  label: string;
}

interface SlidingTabsProps<T extends string | number> {
  options: TabOption<T>[] | readonly TabOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  layoutId: string;
  className?: string;
  activeClassName?: string;
}

export function SlidingTabs<T extends string | number>({
  options,
  selectedValue,
  onChange,
  layoutId,
  className = "",
  activeClassName = "",
}: SlidingTabsProps<T>) {
  return (
    <div className={`flex p-1 rounded-xl bg-white/5 border border-white/10 select-none ${className}`}>
      {options.map((option) => {
        const isActive = selectedValue === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="relative px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer focus:outline-none"
            style={{
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isActive && (
              <m.div
                layoutId={layoutId}
                className={`absolute inset-0 bg-white/10 rounded-lg ${activeClassName}`}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className={`relative z-10 transition-colors ${isActive ? "text-white" : "text-muted-foreground hover:text-white"}`}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
