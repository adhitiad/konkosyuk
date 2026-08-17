import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { logError, logApiRequest } from "@/lib/logger";
import {
  getCachedData,
  buildCacheKey,
  invalidateCacheByTag,
} from "@/lib/cache";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await requireSession();

    const cacheKey = buildCacheKey("notifications", {
      userId: session.user.id,
    });

    const result = await getCachedData(
      cacheKey,
      async () => {
        const data = await db
          .select()
          .from(notifications)
          .where(eq(notifications.userId, session.user.id))
          .orderBy(desc(notifications.createdAt))
          .limit(50);

        return { data, meta: { total: data.length } };
      },
      { ttlSeconds: 30, tags: ["notifications"] },
    );

    const duration = Date.now() - startTime;
    logApiRequest("GET", "/api/notifications", 200, duration);

    return ok(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    const statusCode =
      error instanceof Error && "statusCode" in error
        ? (error as any).statusCode
        : 500;
    logApiRequest("GET", "/api/notifications", statusCode, duration);
    logError(error, "GET /api/notifications");
    return handleApiError(error, "GET /api/notifications");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession();
    const body = await req.json();
    const { notificationId } = body;

    if (notificationId) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, session.user.id),
          ),
        );
    }

    await invalidateCacheByTag("notifications");

    return ok({ success: true });
  } catch (error) {
    logError(error, "PATCH /api/notifications");
    return handleApiError(error, "PATCH /api/notifications");
  }
}
