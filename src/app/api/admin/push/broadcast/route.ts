import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { ok, fail, handleApiError } from "@/lib/api";
import { sendWebPushNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    await requireSession(["admin"] as const);
    const body = await req.json();
    const { title, message } = body as { title?: string; message?: string };

    if (!title?.trim() || !message?.trim()) {
      return fail("Title and message are required", 400);
    }

    const subscriptions = await db.select().from(pushSubscriptions);
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendWebPushNotification(sub.userId, title.trim(), message.trim()),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    return ok({
      success: true,
      total: subscriptions.length,
      failed,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/push/broadcast");
  }
}
