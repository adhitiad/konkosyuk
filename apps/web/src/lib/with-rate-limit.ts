import { NextResponse } from "next/server";
import {
  authRateLimit,
  bookingRateLimit,
  generalRateLimit,
} from "@/lib/rate-limit";
import { getOrCreateDeviceId, getDeviceName } from "@/lib/device";

export function withRateLimit(
  handler: (req: Request) => Promise<NextResponse>,
  options: { type?: "auth" | "booking" | "general" } = {},
) {
  return async (req: Request): Promise<NextResponse> => {
    const deviceId = await getOrCreateDeviceId();
    const deviceName = await getDeviceName();

    let result;
    switch (options.type) {
      case "auth":
        result = await authRateLimit({ deviceId, deviceName });
        break;
      case "booking":
        result = await bookingRateLimit({ deviceId, deviceName });
        break;
      default:
        result = await generalRateLimit({ deviceId, deviceName });
    }

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

    return handler(req);
  };
}
