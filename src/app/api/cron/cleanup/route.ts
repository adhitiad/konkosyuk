import { NextResponse } from "next/server";
import { cleanupExpiredBookings } from "@/lib/cron/cleanup-bookings";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const result = await cleanupExpiredBookings();

    return NextResponse.json({
      success: true,
      cleanedCount: result.cancelledCount,
    });
  } catch (error) {
    console.error("Cron cleanup failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
