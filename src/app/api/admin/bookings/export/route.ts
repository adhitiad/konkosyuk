import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, users, properties } from "@/db/schema";
import { validateAdminRequest } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { eq } from "drizzle-orm";

function escapeCsv(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAdminRequest(req);
    if (authResult instanceof Response) return authResult;
    const { session } = authResult;

    const data = await db
      .select({
        id: bookings.id,
        customerName: users.name,
        customerEmail: users.email,
        propertyName: properties.name,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        status: bookings.status,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.userId))
      .innerJoin(properties, eq(properties.id, bookings.propertyId))
      .orderBy(bookings.createdAt);

    const header = [
      "ID",
      "Customer Name",
      "Customer Email",
      "Property",
      "Start Date",
      "End Date",
      "Status",
      "Created At",
    ];

    const rows = data.map((booking) =>
      [
        booking.id,
        booking.customerName,
        booking.customerEmail,
        booking.propertyName,
        booking.startDate?.toISOString?.() ?? "",
        booking.endDate?.toISOString?.() ?? "",
        booking.status,
        booking.createdAt?.toISOString?.() ?? "",
      ]
        .map((value) => escapeCsv(String(value ?? "")))
        .join(","),
    );

    const csv = [header.join(","), ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=bookings.csv",
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/bookings/export");
  }
}
