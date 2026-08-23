"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const approveKycSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["verified", "rejected"]),
  adminNote: z.string().optional(),
});

export type ApproveKycState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function approveKycAction(
  prevState: ApproveKycState | undefined,
  formData: FormData,
): Promise<ApproveKycState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role !== "admin") {
      return { error: "Dilarang - hanya admin", success: false };
    }

    const validated = approveKycSchema.parse({
      userId: formData.get("userId"),
      action: formData.get("action"),
      adminNote: formData.get("adminNote") || undefined,
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, validated.userId))
      .limit(1);

    if (!user) {
      return { error: "User tidak ditemukan", success: false };
    }

    if (user.role !== "owner") {
      return { error: "User bukan owner", success: false };
    }

    if (validated.action === "rejected" && !validated.adminNote) {
      return { error: "Alasan penolakan wajib diisi.", success: false };
    }

    await db
      .update(users)
      .set({
        kycStatus: validated.action,
        updatedAt: new Date(),
      })
      .where(eq(users.id, validated.userId));

    await createAuditLog({
      action: validated.action === "verified" ? "approve" : "reject",
      targetType: "kyc",
      targetId: validated.userId,
      adminId: session.user.id,
      details: {
        targetUserId: validated.userId,
        adminNote: validated.adminNote,
      },
    });

    return {
      success: true,
      message: `KYC berhasil ${validated.action === "verified" ? "diverifikasi" : "ditolak"}.`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal memproses KYC", success: false };
  }
}
