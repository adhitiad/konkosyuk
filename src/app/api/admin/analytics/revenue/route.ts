import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  payments,
  bookings,
  properties,
  users,
  platformSettings,
} from "@/db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import type { Role } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"] as Role[]);
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const now = new Date();
    const defaultEnd = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    );
    const defaultStart = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    );

    const start = startDate
      ? new Date(`${startDate}T00:00:00.000Z`)
      : defaultStart;
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : defaultEnd;

    const [settings] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, "default"))
      .limit(1);

    const feePercent = parseFloat(settings?.platformFeePercent || "1.8") / 100;

    const successPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        paidAt: payments.paidAt,
        provider: payments.provider,
        purpose: payments.purpose,
        bookingId: payments.bookingId,
        propertyId: properties.id,
        ownerId: properties.ownerId,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(payments)
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(
        and(
          eq(payments.status, "success"),
          gte(payments.paidAt, start),
          lte(payments.paidAt, end),
        ),
      )
      .orderBy(desc(payments.paidAt));

    const totalGMV = successPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const platformProfit = totalGMV * feePercent;

    const ownerMap = new Map<
      string,
      {
        ownerId: string;
        ownerName: string;
        ownerEmail: string;
        totalEarning: number;
      }
    >();
    for (const p of successPayments) {
      if (!p.ownerId) continue;
      const key = p.ownerId;
      const current = ownerMap.get(key) || {
        ownerId: p.ownerId,
        ownerName: (p.ownerName as string) ?? "Unknown",
        ownerEmail: (p.ownerEmail as string) ?? "",
        totalEarning: 0,
      };
      current.totalEarning += Number(p.amount) * (1 - feePercent);
      ownerMap.set(key, current);
    }

    const ownerProfits = Array.from(ownerMap.values()).map((o) => ({
      ...o,
      platformFee: Number((o.totalEarning / (1 - feePercent)).toFixed(2)),
    }));

    return ok({
      totalGMV: Number(totalGMV.toFixed(2)),
      platformProfit: Number(platformProfit.toFixed(2)),
      totalPaidToOwner: Number((totalGMV - platformProfit).toFixed(2)),
      ownerProfits,
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      platformFeePercent: Number((feePercent * 100).toFixed(2)),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/analytics/revenue");
  }
}
