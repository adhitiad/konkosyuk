import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockQuit = vi.fn().mockResolvedValue(undefined);
const mockOn = vi.fn();

vi.mock("ioredis", () => {
  class MockRedis {
    options: Record<string, unknown>;
    constructor(_url: string, options?: Record<string, unknown>) {
      this.options = options || {};
    }
    connect = mockConnect;
    quit = mockQuit;
    on = mockOn;
  }
  return {
    default: MockRedis,
  };
});

describe("redis.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REDIS_URL = "rediss://default:test-token@upstash.io:6379";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error when REDIS_URL is not set", async () => {
    delete process.env.REDIS_URL;
    const { createRedisConnection } = await import("@/lib/redis");
    expect(() => createRedisConnection()).toThrow(
      "REDIS_URL harus diisi di environment variables",
    );
  });

  it("createRedisConnection should pass BullMQ-required options", async () => {
    const { createRedisConnection } = await import("@/lib/redis");
    const conn = createRedisConnection();
    expect(conn.options).toMatchObject({
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  });

  it("createRedisClient should NOT set maxRetriesPerRequest to null", async () => {
    const { createRedisClient } = await import("@/lib/redis");
    const client = createRedisClient();
    expect(client.options.maxRetriesPerRequest).not.toBe(null);
    expect(client.options.lazyConnect).toBe(true);
  });

  it("getRedis should return memory client when REDIS_URL is not set", async () => {
    delete process.env.REDIS_URL;
    vi.resetModules();

    const { getRedis } = await import("@/lib/redis");
    const client = await getRedis();
    expect(client).toBeDefined();
  });

  it("redisHealth should return ok:true when REDIS_URL is not set", async () => {
    delete process.env.REDIS_URL;
    vi.resetModules();

    const { redisHealth } = await import("@/lib/redis");
    const result = await redisHealth();
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("memory");
  });
});
