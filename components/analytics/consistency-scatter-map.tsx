"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { Info, HelpCircle } from "lucide-react";

interface ScatterPostPoint {
  id: string;
  title: string;
  views: number;
  saves: number;
  timestamp: string | Date;
}

interface ConsistencyScatterMapProps {
  posts: ScatterPostPoint[];
}

// Fixed thresholds for quadrants
const VIEWS_THRESHOLD = 5000;
const LOG_VIEWS_THRESHOLD = Math.log10(VIEWS_THRESHOLD); // ~3.699
const SAVES_RATE_THRESHOLD = 1.0; // 1% saves rate

export function ConsistencyScatterMap({ posts }: ConsistencyScatterMapProps) {
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

  // Normalize data for scatter plotting
  const chartPoints = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return posts.map((post) => {
      const views = Math.max(1, post.views);
      const saves = post.saves || 0;
      const savesRate = parseFloat(((saves / views) * 100).toFixed(3));
      const logViews = parseFloat(Math.log10(views).toFixed(3));
      
      const isRecent = new Date(post.timestamp).getTime() >= thirtyDaysAgo;

      return {
        id: post.id,
        title: post.title || "Untitled synced post",
        rawViews: post.views,
        saves,
        savesRate,
        x: logViews,
        y: savesRate,
        isRecent,
      };
    });
  }, [posts]);

  // Compute quadrant distribution for recent posts
  const quadrantAnalysis = useMemo(() => {
    const recentPoints = chartPoints.filter(p => p.isRecent);
    if (recentPoints.length === 0) return null;

    let buildingAudience = 0;   // Top-Left: views < 5K, savesRate >= 1%
    let viralSticky = 0;        // Top-Right: views >= 5K, savesRate >= 1%
    let spikeNoRetention = 0;   // Bottom-Right: views >= 5K, savesRate < 1%
    let underperforming = 0;    // Bottom-Left: views < 5K, savesRate < 1%

    recentPoints.forEach(p => {
      const highViews = p.rawViews >= VIEWS_THRESHOLD;
      const highSaves = p.savesRate >= SAVES_RATE_THRESHOLD;

      if (highSaves && !highViews) buildingAudience++;
      else if (highSaves && highViews) viralSticky++;
      else if (!highSaves && highViews) spikeNoRetention++;
      else underperforming++;
    });

    const counts = [
      { id: "Spike without retention", count: spikeNoRetention, advice: "Most of your recent posts are in Spike without retention — you are reaching new viewers but not converting them to loyal followers. Prioritize save-worthy checklists and high-value takeaways in your next 5 posts to build an audience moat." },
      { id: "Building audience", count: buildingAudience, advice: "Most of your recent posts are in Building audience — you are successfully creating highly save-worthy content but reaching smaller viewer pools. Focus on search-friendly keywords, broader topic hooks, and trending templates to scale your views." },
      { id: "Viral and sticky", count: viralSticky, advice: "Most of your recent posts are in Viral and sticky — congratulations! You are hitting massive viral reach while maintaining supreme subscriber conversion. Double down on this formula and create repeatable multi-part series." },
      { id: "Underperforming", count: underperforming, advice: "Most of your recent posts are in Underperforming — your reach is limited and viewer intent remains low. Pivot your messaging and introduce a stronger, faster visual hook in your first 2 seconds to boost early retention." }
    ];

    // Sort to find majority quadrant
    return counts.sort((a, b) => b.count - a.count)[0];
  }, [chartPoints]);

  const formatLogTickX = (tick: number) => {
    const val = Math.pow(10, tick);
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return val.toLocaleString();
  };

  const formatPercentY = (val: number) => `${val.toFixed(1)}%`;

  if (chartPoints.length === 0) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center rounded-2xl border border-white/10 bg-glass px-6 text-center select-none">
        <p className="text-xs font-semibold text-muted-foreground">
          No live trend points yet. Sync posts to populate the virality scatter map.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-glass bg-glass rounded-2xl p-6 shadow-glow relative select-none flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-display font-extrabold text-white flex items-center gap-1.5">
            <span>Consistency vs Virality Scatter Map</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
              Change 1
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identifies creator-market fit by mapping views against saves rate.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shadow-glow-sm" />
            <span className="text-white">Last 30 Days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 opacity-40" />
            <span className="text-gray-400">Older posts</span>
          </div>
        </div>
      </div>

      {/* Recharts Scatter Plot container */}
      <div className="w-full h-[300px] relative text-xs bg-black/10 rounded-xl p-4 border border-white/5 overflow-hidden">
        {/* Quadrant Text Labels in background */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 p-10 opacity-30 select-none">
          <div className="text-[10px] font-black uppercase text-gray-400 self-start justify-self-start">Building audience (high saves, lower views)</div>
          <div className="text-[10px] font-black uppercase text-brand-primary self-start justify-self-end">Viral and sticky (high both)</div>
          <div className="text-[10px] font-black uppercase text-gray-500 self-end justify-self-start">Underperforming</div>
          <div className="text-[10px] font-black uppercase text-brand-secondary self-end justify-self-end">Spike without retention (high views, low saves)</div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 15, right: 15, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Views" 
              domain={[1, 5]} 
              stroke="rgba(255,255,255,0.2)"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatLogTickX}
              dy={5}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Saves Rate" 
              domain={[0, 4]} 
              stroke="rgba(255,255,255,0.2)"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatPercentY}
              dx={-5}
            />
            <ZAxis type="number" range={[120, 120]} />
            <ChartTooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0]?.payload;
                  if (!data) return null;
                  return (
                    <div className="p-3.5 rounded-xl border border-glass bg-popover/90 backdrop-blur-md text-white text-[10px] flex flex-col gap-1.5 shadow-glow select-none max-w-[200px]">
                      <span className="font-bold text-white line-clamp-2">{data.title}</span>
                      <div className="h-px bg-white/10 my-0.5" />
                      <span className="font-semibold text-gray-400 flex justify-between">
                        Views: <strong className="text-white ml-2">{data.rawViews.toLocaleString()}</strong>
                      </span>
                      <span className="font-semibold text-brand-primary flex justify-between">
                        Saves Rate: <strong className="text-white ml-2">{data.savesRate}%</strong>
                      </span>
                      <span className="text-[8px] text-gray-500 mt-1 uppercase font-black">
                        {data.isRecent ? "Recent post (30d)" : "Older post"}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Quadrant lines */}
            <ReferenceLine x={LOG_VIEWS_THRESHOLD} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} strokeDasharray="3 3" />
            <ReferenceLine y={SAVES_RATE_THRESHOLD} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} strokeDasharray="3 3" />

            <Scatter data={chartPoints} shape="circle">
              {chartPoints.map((entry, index) => {
                const fill = entry.isRecent ? "hsl(251, 88%, 62%)" : "rgba(148, 163, 184, 0.4)";
                const filter = entry.isRecent ? "drop-shadow(0 0 4px rgba(79, 70, 229, 0.5))" : "none";
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={fill} 
                    style={{ filter, cursor: "pointer" }}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Strategic Callout */}
      {quadrantAnalysis && (
        <div className="p-4 rounded-xl bg-white/5 border border-glass flex items-start gap-3 mt-1.5 select-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-xl group-hover:bg-brand-primary/10 transition-all" />
          <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-brand-primary tracking-wider">Strategic Recommendation</span>
            <p className="text-[11px] text-gray-200 leading-relaxed font-semibold">
              {quadrantAnalysis.advice}
            </p>
          </div>
        </div>
      )}

      {/* Explanatory Educational Callout about mathematical formulas */}
      <div className="p-3 rounded-xl bg-brand-secondary/5 border border-brand-secondary/25 text-[10px] text-gray-400 font-semibold flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5 leading-normal">
          <span className="font-bold text-gray-300 uppercase tracking-wide">Behind the Mathematics: Grid Calculations & Predictions</span>
          <p>
            The X-axis uses a **base-10 logarithmic scale** (e.g. log(100)=2, log(10K)=4) to map small experiments and major virals on the same scope without distortion.
            Saves rate is calculated as **Saves / Views**, isolating true user bookmarking commitment from passive views.
            Separator coordinates are set at a baseline of **5,000 views** and **1.0% saves rate** derived from Creator-Market fit models.
          </p>
        </div>
      </div>
    </div>
  );
}
