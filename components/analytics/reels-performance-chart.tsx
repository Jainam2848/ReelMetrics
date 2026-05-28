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
  Views?: number;
  Impressions?: number;
  Intent?: number;
  Engagements?: number;
}

interface ReelsPerformanceChartProps {
  data: ChartDataPoint[];
}

const CHART_MODES = [
  { key: "Reach", label: "Reach" },
  { key: "Views", label: "Views" },
  { key: "Intent", label: "Saves + Shares" },
  { key: "Engagements", label: "Interactions" },
] as const;

type ChartMetric = (typeof CHART_MODES)[number]["key"];

export function ReelsPerformanceChart({ data }: ReelsPerformanceChartProps) {
  const [mounted, setMounted] = React.useState(false);
  const [metric, setMetric] = React.useState<ChartMetric>("Reach");

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

  const normalizedData = data.map((point) => ({
    ...point,
    Views: point.Views ?? point.Impressions ?? 0,
    Intent: point.Intent ?? 0,
    Engagements: point.Engagements ?? 0,
  }));

  const selectedLabel = CHART_MODES.find((mode) => mode.key === metric)?.label ?? metric;
  const compareMetric: ChartMetric = metric === "Reach" ? "Views" : "Reach";
  const compareLabel = compareMetric === "Views" ? "Views" : "Reach";
  const formatValue = (value: unknown) => {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return "-";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  if (normalizedData.length === 0) {
    return (
      <div className="flex h-[220px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-center">
        <p className="text-xs font-semibold text-muted-foreground">
          No live trend points yet. Sync posts or account insights to populate this chart.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[250px] flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {CHART_MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => setMetric(mode.key)}
            className={`rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
              metric === mode.key
                ? "bg-brand-primary text-white shadow-glow-sm"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
      <LineChart data={normalizedData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" axisLine={false} tickLine={false} dy={10} />
        <YAxis stroke="rgba(255,255,255,0.3)" axisLine={false} tickLine={false} dx={-5} tickFormatter={formatValue} />
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
                    {selectedLabel}: <strong className="text-white">{formatValue(p0.value)}</strong>
                  </span>
                  {p1 && (
                    <span className="font-semibold text-brand-secondary flex items-center gap-1">
                      {compareLabel}: <strong className="text-white">{formatValue(p1.value)}</strong>
                    </span>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
        <Line type="monotone" dataKey={metric} stroke="#4F46E5" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
        {metric !== compareMetric && (
          <Line type="monotone" dataKey={compareMetric} stroke="#14B8A6" strokeWidth={2} dot={false} strokeDasharray="4 4" />
        )}
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}
