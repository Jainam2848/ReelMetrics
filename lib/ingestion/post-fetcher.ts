/**
 * Instagram Graph API Post Fetcher (spec §6.3).
 *
 * Fetches user media and per-post insights from the Instagram Graph API v22.0+.
 * Implements exponential backoff on HTTP 429 (1min → 2min → 4min → 8min → 15min max).
 *
 * @security Access tokens are passed as parameters and NEVER logged.
 */

// ── Raw API Response Types ─────────────────────────────────────────────────

/** Shape of a single media object from `/{user-id}/media`. */
export interface RawInstagramPost {
  id: string;
  caption?: string;
  media_url?: string;
  permalink?: string;
  timestamp: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REEL";
}

/** Normalized insights extracted from the per-metric `data[]` array. */
export interface RawInstagramInsights {
  views?: number;
  total_views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saved?: number;
  reach?: number;
  total_interactions?: number;
  public_reposts?: number;
  reels_skip_rate?: number;
}

/** Combined post data with its insights for downstream normalization. */
export interface RawInstagramPostWithInsights {
  post: RawInstagramPost;
  insights: RawInstagramInsights;
}

/** Shape of the Instagram insights response per metric entry. */
interface InsightMetricEntry {
  name: string;
  period: string;
  values: Array<{ value: number }>;
}

/** Paginated media list response from the Graph API. */
interface MediaListResponse {
  data: RawInstagramPost[];
  paging?: {
    cursors?: { before?: string; after?: string };
    next?: string;
  };
}

/** Insights response wrapping an array of metric entries. */
interface InsightsResponse {
  data: InsightMetricEntry[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const GRAPH_API_BASE = "https://graph.instagram.com/v22.0";

/** Instagram allows 200 API calls per user per hour. */
const DEFAULT_FETCH_LIMIT = 25;

/**
 * Exponential backoff schedule for HTTP 429 retries (milliseconds).
 * Spec: 1min → 2min → 4min → 8min → 15min (max).
 */
const BACKOFF_SCHEDULE_MS = [
  60_000,   // 1 min
  120_000,  // 2 min
  240_000,  // 4 min
  480_000,  // 8 min
  900_000,  // 15 min
] as const;

const MAX_RETRIES = BACKOFF_SCHEDULE_MS.length;

/**
 * Media fields requested from the Graph API.
 * Kept minimal to reduce API response size and rate-limit consumption.
 */
const MEDIA_FIELDS = [
  "id",
  "caption",
  "media_url",
  "permalink",
  "timestamp",
  "media_type",
].join(",");

/**
 * Insight metrics requested per post.
 * Uses `views` (not deprecated `plays`) and includes new v22.0+ metrics.
 */
const INSIGHT_METRICS = [
  "views",
  "likes",
  "comments",
  "shares",
  "saved",
  "reach",
  "total_interactions",
].join(",");

/**
 * Additional Reels-specific metrics. Requested separately because they
 * may return errors on non-Reel media types.
 */
const REEL_INSIGHT_METRICS = [
  "views",
  "likes",
  "comments",
  "shares",
  "saved",
  "reach",
  "total_interactions",
  "ig_reels_avg_watch_time",
  "ig_reels_video_view_total_time",
].join(",");

// ── Rate-Limit Aware Fetch ─────────────────────────────────────────────────

/**
 * Executes a fetch with exponential backoff on HTTP 429 responses.
 * Reads the `x-app-usage` header to proactively detect approaching limits.
 */
async function fetchWithBackoff(
  url: string,
  retryCount = 0
): Promise<Response> {
  const response = await fetch(url);

  if (response.status === 429) {
    if (retryCount >= MAX_RETRIES) {
      throw new InstagramRateLimitError(
        `Instagram rate limit exceeded after ${MAX_RETRIES} retries`
      );
    }

    const backoffMs = BACKOFF_SCHEDULE_MS[retryCount]!;
    console.warn(
      `[post-fetcher] Rate limited (429). Backing off ${backoffMs / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`
    );

    await sleep(backoffMs);
    return fetchWithBackoff(url, retryCount + 1);
  }

  // Proactive rate-limit awareness: log warnings if usage is high
  const appUsage = response.headers.get("x-app-usage");
  if (appUsage) {
    try {
      const usage = JSON.parse(appUsage) as {
        call_count?: number;
        total_cputime?: number;
        total_time?: number;
      };
      if (
        (usage.call_count && usage.call_count > 80) ||
        (usage.total_time && usage.total_time > 80)
      ) {
        console.warn(
          `[post-fetcher] Approaching Instagram rate limit: ${JSON.stringify(usage)}`
        );
      }
    } catch {
      // Non-critical: ignore malformed usage headers
    }
  }

  return response;
}

// ── Custom Error Classes ───────────────────────────────────────────────────

export class InstagramApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly igErrorCode?: number,
    public readonly igErrorSubcode?: number
  ) {
    super(message);
    this.name = "InstagramApiError";
  }
}

export class InstagramRateLimitError extends InstagramApiError {
  constructor(message: string) {
    super(message, 429);
    this.name = "InstagramRateLimitError";
  }
}

export class InstagramTokenInvalidError extends InstagramApiError {
  constructor(message: string) {
    super(message, 401);
    this.name = "InstagramTokenInvalidError";
  }
}

// ── Core Fetcher ───────────────────────────────────────────────────────────

/**
 * Fetches Instagram posts and their insights for a given user.
 *
 * 1. Retrieves paginated media list from `/{platformUserId}/media`
 * 2. For each post, fetches lifetime insights
 * 3. Returns combined post + insights data for normalization
 *
 * @param accessToken  Decrypted access token — NEVER log this value.
 * @param platformUserId  Instagram user ID (ig_user_id).
 * @param limit  Maximum number of posts to fetch (default 25).
 * @returns Array of raw posts with their insights.
 * @throws {InstagramApiError} On non-recoverable API errors.
 * @throws {InstagramRateLimitError} After exhausting backoff retries.
 * @throws {InstagramTokenInvalidError} On 401/expired token.
 */
export async function fetchInstagramPosts(
  accessToken: string,
  platformUserId: string,
  limit: number = DEFAULT_FETCH_LIMIT
): Promise<RawInstagramPostWithInsights[]> {
  // 1. Fetch media list
  const mediaUrl = `${GRAPH_API_BASE}/${platformUserId}/media?fields=${MEDIA_FIELDS}&limit=${limit}&access_token=${accessToken}`;
  const mediaResponse = await fetchWithBackoff(mediaUrl);

  if (!mediaResponse.ok) {
    await handleApiError(mediaResponse, "fetch media list");
  }

  const mediaData = (await mediaResponse.json()) as MediaListResponse;
  const posts = mediaData.data ?? [];

  if (posts.length === 0) {
    return [];
  }

  // 2. Fetch insights for each post
  const results: RawInstagramPostWithInsights[] = [];

  for (const post of posts) {
    const insights = await fetchPostInsights(accessToken, post.id, post.media_type);
    results.push({ post, insights });
  }

  return results;
}

/**
 * Fetches lifetime insights for a single Instagram media object.
 * Uses Reel-specific metrics for Reel/Video content, standard metrics otherwise.
 */
async function fetchPostInsights(
  accessToken: string,
  mediaId: string,
  mediaType: RawInstagramPost["media_type"]
): Promise<RawInstagramInsights> {
  // Select metrics based on media type
  const metrics = mediaType === "REEL" || mediaType === "VIDEO"
    ? REEL_INSIGHT_METRICS
    : INSIGHT_METRICS;

  const insightsUrl = `${GRAPH_API_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`;

  try {
    const response = await fetchWithBackoff(insightsUrl);

    if (!response.ok) {
      // Some media types don't support all metrics — return empty insights
      if (response.status === 400) {
        console.warn(
          `[post-fetcher] Insights unavailable for media ${mediaId} (type: ${mediaType})`
        );
        return {};
      }
      await handleApiError(response, `fetch insights for ${mediaId}`);
    }

    const data = (await response.json()) as InsightsResponse;
    return parseInsightsResponse(data);
  } catch (error) {
    // If insights fail for a single post, log and continue rather than
    // aborting the entire sync. Insights are supplementary data.
    if (error instanceof InstagramRateLimitError) {
      throw error; // Re-throw rate limit errors to stop the sync
    }
    console.warn(
      `[post-fetcher] Failed to fetch insights for media ${mediaId}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return {};
  }
}

/**
 * Parses the Instagram insights API response into a flat key-value map.
 *
 * The API returns: `{ data: [{ name: "views", values: [{ value: 123 }] }] }`
 * We flatten to: `{ views: 123 }`
 */
function parseInsightsResponse(response: InsightsResponse): RawInstagramInsights {
  const insights: Record<string, number> = {};

  for (const metric of response.data ?? []) {
    const value = metric.values?.[0]?.value;
    if (typeof value === "number") {
      insights[metric.name] = value;
    }
  }

  return {
    views: insights["views"],
    total_views: insights["total_views"],
    likes: insights["likes"],
    comments: insights["comments"],
    shares: insights["shares"],
    saved: insights["saved"],
    reach: insights["reach"],
    total_interactions: insights["total_interactions"],
    public_reposts: insights["public_reposts"],
    reels_skip_rate: insights["reels_skip_rate"],
  };
}

// ── Error Handling ─────────────────────────────────────────────────────────

/**
 * Handles non-OK API responses by throwing typed errors.
 * Maps Instagram error codes to specific error types for upstream handling.
 */
async function handleApiError(
  response: Response,
  context: string
): Promise<never> {
  let errorBody: {
    error?: { message?: string; code?: number; error_subcode?: number };
  } = {};

  try {
    errorBody = (await response.json()) as typeof errorBody;
  } catch {
    // Non-JSON response — use status text
  }

  const igError = errorBody.error;
  const message = igError?.message ?? response.statusText ?? "Unknown error";
  const code = igError?.code;
  const subcode = igError?.error_subcode;

  // Token expired or invalid (OAuthException code 190)
  if (response.status === 401 || code === 190) {
    throw new InstagramTokenInvalidError(
      `[post-fetcher] Token invalid during ${context}: ${message}`
    );
  }

  throw new InstagramApiError(
    `[post-fetcher] API error during ${context}: ${message}`,
    response.status,
    code,
    subcode
  );
}

// ── Utilities ──────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
