import { db } from "../lib/db";
import { instagramAccounts, reels, reelScores, jobQueue } from "../lib/db/schema";
import { count } from "drizzle-orm";

async function main() {
  try {
    const [accountsCount] = await db.select({ value: count() }).from(instagramAccounts);
    const [reelsCount] = await db.select({ value: count() }).from(reels);
    const [scoresCount] = await db.select({ value: count() }).from(reelScores);
    const [jobsCount] = await db.select({ value: count() }).from(jobQueue);

    console.log("=== DATABASE STATE ===");
    console.log("Instagram Accounts count:", accountsCount?.value);
    console.log("Reels count:", reelsCount?.value);
    console.log("Reel Scores count:", scoresCount?.value);
    console.log("Job Queue count:", jobsCount?.value);

    const pendingJobs = await db.select().from(jobQueue).limit(5);
    console.log("\n=== FIRST 5 JOBS ===");
    console.log(JSON.stringify(pendingJobs, null, 2));

    const allAccounts = await db.select().from(instagramAccounts).limit(5);
    console.log("\n=== FIRST 5 ACCOUNTS ===");
    console.log(JSON.stringify(allAccounts, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Error checking DB state:", err);
    process.exit(1);
  }
}

main();
