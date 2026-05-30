import * as fs from "fs";
import * as path from "path";

// Manually load environment variables from .env file before imports
function loadEnv(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const match = line.trim().match(/^([^#\s=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let val = match[2]?.trim() ?? "";
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (key) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

async function main() {
  try {
    const { db } = await import("@/lib/db");
    const { sql } = await import("drizzle-orm");

    console.log("Running migration statement-1: CREATE TABLE trend_signals...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "trend_signals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "niche" text NOT NULL,
        "platform" text DEFAULT 'instagram' NOT NULL,
        "signal_type" text NOT NULL,
        "day_key" text NOT NULL,
        "signal_data" jsonb NOT NULL,
        "source" text DEFAULT 'llm' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "trend_signals_day_key_unique" UNIQUE("day_key")
      );
    `);
    console.log("Migration statement-1 complete.");

    console.log("Running migration statement-2: CREATE INDEX idx_trend_signals_niche_type_created...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_trend_signals_niche_type_created" 
      ON "trend_signals" USING btree ("niche","signal_type","created_at" DESC);
    `);
    console.log("Migration statement-2 complete. Database migrated successfully!");
  } catch (err) {
    console.error("Migration execution failed:", err);
  }
  process.exit(0);
}

main();
