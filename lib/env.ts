/**
 * Startup-Level Environment Sentinel (spec §5.5).
 *
 * Importing this module from a build-time entry point (`next.config.ts`) and
 * a runtime entry point (`app/layout.tsx`) guarantees the application crashes
 * fast — before serving a single request — if any required secret is missing
 * or malformed.
 *
 * NOTE: Naming convention.
 * - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required
 *   by the Next.js bundler to ship them safely to the browser. The
 *   service-role key MUST NEVER be `NEXT_PUBLIC_*`.
 * - `DATABASE_URL` is the pooled connection string used by application
 *   queries. `SUPABASE_DB_URL` is the direct (non-pooled) URL used by
 *   migrations / RLS test scripts.
 */

import { z } from "zod";

const TOKEN_ENCRYPTION_KEYS_SCHEMA = z.string().refine(
  (raw) => {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return false;
      }
      const entries = Object.entries(parsed as Record<string, unknown>);
      if (entries.length === 0) return false;
      // Each value MUST be a 64-character hex string (32 bytes for AES-256-GCM).
      return entries.every(
        ([, v]) => typeof v === "string" && /^[0-9a-fA-F]{64}$/.test(v)
      );
    } catch {
      return false;
    }
  },
  {
    message:
      'TOKEN_ENCRYPTION_KEYS must be a JSON object mapping version strings to 64-char hex keys, e.g. \'{"v1":"<64-hex>","v2":"<64-hex>"}\'',
  }
);

const envSchema = z.object({
  // ─── Supabase ──────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // ─── Database (Drizzle / Migrations) ───────────────────────────────────
  // DATABASE_URL: pooled connection string (PgBouncer / Supavisor in prod).
  DATABASE_URL: z.string().url(),
  // SUPABASE_DB_URL / DIRECT_URL: direct, non-pooled URL. Optional in
  // production (falls back to DATABASE_URL) but recommended locally so
  // drizzle-kit migrations don't compete with app traffic.
  SUPABASE_DB_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),

  // ─── Instagram (Graph API + OAuth) ─────────────────────────────────────
  INSTAGRAM_CLIENT_ID: z.string().min(1),
  INSTAGRAM_CLIENT_SECRET: z.string().min(1),
  INSTAGRAM_REDIRECT_URI: z.string().url(),
  // Required for Meta webhook hub challenge verification. Without it ALL
  // Instagram webhook deliveries silently fail — boot must reject early.
  INSTAGRAM_VERIFY_TOKEN: z.string().min(16),
  // App secret used to HMAC-verify webhook payloads (spec §11.3).
  INSTAGRAM_APP_SECRET: z.string().min(1),

  // ─── OpenAI ────────────────────────────────────────────────────────────
  OPENAI_API_KEY: z.string().min(1).optional(),

  // ─── Gemini (Google AI Studio) ─────────────────────────────────────────
  GEMINI_API_KEY: z.string().min(1).optional(),

  // ─── DeepSeek ──────────────────────────────────────────────────────────
  DEEPSEEK_API_KEY: z.string().min(1).optional(),

  // ─── Stripe ────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_CREATOR: z.string().min(1),
  STRIPE_PRICE_PRO: z.string().min(1),
  STRIPE_PRICE_AGENCY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),

  // ─── Email (Resend) ────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().min(1),

  // ─── Cron / Worker Authorization ───────────────────────────────────────
  CRON_SECRET: z.string().min(16),

  // ─── Token Encryption (zero-downtime key rotation, spec §11.2) ─────────
  TOKEN_ENCRYPTION_KEYS: TOKEN_ENCRYPTION_KEYS_SCHEMA,
  ACTIVE_KEY_VERSION: z.string().min(1).default("v1"),

  // ─── App Metadata ──────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  APP_VERSION: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse `process.env` into a strongly-typed `env` object. On failure, throw a
 * single descriptive error listing every missing or invalid variable so an
 * operator can fix all of them in one pass instead of one-at-a-time.
 */
function parseEnv(): Env {
  if (typeof window !== "undefined") {
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    } as unknown as Env;
  }
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    // Cross-field validation: ACTIVE_KEY_VERSION MUST reference a key that
    // exists in TOKEN_ENCRYPTION_KEYS. Otherwise the encryption layer fails
    // at first use, after we've already accepted requests — which is too late.
    const keys = JSON.parse(result.data.TOKEN_ENCRYPTION_KEYS) as Record<
      string,
      string
    >;
    if (!keys[result.data.ACTIVE_KEY_VERSION]) {
      throw new Error(
        `[env] ACTIVE_KEY_VERSION="${result.data.ACTIVE_KEY_VERSION}" is not present in TOKEN_ENCRYPTION_KEYS. Configure the active key before boot.`
      );
    }
    if (!result.data.GEMINI_API_KEY && !result.data.DEEPSEEK_API_KEY) {
      throw new Error(
        `[env] Environment validation failed. At least one of GEMINI_API_KEY or DEEPSEEK_API_KEY must be configured to start the application.`
      );
    }
    return result.data;
  }

  const issues = result.error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "(root)";
      return `  • ${path}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(
    `\n[env] Environment validation failed. Fix the following before starting the app:\n${issues}\n\nSee .env.example for the full list of required variables.\n`
  );
}

export const env: Env = parseEnv();
