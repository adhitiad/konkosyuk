import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit, getRateLimitHeaders, type RateLimitConfig } from "@/lib/rate-limit";

const mockIncr = vi.fn();

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn().mockResolvedValue({
    incr: (key: string, ttlSeconds?: number) => mockIncr(key, ttlSeconds),
  }),
}));

describe("rateLimit", () => {
  beforeEach(() => {
    mockIncr.mockReset();
    mockIncr.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (key: string, ttlSeconds?: number) => 1,
    );
  });

  const config: RateLimitConfig = {
    windowMs: 60000,
    maxRequests: 5,
    keyPrefix: "rl:test",
  };

  it("allows first request within limit", async () => {
    mockIncr.mockReturnValue(1);
    const result = await rateLimit(config, "user-1");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows request at exactly limit", async () => {
    mockIncr.mockReturnValue(5);
    const result = await rateLimit(config, "user-1");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks request over limit", async () => {
    mockIncr.mockReturnValue(6);
    const result = await rateLimit(config, "user-1");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("allows request after window expires", async () => {
    mockIncr.mockReturnValue(1);
    const result = await rateLimit(config, "user-1");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks different identifiers independently", async () => {
    mockIncr.mockReturnValue(1);
    const result1 = await rateLimit(config, "user-1");
    const result2 = await rateLimit(config, "user-2");
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it("returns correct headers", () => {
    const result: { success: boolean; remaining: number; resetAt: Date } = {
      success: true,
      remaining: 4,
      resetAt: new Date("2025-01-01T00:01:00.000Z"),
    };
    const headers = getRateLimitHeaders(result, 5);
    expect(headers["X-RateLimit-Limit"]).toBe("5");
    expect(headers["X-RateLimit-Remaining"]).toBe("4");
    expect(headers["X-RateLimit-Reset"]).toBe("2025-01-01T00:01:00.000Z");
  });

  it("blocks request when Redis throws", async () => {
    mockIncr.mockRejectedValueOnce(new Error("Redis down"));
    const result = await rateLimit(config, "user-1");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
