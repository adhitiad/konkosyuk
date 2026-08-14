"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const submitKycSchema = z.object({
  ktpNumber: z.string().regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  ktpImageUrl: z.string().url("URL foto KTP tidak valid"),
});

export type SubmitKycState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function submitKycAction(
  prevState: SubmitKycState | undefined,
  formData: FormData,
): Promise<SubmitKycState> {
  try {
    const validated = submitKycSchema.parse({
      ktpNumber: formData.get("ktpNumber"),
      ktpImageUrl: formData.get("ktpImageUrl"),
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return { error: "Pengguna tidak ditemukan", success: false };
    }

    if (user.kycStatus === "pending") {
      return { error: "KYC Anda sedang dalam proses verifikasi.", success: false };
    }

    if (user.kycStatus === "verified") {
      return { error: "KYC Anda sudah terverifikasi.", success: false };
    }

    await db
      .update(users)
      .set({
        ktpNumber: validated.ktpNumber,
        ktpImageUrl: validated.ktpImageUrl,
        kycStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return {
      success: true,
      message: "KYC berhasil dikirim. Menunggu verifikasi admin.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Input tidak valid", success: false };
    }
    return { error: "Gagal mengirim KYC", success: false };
  }
}