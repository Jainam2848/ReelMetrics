"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  date: string;
  engagementRate: number;
  hookRetention: number;
  watchThrough?: number | null;
}

interface TrendChartProps {
  data: DataPoint[];
  isLoading?: boolean;
}

export function TrendChart({ data = [], isLoading = false }: TrendChartProps) {
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [metricKey, setMetricKey] = useState<"engagementRate" | "hookRetention">("engagementRate");

  // Prevent SSR hydration mismatch warning by only rendering after mount
  useEffect(() => {
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

  if (isLoading || !mounted) {
    return (
      <div className="w-full rounded-2xl border border-glass bg-glass p-6 animate-pulse min-h-[350px] flex flex-col justify-between">
        <div className="flex justify-between items-center mb-6">
          <div className="w-1/3 h-6 bg-white/10 rounded-md" />
          <div className="w-1/4 h-8 bg-white/10 rounded-md" />
        </div>
        <div className="flex-grow w-full bg-white/5 rounded-xl min-h-[220px]" />
      </div>
    );
  }

  // Filter data based on selected range
  const filteredData = data.slice(-range);

  // Y-axis tick formatter (K formatting and percentages)
  const formatYAxis = (val: number) => {
    if (metricKey === "engagementRate") {
      return `${val.toFixed(1)}%`;
    }
    return `${val}%`;
  };

  const getMetricLabel = () => {
    return metricKey === "engagementRate" ? "Engagement Rate" : "Hook Retention (Commute Opener)";
  };

  const activeColor = metricKey === "engagementRate" ? "#6C5CE7" : "#00B894";
  const activeGradient = metricKey === "engagementRate" ? "url(#colorER)" : "url(#colorHR)";

  return (
    <div className="w-full rounded-2xl border border-glass bg-glass p-6 hover:shadow-glow transition-all flex flex-col gap-6 min-h-[350px]">
      {/* Chart Headers & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h3 className="text-lg font-bold font-heading text-white">
            {getMetricLabel()}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Proprietary strategy trends over time
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Metric selector */}
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <button
              onClick={() => setMetricKey("engagementRate")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 ${
                metricKey === "engagementRate" ? "bg-brand-primary text-white" : "hover:text-white"
              }`}
            >
              ER
            </button>
            <button
              onClick={() => setMetricKey("hookRetention")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 ${
                metricKey === "hookRetention" ? "bg-brand-secondary text-white" : "hover:text-white"
              }`}
            >
              Hook hold
            </button>
          </div>

          {/* Range Selector */}
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {([7, 30, 90] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 ${
                  range === r ? "bg-white/10 text-white" : "hover:text-white"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts container */}
      <div className="w-full h-[220px] min-w-0 min-h-0 text-xs">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Engagement Rate Gradient */}
              <linearGradient id="colorER" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
              </linearGradient>
              {/* Hook Retention Gradient */}
              <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00B894" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00B894" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.3)"
              axisLine={false}
              tickLine={false}
              dy={10}
            />

            <YAxis
              stroke="rgba(255,255,255,0.3)"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxis}
              domain={metricKey === "engagementRate" ? [0, "auto"] : [30, 100]}
              dx={-5}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0 && payload[0]) {
                  const dataPoint = payload[0].payload as DataPoint;
                  return (
                    <div className="p-3.5 rounded-xl border border-glass bg-popover/90 backdrop-blur-md shadow-glow text-white text-xs flex flex-col gap-1.5 select-none">
                      <span className="font-bold text-gray-400">{dataPoint.date}</span>
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-brand-primary" />
                        Engagement Rate: <strong className="text-white">{dataPoint.engagementRate}%</strong>
                      </span>
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-brand-secondary" />
                        Hook holding: <strong className="text-white">{dataPoint.hookRetention}%</strong>
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey={metricKey}
              stroke={activeColor}
              strokeWidth={3}
              fillOpacity={1}
              fill={activeGradient}
              style={{ willChange: "transform" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
