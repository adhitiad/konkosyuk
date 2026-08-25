import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import type { FeatureFlag, NewFeatureFlag } from "@/db/schema";
import { getRedis } from "@/lib/redis";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const CACHE_KEY = "feature-flag:";
const CACHE_TTL = 60;

export async function isFeatureEnabled(
  key: string,
  userId?: string,
  userRole?: string,
): Promise<boolean> {
  const client = await getRedis();
  const cacheKey = `${CACHE_KEY}${key}`;

  try {
    const cached = await client.get<{ enabled: boolean }>(cacheKey);
    if (cached !== null) {
      return evaluateFlag(cached.enabled, userId, userRole, key);
    }
  } catch {
    // Cache miss or error, continue to DB lookup
  }

  const [flag] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.key, key))
    .limit(1);

  if (!flag) {
    await client.set(cacheKey, { enabled: false }, CACHE_TTL);
    return false;
  }

  const result = evaluateFlag(
    flag.enabled,
    userId,
    userRole,
    key,
    flag.rolloutPercentage,
    flag.allowedUsers,
    flag.allowedRoles,
  );

  try {
    await client.set(cacheKey, { enabled: result }, CACHE_TTL);
  } catch {
    // Cache write failed, but result is still valid
  }

  return result;
}

export async function setFeatureFlag(
  key: string,
  enabled: boolean,
): Promise<void> {
  const client = await getRedis();
  const cacheKey = `${CACHE_KEY}${key}`;

  await db
    .update(featureFlags)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(featureFlags.key, key));

  try {
    await client.del(cacheKey);
  } catch {
    // Cache deletion failed, but DB update succeeded
  }
}

export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  return db.select().from(featureFlags).orderBy(featureFlags.createdAt);
}

export async function createFeatureFlag(
  input: NewFeatureFlag,
): Promise<FeatureFlag> {
  const [flag] = await db.insert(featureFlags).values(input).returning();
  return flag;
}

export async function updateFeatureFlag(
  id: string,
  input: Partial<NewFeatureFlag>,
): Promise<FeatureFlag | undefined> {
  const [flag] = await db
    .update(featureFlags)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(featureFlags.id, id))
    .returning();
  return flag;
}

export async function deleteFeatureFlag(id: string): Promise<void> {
  await db.delete(featureFlags).where(eq(featureFlags.id, id));
}

function evaluateFlag(
  enabled: boolean,
  userId: string | undefined,
  userRole: string | undefined,
  key: string,
  rolloutPercentage = 100,
  allowedUsers: string[] = [],
  allowedRoles: string[] = [],
): boolean {
  if (!enabled) {
    return false;
  }

  if (userId && allowedUsers.includes(userId)) {
    return true;
  }

  if (userRole && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return false;
  }

  if (rolloutPercentage >= 100) {
    return true;
  }

  if (!userId) {
    return false;
  }

  const hash = crypto
    .createHash("md5")
    .update(`${userId}:${key}`)
    .digest("hex");
  const bucket = parseInt(hash.slice(0, 8), 16) % 100;
  return bucket < rolloutPercentage;
}
