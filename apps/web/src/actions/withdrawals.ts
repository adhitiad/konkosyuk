"use server";

import { db } from "@/db";
import { users, ownerBankAccounts, withdrawals } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createWithdrawalSchema } from "@konkosyuk/shared";
import { invalidateCacheByTag } from "@/lib/cache";
import { validateActionCsrf } from "@/lib/api-auth";

export type CreateWithdrawalState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    amount: string;
    status: string;
    bankAccountId: string;
    createdAt: Date;
  };
};

export async function createWithdrawalAction(
  prevState: CreateWithdrawalState | undefined,
  formData: FormData,
): Promise<CreateWithdrawalState> {
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

    if (session.user.role !== "owner") {
      return { error: "Dilarang", success: false };
    }

    const validated = createWithdrawalSchema.parse({
      bank_account_id: formData.get("bank_account_id"),
      amount: formData.get("amount"),
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return { error: "Pengguna tidak ditemukan", success: false };
    }

    const balance = Number(user.balance || 0);
    const amount = Number(validated.amount);

    if (balance < amount) {
      return { error: "Saldo tidak mencukupi", success: false };
    }

    const [account] = await db
      .select()
      .from(ownerBankAccounts)
      .where(
        and(
          eq(ownerBankAccounts.id, validated.bank_account_id),
          eq(ownerBankAccounts.ownerId, session.user.id),
        ),
      )
      .limit(1);

    if (!account) {
      return { error: "Rekening tidak ditemukan", success: false };
    }

    const [withdrawal] = await db.transaction(async (tx) => {
      const [w] = await tx
        .insert(withdrawals)
        .values({
          ownerId: session.user.id,
          bankAccountId: validated.bank_account_id,
          amount: amount.toFixed(2),
          status: "pending",
        })
        .returning();

      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

      return [w];
    });

    await invalidateCacheByTag("withdrawals");

    return {
      success: true,
      data: withdrawal,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal mengajukan penarikan", success: false };
  }
}
