import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, desc, sql, and, or, ilike } from "drizzle-orm";
import { validateAdminRequest } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import type { Role } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAdminRequest(req);
    if (authResult instanceof Response) return authResult;
    const { session } = authResult;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const isRead = searchParams.get("isRead");
    const search = searchParams.get("search");

    const conditions: any[] = [];

    if (type) {
      conditions.push(
        eq(
          notifications.type,
          type as (typeof notifications.type.enumValues)[number],
        ),
      );
    }

    if (isRead === "true") {
      conditions.push(eq(notifications.isRead, true));
    } else if (isRead === "false") {
      conditions.push(eq(notifications.isRead, false));
    }

    if (search) {
      conditions.push(
        or(
          ilike(notifications.title, `%${search}%`),
          ilike(notifications.message, `%${search}%`),
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        referenceId: notifications.referenceId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.userId, users.id))
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    return ok({ data, meta: { total: data.length } });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/notifications");
  }
}
