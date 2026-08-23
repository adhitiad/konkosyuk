"use server";

import { db } from "@/db";
import { users, ownerBankAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { addBankAccountSchema } from "@konkosyuk/shared";
import { invalidateCacheByTag } from "@/lib/cache";

export type AddBankAccountState = {
  success?: boolean;
  error?: string;
  errorCode?: string;
  data?: {
    id: string;
    accountType: string;
    providerName: string;
    accountNumber: string;
    accountName: string;
    isPrimary: boolean;
    createdAt: Date;
  };
};

export async function addBankAccountAction(
  prevState: AddBankAccountState | undefined,
  formData: FormData,
): Promise<AddBankAccountState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role !== "owner") {
      return { error: "Dilarang", success: false };
    }

    const validated = addBankAccountSchema.parse({
      account_type: formData.get("account_type"),
      provider_name: formData.get("provider_name"),
      account_number: formData.get("account_number"),
      account_name: formData.get("account_name"),
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return { error: "Pengguna tidak ditemukan", success: false };
    }

    const normalize = (str: string) =>
      str.toLowerCase().trim().replace(/\s+/g, " ");

    if (normalize(user.name) !== normalize(validated.account_name)) {
      return {
        error:
          "Nama rekening tidak sesuai dengan nama profil KonkosYuk Anda. Silakan perbarui nama profil Anda terlebih dahulu di halaman Pengaturan Profil agar sesuai dengan KTP/Buku Tabungan.",
        errorCode: "NAME_MISMATCH",
        success: false,
      };
    }

    const existingAccounts = await db
      .select()
      .from(ownerBankAccounts)
      .where(eq(ownerBankAccounts.ownerId, session.user.id))
      .limit(1);

    const isFirstAccount = existingAccounts.length === 0;

    const [account] = await db
      .insert(ownerBankAccounts)
      .values({
        ownerId: session.user.id,
        accountType: validated.account_type,
        providerName: validated.provider_name,
        accountNumber: validated.account_number,
        accountName: validated.account_name,
        isPrimary: isFirstAccount,
      })
      .returning();

    await db
      .update(users)
      .set({ kycStatus: "verified" })
      .where(eq(users.id, session.user.id));

    await invalidateCacheByTag("bank-accounts");

    return { success: true, data: account };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal menambahkan rekening", success: false };
  }
}

export type UpdateBankAccountState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    accountType: string;
    providerName: string;
    accountNumber: string;
    accountName: string;
    isPrimary: boolean;
    createdAt: Date;
  };
};

export async function updateBankAccountAction(
  prevState: UpdateBankAccountState | undefined,
  formData: FormData,
): Promise<UpdateBankAccountState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role !== "owner") {
      return { error: "Dilarang", success: false };
    }

    const id = formData.get("id") as string;
    if (!id) {
      return { error: "ID rekening diperlukan", success: false };
    }

    const [account] = await db
      .select()
      .from(ownerBankAccounts)
      .where(
        and(
          eq(ownerBankAccounts.id, id),
          eq(ownerBankAccounts.ownerId, session.user.id),
        ),
      )
      .limit(1);

    if (!account) {
      return { error: "Rekening tidak ditemukan", success: false };
    }

    const updateData: Partial<{
      isPrimary: boolean;
      providerName: string;
      accountNumber: string;
      accountName: string;
    }> = {};

    const isPrimary = formData.get("is_primary");
    if (isPrimary !== null) {
      updateData.isPrimary = isPrimary === "true";
    }

    const providerName = formData.get("provider_name");
    if (providerName) {
      updateData.providerName = providerName as string;
    }

    const accountNumber = formData.get("account_number");
    if (accountNumber) {
      updateData.accountNumber = accountNumber as string;
    }

    const accountName = formData.get("account_name");
    if (accountName) {
      updateData.accountName = accountName as string;
    }

    if (Object.keys(updateData).length === 0) {
      return { error: "Tidak ada data yang diupdate", success: false };
    }

    const [updated] = await db
      .update(ownerBankAccounts)
      .set(updateData)
      .where(eq(ownerBankAccounts.id, id))
      .returning();

    await invalidateCacheByTag("bank-accounts");

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal memperbarui rekening", success: false };
  }
}

export type DeleteBankAccountState = {
  success?: boolean;
  error?: string;
};

export async function deleteBankAccountAction(
  prevState: DeleteBankAccountState | undefined,
  formData: FormData,
): Promise<DeleteBankAccountState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role !== "owner") {
      return { error: "Dilarang", success: false };
    }

    const id = formData.get("id") as string;
    if (!id) {
      return { error: "ID rekening diperlukan", success: false };
    }

    const [account] = await db
      .select()
      .from(ownerBankAccounts)
      .where(
        and(
          eq(ownerBankAccounts.id, id),
          eq(ownerBankAccounts.ownerId, session.user.id),
        ),
      )
      .limit(1);

    if (!account) {
      return { error: "Rekening tidak ditemukan", success: false };
    }

    if (account.isPrimary) {
      return {
        error:
          "Tidak dapat menghapus rekening utama. Setel rekening lain sebagai utama terlebih dahulu.",
        success: false,
      };
    }

    await db.delete(ownerBankAccounts).where(eq(ownerBankAccounts.id, id));

    await invalidateCacheByTag("bank-accounts");

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal menghapus rekening", success: false };
  }
}
