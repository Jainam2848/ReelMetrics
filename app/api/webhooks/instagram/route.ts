/**
 * Instagram Webhook Handler — GET + POST /api/webhooks/instagram
 *
 * GET:  Hub verification for Meta webhook subscription.
 * POST: Webhook event ingestion with HMAC-SHA256 signature verification.
 *
 * Security:
 * - HMAC-SHA256 signature verified with crypto.timingSafeEqual (constant-time)
 *   to prevent timing side-channel attacks.
 * - Fast-ack pattern: returns HTTP 200 within 3 seconds by enqueuing
 *   individual jobs rather than processing inline.
 * - Deterministic idempotency keys prevent duplicate event processing.
 *
 * @security Webhook payloads may contain user data — never log raw bodies.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { enqueueJob, JOB_TYPES } from "@/lib/queue";
import { AuthService } from "@/lib/services/auth.service";

// ── Constants ──────────────────────────────────────────────────────────────

/** Maximum webhook payload size: 1 MiB bounds protection. */
const MAX_WEBHOOK_BODY_BYTES = 1 * 1024 * 1024;

// ── GET: Hub Verification ──────────────────────────────────────────────────

/**
 * GET /api/webhooks/instagram
 *
 * Meta sends a verification challenge when a webhook subscription is
 * configured or renewed. We validate the mode and verify_token, then
 * echo back the challenge as plain text.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe") {
    return new NextResponse("Invalid hub.mode", { status: 400 });
  }

  if (!token || !challenge) {
    return new NextResponse("Missing hub.verify_token or hub.challenge", {
      status: 400,
    });
  }

  // Constant-time comparison of the verify token to prevent timing attacks.
  // Both buffers must be the same length for timingSafeEqual.
  const expectedToken = Buffer.from(env.INSTAGRAM_VERIFY_TOKEN, "utf8");
  const receivedToken = Buffer.from(token, "utf8");

  if (expectedToken.length !== receivedToken.length) {
    console.warn("[ig-webhook] Hub verification failed: token length mismatch");
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!timingSafeEqual(expectedToken, receivedToken)) {
    console.warn(
      "[ig-webhook] Hub verification failed: token value mismatch"
    );
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Echo the challenge as plain text (required by Meta)
  return new NextResponse(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// ── POST: Webhook Event Ingestion ──────────────────────────────────────────

/**
 * POST /api/webhooks/instagram
 *
 * Receives Instagram webhook events from Meta. Flow:
 * 1. Read raw body and enforce size limit
 * 2. Verify HMAC-SHA256 signature (constant-time comparison)
 * 3. Parse payload and iterate entry[] array
 * 4. Derive deterministic idempotency key per event
 * 5. Enqueue individual PROCESS_WEBHOOK jobs
 * 6. Return HTTP 200 within 3 seconds (fast-ack)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 1. Enforce payload size limit
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10);
    if (contentLength > MAX_WEBHOOK_BODY_BYTES) {
      return NextResponse.json({ error: "Payload Too Large" }, { status: 413 });
    }
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Failed to read request body" },
      { status: 400 }
    );
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: "Payload Too Large" }, { status: 413 });
  }

  // 2. Verify HMAC-SHA256 signature
  const signatureHeader = request.headers.get("x-hub-signature-256");
  if (!signatureHeader) {
    await logWebhookFailure(
      "Missing X-Hub-Signature-256 header",
      ipAddress
    );
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 401 }
    );
  }

  if (!verifySignature(rawBody, signatureHeader)) {
    await logWebhookFailure(
      "HMAC-SHA256 signature verification failed",
      ipAddress
    );
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // 3. Parse payload
  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // Validate object type
  if (payload.object !== "instagram") {
    return NextResponse.json({ received: true, skipped: true }, { status: 200 });
  }

  // 4-5. Batch-split and enqueue individual jobs
  let enqueued = 0;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      // Derive deterministic idempotency key from entry + field + time
      const idempotencyKey = deriveIdempotencyKey(
        entry.id,
        change.field,
        entry.time
      );

      const job = await enqueueJob(
        JOB_TYPES.PROCESS_WEBHOOK,
        {
          entryId: entry.id,
          field: change.field,
          value: change.value,
          time: entry.time,
        },
        {
          idempotencyKey,
          priority: 5, // Medium-high priority for webhook-driven updates
          maxRetries: 3,
        }
      );

      if (job) {
        enqueued++;
      }
    }
  }

  // 6. Fast-ack: return 200 immediately
  return NextResponse.json(
    { received: true, enqueued },
    { status: 200 }
  );
}

// ── Signature Verification ─────────────────────────────────────────────────

/**
 * Verifies the HMAC-SHA256 signature of a webhook payload.
 *
 * Uses crypto.timingSafeEqual for constant-time comparison to prevent
 * timing side-channel attacks that could leak the App Secret.
 *
 * The signature header format is: `sha256=<hex_digest>`
 */
function verifySignature(rawBody: string, signatureHeader: string): boolean {
  const expectedPrefix = "sha256=";

  if (!signatureHeader.startsWith(expectedPrefix)) {
    return false;
  }

  const receivedHex = signatureHeader.slice(expectedPrefix.length);

  // Compute HMAC-SHA256 of the raw body using the App Secret
  const computedHmac = createHmac("sha256", env.INSTAGRAM_APP_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  // Constant-time comparison: both strings must be the same length.
  // HMAC hex digests are always 64 characters for SHA-256, but we guard anyway.
  const receivedBuffer = Buffer.from(receivedHex, "hex");
  const computedBuffer = Buffer.from(computedHmac, "hex");

  if (receivedBuffer.length !== computedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, computedBuffer);
}

// ── Idempotency Key Derivation ─────────────────────────────────────────────

/**
 * Derives a deterministic idempotency key for a webhook event.
 *
 * Uses SHA-256 hash of entry_id + field + timestamp to produce a unique,
 * stable key that prevents duplicate processing of the same event.
 */
function deriveIdempotencyKey(
  entryId: string,
  field: string,
  time: number | undefined
): string {
  const input = `${entryId}:${field}:${time ?? ""}`;
  const hash = createHmac("sha256", "webhook-idempotency")
    .update(input)
    .digest("hex")
    .slice(0, 32); // Truncate to 32 chars for readability

  return `wh:ig:${hash}`;
}

// ── Audit Logging ──────────────────────────────────────────────────────────

async function logWebhookFailure(
  reason: string,
  ipAddress: string
): Promise<void> {
  await AuthService.logAudit({
    userId: null,
    action: "social.webhook_verification_failed",
    resourceType: "webhook",
    metadata: { platform: "instagram", reason },
    ipAddress,
  });
}

// ── Types ──────────────────────────────────────────────────────────────────

interface WebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    time?: number;
    changes?: Array<{
      field: string;
      value: unknown;
    }>;
  }>;
}
