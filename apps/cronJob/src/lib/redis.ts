/** Konfigurasi koneksi Redis menggunakan ioredis untuk seluruh aplikasi. */
import Redis from "ioredis";
import { logInfo } from "@konkosyuk/shared/lib/logger";

export type RedisProvider = "ioredis" | "memory";

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

export interface RedisConnectionOptions {
  maxRetriesPerRequest?: number | null;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

/** Timeout koneksi TCP (ms) sebelum dianggap gagal. */
const CONNECT_TIMEOUT_MS = 5_000;

/** Timeout tunggu hasil probe PING (ms) sebelum fallback ke memory client. */
const PROBE_TIMEOUT_MS = 3_000;

/**
 * Pasang listener "error" agar ioredis tidak memunculkan
 * "[ioredis] Unhandled error event" saat koneksi gagal.
 */
function attachErrorHandler(client: Redis): void {
  client.on("error", (err: Error) => {
    logInfo("[ioredis] Connection error", { message: err.message });
  });
}

/** Tutup koneksi secara paksa tanpa melempar error (untuk cleanup client gagal). */
function safeDisconnect(client: Redis | null): void {
  if (!client) return;
  try {
    client.disconnect();
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

export function createRedisConnection(
  overrides?: RedisConnectionOptions,
): Redis {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL harus diisi di environment variables");
  }

  const connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: CONNECT_TIMEOUT_MS,
    // Coba ulang maksimal ~5 detik antar percobaan agar tidak hang selamanya.
    retryStrategy: (times: number) => Math.min(times * 500, 5_000),
    ...overrides,
  });
  attachErrorHandler(connection);
  return connection;
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

  const client = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: CONNECT_TIMEOUT_MS,
    // Gagal cepat per-perintah agar request API tidak menggantung puluhan detik.
    commandTimeout: PROBE_TIMEOUT_MS,
    maxRetriesPerRequest: 2,
    retryStrategy: (times: number) => Math.min(times * 500, 5_000),
    ...overrides,
  });
  attachErrorHandler(client);
  return client;
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
    let client: Redis | null = null;
    try {
      client = createRedisClient();
      // Batasi waktu probe agar rate-limit/auth tidak menggantung saat Redis down.
      await withTimeout(client.ping(), PROBE_TIMEOUT_MS);
      selectedClient = new IoredisClient(client);
      selectedProvider = "ioredis";
      return selectedClient;
    } catch {
      // Disconnect client gagal supaya tidak jadi instance yatim yang terus
      // mencoba koneksi ulang dan memunculkan "Unhandled error event".
      safeDisconnect(client);
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
    let client: Redis | null = null;
    try {
      client = createRedisClient();
      await withTimeout(client.ping(), PROBE_TIMEOUT_MS);
      return { ok: true, provider: "ioredis" as const };
    } catch {
      return { ok: false, provider: "ioredis" as const };
    } finally {
      // Health check memakai client sekali pakai — selalu tutup agar tidak bocor.
      safeDisconnect(client);
    }
  }

  return { ok: true, provider: "memory" as const };
}
