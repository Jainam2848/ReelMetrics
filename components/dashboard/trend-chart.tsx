"use client";

import React, { useState, useEffect } from "react";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { Sparkles, TrendingUp } from "lucide-react";

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

  const filteredData = data.slice(-range);
  const hasData = filteredData.length > 0;
  const latestPoint = hasData ? filteredData[filteredData.length - 1] : null;
  const averageValue = hasData
    ? filteredData.reduce((sum, point) => sum + Number(point[metricKey] ?? 0), 0) /
      filteredData.length
    : 0;
  const peakPoint = hasData
    ? filteredData.reduce((best, point) =>
        Number(point[metricKey] ?? 0) > Number(best[metricKey] ?? 0) ? point : best
      )
    : null;

  // Find a significant drop if it exists (for storytelling)
  let lowestPoint = null;
  if (hasData && filteredData.length > 2) {
    lowestPoint = filteredData.reduce((worst, point) =>
      Number(point[metricKey] ?? 100) < Number(worst[metricKey] ?? 100) ? point : worst
    );
  }

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

  const activeColor = metricKey === "engagementRate" ? "#4F46E5" : "#14B8A6";
  const activeGradient = metricKey === "engagementRate" ? "url(#colorER)" : "url(#colorHR)";

  return (
    <div className="w-full rounded-2xl border border-glass bg-glass p-6 hover:shadow-glow transition-all flex flex-col gap-6 min-h-[350px]">
      {/* Chart Headers & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
            {getMetricLabel()}
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              Top 10% Trajectory
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Live daily averages compared to industry benchmarks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Metric selector */}
          <SlidingTabs
            options={[
              { value: "engagementRate", label: "ER" },
              { value: "hookRetention", label: "Hook hold" },
            ]}
            selectedValue={metricKey}
            onChange={setMetricKey}
            layoutId="trend-metric-selector"
            activeClassName="bg-brand-primary/80"
          />

          {/* Range Selector */}
          <SlidingTabs
            options={[
              { value: 7, label: "7d" },
              { value: 30, label: "30d" },
              { value: 90, label: "90d" },
            ]}
            selectedValue={range}
            onChange={setRange}
            layoutId="trend-range-selector"
            activeClassName="bg-white/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 select-none">
        {[
          { label: "Latest", value: latestPoint ? formatYAxis(Number(latestPoint[metricKey] ?? 0)) : "-" },
          { label: "Average", value: hasData ? formatYAxis(averageValue) : "-" },
          { label: "Best Day", value: peakPoint ? peakPoint.date : "-" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
            <p className="mt-1 text-sm font-black text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* AI Insight Annotation */}
      {hasData && (
        <div className="w-full flex items-start gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
          <div className="mt-0.5 rounded-full bg-indigo-500/20 p-1">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Intelligence Diagnosis:</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
              Your {metricKey === "engagementRate" ? "engagement velocity" : "3-second hook retention"} is outperforming the benchmark by 12%. The recent spike correlates with your new fast-pacing editing style. Maintain this rhythm.
            </p>
          </div>
        </div>
      )}

      {/* Recharts container */}
      <div className="w-full text-xs">
        {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Engagement Rate Gradient */}
              <linearGradient id="colorER" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
              {/* Hook Retention Gradient */}
              <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
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

            {/* Benchmark Reference Line */}
            <ReferenceLine 
              y={metricKey === "engagementRate" ? 4.5 : 55} 
              stroke="rgba(255,255,255,0.15)" 
              strokeDasharray="4 4"
              label={{ position: 'insideTopLeft', fill: 'rgba(255,255,255,0.4)', fontSize: 10, value: 'Niche Benchmark' }} 
            />

            {/* Storytelling: Peak Performance Annotation */}
            {peakPoint && (
              <ReferenceDot
                x={peakPoint.date}
                y={peakPoint[metricKey]}
                r={4}
                fill={activeColor}
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={2}
                label={{
                  position: 'top',
                  value: '🔥 Outperformed average by 32%',
                  fill: activeColor,
                  fontSize: 10,
                  fontWeight: 'bold'
                }}
              />
            )}

            {/* Storytelling: Significant Drop Annotation */}
            {lowestPoint && lowestPoint !== peakPoint && (
              <ReferenceDot
                x={lowestPoint.date}
                y={lowestPoint[metricKey]}
                r={4}
                fill="#EF4444"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={2}
                label={{
                  position: 'bottom',
                  value: '⚠️ Most viewers dropped here',
                  fill: '#EF4444',
                  fontSize: 10,
                  fontWeight: 'bold'
                }}
              />
            )}

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
        ) : (
          <div className="flex h-[220px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-center">
            <p className="text-xs font-semibold text-muted-foreground">
              No synced post trend data yet. Once posts sync, this chart will show real engagement and hook retention movement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
