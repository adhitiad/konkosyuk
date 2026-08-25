import { describe, it, expect, vi, beforeEach } from "vitest";

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

function createAsyncArray(rows: unknown[]) {
  const builder: Record<string, unknown> = {};
  builder._rows = rows;
  builder.from = vi.fn().mockReturnValue(builder);
  builder.where = vi.fn().mockReturnValue(builder);
  builder.orderBy = vi.fn().mockResolvedValue(rows);
  builder.limit = vi.fn().mockResolvedValue(rows);
  builder.then = async (resolve: (value: unknown) => unknown) => resolve(rows);
  return builder;
}

describe("Idempotency Guards (F-2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("cleanup-bookings", () => {
    it("should only process bookings with pending_dp status", async () => {
      const mockBookings = [
        { id: "b1", status: "pending_dp", unitId: "u1", propertyId: "p1", userId: "user1", createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000) },
        { id: "b2", status: "cancelled", unitId: "u2", propertyId: "p2", userId: "user2", createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000) },
      ];

      vi.doMock("@/db", () => ({
        db: {
          select: vi.fn().mockReturnValue(
            createAsyncArray(mockBookings)
          ),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          transaction: vi.fn().mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
            const tx = {
              select: vi.fn().mockReturnValue(
                createAsyncArray(mockBookings)
              ),
              update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                  where: vi.fn().mockResolvedValue(undefined),
                }),
              }),
            };
            return callback(tx);
          }),
        },
      }));

      const { cleanupExpiredBookings } = await import(
        "@/lib/cron/cleanup-bookings"
      );
      const result = await cleanupExpiredBookings();

      expect(result.cancelledCount).toBeGreaterThan(0);
      expect(result.cancelledBookings.length).toBeGreaterThan(0);
    });

    it("should return zero results when no pending_dp bookings exist", async () => {
      vi.doMock("@/db", () => ({
        db: {
          select: vi.fn().mockReturnValue(
            createAsyncArray([])
          ),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          transaction: vi.fn().mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
            const tx = {
              select: vi.fn().mockReturnValue(
                createAsyncArray([])
              ),
              update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                  where: vi.fn().mockResolvedValue(undefined),
                }),
              }),
            };
            return callback(tx);
          }),
        },
      }));

      const { cleanupExpiredBookings } = await import(
        "@/lib/cron/cleanup-bookings"
      );
      const result = await cleanupExpiredBookings();

      expect(result.cancelledCount).toBe(0);
      expect(result.unitReleasedCount).toBe(0);
      expect(result.cancelledBookings).toHaveLength(0);
    });
  });

  describe("complete-bookings", () => {
    it("should create inspection when none exists", async () => {
      vi.doMock("@/db", () => ({
        db: {
          select: vi.fn().mockReturnValue(
            createAsyncArray([
              { id: "b1", status: "confirmed", unitId: "u1", propertyId: "p1", userId: "user1", endDate: new Date(Date.now() - 1000) },
            ])
          ),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          transaction: vi.fn().mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
            const tx = {
              select: vi.fn().mockImplementation(() => {
                return createAsyncArray([
                  { id: "b1", status: "confirmed", unitId: "u1", propertyId: "p1", userId: "user1", endDate: new Date(Date.now() - 1000) },
                ]);
              }),
              update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                  where: vi.fn().mockResolvedValue(undefined),
                }),
              }),
              insert: vi.fn().mockReturnValue({
                values: vi.fn().mockResolvedValue({ id: "insp1" }),
              }),
            };
            return callback(tx);
          }),
        },
      }));

      const { completeExpiredBookings } = await import(
        "@/lib/cron/complete-bookings"
      );
      const result = await completeExpiredBookings();

      expect(result.completedCount).toBe(1);
    });

    it("should not create duplicate inspection when one already exists", async () => {
      vi.doMock("@/db", () => ({
        db: {
          select: vi.fn().mockReturnValue(
            createAsyncArray([
              { id: "b1", status: "confirmed", unitId: "u1", propertyId: "p1", userId: "user1", endDate: new Date(Date.now() - 1000) },
            ])
          ),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          transaction: vi.fn().mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
            const tx = {
              select: vi.fn().mockImplementation((args?: unknown) => {
                const selectArgs = args as { bookingId?: unknown } | undefined;
                if (selectArgs?.bookingId) {
                  return createAsyncArray([{ bookingId: "b1" }]);
                }
                return createAsyncArray([{ id: "insp1" }]);
              }),
              update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                  where: vi.fn().mockResolvedValue(undefined),
                }),
              }),
              insert: vi.fn().mockReturnValue({
                values: vi.fn().mockResolvedValue({ id: "insp1" }),
              }),
            };
            return callback(tx);
          }),
        },
      }));

      const { completeExpiredBookings } = await import(
        "@/lib/cron/complete-bookings"
      );
      const result = await completeExpiredBookings();

      expect(result.completedCount).toBe(1);
      expect(result.inspectionCreatedCount).toBe(0);
    });
  });
});
