import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limiter";

const mockIncr = vi.fn();
const mockExpire = vi.fn();

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn().mockResolvedValue({
    incr: (key: string, ttlSeconds?: number) => mockIncr(key, ttlSeconds),
    expire: (key: string, ttl: number) => mockExpire(key, ttl),
  }),
  getRedisProvider: vi.fn().mockReturnValue("upstash"),
  getSharedRedisConnection: vi.fn().mockReturnValue({
    pipeline: vi.fn().mockReturnValue({
      incr: vi.fn(),
      expire: vi.fn(),
      exec: vi.fn().mockResolvedValue([[1, 1]]),
    }),
  }),
}));

describe("checkRateLimit", () => {
  beforeEach(() => {
    mockIncr.mockReset();
    mockExpire.mockReset();
  });

  it("allows first request within limit", async () => {
    mockIncr.mockReturnValue(1);

    await expect(
      checkRateLimit("fonnte", 5, 1),
    ).resolves.toBeUndefined();
  });

  it("allows request at exactly limit", async () => {
    mockIncr.mockReturnValue(5);

    await expect(
      checkRateLimit("fonnte", 5, 1),
    ).resolves.toBeUndefined();
  });

  it("blocks request over limit", async () => {
    mockIncr.mockReturnValue(6);

    await expect(
      checkRateLimit("fonnte", 5, 1),
    ).rejects.toThrow("Rate limit exceeded for fonnte");
  });

  it("uses default limit and window when not provided", async () => {
    mockIncr.mockReturnValue(3);

    await expect(checkRateLimit("test")).resolves.toBeUndefined();
    expect(mockIncr).toHaveBeenCalledTimes(1);
  });

  it("generates different keys for different identifiers", async () => {
    mockIncr.mockReturnValue(1);

    await checkRateLimit("fonnte", 5, 1);
    await checkRateLimit("telegram", 10, 1);

    expect(mockIncr).toHaveBeenCalledTimes(2);
    expect(mockIncr.mock.calls[0][0]).not.toBe(mockIncr.mock.calls[1][0]);
  });

  it("handles Redis error gracefully", async () => {
    mockIncr.mockRejectedValueOnce(new Error("Redis connection failed"));

    await expect(
      checkRateLimit("fonnte", 5, 1),
    ).rejects.toThrow("Redis connection failed");
  });
});
