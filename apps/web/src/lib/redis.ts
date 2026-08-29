/**
 * Konfigurasi koneksi Redis menggunakan Upstash Redis untuk seluruh aplikasi.
 */
import { Redis as UpstashRedis } from "@upstash/redis";
import { logInfo } from "@/lib/logger";
import type {
  RedisProvider,
  RedisValue,
  RedisClient,
  RedisConnectionOptions,
} from "@/types/infrastructure";

export type { RedisProvider, RedisValue, RedisClient, RedisConnectionOptions };

/** Timeout tunggu hasil probe PING (ms) sebelum fallback ke memory client. */
const PROBE_TIMEOUT_MS = 3_000;

/**
 * Pasang listener "error" agar Upstash Redis tidak memunculkan
 * error event saat koneksi gagal.
 */
function attachErrorHandler(client: UpstashRedis): void {
  (client as unknown as { on: (event: string, handler: (err: Error) => void) => void }).on("error", (err: Error) => {
    logInfo("[upstash-redis] Connection error", { message: err.message });
  });
}

/** Tutup koneksi secara paksa tanpa melempar error (untuk cleanup client gagal). */
function safeDisconnect(client: UpstashRedis | null): void {
  if (!client) return;
  try {
    (client as unknown as { disconnect: () => Promise<void> }).disconnect();
  } catch {
    /* abaikan — client mungkin sudah tertutup */
  }
}

/** Batas waktu Promise agar operasi Redis tidak menggantung tanpa batas. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Redis operation timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Parse ioredis URL format ke Upstash Redis format.
 * Input: redis://default:token@host:port
 * Output: { url: "https://host", token: "token" }
 */
function parseUpstashRedisUrl(redisUrl: string): { url: string; token: string } {
  const url = new URL(redisUrl);
  const token = url.password || "";
  const host = url.hostname;
  return {
    url: `https://${host}`,
    token,
  };
}

export function createRedisConnection(
  overrides?: RedisConnectionOptions,
): UpstashRedis {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL harus diisi di environment variables");
  }

  const { url, token } = parseUpstashRedisUrl(process.env.REDIS_URL);
  const connection = new UpstashRedis({
    url,
    token,
    ...overrides,
  });
  attachErrorHandler(connection);
  return connection;
}

let sharedConnection: UpstashRedis | null = null;

export function getSharedRedisConnection(): UpstashRedis {
  if (!sharedConnection) {
    sharedConnection = createRedisConnection();
  }
  return sharedConnection;
}

export async function closeSharedRedisConnection(): Promise<void> {
  if (sharedConnection) {
    await (sharedConnection as unknown as { disconnect: () => Promise<void> }).disconnect();
    sharedConnection = null;
  }
}

export function createRedisClient(overrides?: RedisConnectionOptions): UpstashRedis {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL harus diisi di environment variables");
  }

  const { url, token } = parseUpstashRedisUrl(process.env.REDIS_URL);
  const client = new UpstashRedis({
    url,
    token,
    ...overrides,
  });
  attachErrorHandler(client);
  return client;
}

class UpstashRedisClient implements RedisClient {
  constructor(private readonly client: UpstashRedis) {}

  get<T>(key: string) {
    return this.client.get(key).then((value) => {
      if (value === null) return null;
      try {
        return JSON.parse(value as string) as T;
      } catch {
        return value as T;
      }
    });
  }

  async set(key: string, value: RedisValue, ttlSeconds?: number) {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, serialized, { ex: ttlSeconds });
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

  async incrby(key: string, increment: number, ttlSeconds?: number) {
    const value = await this.client.incrby(key, increment);
    if (ttlSeconds && value === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return value;
  }

  async expire(key: string, ttlSeconds: number) {
    await this.client.expire(key, ttlSeconds);
  }

  async ping() {
    return Promise.resolve(this.client.ping());
  }

  async push(key: string, value: RedisValue, ttlSeconds?: number) {
    await this.client.rpush(key, JSON.stringify(value));
    if (ttlSeconds) {
      await this.client.expire(key, ttlSeconds);
    }
  }

  async range<T>(key: string, start: number, stop: number) {
    const values = await this.client.lrange(key, start, stop);
    return values.map((v) => JSON.parse(v as string) as T);
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

  async incrby(key: string, increment: number, ttlSeconds?: number) {
    const value = Number((await this.get<number>(key)) ?? 0) + increment;
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async expire(key: string, ttlSeconds: number) {
    const record = this.values.get(key);
    if (record) {
      record.expiresAt = Date.now() + ttlSeconds * 1000;
    }
  }

  async ping() {
    return Promise.resolve("PONG");
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
    let client: UpstashRedis | null = null;
    try {
      client = createRedisClient();
      await withTimeout(client.ping(), PROBE_TIMEOUT_MS);
      selectedClient = new UpstashRedisClient(client);
      selectedProvider = "upstash";
      return selectedClient;
    } catch {
      safeDisconnect(client);
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
    let client: UpstashRedis | null = null;
    try {
      client = createRedisClient();
      await withTimeout(client.ping(), PROBE_TIMEOUT_MS);
      return { ok: true, provider: "upstash" as const };
    } catch {
      return { ok: false, provider: "upstash" as const };
    } finally {
      safeDisconnect(client);
    }
  }

  return { ok: true, provider: "memory" as const };
}
