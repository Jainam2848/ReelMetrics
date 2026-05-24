/**
 * Trendoraa — Background Queue Worker System (spec §9.3).
 *
 * CLI daemon that continuously processes jobs via the shared processor.
 *
 * Running this worker:
 * npx tsx lib/queue/worker.ts
 */

import { claimNextJob, processQueueBatch, sleep } from "./processor";

const WORKER_ID = `worker-local-${Math.random().toString(36).substring(7)}`;

console.log(`Starting Queue Worker: [${WORKER_ID}]`);

async function workerLoop() {
  while (true) {
    try {
      const result = await processQueueBatch(25_000, WORKER_ID);
      if (result.processed === 0) {
        await sleep(2000);
      }
    } catch (error) {
      console.error("Worker cycle error:", error);
      await sleep(5000);
    }
  }
}

workerLoop();
