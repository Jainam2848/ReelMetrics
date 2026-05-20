import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// NEVER import this in client-side code.
// This client uses the SUPABASE_SERVICE_ROLE_KEY which bypasses Row Level Security (RLS).
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
