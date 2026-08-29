import { getRedis, type RedisValue } from "./redis";
import type { CacheOptions } from "@/types/infrastructure";

export type { CacheOptions };

const DEFAULT_TTL = 300; // 5 minutes
const CACHE_PREFIX = "cache:";

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const { ttlSeconds = DEFAULT_TTL, tags = [], condition = true } = options;

  if (!condition) {
    return fetcher();
  }

  const client = await getRedis();
  const cacheKey = `${CACHE_PREFIX}${key}`;

  try {
    const cached = await client.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  } catch {
    // Cache miss or error, fetch from source
  }

  const data = await fetcher();

  try {
    await client.set(cacheKey, data as RedisValue, ttlSeconds);
    if (tags.length > 0) {
      await setCacheTags(key, tags);
    }
  } catch {
    // Cache write failed, but data is still returned
  }

  return data;
}

export async function invalidateCache(key: string): Promise<void> {
  const client = await getRedis();
  const cacheKey = `${CACHE_PREFIX}${key}`;
  await client.del(cacheKey);
}

export async function invalidateCacheByTag(tag: string): Promise<void> {
  const client = await getRedis();

  const keys = await client.get<string[]>(`tags:${tag}`);
  if (keys && Array.isArray(keys)) {
    await Promise.all(keys.map((key) => client.del(key)));
    await client.del(`tags:${tag}`);
  }
}

export async function setCacheTags(key: string, tags: string[]): Promise<void> {
  if (tags.length === 0) return;

  const client = await getRedis();
  const cacheKey = `${CACHE_PREFIX}${key}`;

  await Promise.all(
    tags.map(async (tag) => {
      const tagKey = `tags:${tag}`;
      const existing = await client.get<string[]>(tagKey);
      const updated = [...(existing ?? []), cacheKey];
      const unique = [...new Set(updated)];
      await client.set(tagKey, unique, 86400); // 24 hours
    }),
  );
}

export function buildCacheKey(
  prefix: string,
  params: Record<string, unknown>,
): string {
  // Optimasi: gunakan array push + single join alih-alih .sort().map().join()
  // yang membuat banyak intermediate strings
  const keys = Object.keys(params).sort();
  const parts: string[] = [prefix];
  for (let i = 0; i < keys.length; i++) {
    parts.push(keys[i]);
    parts.push(String(params[keys[i]]));
  }
  return parts.join(":");
}
