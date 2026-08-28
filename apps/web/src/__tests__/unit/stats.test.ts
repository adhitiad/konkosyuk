import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackStat } from "@/lib/stats";

const { mockRedis, mockIoredisClient } = vi.hoisted(() => {
  const redis = {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  };

  const ioredisClient = {
    incr: vi.fn().mockReturnValue(1),
    then: vi.fn().mockImplementation((onFulfilled) => Promise.resolve(onFulfilled?.(1))),
    catch: vi.fn(),
    expire: vi.fn(),
    pipeline: vi.fn().mockReturnValue({
      incr: vi.fn(),
      expire: vi.fn(),
      exec: vi.fn().mockResolvedValue([[1, 1]]),
    }),
  };

  return { mockRedis: redis, mockIoredisClient: ioredisClient };
});

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn().mockResolvedValue(mockRedis),
  getRedisProvider: vi.fn().mockReturnValue("upstash"),
  getSharedRedisConnection: vi.fn().mockReturnValue(mockIoredisClient),
}));

describe("trackStat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.incr.mockClear();
    mockRedis.expire.mockClear();
    mockIoredisClient.incr.mockClear();
    mockIoredisClient.expire.mockClear();
  });

  it("should track success stat with correct key format", async () => {
    await trackStat("email", "success");

    expect(mockRedis.incr).toHaveBeenCalledTimes(1);
    const call = mockRedis.incr.mock.calls[0];
    expect(call[0]).toMatch(/^stats:email:success:\d{4}-\d{2}-\d{2}-\d{2}$/);
  });

  it("should track failed stat with correct key format", async () => {
    await trackStat("telegram", "failed");

    expect(mockRedis.incr).toHaveBeenCalledTimes(1);
    const call = mockRedis.incr.mock.calls[0];
    expect(call[0]).toMatch(/^stats:telegram:failed:\d{4}-\d{2}-\d{2}-\d{2}$/);
  });

  it("should track rate_limited stat with correct key format", async () => {
    await trackStat("whatsapp", "rate_limited");

    expect(mockRedis.incr).toHaveBeenCalledTimes(1);
    const call = mockRedis.incr.mock.calls[0];
    expect(call[0]).toMatch(/^stats:whatsapp:rate_limited:\d{4}-\d{2}-\d{2}-\d{2}$/);
  });

  it("should track dlq stat with correct key format", async () => {
    await trackStat("in_app", "dlq");

    expect(mockRedis.incr).toHaveBeenCalledTimes(1);
    const call = mockRedis.incr.mock.calls[0];
    expect(call[0]).toMatch(/^stats:in_app:dlq:\d{4}-\d{2}-\d{2}-\d{2}$/);
  });

  it("should not throw on Redis error", async () => {
    mockRedis.incr.mockRejectedValueOnce(new Error("Redis connection failed"));

    await expect(trackStat("email", "success")).resolves.toBeUndefined();
  });
});
