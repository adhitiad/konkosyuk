import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requireSession(["admin", "staff"] as const);
    const subscriptions = await db.select().from(pushSubscriptions);
    return ok({ subscriptions });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/push/subscriptions");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"] as const);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/push/subscriptions");
  }
}
