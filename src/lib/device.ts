import { cookies } from "next/headers";
import { CookieMapPool } from "@/lib/perf";

const DEVICE_ID_COOKIE = "device_id";
const DEVICE_NAME_COOKIE = "device_name";
const DEVICE_ID_MAX_AGE = 60 * 60 * 24 * 365;

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
}

export function generateDeviceId(): string {
  return crypto.randomUUID();
}

export function generateDeviceName(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  const parts = ua.split(" ");
  const browser = parts[parts.length - 2] || "Browser";
  const os = parts[parts.length - 1] || "OS";
  return `${browser} on ${os}`.slice(0, 100);
}

export async function getOrCreateDeviceId(): Promise<string> {
  const cookieStore = await cookies();
  let deviceId = cookieStore.get(DEVICE_ID_COOKIE)?.value;

  if (!deviceId) {
    deviceId = generateDeviceId();
    cookieStore.set(DEVICE_ID_COOKIE, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: DEVICE_ID_MAX_AGE,
      path: "/",
    });
  }

  return deviceId;
}

export async function getDeviceName(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(DEVICE_NAME_COOKIE)?.value || "unknown";
}

export async function setDeviceName(name: string) {
  const cookieStore = await cookies();
  cookieStore.set(DEVICE_NAME_COOKIE, name.slice(0, 100), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DEVICE_ID_MAX_AGE,
    path: "/",
  });
}

export function getDeviceInfoFromRequest(req: Request): DeviceInfo {
  const cookieHeader = req.headers.get("cookie") || "";

  // Gunakan pooled cookie map untuk menghindari alokasi object baru per-request
  const cookies = CookieMapPool.acquire();

  // Iterative parsing alih-alih split().reduce()
  let start = 0;
  const len = cookieHeader.length;
  while (start < len) {
    // Cari akhir cookie pair
    let end = cookieHeader.indexOf(";", start);
    if (end === -1) end = len;

    // Cari pemisah key=value
    const eqIdx = cookieHeader.indexOf("=", start);
    if (eqIdx !== -1 && eqIdx < end) {
      // Trim whitespace dari key
      let keyStart = start;
      while (keyStart < eqIdx && cookieHeader.charCodeAt(keyStart) === 32) keyStart++;
      const key = cookieHeader.slice(keyStart, eqIdx);
      const value = cookieHeader.slice(eqIdx + 1, end);
      cookies[key] = value;
    }

    start = end + 1;
    // Skip whitespace setelah semicolon
    while (start < len && cookieHeader.charCodeAt(start) === 32) start++;
  }

  const deviceId = cookies[DEVICE_ID_COOKIE] || generateDeviceId();
  const deviceName = cookies[DEVICE_NAME_COOKIE] || "unknown";

  // Release pooled map setelah extract nilai yang diperlukan
  CookieMapPool.release(cookies);

  return { deviceId, deviceName };
}
