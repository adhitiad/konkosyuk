import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { NewAuditLog } from "@/db/schema";

export async function logAudit(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: any,
) {
  const payload: NewAuditLog = {
    adminId,
    action,
    targetType,
    targetId,
    details: details ?? {},
  };

  const [log] = await db.insert(auditLogs).values(payload).returning();
  return log;
}
