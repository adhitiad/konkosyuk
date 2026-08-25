import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job } from "bullmq";

const mockWorkers: Array<{ close: () => Promise<void> }> = [];
const workerCalls: Array<{
  queueName: string;
  processor: (job: Job) => Promise<unknown>;
  opts: Record<string, unknown>;
}> = [];

vi.mock("bullmq", () => {
  class MockWorker {
    close = vi.fn().mockResolvedValue(undefined);
    constructor(
      queueName: string,
      processor: (job: Job) => Promise<unknown>,
      opts: Record<string, unknown>,
    ) {
      workerCalls.push({ queueName, processor, opts });
      mockWorkers.push(this);
    }
  }
  class MockQueueEvents {
    close = vi.fn().mockResolvedValue(undefined);
    constructor() {}
    on = vi.fn();
  }
  return {
    Worker: MockWorker,
    QueueEvents: MockQueueEvents,
  };
});

vi.mock("@/lib/redis", () => ({
  createRedisConnection: vi.fn().mockReturnValue({}),
  getSharedRedisConnection: vi.fn().mockReturnValue({}),
  closeSharedRedisConnection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/workers/processors/cleanup.processor", () => ({
  processCleanupExpiredBookings: vi.fn(),
}));

vi.mock("@/workers/processors/complete.processor", () => ({
  processCompleteExpiredBookings: vi.fn(),
}));

vi.mock("@/workers/processors/saved-search.processor", () => ({
  processSavedSearchMatcher: vi.fn(),
}));

vi.mock("@/workers/processors/update-area-counts.processor", () => ({
  processUpdateAreaCounts: vi.fn(),
}));

vi.mock("@/workers/processors/process-expired-refunds.processor", () => ({
  processExpiredPaymentRefundsJob: vi.fn(),
}));

vi.mock("@/workers/processors/referral-eligibility-sweep.processor", () => ({
  processReferralEligibilitySweep: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

describe("main.worker.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkers.length = 0;
    workerCalls.length = 0;
  });

  it("startWorkers should create 5 workers", async () => {
    const { startWorkers } = await import("@/workers/main.worker");
    startWorkers();

    expect(mockWorkers).toHaveLength(6);
  });

  it("startWorkers should pass correct queue names", async () => {
    const { startWorkers } = await import("@/workers/main.worker");
    startWorkers();

    const queueNames = workerCalls.map((call) => call.queueName);

    expect(queueNames).toContain("cleanup-expired-bookings");
    expect(queueNames).toContain("complete-expired-bookings");
    expect(queueNames).toContain("saved-search-matcher");
    expect(queueNames).toContain("update-area-counts");
    expect(queueNames).toContain("process-expired-refunds");
    expect(queueNames).toContain("referral-eligibility-sweep");
  });

  it("startWorkers should set concurrency to 1", async () => {
    const { startWorkers } = await import("@/workers/main.worker");
    startWorkers();

    const concurrencyValues = workerCalls.map((call) => call.opts?.concurrency);

    expect(concurrencyValues.every((c) => c === 1)).toBe(true);
  });

  it("stopWorkers should close all workers", async () => {
    const { startWorkers, stopWorkers } = await import("@/workers/main.worker");
    startWorkers();

    await stopWorkers();

    for (const worker of mockWorkers) {
      expect(worker.close).toHaveBeenCalledTimes(1);
    }
  });

  it("startWorkers should pass stalledInterval to each worker", async () => {
    const { startWorkers } = await import("@/workers/main.worker");
    startWorkers();

    const stalledValues = workerCalls.map((call) => call.opts?.stalledInterval);

    expect(stalledValues.every((s) => s === 600000)).toBe(true);
  });
});
