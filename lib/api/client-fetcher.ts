import type { ErrorCode } from "./response";

/**
 * Structured error from the standard API envelope — preserved for UI mapping.
 */
export class ApiClientError extends Error {
  readonly code: ErrorCode | "HTTP_ERROR";
  readonly status: number;
  readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode | "HTTP_ERROR",
    status: number,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: ErrorCode; message: string; details?: unknown };
}

/**
 * Default SWR fetcher — throws ApiClientError with code + HTTP status.
 */
export async function apiFetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  let json: ApiEnvelope<T> | null = null;

  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    if (!res.ok) {
      throw new ApiClientError(
        `Request failed (${res.status})`,
        "HTTP_ERROR",
        res.status
      );
    }
    throw new ApiClientError("Invalid JSON response", "HTTP_ERROR", res.status);
  }

  if (!res.ok || !json?.success) {
    const code = (json?.error?.code ?? "HTTP_ERROR") as ErrorCode | "HTTP_ERROR";
    const message =
      json?.error?.message ||
      (res.status === 401
        ? "Authentication required"
        : `Request failed (${res.status})`);
    throw new ApiClientError(message, code, res.status, json?.error?.details);
  }

  return json.data as T;
}

/** User-facing hint for common API error codes (SWR / LoadError). */
export function describeApiError(error: unknown): string {
  if (isApiClientError(error)) {
    switch (error.code) {
      case "UNAUTHORIZED":
      case "TOKEN_EXPIRED":
      case "IG_TOKEN_INVALID":
        return "Your session or Instagram connection expired. Sign in again or reconnect under Accounts.";
      case "RATE_LIMIT_EXCEEDED":
        return "Too many requests. Please wait a minute and try again.";
      case "USAGE_LIMIT_EXCEEDED":
      case "AI_BUDGET_EXCEEDED":
      case "PLAN_LIMIT_EXCEEDED":
        return error.message;
      case "SYNC_COOLDOWN_ACTIVE":
      case "SYNC_IN_PROGRESS":
      case "IG_RATE_LIMITED":
      case "IG_QUOTA_EXHAUSTED":
        return error.message;
      default:
        return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "The request failed. Check your connection or try again.";
}
