"use client";

import React from "react";

interface SkeletonProps {
  variant: "metrics" | "chart" | "posts" | "detail" | "strategy" | "list";
  count?: number;
}

export function LoadingSkeleton({ variant, count = 3 }: SkeletonProps) {
  // A simple utility for rendering multiple items
  const items = Array.from({ length: count });

  if (variant === "metrics") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl border border-glass bg-white/5 animate-pulse min-h-[120px] flex flex-col justify-between"
          >
            <div className="w-1/2 h-4 bg-white/10 rounded-md" />
            <div className="w-3/4 h-8 bg-white/10 rounded-md mt-4" />
            <div className="w-1/3 h-4 bg-white/10 rounded-md mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className="w-full rounded-2xl border border-glass bg-white/5 p-6 animate-pulse min-h-[350px] flex flex-col justify-between">
        <div className="flex justify-between items-center mb-6">
          <div className="w-1/3 h-6 bg-white/10 rounded-md" />
          <div className="w-1/4 h-8 bg-white/10 rounded-md" />
        </div>
        <div className="flex-grow w-full bg-white/5 rounded-xl min-h-[220px]" />
      </div>
    );
  }

  if (variant === "posts") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {items.map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-glass bg-white/5 overflow-hidden animate-pulse flex flex-col min-h-[320px]"
          >
            <div className="w-full aspect-video bg-white/10" />
            <div className="p-5 flex-grow flex flex-col justify-between">
              <div>
                <div className="w-1/4 h-4 bg-white/10 rounded-md mb-3" />
                <div className="w-full h-4 bg-white/10 rounded-md mb-2" />
                <div className="w-5/6 h-4 bg-white/10 rounded-md" />
              </div>
              <div className="mt-6 flex justify-between items-center">
                <div className="w-1/3 h-4 bg-white/10 rounded-md" />
                <div className="w-1/4 h-6 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full animate-pulse">
        {/* Left Side detail panel */}
        <div className="lg:col-span-5 rounded-2xl border border-glass bg-white/5 p-6 min-h-[450px] flex flex-col gap-6">
          <div className="w-full aspect-video bg-white/10 rounded-xl" />
          <div className="w-1/3 h-6 bg-white/10 rounded-md" />
          <div className="w-full h-4 bg-white/10 rounded-md" />
          <div className="w-5/6 h-4 bg-white/10 rounded-md" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="w-full h-12 bg-white/10 rounded-xl" />
            <div className="w-full h-12 bg-white/10 rounded-xl" />
          </div>
        </div>

        {/* Right Side scores */}
        <div className="lg:col-span-7 rounded-2xl border border-glass bg-white/5 p-6 min-h-[450px] flex flex-col gap-6">
          <div className="flex items-center gap-6 pb-6 border-b border-white/10">
            <div className="w-24 h-24 rounded-full bg-white/10" />
            <div className="flex-grow flex flex-col gap-3">
              <div className="w-1/2 h-6 bg-white/10 rounded-md" />
              <div className="w-1/3 h-4 bg-white/10 rounded-md" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="w-1/4 h-4 bg-white/10 rounded-md" />
                <div className="w-1/2 h-3 bg-white/10 rounded-full" />
                <div className="w-8 h-4 bg-white/10 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "strategy") {
    return (
      <div className="w-full animate-pulse flex flex-col gap-6">
        <div className="w-full h-24 bg-white/5 border border-glass rounded-2xl p-6" />
        <div className="flex flex-col gap-4">
          {items.map((_, i) => (
            <div key={i} className="w-full h-32 bg-white/5 border border-glass rounded-2xl p-6" />
          ))}
        </div>
      </div>
    );
  }

  // list
  return (
    <div className="w-full flex flex-col gap-4 animate-pulse">
      {items.map((_, idx) => (
        <div
          key={idx}
          className="flex justify-between items-center p-4 rounded-xl border border-glass bg-white/5"
        >
          <div className="flex gap-4 items-center flex-grow">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-grow">
              <div className="w-1/3 h-4 bg-white/10 rounded-md" />
              <div className="w-2/3 h-3 bg-white/10 rounded-md" />
            </div>
          </div>
          <div className="w-16 h-6 bg-white/10 rounded-full ml-4" />
        </div>
      ))}
    </div>
  );
}
