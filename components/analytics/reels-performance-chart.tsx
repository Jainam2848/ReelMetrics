"use client";

import React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
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

  const normalizedData = React.useMemo(() => {
    return data.map((point) => ({
      ...point,
      Views: point.Views ?? point.Impressions ?? 0,
      Intent: point.Intent ?? 0,
      Engagements: point.Engagements ?? 0,
    }));
  }, [data]);

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

  // Custom hover state and spring-tracking coordinate controls
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hoveredData, setHoveredData] = React.useState<any>(null);
  const [tooltipActive, setTooltipActive] = React.useState(false);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  // Spring dynamics configuration for fluid cursor tracking
  const springX = useSpring(cursorX, { damping: 24, stiffness: 180 });
  const springY = useSpring(cursorY, { damping: 24, stiffness: 180 });

  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Set absolute coordinates relative to the chart viewport container
    cursorX.set(x);
    cursorY.set(y);

    // Calculate active data index by mapping horizontal percentage coordinate
    const width = rect.width;
    const pct = x / width;
    const index = Math.round(pct * (normalizedData.length - 1));
    const nearestIndex = Math.min(Math.max(index, 0), normalizedData.length - 1);

    if (normalizedData[nearestIndex]) {
      setHoveredData(normalizedData[nearestIndex]);
    }
  }, [normalizedData, cursorX, cursorY]);

  const handleMouseEnter = React.useCallback(() => {
    setTooltipActive(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setTooltipActive(false);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-white/5 animate-pulse rounded-xl" />;
  }

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
            className={`rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
              metric === mode.key
                ? "bg-brand-primary text-white shadow-glow-sm"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-[220px] select-none"
      >
        <style>{`
          @keyframes drawLinePrimary {
            from {
              stroke-dashoffset: 2000;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
          @keyframes drawLineSecondary {
            from {
              stroke-dashoffset: 2000;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
          .recharts-custom-line-primary .recharts-line-curve {
            stroke-dasharray: 2000;
            stroke-dashoffset: 2000;
            animation: drawLinePrimary 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          }
          .recharts-custom-line-secondary .recharts-line-curve {
            stroke-dasharray: 2000;
            stroke-dashoffset: 2000;
            animation: drawLineSecondary 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            animation-delay: 0.15s;
          }
        `}</style>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart 
            key={`${metric}-${normalizedData.length}`}
            data={normalizedData} 
            margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" axisLine={false} tickLine={false} dy={10} />
            <YAxis stroke="rgba(255,255,255,0.3)" axisLine={false} tickLine={false} dx={-5} tickFormatter={formatValue} />
            
            {/* Custom blank Tooltip to enable hover triggers while hiding standard markup */}
            <ChartTooltip
              content={() => null}
              cursor={false}
            />

            <Line 
              type="monotone" 
              dataKey={metric} 
              stroke="#4F46E5" 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ r: 5 }} 
              isAnimationActive={false}
              className="recharts-custom-line-primary"
            />
            {metric !== compareMetric && (
              <Line 
                type="monotone" 
                dataKey={compareMetric} 
                stroke="#14B8A6" 
                strokeWidth={2} 
                dot={false} 
                strokeDasharray="4 4" 
                isAnimationActive={false}
                className="recharts-custom-line-secondary"
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Custom Interactive Spring Glassmorphic Tooltip */}
        {tooltipActive && hoveredData && (
          <motion.div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              x: springX,
              y: springY,
              transform: "translate(-50%, -115%)",
              pointerEvents: "none",
              zIndex: 50,
            }}
            className="p-3.5 rounded-xl border border-glass bg-popover/90 backdrop-blur-[20px] shadow-glow text-white text-[10px] flex flex-col gap-1.5 select-none"
          >
            <span className="font-bold text-gray-400">{hoveredData.date}</span>
            <span className="font-semibold text-brand-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
              {selectedLabel}: <strong className="text-white">{formatValue(hoveredData[metric])}</strong>
            </span>
            {metric !== compareMetric && (
              <span className="font-semibold text-brand-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary" />
                {compareLabel}: <strong className="text-white">{formatValue(hoveredData[compareMetric])}</strong>
              </span>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
