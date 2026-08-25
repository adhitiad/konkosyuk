import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq, sql, ilike, and } from "drizzle-orm";
import { handleApiError, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "city";

    if (!q || q.length < 2) {
      return ok([]);
    }

    if (type === "district") {
      const rows = await db
        .select({
          district: properties.district,
          city: properties.city,
          province: properties.province,
          count: sql<number>`count(*)`,
        })
        .from(properties)
        .where(
          and(
            ilike(properties.district, `%${q}%`),
            eq(properties.isActive, true),
          ),
        )
        .groupBy(properties.district, properties.city, properties.province)
        .orderBy(sql`count(*) desc`)
        .limit(20);

      return ok(
        rows.map((r) => ({
          district: r.district,
          city: r.city,
          province: r.province,
          propertyCount: Number(r.count),
          label: `${r.district}, ${r.city}`,
          value: r.district,
        })),
      );
    }

    const rows = await db
      .select({
        city: properties.city,
        province: properties.province,
        count: sql<number>`count(*)`,
      })
      .from(properties)
      .where(
        and(
          ilike(properties.city, `%${q}%`),
          eq(properties.isActive, true),
        ),
      )
      .groupBy(properties.city, properties.province)
      .orderBy(sql`count(*) desc`)
      .limit(20);

    return ok(
      rows.map((r) => ({
        city: r.city,
        province: r.province,
        propertyCount: Number(r.count),
        label: `${r.city}, ${r.province}`,
        value: r.city,
      })),
    );
  } catch (error) {
    return handleApiError(error, "GET /api/locations");
  }
}
