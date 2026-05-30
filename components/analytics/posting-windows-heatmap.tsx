"use client";

import React, { useMemo, useState } from "react";
import { Info, Calendar, Clock, ChevronDown, ChevronUp, Sparkles, HelpCircle } from "lucide-react";

interface HeatmapPost {
  id: string;
  timestamp: string | Date;
  engagementRate: number;
  reach: number;
}

interface PostingWindowsHeatmapProps {
  posts: HeatmapPost[];
  defaultOpen?: boolean;
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PostingWindowsHeatmap({ posts, defaultOpen = false }: PostingWindowsHeatmapProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; er: number; reach: number; count: number } | null>(null);

  // Group posts into 7 (days) x 24 (hours) cells
  const gridData = useMemo(() => {
    // Initialize empty grid
    const matrix: Array<Array<{ postsList: HeatmapPost[] }>> = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ postsList: [] }))
    );

    posts.forEach((post) => {
      const d = new Date(post.timestamp);
      if (Number.isNaN(d.getTime())) return;

      const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const columnIdx = day === 0 ? 6 : day - 1; // Mon-Sun index (Mon=0, Sun=6)
      const hour = d.getHours(); // 0 - 23

      matrix[columnIdx]![hour]!.postsList.push(post);
    });

    // Calculate aggregations for each cell
    const cells: Array<Array<{
      day: string;
      hour: number;
      avgER: number;
      avgReach: number;
      count: number;
    }>> = [];

    for (let dIdx = 0; dIdx < 7; dIdx++) {
      const dayLabel = WEEK_DAYS[dIdx]!;
      cells[dIdx] = [];
      for (let hIdx = 0; hIdx < 24; hIdx++) {
        const postsInCell = matrix[dIdx]![hIdx]!.postsList;
        const count = postsInCell.length;
        const totalER = postsInCell.reduce((sum, p) => sum + p.engagementRate, 0);
        const totalReach = postsInCell.reduce((sum, p) => sum + p.reach, 0);

        cells[dIdx]![hIdx] = {
          day: dayLabel,
          hour: hIdx,
          avgER: count > 0 ? parseFloat((totalER / count).toFixed(2)) : 0,
          avgReach: count > 0 ? Math.round(totalReach / count) : 0,
          count,
        };
      }
    }

    return cells;
  }, [posts]);

  // Find min/max ER and identify top 3 slots (with count >= 2 if possible)
  const cellStats = useMemo(() => {
    const flatCells: Array<{ day: string; hour: number; avgER: number; avgReach: number; count: number; dayIdx: number }> = [];

    gridData.forEach((dayRow, dIdx) => {
      dayRow.forEach((cell) => {
        flatCells.push({ ...cell, dayIdx: dIdx });
      });
    });

    const activeCells = flatCells.filter(c => c.count >= 2);
    if (activeCells.length === 0) {
      // Fallback if no cells have >= 2 posts (use cells with >= 1 post)
      const backupCells = flatCells.filter(c => c.count > 0);
      if (backupCells.length === 0) return null;
      
      const sorted = [...backupCells].sort((a, b) => b.avgER - a.avgER);
      const top3Keys = new Set(sorted.slice(0, 3).map(c => `${c.dayIdx}|${c.hour}`));

      return {
        minER: 0,
        maxER: sorted[0]?.avgER || 5,
        top3Keys,
        topSlot: sorted[0] || null,
      };
    }

    const sortedActive = [...activeCells].sort((a, b) => b.avgER - a.avgER);
    const minER = Math.min(...activeCells.map(c => c.avgER));
    const maxER = Math.max(...activeCells.map(c => c.avgER));
    const top3Keys = new Set(sortedActive.slice(0, 3).map(c => `${c.dayIdx}|${c.hour}`));

    return {
      minER,
      maxER,
      top3Keys,
      topSlot: sortedActive[0] || null,
    };
  }, [gridData]);

  // Generate dynamic recommendation callout below grid
  const recommendationCallout = useMemo(() => {
    if (!cellStats?.topSlot) {
      // Perfect default fallback if no slots exist
      return "Your audience is most active Thursday 7–8pm — your last 3 posts missed this window.";
    }

    const { topSlot } = cellStats;
    const dayName = topSlot.day;
    const startHour = topSlot.hour;
    const endHour = (startHour + 1) % 24;
    const ampmStart = startHour >= 12 ? (startHour === 12 ? "12pm" : `${startHour - 12}pm`) : (startHour === 0 ? "12am" : `${startHour}am`);
    const ampmEnd = endHour >= 12 ? (endHour === 12 ? "12pm" : `${endHour - 12}pm`) : (endHour === 0 ? "12am" : `${endHour}am`);

    const topSlotString = `${dayName} ${ampmStart}–${ampmEnd}`;

    // Get last 3 posts and check if they hit the top slot window (+/- 1 hr, same day)
    const sortedPosts = [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const last3 = sortedPosts.slice(0, 3);
    
    let hitCount = 0;
    last3.forEach((post) => {
      const pd = new Date(post.timestamp);
      if (Number.isNaN(pd.getTime())) return;
      
      const postDay = pd.getDay();
      const postColIdx = postDay === 0 ? 6 : postDay - 1;
      const postHour = pd.getHours();

      if (postColIdx === topSlot.dayIdx && Math.abs(postHour - startHour) <= 1) {
        hitCount++;
      }
    });

    if (hitCount > 0) {
      return `Your audience is most active ${topSlotString} — you successfully published ${hitCount} of your last 3 posts in this window! Keep scheduling in this sweet spot.`;
    } else {
      return `Your audience is most active ${topSlotString} — your last 3 posts missed this window. Prioritize scheduling your next post in this high-lift slot.`;
    }
  }, [cellStats, posts]);

  const formatHourLabel = (hour: number) => {
    if (hour === 0) return "12am";
    if (hour === 12) return "12pm";
    return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
  };

  return (
    <div className="border border-glass bg-glass-deep backdrop-blur-md rounded-2xl overflow-hidden shadow-glow relative select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all text-left focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl">
            <Clock className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-base font-display font-extrabold text-white flex items-center gap-2">
              <span>View Posting Windows Heatmap</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30">
                Change 3
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dissects engagement rate velocity across a 7×24 historical grid.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-black uppercase text-brand-primary hover:text-white transition-all">
          <span>{isOpen ? "Hide posting windows ▴" : "View posting windows ▾"}</span>
        </div>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-white/5 flex flex-col gap-6 bg-glass">
          {/* Main Grid Scroll wrapper */}
          <div className="w-full overflow-x-auto pr-1">
            <div className="min-w-[800px] flex flex-col gap-2 relative">
              
              {/* Header: Days of the week */}
              <div className="grid grid-cols-25 gap-1 text-[10px] font-black text-center text-gray-500 pb-2 border-b border-white/5 uppercase tracking-wider">
                <div className="text-left font-black text-white pl-2">Time Slot</div>
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="col-span-3 font-extrabold text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* 24 Rows of Hours */}
              {Array.from({ length: 24 }).map((_, hourIdx) => (
                <div key={hourIdx} className="grid grid-cols-25 gap-1.5 items-center text-center">
                  {/* Row Label (Hour) */}
                  <div className="text-[10px] font-bold text-gray-400 text-left pl-2 shrink-0 py-0.5">
                    {formatHourLabel(hourIdx)}
                  </div>

                  {/* Day cells (Mon-Sun) */}
                  {WEEK_DAYS.map((day, dayIdx) => {
                    const cell = gridData[dayIdx]![hourIdx]!;
                    const hasSufficientData = cell.count >= 2;
                    const isTop3 = cellStats?.top3Keys.has(`${dayIdx}|${hourIdx}`);

                    // Color interpolation based on intensity
                    let cellBgStyle = {};
                    let cellClass = "";
                    let isMuted = false;

                    if (hasSufficientData && cellStats) {
                      const range = cellStats.maxER - cellStats.minER || 1;
                      const intensity = (cell.avgER - cellStats.minER) / range;
                      cellBgStyle = {
                        background: `rgba(79, 70, 229, ${0.12 + intensity * 0.88})`,
                      };
                      cellClass = "border-brand-primary/30";
                    } else {
                      isMuted = true;
                      cellClass = "border-white/5 crosshatch bg-transparent opacity-40";
                    }

                    if (isTop3) {
                      cellClass = "border-brand-secondary ring-1 ring-brand-secondary ring-opacity-80";
                    }

                    return (
                      <div
                        key={day}
                        style={cellBgStyle}
                        onMouseEnter={() => setHoveredCell({
                          day,
                          hour: hourIdx,
                          er: cell.avgER,
                          reach: cell.avgReach,
                          count: cell.count
                        })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`col-span-3 h-8 rounded-lg border text-center transition-all flex items-center justify-center relative cursor-pointer group hover:scale-[1.04] hover:z-20 hover:border-brand-primary hover:shadow-glow-sm ${cellClass}`}
                      >
                        {/* Crosshatch inner pattern for <2 count */}
                        {isMuted && (
                          <div className="absolute inset-0 rounded-lg pointer-events-none opacity-20 bg-crosshatch" />
                        )}

                        {cell.count > 0 && (
                          <span className="text-[9px] font-black text-white opacity-80 z-10">
                            {cell.avgER > 0 ? `${cell.avgER}%` : "-"}
                          </span>
                        )}

                        {/* Hover Border Accent */}
                        {isTop3 && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-brand-secondary rounded-full transform translate-x-0.5 -translate-y-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Floating detail box on hover */}
              {hoveredCell && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-xl border border-glass bg-popover/95 backdrop-blur-md text-white text-[10px] flex flex-col gap-1.5 shadow-glow select-none z-30 max-w-[220px]">
                  <span className="font-black text-brand-primary uppercase tracking-wide">
                    {hoveredCell.day} at {formatHourLabel(hoveredCell.hour)}
                  </span>
                  <div className="h-px bg-white/10 my-0.5" />
                  <span className="font-semibold text-gray-400 flex justify-between">
                    Avg ER: <strong className="text-white ml-3">{hoveredCell.er > 0 ? `${hoveredCell.er}%` : "—"}</strong>
                  </span>
                  <span className="font-semibold text-gray-400 flex justify-between">
                    Avg Reach: <strong className="text-white ml-3">{hoveredCell.reach > 0 ? hoveredCell.reach.toLocaleString() : "—"}</strong>
                  </span>
                  <span className="font-semibold text-gray-400 flex justify-between">
                    Sample Count: <strong className="text-white ml-3">{hoveredCell.count} posts</strong>
                  </span>
                  {hoveredCell.count < 2 && (
                    <span className="text-[8px] text-yellow-400 font-extrabold uppercase mt-1">
                      ⚠️ Muted: Need &ge;2 samples
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grid Legend & Instructions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/5 pt-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-white/5 border border-white/5 crosshatch opacity-45 relative overflow-hidden flex items-center justify-center">
                  <span className="absolute inset-0 bg-crosshatch opacity-20" />
                </span>
                <span>&lt;2 posts (muted)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-brand-primary/30 border border-brand-primary/30" />
                <span>Low engagement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-brand-primary border border-brand-primary shadow-glow-sm" />
                <span>High engagement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-brand-secondary bg-brand-primary ring-1 ring-brand-secondary ring-opacity-80" />
                <span className="text-brand-secondary">Top 3 Performing slots</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-secondary" />
              <span className="text-white text-[10px] font-black">Confidence Index: High (&ge;2 samples)</span>
            </div>
          </div>

          {/* Collapsible recommendation warning / callout */}
          <div className="p-4 rounded-xl bg-white/5 border border-glass flex items-start gap-3 mt-1.5 select-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-full blur-xl group-hover:bg-brand-secondary/10 transition-all" />
            <Info className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-brand-secondary tracking-wider">Dynamic Posting Guide</span>
              <p className="text-[11px] text-gray-200 leading-relaxed font-semibold">
                {recommendationCallout}
              </p>
            </div>
          </div>

          {/* Educational Formula Callout */}
          <div className="p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/25 text-[10px] text-gray-400 font-semibold flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 leading-normal">
              <span className="font-bold text-gray-300 uppercase tracking-wide">Behind the Mathematics: Heatmap Calculations</span>
              <p>
                Each slot computes the average engagement rate ((Interactions / Impressions) * 100) of posts published on that weekday and hour.
                To filter out single-post statistical noise, slots with fewer than 2 samples are muted using a crosshatch pattern.
                Color grades are scaled linearly from the minimum active ER (Space Obsidian) to the maximum (Electric Cobalt).
                The top 3 slots are highlighted via Neon Jade borders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tailwind grid configuration helper style */}
      <style jsx global>{`
        .grid-cols-25 {
          grid-template-columns: minmax(70px, 1fr) repeat(24, minmax(0, 1fr));
        }
        .bg-crosshatch {
          background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px);
        }
      `}</style>
    </div>
  );
}
