import { Queue } from "bullmq";

import { createRedisConnection } from "@/lib/redis";

export const cleanupExpiredBookingsQueue = new Queue("cleanup-expired-bookings", {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const completeExpiredBookingsQueue = new Queue("complete-expired-bookings", {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const savedSearchMatcherQueue = new Queue("saved-search-matcher", {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const updateAreaCountsQueue = new Queue("update-area-counts", {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const processExpiredRefundsQueue = new Queue("process-expired-refunds", {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});
