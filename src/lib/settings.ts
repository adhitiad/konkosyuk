import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const settingsCache = new Map<string, { value: string; expiresAt: number }>();

const CACHE_TTL = 60 * 1000;

export async function getSetting(key: string): Promise<string | null> {
  const now = Date.now();
  const cached = settingsCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const [setting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);

  if (setting) {
    settingsCache.set(key, { value: setting.value, expiresAt: now + CACHE_TTL });
    return setting.value;
  }

  return null;
}

export async function getSettingRequired(key: string): Promise<string> {
  const value = await getSetting(key);
  if (!value) {
    throw new Error(`Missing required setting: ${key}`);
  }
  return value;
}

export function clearSettingsCache() {
  settingsCache.clear();
}
