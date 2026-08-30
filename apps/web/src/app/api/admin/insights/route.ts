import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, properties, bookings, payments } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { count, sum, eq, gte, lte, and } from "drizzle-orm";
import type { Role } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin"] as Role[]);

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

    const [
      [{ total: totalUsers }],
      [{ total: activeUsers }],
      [{ total: totalProperties }],
      [{ total: activeProperties }],
      [{ total: totalBookings }],
      [{ total: confirmedBookings }],
      [{ total: completedBookings }],
      [{ total: cancelledBookings }],
      [{ total: totalRevenue }],
      [{ total: monthlyRevenue }],
    ] = await Promise.all([
      db.select({ total: count() }).from(users),
      db.select({ total: count() }).from(users).where(eq(users.isActive, true)),
      db.select({ total: count() }).from(properties),
      db.select({ total: count() }).from(properties).where(eq(properties.status, "aktif")),
      db.select({ total: count() }).from(bookings),
      db.select({ total: count() }).from(bookings).where(eq(bookings.status, "confirmed")),
      db.select({ total: count() }).from(bookings).where(eq(bookings.status, "completed")),
      db.select({ total: count() }).from(bookings).where(eq(bookings.status, "cancelled")),
      db.select({ total: sum(payments.amount) }).from(payments).where(eq(payments.status, "success")),
      db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.status, "success"),
            gte(payments.paidAt, startOfMonth),
            lte(payments.paidAt, endOfMonth),
          ),
        ),
    ]);

    const confirmationRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

    return ok({
      userStats: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: 0,
      },
      propertyStats: {
        total: totalProperties,
        active: activeProperties,
        featured: 0,
        gpsVerified: 0,
      },
      bookingStats: {
        total: totalBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        confirmationRate: Math.round(confirmationRate),
      },
      platformHealth: {
        totalRevenue: Number(totalRevenue || 0),
        monthlyRevenue: Number(monthlyRevenue || 0),
        activeOwners: 0,
        activeTenants: 0,
      },
    });
  } catch (error) {
    return handleApiError(error, "Admin insights error");
  }
}
