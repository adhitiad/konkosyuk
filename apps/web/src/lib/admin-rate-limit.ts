import { NextResponse } from "next/server";
import { adminRateLimit } from "@/lib/rate-limit";
import { getOrCreateDeviceId, getDeviceName } from "@/lib/device";

export async function withAdminRateLimit() {
  const deviceId = await getOrCreateDeviceId();
  const deviceName = await getDeviceName();

  const result = await adminRateLimit({ deviceId, deviceName });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(
            (result.resetAt.getTime() - Date.now()) / 1000,
          ).toString(),
        },
      },
    );
  }

  return null;
}
