/** Worker utama BullMQ yang mendaftarkan dan mengelola semua processor. */
import { Worker } from "bullmq";
import { QueueEvents } from "bullmq";

import {
  getSharedRedisConnection,
  closeSharedRedisConnection,
} from "@/lib/redis";
import { logInfo, logWarn } from "@konkosyuk/shared/lib/logger";
import { bullmqJobsActive, bullmqJobsCompleted, bullmqJobsFailed, bullmqQueueLength } from "@/lib/metrics.js";

import { processCleanupExpiredBookings } from "@/workers/processors/cleanup.processor";
import { processCompleteExpiredBookings } from "@/workers/processors/complete.processor";
import { processSavedSearchMatcher } from "@/workers/processors/saved-search.processor";
import { processUpdateAreaCounts } from "@/workers/processors/update-area-counts.processor";
import { processExpiredPaymentRefundsJob } from "@/workers/processors/process-expired-refunds.processor";
import { processReferralEligibilitySweep } from "@/workers/processors/referral-eligibility-sweep.processor";
import { processChurnPrediction } from "@/workers/processors/churn-prediction.processor";

const CLEANUP_QUEUE_NAME = "cleanup-expired-bookings";
const COMPLETE_QUEUE_NAME = "complete-expired-bookings";
const SAVED_SEARCH_QUEUE_NAME = "saved-search-matcher";
const UPDATE_AREA_COUNTS_QUEUE_NAME = "update-area-counts";
const PROCESS_EXPIRED_REFUNDS_QUEUE_NAME = "process-expired-refunds";
const REFERRAL_ELIGIBILITY_SWEEP_QUEUE_NAME = "referral-eligibility-sweep";
const CHURN_PREDICTION_QUEUE_NAME = "churn-prediction";

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

  const churnPredictionWorker = new Worker(
    CHURN_PREDICTION_QUEUE_NAME,
    processChurnPrediction,
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
    churnPredictionWorker,
  );

  const queueNames = [
    CLEANUP_QUEUE_NAME,
    COMPLETE_QUEUE_NAME,
    SAVED_SEARCH_QUEUE_NAME,
    UPDATE_AREA_COUNTS_QUEUE_NAME,
    PROCESS_EXPIRED_REFUNDS_QUEUE_NAME,
    REFERRAL_ELIGIBILITY_SWEEP_QUEUE_NAME,
    CHURN_PREDICTION_QUEUE_NAME,
  ];

  for (const queueName of queueNames) {
    const queueEvents = new QueueEvents(queueName, {
      connection: getSharedRedisConnection(),
    });

    queueEvents.on("active", async ({ jobId: _jobId }) => {
      bullmqJobsActive.labels(queueName).inc();
      logInfo("Job active", { queue: queueName });
    });

    queueEvents.on("completed", async ({ jobId: _jobId }) => {
      bullmqJobsActive.labels(queueName).dec();
      bullmqJobsCompleted.labels(queueName).inc();
      logInfo("Job completed", { queue: queueName });
    });

    queueEvents.on("failed", async ({ jobId: _jobId, failedReason }) => {
      bullmqJobsActive.labels(queueName).dec();
      bullmqJobsFailed.labels(queueName).inc();
      logWarn("Job failed", { queue: queueName, failedReason });
    });

    queueEvents.on("stalled", async ({ jobId: _jobId }) => {
      bullmqJobsActive.labels(queueName).dec();
      logWarn("Job stalled", { queue: queueName });
    });

    queueEvents.on("waiting", async ({ jobId: _jobId }) => {
      bullmqQueueLength.labels(queueName).inc();
    });

    queueEvents.on("delayed", async ({ jobId: _jobId }) => {
      bullmqQueueLength.labels(queueName).inc();
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
