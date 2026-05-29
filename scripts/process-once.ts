import { processQueueBatch } from "../lib/queue/processor";

async function main() {
  try {
    console.log("Starting single-pass queue processing...");
    const result = await processQueueBatch(20000, "manual-test-runner");
    console.log("=== PROCESSING RESULT ===");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Queue execution error:", err);
    process.exit(1);
  }
}

main();
