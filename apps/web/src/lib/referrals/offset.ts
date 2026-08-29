import { eq, and, inArray } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { referrals } from "@/db/schema";
import { db } from "@/db";
import * as schemaModule from "@/db/schema";
import type { OffsetPreview } from "@/types/infrastructure";

export type { OffsetPreview };

export async function previewAvailableOffset(
  userId: string,
): Promise<OffsetPreview> {
  const availableReferrals = await db
    .select({
      id: referrals.id,
      commissionAmount: referrals.commissionAmount,
    })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerId, userId),
        eq(referrals.category, "tenant"),
        eq(referrals.status, "completed"),
        eq(referrals.offsetApplied, false),
      ),
    );

  let availableBalance = 0;
  const referralIds: string[] = [];

  for (const ref of availableReferrals) {
    availableBalance += Number(ref.commissionAmount || 0);
    referralIds.push(ref.id);
  }

  return { availableBalance, referralIds };
}

export function computeOffsetDiscount(
  availableBalance: number,
  originalAmount: number,
): { discountAmount: number; finalAmount: number } {
  const discountAmount = Math.min(availableBalance, originalAmount);
  const finalAmount = Math.max(0, originalAmount - discountAmount);
  return { discountAmount, finalAmount };
}

export async function markOffsetConsumed(
  tx: PgTransaction<
    NodePgQueryResultHKT,
    typeof schemaModule,
    ExtractTablesWithRelations<typeof schemaModule>
  >,
  referralIds: string[],
): Promise<void> {
  if (referralIds.length === 0) return;

  await tx
    .update(referrals)
    .set({
      offsetApplied: true,
    })
    .where(inArray(referrals.id, referralIds));
}
