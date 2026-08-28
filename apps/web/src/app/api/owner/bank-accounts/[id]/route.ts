import { NextRequest } from "next/server";
import { db } from "@/db";
import { ownerBankAccounts } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { eq, and } from "drizzle-orm";
import { logError } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner"] as const);
    const { id } = await params;

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
      return fail("Rekening tidak ditemukan", 404);
    }

    return ok(account);
  } catch (error) {
    logError(error, "GET /api/owner/bank-accounts/[id]");
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner"] as const);
    const { id } = await params;
    const body = await req.json();

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
      return fail("Rekening tidak ditemukan", 404);
    }

    const [updated] = await db
      .update(ownerBankAccounts)
      .set({
        ...(typeof body.is_primary === "boolean" && {
          isPrimary: body.is_primary,
        }),
        ...(body.provider_name && { providerName: body.provider_name }),
        ...(body.account_number && { accountNumber: body.account_number }),
        ...(body.account_name && { accountName: body.account_name }),
      })
      .where(eq(ownerBankAccounts.id, id))
      .returning();

    return ok(updated);
  } catch (error) {
    logError(error, "PATCH /api/owner/bank-accounts/[id]");
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner"] as const);
    const { id } = await params;

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
      return fail("Rekening tidak ditemukan", 404);
    }

    if (account.isPrimary) {
      return fail(
        "Tidak dapat menghapus rekening utama. Setel rekening lain sebagai utama terlebih dahulu.",
        400,
      );
    }

    await db.delete(ownerBankAccounts).where(eq(ownerBankAccounts.id, id));

    return ok({ success: true });
  } catch (error) {
    logError(error, "DELETE /api/owner/bank-accounts/[id]");
    return handleApiError(error);
  }
}
