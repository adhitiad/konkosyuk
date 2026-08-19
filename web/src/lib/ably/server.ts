import { Rest } from "ably";
import { getSettingRequired } from "@/lib/settings";

export async function getAblyRest() {
  const apiKey = await getSettingRequired("ABLY_API_KEY");

  return new Rest(apiKey);
}

export async function getAblyAuth() {
  const apiKey = await getSettingRequired("ABLY_API_KEY");

  return new Rest(apiKey).auth;
}
