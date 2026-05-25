/**
 * Shared analytics helpers — derive heatmaps and timelines from synced reels only.
 */

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const HEATMAP_HOURS = [8, 12, 18, 20] as const;

export interface HeatmapCell {
  day: string;
  hour: string;
  score: number; // Normalized 0-100 score for opacity
  lift: number;  // Reach lift percentage vs baseline (e.g. +24.5%)
  count: number; // Number of posts in this cell
}

export interface TimelinePoint {
  date: string;
  engagementRate: number;
  hookRetention: number;
  watchThrough: number | null;
}

type TimestampedReel = {
  timestamp: Date | string;
  engagementRate: string | number | null;
  skipRate: string | number | null;
  reach?: number | string | null;
};

function parseSkipRate(skipRate: string | number | null | undefined): number | null {
  if (skipRate === null || skipRate === undefined) return null;
  const n = typeof skipRate === "number" ? skipRate : parseFloat(skipRate);
  return Number.isFinite(n) ? n : null;
}

function parseEngagementRate(rate: string | number | null | undefined): number | null {
  if (rate === null || rate === undefined) return null;
  const n = typeof rate === "number" ? rate : parseFloat(rate);
  return Number.isFinite(n) ? n : null;
}

/** Bucket publish times into day × hour cells and calculate average reach lift relative to baseline. */
export function buildPostingHeatmap(posts: TimestampedReel[]): HeatmapCell[] {
  if (posts.length === 0) return [];

  // Parse reach values
  const postsWithReach = posts.map(post => {
    const reachRaw = post.reach;
    let reachVal = 0;
    if (reachRaw != null) {
      reachVal = typeof reachRaw === "number" ? reachRaw : parseInt(reachRaw, 10);
      if (Number.isNaN(reachVal)) reachVal = 0;
    }
    return {
      timestamp: post.timestamp,
      reach: reachVal,
    };
  });

  const totalReach = postsWithReach.reduce((sum, p) => sum + p.reach, 0);
  const baselineReach = totalReach / postsWithReach.length;

  const buckets = new Map<string, { totalReach: number; count: number }>();

  for (const post of postsWithReach) {
    const d = new Date(post.timestamp);
    if (Number.isNaN(d.getTime())) continue;

    const day = WEEKDAY_LABELS[d.getUTCDay()]!;
    const hour = d.getUTCHours();
    const bucket = HEATMAP_HOURS.reduce((prev, curr) =>
      Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev
    );
    const key = `${day}|${bucket}`;

    const existing = buckets.get(key) ?? { totalReach: 0, count: 0 };
    existing.totalReach += post.reach;
    existing.count += 1;
    buckets.set(key, existing);
  }

  // Calculate lifts
  const cellLifts = Array.from(buckets.entries()).map(([key, data]) => {
    const [day, hourStr] = key.split("|");
    const hourNum = Number(hourStr);
    const avgReach = data.totalReach / data.count;
    
    // Percentage lift vs overall average reach
    const lift = baselineReach > 0 
      ? parseFloat((((avgReach - baselineReach) / baselineReach) * 100).toFixed(2))
      : 0;

    return {
      day: day!,
      hour: `${hourNum}:00`,
      lift,
      count: data.count,
    };
  });

  if (cellLifts.length === 0) return [];

  const lifts = cellLifts.map(c => c.lift);
  const maxLift = Math.max(...lifts);
  const minLift = Math.min(...lifts);
  const liftRange = maxLift - minLift;

  return cellLifts.map(cell => {
    // Normalize score between 20 (lowest lift) and 100 (highest lift)
    const score = liftRange > 0
      ? Math.round(20 + ((cell.lift - minLift) / liftRange) * 80)
      : 75;

    return {
      day: cell.day,
      hour: cell.hour,
      score,
      lift: cell.lift,
      count: cell.count,
    };
  });
}

/** One timeline point per calendar day that has at least one reel in range. */
export function buildEngagementTimeline(
  posts: TimestampedReel[],
  days: number
): TimelinePoint[] {
  const safeDays = Math.min(90, Math.max(7, days));
  const cutoff = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
  const inRange = posts.filter((p) => new Date(p.timestamp) >= cutoff);

  const timeline: TimelinePoint[] = [];

  for (let i = safeDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const dayPosts = inRange.filter((p) => {
      const pDate = new Date(p.timestamp);
      pDate.setHours(0, 0, 0, 0);
      return pDate.getTime() === date.getTime();
    });

    if (dayPosts.length === 0) continue;

    const erValues = dayPosts
      .map((p) => parseEngagementRate(p.engagementRate))
      .filter((v): v is number => v !== null);
    const skipValues = dayPosts
      .map((p) => parseSkipRate(p.skipRate))
      .filter((v): v is number => v !== null);

    const engagementRate =
      erValues.length > 0
        ? parseFloat((erValues.reduce((a, b) => a + b, 0) / erValues.length).toFixed(2))
        : 0;

    const hookRetention =
      skipValues.length > 0
        ? parseFloat(
            (
              skipValues.reduce((sum, skip) => sum + (100 - skip), 0) /
              skipValues.length
            ).toFixed(1)
          )
        : null;

    timeline.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      engagementRate,
      hookRetention: hookRetention ?? 0,
      watchThrough: null as number | null,
    });
  }

  return timeline;
}
