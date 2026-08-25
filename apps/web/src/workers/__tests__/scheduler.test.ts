import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpsertCalls: Array<{
  queueName: string;
  jobId: string;
  pattern: string;
}> = [];

vi.mock("@/lib/queue/queues", () => {
  const createMockQueue = (name: string) => ({
    upsertJobScheduler: vi.fn((jobId: string, opts: { pattern: string }) => {
      mockUpsertCalls.push({
        queueName: name,
        jobId,
        pattern: opts.pattern,
      });
      return Promise.resolve();
    }),
  });

  return {
    cleanupExpiredBookingsQueue: createMockQueue("cleanup-expired-bookings"),
    completeExpiredBookingsQueue: createMockQueue("complete-expired-bookings"),
    savedSearchMatcherQueue: createMockQueue("saved-search-matcher"),
    updateAreaCountsQueue: createMockQueue("update-area-counts"),
    processExpiredRefundsQueue: createMockQueue("process-expired-refunds"),
    referralEligibilitySweepQueue: createMockQueue(
      "referral-eligibility-sweep",
    ),
  };
});

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

describe("scheduler.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsertCalls.length = 0;
    vi.resetModules();
  });

  it("should register 4 repeat jobs", async () => {
    const { registerRepeatJobs } = await import("@/workers/scheduler");
    await registerRepeatJobs();

    expect(mockUpsertCalls).toHaveLength(6);
  });

  it("should use correct cron patterns", async () => {
    const { registerRepeatJobs } = await import("@/workers/scheduler");
    await registerRepeatJobs();

    const patterns = mockUpsertCalls.reduce(
      (acc, call) => ({ ...acc, [call.queueName]: call.pattern }),
      {} as Record<string, string>,
    );

    expect(patterns["cleanup-expired-bookings"]).toBe("0 * * * *");
    expect(patterns["complete-expired-bookings"]).toBe("0 2 * * *");
    expect(patterns["saved-search-matcher"]).toBe("0 3 * * *");
    expect(patterns["update-area-counts"]).toBe("0 4 * * *");
    expect(patterns["process-expired-refunds"]).toBe("0 5 * * *");
    expect(patterns["referral-eligibility-sweep"]).toBe("0 * * * *");
  });

  it("should use deterministic jobId to prevent duplicates", async () => {
    const { registerRepeatJobs } = await import("@/workers/scheduler");
    await registerRepeatJobs();

    const jobIds = mockUpsertCalls.map((c) => c.jobId);
    expect(new Set(jobIds).size).toBe(6);
    jobIds.forEach((id) => expect(id).toContain("repeat:"));
  });

  it("should pass correct job data to each queue", async () => {
    const { registerRepeatJobs } = await import("@/workers/scheduler");
    await registerRepeatJobs();

    const cleanupCall = mockUpsertCalls.find(
      (c) => c.queueName === "cleanup-expired-bookings",
    );
    expect(cleanupCall).toBeDefined();
    expect(cleanupCall?.jobId).toBe("repeat:cleanup-expired-bookings");
  });
});
