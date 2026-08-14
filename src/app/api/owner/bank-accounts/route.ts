import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, ownerBankAccounts } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { addBankAccountSchema } from "@/lib/zod";
import { eq, and } from "drizzle-orm";
import { logError } from "@/lib/logger";

export async function GET() {
  try {
    const session = await requireSession(["owner"] as any);

    const accounts = await db
      .select()
      .from(ownerBankAccounts)
      .where(eq(ownerBankAccounts.ownerId, session.user.id))
      .orderBy(ownerBankAccounts.createdAt);

    return ok(accounts);
  } catch (error) {
    logError(error, "GET /api/owner/bank-accounts");
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner"] as any);
    const body = addBankAccountSchema.parse(await req.json());

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return fail("User not found", 404);
    }

    const normalize = (str: string) =>
      str.toLowerCase().trim().replace(/\s+/g, " ");

    if (normalize(user.name) !== normalize(body.account_name)) {
      return NextResponse.json(
        {
          error:
            "Nama rekening tidak sesuai dengan nama profil KonkosYuk Anda. Silakan perbarui nama profil Anda terlebih dahulu di halaman Pengaturan Profil agar sesuai dengan KTP/Buku Tabungan.",
          code: "NAME_MISMATCH",
        },
        { status: 400 },
      );
    }

    const isFirstAccount = !(await db
      .select()
      .from(ownerBankAccounts)
      .where(eq(ownerBankAccounts.ownerId, session.user.id))
      .limit(1));

    const [account] = await db
      .insert(ownerBankAccounts)
      .values({
        ownerId: session.user.id,
        accountType: body.account_type,
        providerName: body.provider_name,
        accountNumber: body.account_number,
        accountName: body.account_name,
        isPrimary: isFirstAccount,
      })
      .returning();

    await db
      .update(users)
      .set({ kycStatus: "verified" })
      .where(eq(users.id, session.user.id));

    return ok(account, 201);
  } catch (error) {
    logError(error, "POST /api/owner/bank-accounts");
    return handleApiError(error);
  }
}
