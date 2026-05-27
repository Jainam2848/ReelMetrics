"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
} from "recharts";

interface ChartDataPoint {
  date: string;
  Reach: number;
  Impressions: number;
}

interface ReelsPerformanceChartProps {
  data: ChartDataPoint[];
}

export function ReelsPerformanceChart({ data }: ReelsPerformanceChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      setMounted(true);
    }, 100);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-white/5 animate-pulse rounded-xl" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" axisLine={false} tickLine={false} dy={10} />
        <YAxis stroke="rgba(255,255,255,0.3)" axisLine={false} tickLine={false} dx={-5} />
        <ChartTooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length > 0) {
              const p0 = payload[0];
              const p1 = payload[1];
              if (!p0) return null;
              return (
                <div className="p-3 rounded-xl border border-glass bg-popover/90 backdrop-blur-md text-white text-[10px] flex flex-col gap-1.5 shadow-glow select-none">
                  <span className="font-bold text-gray-400">{p0.payload?.date}</span>
                  <span className="font-semibold text-brand-primary flex items-center gap-1">
                    Reach: <strong className="text-white">{p0.value?.toLocaleString()}</strong>
                  </span>
                  {p1 && (
                    <span className="font-semibold text-brand-secondary flex items-center gap-1">
                      Impressions: <strong className="text-white">{p1.value?.toLocaleString()}</strong>
                    </span>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
        <Line type="monotone" dataKey="Reach" stroke="#6C5CE7" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="Impressions" stroke="#00B894" strokeWidth={2} dot={false} strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  );
}
