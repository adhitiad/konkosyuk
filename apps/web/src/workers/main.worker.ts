/** Worker utama BullMQ yang mendaftarkan dan mengelola semua processor. */
import { Worker } from "bullmq";

import { createRedisConnection } from "@/lib/redis";
import { logInfo } from "@/lib/logger";

import { processCleanupExpiredBookings } from "@/workers/processors/cleanup.processor";
import { processCompleteExpiredBookings } from "@/workers/processors/complete.processor";
import { processSavedSearchMatcher } from "@/workers/processors/saved-search.processor";
import { processUpdateAreaCounts } from "@/workers/processors/update-area-counts.processor";
import { processExpiredPaymentRefundsJob } from "@/workers/processors/process-expired-refunds.processor";

const CLEANUP_QUEUE_NAME = "cleanup-expired-bookings";
const COMPLETE_QUEUE_NAME = "complete-expired-bookings";
const SAVED_SEARCH_QUEUE_NAME = "saved-search-matcher";
const UPDATE_AREA_COUNTS_QUEUE_NAME = "update-area-counts";
const PROCESS_EXPIRED_REFUNDS_QUEUE_NAME = "process-expired-refunds";

const STALLED_INTERVAL = 600000;

const workers: Worker[] = [];

export function startWorkers() {
  const cleanupWorker = new Worker(
    CLEANUP_QUEUE_NAME,
    processCleanupExpiredBookings,
    {
      connection: createRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
    },
  );

  const completeWorker = new Worker(
    COMPLETE_QUEUE_NAME,
    processCompleteExpiredBookings,
    {
      connection: createRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
    },
  );

  const savedSearchWorker = new Worker(
    SAVED_SEARCH_QUEUE_NAME,
    processSavedSearchMatcher,
    {
      connection: createRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
    },
  );

  const updateAreaCountsWorker = new Worker(
    UPDATE_AREA_COUNTS_QUEUE_NAME,
    processUpdateAreaCounts,
    {
      connection: createRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
    },
  );

  const processExpiredRefundsWorker = new Worker(
    PROCESS_EXPIRED_REFUNDS_QUEUE_NAME,
    processExpiredPaymentRefundsJob,
    {
      connection: createRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
    },
  );

  workers.push(cleanupWorker, completeWorker, savedSearchWorker, updateAreaCountsWorker, processExpiredRefundsWorker);

  logInfo("Semua worker BullMQ telah dimulai", {
    workers: workers.length,
    queues: [
      CLEANUP_QUEUE_NAME,
      COMPLETE_QUEUE_NAME,
      SAVED_SEARCH_QUEUE_NAME,
      UPDATE_AREA_COUNTS_QUEUE_NAME,
      PROCESS_EXPIRED_REFUNDS_QUEUE_NAME,
    ],
  });
}

export async function stopWorkers() {
  logInfo("Menghentikan worker BullMQ...");

  const closePromises = workers.map(async (worker) => {
    await worker.close();
  });

  await Promise.all(closePromises);

  logInfo("Semua worker BullMQ telah dihentikan");
}
