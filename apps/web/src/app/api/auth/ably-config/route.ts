import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import { fail, handleApiError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const key = await getSetting("NEXT_PUBLIC_ABLY_KEY");

    if (!key) {
      return fail("Ably key not configured", 503, "SERVICE_UNAVAILABLE");
    }

    return NextResponse.json({ key });
  } catch (error) {
    return handleApiError(error, "GET /api/auth/ably-config");
  }
}
