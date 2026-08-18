import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const key = await getSetting("NEXT_PUBLIC_ABLY_KEY");

    if (!key) {
      return NextResponse.json(
        { error: "Ably key not configured" },
        { status: 500 },
      );
    }

    return NextResponse.json({ key });
  } catch (error) {
    console.error("[Ably Config] Error:", error);
    return NextResponse.json(
      { error: "Failed to load Ably config" },
      { status: 500 },
    );
  }
}
