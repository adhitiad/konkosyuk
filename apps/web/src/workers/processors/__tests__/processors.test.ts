import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job } from "bullmq";

vi.mock("winston", () => {
  const fn = vi.fn();
  const mockFormat = ((cb: (info: unknown) => unknown) => cb) as unknown as Record<string, unknown>;
  mockFormat.combine = () => mockFormat;
  mockFormat.timestamp = () => mockFormat;
  mockFormat.printf = () => mockFormat;
  mockFormat.colorize = () => mockFormat;
  mockFormat.json = () => mockFormat;

  return {
    createLogger: vi.fn(() => ({
      info: fn,
      error: fn,
      warn: fn,
      debug: fn,
    })),
    format: mockFormat,
    transports: {
      Console: vi.fn(),
    },
    info: fn,
    error: fn,
    warn: fn,
  };
});

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("@/lib/cron/cleanup-bookings", () => ({
  cleanupExpiredBookings: vi.fn().mockResolvedValue({
    cancelledCount: 2,
    unitReleasedCount: 2,
    cancelledBookings: [
      { id: "b1", unitId: "u1", propertyId: "p1", userId: "user1", createdAt: "2024-01-01T00:00:00Z" },
      { id: "b2", unitId: "u2", propertyId: "p2", userId: "user2", createdAt: "2024-01-01T00:00:00Z" },
    ],
  }),
}));

vi.mock("@/lib/cron/complete-bookings", () => ({
  completeExpiredBookings: vi.fn().mockResolvedValue({
    completedCount: 1,
    inspectionCreatedCount: 1,
    unitReleasedCount: 1,
    completedBookings: [
      { id: "b3", unitId: "u3", propertyId: "p3", userId: "user3", endDate: "2024-01-02T00:00:00Z" },
    ],
  }),
}));

vi.mock("@/lib/cron/saved-search-matcher", () => ({
  matchAndNotifySavedSearches: vi.fn().mockResolvedValue({
    matched: 5,
    notified: 3,
    errors: 0,
  }),
}));

vi.mock("@/lib/cron/update-area-counts", () => ({
  updateAreaCounts: vi.fn().mockResolvedValue({
    updatedPopular: 10,
    updatedCampus: 5,
  }),
}));

const createMockJob = (name: string): Job => {
  const job = {
    id: `test-${name}-${Date.now()}`,
    name,
    data: {},
    progress: vi.fn(),
  };
  return job as Job;
};

describe("Job Processors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cleanup processor", () => {
    it("should return result from cleanupExpiredBookings", async () => {
      const mod = await import(
        "@/workers/processors/cleanup.processor"
      );
      const processor = mod.processCleanupExpiredBookings;
      const job = createMockJob("cleanup-expired-bookings");
      const result = await processor(job);

      expect(result.cancelledCount).toBe(2);
      expect(result.cancelledBookings).toHaveLength(2);
    });

    it("should call Sentry when business logic throws", async () => {
      const { captureException } = await import("@sentry/nextjs");
      const { cleanupExpiredBookings } = await import(
        "@/lib/cron/cleanup-bookings"
      );
      vi.mocked(cleanupExpiredBookings).mockRejectedValueOnce(
        new Error("DB connection failed")
      );

      const mod = await import(
        "@/workers/processors/cleanup.processor"
      );
      const processor = mod.processCleanupExpiredBookings;
      const job = createMockJob("cleanup-expired-bookings");

      await expect(processor(job)).rejects.toThrow("DB connection failed");

      const calls = vi.mocked(captureException).mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0]).toBeInstanceOf(Error);
      expect(calls[0][0]).toHaveProperty("message", "DB connection failed");
      expect(calls[0][1]).toMatchObject({
        tags: { queue: "cleanup-expired-bookings" },
      });
    });
  });

  describe("complete processor", () => {
    it("should return result from completeExpiredBookings", async () => {
      const mod = await import(
        "@/workers/processors/complete.processor"
      );
      const processor = mod.processCompleteExpiredBookings;
      const job = createMockJob("complete-expired-bookings");
      const result = await processor(job);

      expect(result.completedCount).toBe(1);
      expect(result.inspectionCreatedCount).toBe(1);
    });
  });

  describe("saved search processor", () => {
    it("should return result from matchAndNotifySavedSearches", async () => {
      const mod = await import(
        "@/workers/processors/saved-search.processor"
      );
      const processor = mod.processSavedSearchMatcher;
      const job = createMockJob("saved-search-matcher");
      const result = await processor(job);

      expect(result.matched).toBe(5);
      expect(result.notified).toBe(3);
    });
  });

  describe("update area counts processor", () => {
    it("should complete without throwing for updateAreaCounts", async () => {
      const mod = await import(
        "@/workers/processors/update-area-counts.processor"
      );
      const processor = mod.processUpdateAreaCounts;
      const job = createMockJob("update-area-counts");

      await expect(processor(job)).resolves.toBeUndefined();
    });
  });
});
