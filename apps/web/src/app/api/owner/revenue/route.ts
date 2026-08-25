import { NextRequest } from "next/server";
import { db } from "@/db";
import { payments, bookings, properties, units } from "@/db/schema";
import { eq, sql, and, gte, lte, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { z } from "zod";

const revenueQuerySchema = z.object({
  period: z.enum(["month", "quarter", "year"]).default("month"),
  propertyId: z.string().uuid().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

function getDateRange(period: string, year?: number, month?: number) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;

  let startDate: Date;
  let endDate: Date;

  if (period === "month") {
    startDate = new Date(y, m - 1, 1);
    endDate = new Date(y, m, 0, 23, 59, 59);
  } else if (period === "quarter") {
    const quarter = Math.floor((m - 1) / 3) + 1;
    startDate = new Date(y, (quarter - 1) * 3, 1);
    endDate = new Date(y, quarter * 3, 0, 23, 59, 59);
  } else {
    startDate = new Date(y, 0, 1);
    endDate = new Date(y, 11, 31, 23, 59, 59);
  }

  return { startDate, endDate, year: y, month: m };
}

function getPreviousPeriod(period: string, year: number, month: number) {
  if (period === "month") {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return { year: prevYear, month: prevMonth };
  } else if (period === "quarter") {
    const quarter = Math.floor((month - 1) / 3) + 1;
    const prevQuarter = quarter === 1 ? 4 : quarter - 1;
    const prevYear = quarter === 1 ? year - 1 : year;
    return { year: prevYear, month: (prevQuarter - 1) * 3 + 1 };
  } else {
    return { year: year - 1, month: 1 };
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(["owner", "admin", "staff"]);

    const { searchParams } = new URL(req.url);
    const query = revenueQuerySchema.parse(Object.fromEntries(searchParams));

    const ownerPropertyIds = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.ownerId, session.user.id));

    const propertyIds = ownerPropertyIds.map((p) => p.id);

    if (propertyIds.length === 0) {
      return ok({
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        comparedToPreviousPeriod: {
          revenueChange: 0,
          transactionChange: 0,
        },
        monthlyData: [],
        topProperties: [],
      });
    }

    const effectivePropertyIds = query.propertyId
      ? propertyIds.includes(query.propertyId)
        ? [query.propertyId]
        : []
      : propertyIds;

    if (effectivePropertyIds.length === 0) {
      return ok({
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        comparedToPreviousPeriod: {
          revenueChange: 0,
          transactionChange: 0,
        },
        monthlyData: [],
        topProperties: [],
      });
    }

    const { startDate, endDate, year, month } = getDateRange(
      query.period,
      query.year,
      query.month,
    );

    const baseConditions = [
      eq(payments.status, "success"),
      inArray(payments.propertyId, effectivePropertyIds),
      gte(payments.paidAt ?? payments.createdAt, startDate),
      lte(payments.paidAt ?? payments.createdAt, endDate),
    ];

    const totalRevenueRow = await db
      .select({ sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))` })
      .from(payments)
      .where(and(...baseConditions));

    const totalTransactionsRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(and(...baseConditions));

    const totalRevenue = Number(totalRevenueRow[0]?.sum || 0);
    const totalTransactions = Number(totalTransactionsRow[0]?.count || 0);
    const averageTransactionValue =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const prev = getPreviousPeriod(query.period, year, month);
    const { startDate: prevStart, endDate: prevEnd } = getDateRange(
      query.period,
      prev.year,
      prev.month,
    );

    const prevConditions = [
      eq(payments.status, "success"),
      inArray(payments.propertyId, effectivePropertyIds),
      gte(payments.paidAt ?? payments.createdAt, prevStart),
      lte(payments.paidAt ?? payments.createdAt, prevEnd),
    ];

    const prevRevenueRow = await db
      .select({ sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))` })
      .from(payments)
      .where(and(...prevConditions));

    const prevTransactionsRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(and(...prevConditions));

    const prevRevenue = Number(prevRevenueRow[0]?.sum || 0);
    const prevTransactions = Number(prevTransactionsRow[0]?.count || 0);

    const revenueChange =
      prevRevenue > 0
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    const transactionChange =
      prevTransactions > 0
        ? ((totalTransactions - prevTransactions) / prevTransactions) * 100
        : totalTransactions > 0
          ? 100
          : 0;

    const monthlyData: { label: string; revenue: number; transactions: number }[] =
      [];

    if (query.period === "month") {
      const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
      ];

      for (let m = 1; m <= 12; m++) {
        const monthStart = new Date(year, m - 1, 1);
        const monthEnd = new Date(year, m, 0, 23, 59, 59);

        const monthConditions = [
          eq(payments.status, "success"),
          inArray(payments.propertyId, effectivePropertyIds),
          gte(payments.paidAt ?? payments.createdAt, monthStart),
          lte(payments.paidAt ?? payments.createdAt, monthEnd),
        ];

        const [revenueRow, countRow] = await Promise.all([
          db
            .select({ sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))` })
            .from(payments)
            .where(and(...monthConditions)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(payments)
            .where(and(...monthConditions)),
        ]);

        monthlyData.push({
          label: months[m - 1],
          revenue: Number(revenueRow[0]?.sum || 0),
          transactions: Number(countRow[0]?.count || 0),
        });
      }
    } else if (query.period === "quarter") {
      for (let q = 1; q <= 4; q++) {
        const quarterStart = new Date(year, (q - 1) * 3, 1);
        const quarterEnd = new Date(year, q * 3, 0, 23, 59, 59);

        const quarterConditions = [
          eq(payments.status, "success"),
          inArray(payments.propertyId, effectivePropertyIds),
          gte(payments.paidAt ?? payments.createdAt, quarterStart),
          lte(payments.paidAt ?? payments.createdAt, quarterEnd),
        ];

        const [revenueRow, countRow] = await Promise.all([
          db
            .select({ sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))` })
            .from(payments)
            .where(and(...quarterConditions)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(payments)
            .where(and(...quarterConditions)),
        ]);

        monthlyData.push({
          label: `Q${q}`,
          revenue: Number(revenueRow[0]?.sum || 0),
          transactions: Number(countRow[0]?.count || 0),
        });
      }
    } else {
      for (let y = year - 4; y <= year; y++) {
        const yearStart = new Date(y, 0, 1);
        const yearEnd = new Date(y, 11, 31, 23, 59, 59);

        const yearConditions = [
          eq(payments.status, "success"),
          inArray(payments.propertyId, effectivePropertyIds),
          gte(payments.paidAt ?? payments.createdAt, yearStart),
          lte(payments.paidAt ?? payments.createdAt, yearEnd),
        ];

        const [revenueRow, countRow] = await Promise.all([
          db
            .select({ sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))` })
            .from(payments)
            .where(and(...yearConditions)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(payments)
            .where(and(...yearConditions)),
        ]);

        monthlyData.push({
          label: String(y),
          revenue: Number(revenueRow[0]?.sum || 0),
          transactions: Number(countRow[0]?.count || 0),
        });
      }
    }

    const topPropertiesRows = await db
      .select({
        propertyId: properties.id,
        propertyName: properties.name,
        revenue: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))`,
        transactions: sql<number>`count(*)`,
        avgDailyRate: sql<number>`avg(CAST(${units.price} AS NUMERIC))`,
        occupiedDays: sql<number>`coalesce(sum(
          EXTRACT(EPOCH FROM (
            least(${bookings.endDate}, ${endDate}) - greatest(${bookings.startDate}, ${startDate})
          )) / 86400
        ), 0)`,
      })
      .from(payments)
      .innerJoin(properties, eq(payments.propertyId, properties.id))
      .leftJoin(units, and(eq(units.propertyId, properties.id), eq(units.status, "booked")))
      .leftJoin(
        bookings,
        and(
          eq(bookings.propertyId, properties.id),
          inArray(bookings.status, ["confirmed", "completed"]),
          gte(bookings.startDate, startDate),
          lte(bookings.endDate, endDate),
        ),
      )
      .where(and(...baseConditions))
      .groupBy(properties.id, properties.name)
      .orderBy(sql`sum(CAST(${payments.amount} AS NUMERIC)) DESC`)
      .limit(10);

    const totalDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const topProperties = topPropertiesRows.map((row) => {
      const occupiedDays = Number(row.occupiedDays || 0);
      const occupancyRate =
        totalDays > 0 ? Math.round((occupiedDays / totalDays) * 100) : 0;

      return {
        propertyId: row.propertyId,
        propertyName: row.propertyName,
        revenue: Number(row.revenue || 0),
        transactions: Number(row.transactions || 0),
        occupancyRate,
        avgDailyRate: Number(row.avgDailyRate || 0),
      };
    });

    return ok({
      totalRevenue,
      totalTransactions,
      averageTransactionValue: Math.round(averageTransactionValue),
      comparedToPreviousPeriod: {
        revenueChange: Math.round(revenueChange * 100) / 100,
        transactionChange: Math.round(transactionChange * 100) / 100,
      },
      monthlyData,
      topProperties,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/owner/revenue");
  }
}
