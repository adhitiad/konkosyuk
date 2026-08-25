import { Queue } from "bullmq";

import { getSharedRedisConnection } from "@/lib/redis";

export const cleanupExpiredBookingsQueue = new Queue("cleanup-expired-bookings", {
  connection: getSharedRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 0 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const completeExpiredBookingsQueue = new Queue("complete-expired-bookings", {
  connection: getSharedRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 0 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const savedSearchMatcherQueue = new Queue("saved-search-matcher", {
  connection: getSharedRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 0 },
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const updateAreaCountsQueue = new Queue("update-area-counts", {
  connection: getSharedRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 0 },
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const processExpiredRefundsQueue = new Queue("process-expired-refunds", {
  connection: getSharedRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 0 },
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
  },
});

export const referralEligibilitySweepQueue = new Queue("referral-eligibility-sweep", {
  connection: getSharedRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 0 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const deadLetterQueues = [
  cleanupExpiredBookingsQueue,
  completeExpiredBookingsQueue,
  savedSearchMatcherQueue,
  updateAreaCountsQueue,
  processExpiredRefundsQueue,
  referralEligibilitySweepQueue,
];
