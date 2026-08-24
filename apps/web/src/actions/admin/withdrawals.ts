"use server";

import { db } from "@/db";
import { withdrawals, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";
import { validateActionCsrf } from "@/lib/api-auth";

const processWithdrawalSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["success", "rejected"]),
  adminNote: z.string().optional(),
});

export type ProcessWithdrawalState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function processWithdrawalAction(
  prevState: ProcessWithdrawalState | undefined,
  formData: FormData,
): Promise<ProcessWithdrawalState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (!["admin", "staff"].includes(session.user.role)) {
      return { error: "Dilarang", success: false };
    }

    const validated = processWithdrawalSchema.parse({
      id: formData.get("id"),
      action: formData.get("action"),
      adminNote: formData.get("adminNote") || undefined,
    });

    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, validated.id))
      .limit(1);

    if (!withdrawal) {
      return { error: "Penarikan tidak ditemukan", success: false };
    }

    if (withdrawal.status !== "pending") {
      return { error: "Penarikan sudah diproses", success: false };
    }

    if (validated.action === "rejected" && !validated.adminNote?.trim()) {
      return { error: "Alasan penolakan wajib diisi", success: false };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(withdrawals)
        .set({
          status: validated.action,
          adminNote: validated.adminNote?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(withdrawals.id, validated.id));

      if (validated.action === "rejected") {
        await tx
          .update(users)
          .set({
            balance: sql`${users.balance} + ${withdrawal.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, withdrawal.ownerId));
      }
    });

    await createAuditLog({
      action: validated.action === "success" ? "approve" : "reject",
      targetType: "withdrawal",
      targetId: withdrawal.id,
      adminId: session.user.id,
      details: {
        ownerId: withdrawal.ownerId,
        amount: withdrawal.amount,
        adminNote: validated.adminNote,
      },
    });

    return {
      success: true,
      message: `Penarikan ${validated.action === "success" ? "disetujui" : "ditolak"}.`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal memproses penarikan", success: false };
  }
}
