import { describe, it, expect, vi, beforeEach } from "vitest";

const queues: Record<string, { name: string; opts: Record<string, unknown> }> =
  {};

vi.mock("bullmq", () => {
  class MockQueue {
    name: string;
    opts: Record<string, unknown>;
    constructor(name: string, opts?: Record<string, unknown>) {
      this.name = name;
      this.opts = opts ?? {};
      queues[name] = { name, opts: opts ?? {} };
    }
  }
  return {
    Queue: MockQueue,
  };
});

vi.mock("@/lib/redis", () => ({
  createRedisConnection: vi.fn().mockReturnValue({}),
  getSharedRedisConnection: vi.fn().mockReturnValue({}),
}));

describe("queues.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should define 4 queues with correct names", async () => {
    await import("@/lib/queue/queues");

    expect(queues["cleanup-expired-bookings"]).toBeDefined();
    expect(queues["complete-expired-bookings"]).toBeDefined();
    expect(queues["saved-search-matcher"]).toBeDefined();
    expect(queues["update-area-counts"]).toBeDefined();
  });

  it("should set default job options with attempts and backoff", async () => {
    await import("@/lib/queue/queues");

    const queue = queues["cleanup-expired-bookings"];
    expect(queue.opts.defaultJobOptions).toMatchObject({
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 0 },
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
  });

  it("all queues should have the same default job options", async () => {
    await import("@/lib/queue/queues");

    const names = [
      "cleanup-expired-bookings",
      "complete-expired-bookings",
      "saved-search-matcher",
      "update-area-counts",
    ];

    const expectedOpts = {
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 0 },
      backoff: { type: "exponential", delay: 5000 },
    };

    for (const name of names) {
      expect(queues[name].opts.defaultJobOptions).toMatchObject(expectedOpts);
    }
  });
});
