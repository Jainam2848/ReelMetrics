import { db } from "../lib/db";
import { reels, instagramAccounts, reelScores } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { enqueueJob, JOB_TYPES } from "../lib/queue";
import { processQueueBatch } from "../lib/queue/processor";

async function main() {
  try {
    console.log("Starting sandbox automatic re-scoring...");

    // 1. Fetch all reels
    const allReels = await db.select().from(reels);
    console.log(`Found ${allReels.length} total reels in database.`);

    let enqueuedCount = 0;

    for (const reel of allReels) {
      // Check if this reel already has a score
      const [existingScore] = await db
        .select()
        .from(reelScores)
        .where(eq(reelScores.reelId, reel.id))
        .limit(1);

      if (existingScore) {
        console.log(`Reel ${reel.id} (@media_${reel.igMediaId}) already scored: ${existingScore.overallScore}`);
        continue;
      }

      // Find user associated with this account
      const [account] = await db
        .select()
        .from(instagramAccounts)
        .where(eq(instagramAccounts.id, reel.accountId))
        .limit(1);

      if (!account) {
        console.warn(`No account found for reel ${reel.id}`);
        continue;
      }

      console.log(`Enqueuing SCORE_REEL job for reel ${reel.id} (user: ${account.userId})`);
      await enqueueJob(
        JOB_TYPES.SCORE_REEL,
        {
          accountId: reel.accountId,
          igMediaId: reel.igMediaId,
          userId: account.userId,
        },
        {
          idempotencyKey: `score:${reel.id}`,
          priority: 10,
        }
      );
      enqueuedCount++;
    }

    if (enqueuedCount > 0) {
      console.log(`Enqueued ${enqueuedCount} new scoring jobs. Starting queue processing batch...`);
      const result = await processQueueBatch(45000, "sandbox-healer");
      console.log("=== QUEUE BATCH COMPLETE ===");
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("No unscored reels found. Everything is fully evaluated.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error during re-scoring:", err);
    process.exit(1);
  }
}

main();
