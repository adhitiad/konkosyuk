import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { validateAdminRequest } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api";

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

    const data = await db
      .select({
        id: properties.id,
        name: properties.name,
        address: properties.address,
        city: properties.city,
        type: properties.type,
        basePrice: properties.basePrice,
        status: properties.status,
        isActive: properties.isActive,
        gpsVerified: properties.gpsVerified,
        createdAt: properties.createdAt,
      })
      .from(properties)
      .orderBy(properties.createdAt);

    const header = [
      "ID",
      "Name",
      "Address",
      "City",
      "Type",
      "Base Price",
      "Status",
      "Active",
      "GPS Verified",
      "Created At",
    ];

    const rows = data.map((property) =>
      [
        property.id,
        property.name,
        property.address,
        property.city,
        property.type,
        property.basePrice,
        property.status,
        property.isActive ? "true" : "false",
        property.gpsVerified ? "true" : "false",
        property.createdAt?.toISOString?.() ?? "",
      ]
        .map((value) => escapeCsv(String(value ?? "")))
        .join(","),
    );

    const csv = [header.join(","), ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=properties.csv",
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/properties/export");
  }
}
