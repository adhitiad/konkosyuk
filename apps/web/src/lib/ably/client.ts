import { Realtime } from "ably";

export function createAblyClient() {
  const apiKey = process.env.NEXT_PUBLIC_ABLY_KEY;

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_ABLY_KEY is not defined");
  }

  return new Realtime(apiKey);
}

export async function createAblyClientFromSettings() {
  const response = await fetch("/api/auth/ably-config");

  if (!response.ok) {
    throw new Error("Failed to load Ably configuration from settings");
  }

  const data = await response.json();

  if (!data.key) {
    throw new Error("Ably API key not found in settings");
  }

  return new Realtime(data.key);
}

export type AblyClient = ReturnType<typeof createAblyClient>;
