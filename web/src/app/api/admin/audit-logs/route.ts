import { NextRequest } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq, desc, sql, and, ilike, gte, lte } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { withAdminRateLimit } from "@/lib/admin-rate-limit";
import { ok, handleApiError } from "@/lib/api";
import { z } from "zod";

const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});

type AuditLogWithUser = {
  id: string;
  adminId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
};

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"]);

    const rateLimitResult = await withAdminRateLimit();
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { searchParams } = new URL(req.url);
    const query = auditLogQuerySchema.parse(Object.fromEntries(searchParams));

    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof and>> = [];

    if (query.userId) {
      conditions.push(eq(auditLogs.adminId, query.userId));
    }

    if (query.action) {
      conditions.push(eq(auditLogs.action, query.action));
    }

    if (query.resource) {
      conditions.push(eq(auditLogs.targetType, query.resource));
    }

    if (query.startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(query.startDate)));
    }

    if (query.endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(query.endDate)));
    }

    if (query.search) {
      conditions.push(
        ilike(sql`CAST(${auditLogs.details} AS TEXT)`, `%${query.search}%`),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, [{ count }]] = await Promise.all([
      db
        .select({
          id: auditLogs.id,
          adminId: auditLogs.adminId,
          action: auditLogs.action,
          targetType: auditLogs.targetType,
          targetId: auditLogs.targetId,
          details: auditLogs.details,
          createdAt: auditLogs.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.adminId, users.id))
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(whereClause),
    ]);

    const total = Number(count);
    const totalPages = Math.ceil(total / limit);

    const result: AuditLogWithUser[] = logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      details: log.details ?? {},
      createdAt: log.createdAt.toISOString(),
      userName: log.userName ?? null,
      userEmail: log.userEmail ?? null,
    }));

    return ok({
      data: result,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/audit-logs");
  }
}
