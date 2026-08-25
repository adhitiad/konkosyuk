/** Worker utama BullMQ yang mendaftarkan dan mengelola semua processor. */
import { Worker } from "bullmq";
import { QueueEvents } from "bullmq";

import {
  getSharedRedisConnection,
  closeSharedRedisConnection,
} from "@/lib/redis";
import { logInfo, logWarn } from "@/lib/logger";

import { processCleanupExpiredBookings } from "@/workers/processors/cleanup.processor";
import { processCompleteExpiredBookings } from "@/workers/processors/complete.processor";
import { processSavedSearchMatcher } from "@/workers/processors/saved-search.processor";
import { processUpdateAreaCounts } from "@/workers/processors/update-area-counts.processor";
import { processExpiredPaymentRefundsJob } from "@/workers/processors/process-expired-refunds.processor";
import { processReferralEligibilitySweep } from "@/workers/processors/referral-eligibility-sweep.processor";

const CLEANUP_QUEUE_NAME = "cleanup-expired-bookings";
const COMPLETE_QUEUE_NAME = "complete-expired-bookings";
const SAVED_SEARCH_QUEUE_NAME = "saved-search-matcher";
const UPDATE_AREA_COUNTS_QUEUE_NAME = "update-area-counts";
const PROCESS_EXPIRED_REFUNDS_QUEUE_NAME = "process-expired-refunds";
const REFERRAL_ELIGIBILITY_SWEEP_QUEUE_NAME = "referral-eligibility-sweep";

const STALLED_INTERVAL = 600000;
const MAX_STALLED_COUNT = 2;

const workers: Worker[] = [];
const queueEventsInstances: QueueEvents[] = [];

export function startWorkers() {
  const cleanupWorker = new Worker(
    CLEANUP_QUEUE_NAME,
    processCleanupExpiredBookings,
    {
      connection: getSharedRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
      maxStalledCount: MAX_STALLED_COUNT,
    },
  );

  const completeWorker = new Worker(
    COMPLETE_QUEUE_NAME,
    processCompleteExpiredBookings,
    {
      connection: getSharedRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
      maxStalledCount: MAX_STALLED_COUNT,
    },
  );

  const savedSearchWorker = new Worker(
    SAVED_SEARCH_QUEUE_NAME,
    processSavedSearchMatcher,
    {
      connection: getSharedRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
      maxStalledCount: MAX_STALLED_COUNT,
    },
  );

  const updateAreaCountsWorker = new Worker(
    UPDATE_AREA_COUNTS_QUEUE_NAME,
    processUpdateAreaCounts,
    {
      connection: getSharedRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
      maxStalledCount: MAX_STALLED_COUNT,
    },
  );

  const processExpiredRefundsWorker = new Worker(
    PROCESS_EXPIRED_REFUNDS_QUEUE_NAME,
    processExpiredPaymentRefundsJob,
    {
      connection: getSharedRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
      maxStalledCount: MAX_STALLED_COUNT,
    },
  );

  const referralEligibilitySweepWorker = new Worker(
    REFERRAL_ELIGIBILITY_SWEEP_QUEUE_NAME,
    processReferralEligibilitySweep,
    {
      connection: getSharedRedisConnection(),
      concurrency: 1,
      stalledInterval: STALLED_INTERVAL,
      maxStalledCount: MAX_STALLED_COUNT,
    },
  );

  workers.push(
    cleanupWorker,
    completeWorker,
    savedSearchWorker,
    updateAreaCountsWorker,
    processExpiredRefundsWorker,
    referralEligibilitySweepWorker,
  );

  const queueNames = [
    CLEANUP_QUEUE_NAME,
    COMPLETE_QUEUE_NAME,
    SAVED_SEARCH_QUEUE_NAME,
    UPDATE_AREA_COUNTS_QUEUE_NAME,
    PROCESS_EXPIRED_REFUNDS_QUEUE_NAME,
    REFERRAL_ELIGIBILITY_SWEEP_QUEUE_NAME,
  ];

  for (const queueName of queueNames) {
    const queueEvents = new QueueEvents(queueName, {
      connection: getSharedRedisConnection(),
    });

    queueEvents.on("failed", async ({ jobId, failedReason }) => {
      logWarn("Job failed", { queue: queueName, jobId, failedReason });
    });

    queueEvents.on("completed", async ({ jobId }) => {
      logInfo("Job completed", { queue: queueName, jobId });
    });

    queueEvents.on("stalled", async ({ jobId }) => {
      logWarn("Job stalled", { queue: queueName, jobId });
    });

    queueEventsInstances.push(queueEvents);
  }

  logInfo("Semua worker BullMQ telah dimulai", {
    workers: workers.length,
    queues: queueNames,
  });
}

export async function stopWorkers() {
  logInfo("Menghentikan worker BullMQ...");

  const closePromises = workers.map(async (worker) => {
    await worker.close(true);
  });

  await Promise.all(closePromises);

  const closeEventsPromises = queueEventsInstances.map(async (events) => {
    await events.close();
  });

  await Promise.all(closeEventsPromises);

  await closeSharedRedisConnection();

  logInfo("Semua worker BullMQ telah dihentikan");
}
