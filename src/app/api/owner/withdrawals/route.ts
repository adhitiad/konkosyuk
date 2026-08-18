import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, ownerBankAccounts, withdrawals } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { eq, desc, sql } from "drizzle-orm";
import { createWithdrawalSchema } from "@/lib/zod";
import { logError } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner"] as const);
    const body = createWithdrawalSchema.parse(await req.json());

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return fail("User not found", 404);
    }

    const balance = Number(user.balance || 0);
    const amount = Number(body.amount);

    if (balance < amount) {
      return fail("Saldo tidak mencukupi", 400);
    }

    const [account] = await db
      .select()
      .from(ownerBankAccounts)
      .where(eq(ownerBankAccounts.id, body.bank_account_id))
      .limit(1);

    if (!account || account.ownerId !== session.user.id) {
      return fail("Rekening tidak ditemukan", 404);
    }

    await db.transaction(async (tx) => {
      await tx.insert(withdrawals).values({
        ownerId: session.user.id,
        bankAccountId: body.bank_account_id,
        amount: amount.toFixed(2),
        status: "pending",
      });

      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));
    });

    return ok({
      success: true,
      message: "Permintaan penarikan berhasil dikirim.",
    });
  } catch (error) {
    logError(error, "POST /api/owner/withdrawals");
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const session = await requireSession(["owner"] as const);

    const data = await db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        status: withdrawals.status,
        adminNote: withdrawals.adminNote,
        createdAt: withdrawals.createdAt,
        updatedAt: withdrawals.updatedAt,
        bankAccount: {
          id: ownerBankAccounts.id,
          providerName: ownerBankAccounts.providerName,
          accountNumber: ownerBankAccounts.accountNumber,
          accountName: ownerBankAccounts.accountName,
          accountType: ownerBankAccounts.accountType,
        },
      })
      .from(withdrawals)
      .leftJoin(
        ownerBankAccounts,
        eq(ownerBankAccounts.id, withdrawals.bankAccountId),
      )
      .where(eq(withdrawals.ownerId, session.user.id))
      .orderBy(desc(withdrawals.createdAt));

    return ok({ data });
  } catch (error) {
    logError(error, "GET /api/owner/withdrawals");
    return handleApiError(error);
  }
}
