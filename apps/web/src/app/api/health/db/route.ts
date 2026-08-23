import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { monitor } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const started = performance.now();
    await monitor("health.database", () =>
      db.execute(sql`SELECT 1`).then(() => undefined),
    );
    return NextResponse.json({
      status: "healthy",
      latency: Math.round(performance.now() - started),
      message: "Database connected",
    });
  } catch {
    return NextResponse.json(
      { status: "down", message: "Database connection failed" },
      { status: 500 },
    );
  }
}
