/** Konfigurasi koneksi Redis menggunakan ioredis untuk seluruh aplikasi. */
import Redis from "ioredis";

export type RedisProvider = "ioredis" | "memory";

export type RedisValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export interface RedisClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: RedisValue, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string, ttlSeconds?: number): Promise<number>;
  push(key: string, value: RedisValue, ttlSeconds?: number): Promise<void>;
  range<T = unknown>(key: string, start: number, stop: number): Promise<T[]>;
  ping(): Promise<string>;
}

export interface RedisConnectionOptions {
  maxRetriesPerRequest?: number | null;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

export function createRedisConnection(overrides?: RedisConnectionOptions): Redis {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL harus diisi di environment variables");
  }

  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    ...overrides,
  });
}

let sharedConnection: Redis | null = null;

export function getSharedRedisConnection(): Redis {
  if (!sharedConnection) {
    sharedConnection = createRedisConnection();
  }
  return sharedConnection;
}

export async function closeSharedRedisConnection(): Promise<void> {
  if (sharedConnection) {
    await sharedConnection.quit();
    sharedConnection = null;
  }
}

export function createRedisClient(overrides?: RedisConnectionOptions): Redis {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL harus diisi di environment variables");
  }

  return new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    ...overrides,
  });
}

class IoredisClient implements RedisClient {
  constructor(private readonly client: Redis) {}

  get<T>(key: string) {
    return this.client.get(key).then((value) => {
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  }

  async set(key: string, value: RedisValue, ttlSeconds?: number) {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, serialized, "EX", ttlSeconds);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async incr(key: string, ttlSeconds?: number) {
    const value = await this.client.incr(key);
    if (ttlSeconds && value === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return value;
  }

  ping() {
    return this.client.ping();
  }

  async push(key: string, value: RedisValue, ttlSeconds?: number) {
    await this.client.rpush(key, JSON.stringify(value));
    if (ttlSeconds) {
      await this.client.expire(key, ttlSeconds);
    }
  }

  async range<T>(key: string, start: number, stop: number) {
    const values = await this.client.lrange(key, start, stop);
    return values.map((v) => JSON.parse(v) as T);
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

export async function getRedis(): Promise<RedisClient> {
  if (selectedClient) return selectedClient;

  if (process.env.REDIS_URL) {
    try {
      const client = createRedisClient();
      await client.ping();
      selectedClient = new IoredisClient(client);
      selectedProvider = "ioredis";
      return selectedClient;
    } catch {
      /* fallback to memory */
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
  if (process.env.REDIS_URL) {
    const client = createRedisClient();
    try {
      await client.ping();
      return { ok: true, provider: "ioredis" as const };
    } catch {
      return { ok: false, provider: "ioredis" as const };
    }
  }

  return { ok: true, provider: "memory" as const };
}
