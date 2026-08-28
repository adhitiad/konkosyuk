import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn().mockResolvedValue(undefined);
const mockOn = vi.fn();
const mockPing = vi.fn().mockResolvedValue("PONG");

vi.mock("@upstash/redis", () => {
  class MockRedis {
    options: Record<string, unknown>;
    constructor(_options: Record<string, unknown>) {
      this.options = _options || {};
    }
    connect = mockConnect;
    disconnect = mockDisconnect;
    on = mockOn;
    ping = mockPing;
  }
  return {
    Redis: MockRedis,
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

  it("createRedisConnection should parse ioredis URL to Upstash format", async () => {
    const { createRedisConnection } = await import("@/lib/redis");
    const conn = createRedisConnection();
    expect((conn as unknown as { options: { url: string; token: string } }).options).toMatchObject({
      url: "https://upstash.io",
      token: "test-token",
    });
  });

  it("createRedisClient should parse ioredis URL to Upstash format", async () => {
    const { createRedisClient } = await import("@/lib/redis");
    const client = createRedisClient();
    expect((client as unknown as { options: { url: string; token: string } }).options.url).toBe("https://upstash.io");
    expect((client as unknown as { options: { url: string; token: string } }).options.token).toBe("test-token");
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
