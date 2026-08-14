import { Realtime } from "ably";

export function createAblyClient() {
  const apiKey = process.env.NEXT_PUBLIC_ABLY_KEY;

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_ABLY_KEY is not defined");
  }

  return new Realtime(apiKey);
}

export type AblyClient = ReturnType<typeof createAblyClient>;
