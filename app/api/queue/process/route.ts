import { withCronSecret } from "@/lib/api/middleware";
import { apiSuccess } from "@/lib/api/response";
import { processQueueBatch } from "@/lib/queue/processor";

export const POST = withCronSecret(async () => {
  const batch = await processQueueBatch(14_000);
  return apiSuccess(batch);
});
