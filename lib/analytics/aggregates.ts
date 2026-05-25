/**
 * Shared analytics helpers — derive heatmaps and timelines from synced reels only.
 */

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const HEATMAP_HOURS = [8, 12, 18, 20] as const;

export interface HeatmapCell {
  day: string;
  hour: string;
  score: number;
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

/** Bucket reel publish times into day × hour cells (normalized 0–100 by max count). */
export function buildPostingHeatmap(posts: TimestampedReel[]): HeatmapCell[] {
  if (posts.length === 0) return [];

  const counts = new Map<string, number>();

  for (const post of posts) {
    const d = new Date(post.timestamp);
    if (Number.isNaN(d.getTime())) continue;

    const day = WEEKDAY_LABELS[d.getUTCDay()]!;
    const hour = d.getUTCHours();
    const bucket = HEATMAP_HOURS.reduce((prev, curr) =>
      Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev
    );
    const key = `${day}|${bucket}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const maxCount = Math.max(...counts.values(), 1);

  return Array.from(counts.entries()).map(([key, count]) => {
    const [day, hourStr] = key.split("|");
    const hourNum = Number(hourStr);
    return {
      day: day!,
      hour: `${hourNum}:00`,
      score: Math.round((count / maxCount) * 100),
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
