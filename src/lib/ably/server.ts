import { Rest } from "ably";

export function getAblyRest() {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    throw new Error("ABLY_API_KEY is not defined");
  }

  return new Rest(apiKey);
}

export function getAblyAuth() {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    throw new Error("ABLY_API_KEY is not defined");
  }

  return new Rest(apiKey).auth;
}
