import type { ErrorCode } from "@/lib/api/response";

interface SyncErrorPayload {
  code?: string;
  message?: string;
}

/**
 * Maps manual-sync API error codes to toast copy for accounts UI.
 */
export function syncErrorToast(
  error: SyncErrorPayload | undefined,
  fallback = "Failed to trigger sync."
): { variant: "error" | "info"; message: string } {
  const code = error?.code as ErrorCode | undefined;
  const message = error?.message;

  switch (code) {
    case "SYNC_COOLDOWN_ACTIVE":
      return {
        variant: "info",
        message:
          message ||
          "Sync cooldown active. You can sync again in about 5 minutes.",
      };
    case "SYNC_IN_PROGRESS":
      return {
        variant: "info",
        message:
          message ||
          "A sync is already running for this account. Wait for it to finish.",
      };
    case "IG_RATE_LIMITED":
      return {
        variant: "info",
        message:
          message ||
          "Instagram rate limit cooldown is active. Sync will resume automatically.",
      };
    case "IG_QUOTA_EXHAUSTED":
      return {
        variant: "info",
        message:
          message ||
          "Hourly Instagram API quota is nearly full. Try again next hour or wait for scheduled sync.",
      };
    case "IG_TOKEN_INVALID":
      return {
        variant: "error",
        message:
          message ||
          "Instagram connection lost. Reconnect your account under Accounts.",
      };
    case "RESOURCE_NOT_FOUND":
      return {
        variant: "error",
        message: message || "Account not found.",
      };
    default:
      return { variant: "error", message: message || fallback };
  }
}
