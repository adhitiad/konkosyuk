"use server";

import { db } from "@/db";
import { generalLedger, chartOfAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import type { Role } from "@/lib/auth";

const createLedgerEntrySchema = z
  .object({
    transactionDate: z.string().min(1),
    accountCode: z.string().min(1).max(50),
    accountName: z.string().min(1).max(255),
    description: z.string().min(1).max(500),
    referenceType: z
      .enum(["payment", "withdrawal", "fee", "refund", "adjustment"])
      .optional(),
    referenceId: z.string().optional(),
    debit: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .transform((val) => (Number(val) <= 0 ? "0" : val)),
    credit: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .transform((val) => (Number(val) <= 0 ? "0" : val)),
  })
  .refine(
    (data) => {
      const debit = Number(data.debit);
      const credit = Number(data.credit);
      return (
        (debit > 0 && credit === 0) ||
        (debit === 0 && credit > 0) ||
        (debit === 0 && credit === 0)
      );
    },
    {
      message: "Entry tidak boleh memiliki debit dan credit lebih dari nol",
      path: ["debit"],
    },
  );

export type CreateLedgerEntryState = {
  success?: boolean;
  error?: string;
  data?: typeof generalLedger.$inferSelect;
};

export async function createLedgerEntryAction(
  prevState: CreateLedgerEntryState | undefined,
  formData: FormData,
): Promise<CreateLedgerEntryState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const allowedRoles: Role[] = ["admin", "staff"];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const validated = createLedgerEntrySchema.parse({
      transactionDate: formData.get("transactionDate"),
      accountCode: formData.get("accountCode"),
      accountName: formData.get("accountName"),
      description: formData.get("description"),
      referenceType: formData.get("referenceType") || undefined,
      referenceId: formData.get("referenceId") || undefined,
      debit: formData.get("debit"),
      credit: formData.get("credit"),
    });

    const [account] = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.accountCode, validated.accountCode))
      .limit(1);

    if (!account) {
      return { error: "Kode akun tidak valid", success: false };
    }

    const newEntry = await db
      .insert(generalLedger)
      .values({
        id: crypto.randomUUID(),
        transactionDate: new Date(`${validated.transactionDate}T00:00:00.000Z`),
        accountCode: validated.accountCode,
        accountName: validated.accountName,
        description: validated.description,
        referenceType: validated.referenceType,
        referenceId: validated.referenceId,
        debit: validated.debit,
        credit: validated.credit,
        createdBy: session.user.id,
      })
      .returning();

    return { success: true, data: newEntry[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Input tidak valid", success: false };
    }
    console.error("createLedgerEntryAction error:", error);
    return { error: "Gagal membuat entri buku besar", success: false };
  }
}