import { Redis as UpstashRedis } from "@upstash/redis";

export type RedisProvider = "upstash" | "memory";

export type RedisValue =
  string | number | boolean | null | Record<string, unknown> | unknown[];

export interface RedisClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: RedisValue, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string, ttlSeconds?: number): Promise<number>;
  push(key: string, value: RedisValue, ttlSeconds?: number): Promise<void>;
  range<T = unknown>(key: string, start: number, stop: number): Promise<T[]>;
  ping(): Promise<string>;
}

class UpstashClient implements RedisClient {
  constructor(private readonly client: UpstashRedis) {}
  get<T>(key: string) {
    return this.client.get<T>(key);
  }
  async set(key: string, value: RedisValue, ttlSeconds?: number) {
    if (ttlSeconds) await this.client.set(key, value, { ex: ttlSeconds });
    else await this.client.set(key, value);
  }
  async del(key: string) {
    await this.client.del(key);
  }
  async incr(key: string, ttlSeconds?: number) {
    const value = await this.client.incr(key);
    if (ttlSeconds && value === 1) await this.client.expire(key, ttlSeconds);
    return value;
  }
  ping() {
    return this.client.ping();
  }
  async push(key: string, value: RedisValue, ttlSeconds?: number) {
    await this.client.rpush(key, JSON.stringify(value));
    if (ttlSeconds) await this.client.expire(key, ttlSeconds);
  }
  async range<T>(key: string, start: number, stop: number) {
    return (await this.client.lrange(key, start, stop)).map(
      (value) => JSON.parse(value) as T,
    );
  }
}

class MemoryClient implements RedisClient {
  private readonly values = new Map<
    string,
    { value: RedisValue; expiresAt?: number }
  >();
  async get<T>(key: string) {
    const record = this.values.get(key);
    if (!record || (record.expiresAt && record.expiresAt <= Date.now())) {
      this.values.delete(key);
      return null;
    }
    return record.value as T;
  }
  async set(key: string, value: RedisValue, ttlSeconds?: number) {
    this.values.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }
  async del(key: string) {
    this.values.delete(key);
  }
  async incr(key: string, ttlSeconds?: number) {
    const value = Number((await this.get<number>(key)) ?? 0) + 1;
    await this.set(key, value, ttlSeconds);
    return value;
  }
  async ping() {
    return "PONG";
  }
  async push(key: string, value: RedisValue, ttlSeconds?: number) {
    const values = (await this.get<RedisValue[]>(key)) ?? [];
    values.push(value);
    await this.set(key, values.slice(-100), ttlSeconds);
  }
  async range<T>(key: string, start: number, stop: number) {
    return ((await this.get<unknown[]>(key)) ?? []).slice(
      start,
      stop < 0 ? undefined : stop + 1,
    ) as T[];
  }
}

const memoryClient = new MemoryClient();
let selectedClient: RedisClient | null = null;
let selectedProvider: RedisProvider = "memory";

function createCandidates(): Array<{
  provider: RedisProvider;
  client: RedisClient;
}> {
  const candidates: Array<{ provider: RedisProvider; client: RedisClient }> =
    [];
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
    candidates.push({
      provider: "upstash",
      client: new UpstashClient(
        new UpstashRedis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
      ),
    });
  return candidates;
}

export async function getRedis(): Promise<RedisClient> {
  if (selectedClient) return selectedClient;
  for (const candidate of createCandidates()) {
    try {
      await candidate.client.ping();
      selectedClient = candidate.client;
      selectedProvider = candidate.provider;
      return selectedClient;
    } catch {
      /* Try next provider. */
    }
  }
  selectedClient = memoryClient;
  selectedProvider = "memory";
  return memoryClient;
}

export function getRedisProvider(): RedisProvider {
  return selectedProvider;
}

export async function redisHealth() {
  const client = await getRedis();
  try {
    await client.ping();
    return { ok: true, provider: selectedProvider };
  } catch {
    return { ok: false, provider: selectedProvider };
  }
}
