/**
 * M-4 fix: Unit test untuk job processors.
 * Mock database dan external dependencies, fokus pada logika processor.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Job } from "bullmq";

// Mock winston
vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

// Mock semua cron business logic
vi.mock("@/lib/cron/cleanup-bookings", () => ({
  cleanupExpiredBookings: vi.fn().mockResolvedValue({
    cancelledCount: 1,
    unitReleasedCount: 1,
    cancelledBookings: [{ id: "booking-1" }],
  }),
}));

vi.mock("@/lib/cron/complete-bookings", () => ({
  completeExpiredBookings: vi.fn().mockResolvedValue({
    completedCount: 1,
    inspectionCreatedCount: 0,
    unitReleasedCount: 1,
    completedBookings: [{ id: "booking-2" }],
  }),
}));

vi.mock("@/lib/cron/saved-search-matcher", () => ({
  matchAndNotifySavedSearches: vi.fn().mockResolvedValue({
    matched: 2,
    notified: 2,
    errors: 0,
  }),
}));

vi.mock("@/lib/cron/update-area-counts", () => ({
  updateAreaCounts: vi.fn().mockResolvedValue(undefined),
}));

// Mock BullMQ Job type
const createMockJob = (name: string): Job =>
  ({
    id: `test-${name}-${Date.now()}`,
    name,
    data: {},
    progress: vi.fn(),
    log: vi.fn(),
  }) as unknown as Job;

describe("Job Processors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cleanup processor", () => {
    it("should call cleanupExpiredBookings and return result", async () => {
      const { processCleanupExpiredBookings } =
        await import("@/workers/processors/cleanup.processor");
      const job = createMockJob("cleanup-expired-bookings");
      const result = await processCleanupExpiredBookings(job);
      expect(result.cancelledCount).toBe(1);
      expect(result.unitReleasedCount).toBe(1);
    });
  });

  describe("complete processor", () => {
    it("should call completeExpiredBookings and return result", async () => {
      const { processCompleteExpiredBookings } =
        await import("@/workers/processors/complete.processor");
      const job = createMockJob("complete-expired-bookings");
      const result = await processCompleteExpiredBookings(job);
      expect(result.completedCount).toBe(1);
      expect(result.inspectionCreatedCount).toBe(0);
      expect(result.unitReleasedCount).toBe(1);
    });
  });

  describe("saved search processor", () => {
    it("should call matchAndNotifySavedSearches and return result", async () => {
      const { processSavedSearchMatcher } =
        await import("@/workers/processors/saved-search.processor");
      const job = createMockJob("saved-search-matcher");
      const result = await processSavedSearchMatcher(job);
      expect(result.matched).toBe(2);
      expect(result.notified).toBe(2);
      expect(result.errors).toBe(0);
    });
  });

  describe("update area counts processor", () => {
    it("should call updateAreaCounts and return undefined", async () => {
      const { processUpdateAreaCounts } =
        await import("@/workers/processors/update-area-counts.processor");
      const job = createMockJob("update-area-counts");
      const result = await processUpdateAreaCounts(job);
      expect(result).toBeUndefined();
    });
  });
});
