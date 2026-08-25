import { NextRequest } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq, desc, and, or, ilike, count } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import type { Role } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"] as Role[]);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const search = searchParams.get("search") || undefined;

    const conditions = [];
    if (action) conditions.push(eq(auditLogs.action, action));
    if (userId) conditions.push(eq(auditLogs.adminId, userId));
    if (search) {
      conditions.push(
        or(
          ilike(auditLogs.targetType, `%${search}%`),
          ilike(auditLogs.targetId, `%${search}%`),
          ilike(users.name, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: count() })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.adminId))
      .where(whereClause);

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.adminId,
        userName: users.name,
        userRole: users.role,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.adminId))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);

    const mappedData = logs.map((item) => ({
      id: item.id,
      action: item.action,
      description: `${item.targetType} ${item.targetId}${item.userName ? ` by ${item.userName}` : ""}`,
      userId: item.userId,
      userName: item.userName,
      userRole: item.userRole,
      ipAddress: null,
      userAgent: null,
      createdAt: item.createdAt,
    }));

    return ok({ data: mappedData, meta: { total: countResult?.count ?? 0 } });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/activity-logs");
  }
}
