import { db } from "../lib/db";
import { jobQueue } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    console.log("Starting database queue cleanup...");
    
    // Delete all completed/failed jobs to clear the idempotency keys
    const deletedCount = await db
      .delete(jobQueue)
      .where(eq(jobQueue.status, "completed"))
      .returning();

    console.log(`Successfully deleted ${deletedCount.length} completed jobs from the queue.`);
    process.exit(0);
  } catch (err) {
    console.error("Error during queue cleanup:", err);
    process.exit(1);
  }
}

main();
