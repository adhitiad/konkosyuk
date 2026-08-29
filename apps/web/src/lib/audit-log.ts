import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { AuditLog, NewAuditLog } from "@/db/schema";
import type { AuditAction, AuditEntityType, AuditLogInput } from "@/types/infrastructure";

export type { AuditAction, AuditEntityType, AuditLogInput };

export async function createAuditLog(input: AuditLogInput): Promise<AuditLog> {
  const payload = {
    adminId: input.adminId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    details: input.details ?? {},
  } as NewAuditLog;

  const [log] = await db.insert(auditLogs).values(payload).returning();
  return log;
}
