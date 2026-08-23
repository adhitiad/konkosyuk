import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { AuditLog, NewAuditLog } from "@/db/schema";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "reconcile"
  | "refund"
  | "refund_request"
  | "refund_rejected"
  | "login"
  | "logout"
  | "config_change";

export type AuditEntityType =
  | "user"
  | "property"
  | "booking"
  | "payment"
  | "withdrawal"
  | "kyc"
  | "notification"
  | "payment_gateway"
  | "platform_setting"
  | "ledger"
  | "webhook"
  | "refund_request";

export interface AuditLogInput {
  action: AuditAction;
  targetType: AuditEntityType;
  targetId: string;
  adminId?: string;
  details?: Record<string, unknown>;
}

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
