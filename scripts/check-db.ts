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

    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trend_signals'
      );
    `);
    console.log("Table exists check result:", result);
  } catch (err) {
    console.error("Error checking table:", err);
  }
  process.exit(0);
}

main();
