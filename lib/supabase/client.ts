'use client';

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Creates a browser-side Supabase client.
 * Safe for use inside Next.js client components.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
