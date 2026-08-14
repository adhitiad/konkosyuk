import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq, desc, and, or, ilike, count } from "drizzle-orm";
import { validateAdminRequest } from "@/lib/api-auth";
import type { Role } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAdminRequest(req);
    if (authResult instanceof Response) return authResult;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const targetType = searchParams.get("targetType") || undefined;
    const search = searchParams.get("search") || undefined;

    const conditions = [];
    if (action) conditions.push(eq(auditLogs.action, action));
    if (targetType) conditions.push(eq(auditLogs.targetType, targetType));
    if (search) {
      conditions.push(
        or(
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
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        adminId: auditLogs.adminId,
        adminName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.adminId))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);

    return NextResponse.json({
      data: logs,
      meta: { total: countResult?.count ?? 0 },
    });
  } catch (error) {
    console.error("[API] Audit Logs Error:", error);
    return NextResponse.json(
      {
        error: "Gagal memuat audit logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
