import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import type { NewProperty } from "@/db/schema";
import { eq, desc, and, or, sql, like } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { createPropertySchema } from "@/lib/zod";
import type { Role } from "@/lib/auth";
import { logError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(["owner", "admin", "staff"] as Role[]);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const city = searchParams.get("city");
    const status = searchParams.get("status");

    const conditions = [eq(properties.ownerId, session.user.id)];

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(properties.name, term),
          like(properties.address, term),
          like(properties.description, term),
        ),
      );
    }

    if (type) {
      conditions.push(
        eq(properties.type, type as "kost" | "kontrakan" | "ruko"),
      );
    }

    if (city) {
      conditions.push(eq(properties.city, city));
    }

    if (status) {
      conditions.push(eq(properties.status, status as "aktif" | "nonaktif"));
    }

    const where = and(...conditions);

    const data = await db
      .select({
        id: properties.id,
        name: properties.name,
        description: properties.description,
        address: properties.address,
        province: properties.province,
        city: properties.city,
        district: properties.district,
        type: properties.type,
        basePrice: properties.basePrice,
        packages: properties.packages,
        status: properties.status,
        amenities: properties.amenities,
        metadata: properties.metadata,
        images: properties.images,
        latitude: properties.latitude,
        longitude: properties.longitude,
        isActive: properties.isActive,
        isFeatured: properties.isFeatured,
        gpsVerified: properties.gpsVerified,
        featuredUntil: properties.featuredUntil,
        icalExportToken: properties.icalExportToken,
        icalImportUrl: properties.icalImportUrl,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
        ownerId: properties.ownerId,
      })
      .from(properties)
      .where(where)
      .orderBy(desc(properties.createdAt));

    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(where);

    return ok({
      data,
      meta: {
        total: Number(count[0]?.count ?? 0),
        page: 1,
        limit: 100,
        totalPages: 1,
      },
    });
  } catch (error) {
    logError(error, "GET /api/owner/properties");
    return handleApiError(error, "GET /api/owner/properties");
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner", "admin", "staff"] as Role[]);
    const body = createPropertySchema.parse(await req.json());

    if (session.user.role === "owner") {
      if (session.user.kycStatus !== "verified") {
        return fail("Verifikasi KTP Anda terlebih dahulu.", 403);
      }

      if (!session.user.phone) {
        return fail("Nomor HP/WA wajib diisi di profil.", 400);
      }

      if (!session.user.name || session.user.name.trim().length < 2) {
        return fail(
          "Nama profil tidak sesuai dengan data KYC terverifikasi.",
          400,
        );
      }
    }

    const [property] = await db
      .insert(properties)
      .values({
        name: body.title,
        description: body.description,
        address: body.address,
        province: body.province,
        city: body.city,
        district: body.district,
        type: body.type,
        basePrice: body.basePrice,
        packages: body.packages,
        status: body.status,
        amenities: body.amenities,
        images: body.images,
        metadata: body.metadata,
        ownerId: session.user.id,
        latitude:
          body.latitude !== undefined ? String(body.latitude) : undefined,
        longitude:
          body.longitude !== undefined ? String(body.longitude) : undefined,
        isActive: body.isActive ?? false,
        isFeatured: body.isFeatured ?? false,
        gpsVerified: body.gpsVerified ?? false,
        featuredUntil: body.featuredUntil
          ? new Date(body.featuredUntil)
          : undefined,
        icalExportToken: body.icalExportToken,
        icalImportUrl: body.icalImportUrl,
      } satisfies NewProperty)
      .returning();

    return ok(property, 201);
  } catch (error) {
    logError(error, "POST /api/owner/properties");
    return handleApiError(error, "POST /api/owner/properties");
  }
}
