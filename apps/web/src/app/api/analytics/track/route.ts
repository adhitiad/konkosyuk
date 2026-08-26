import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail, handleApiError } from "@/lib/api";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const body = await request.json();
    const { event, properties, sessionId } = body;

    if (!event || typeof event !== "string") {
      return fail("Event name is required", 400);
    }

    await db.insert(analyticsEvents).values({
      userId: session?.user?.id ?? null,
      sessionId: sessionId ?? null,
      event,
      properties: properties ?? {},
      userAgent: request.headers.get("user-agent") ?? undefined,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      referrer: request.headers.get("referer") ?? undefined,
    });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "POST /api/analytics/track");
  }
}
