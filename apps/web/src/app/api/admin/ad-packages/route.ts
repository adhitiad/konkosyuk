import { NextRequest } from "next/server";
import { db } from "@/db";
import { adPackages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const createPackageSchema = z.object({
  name: z.string().min(1, "Nama paket wajib diisi"),
  label: z.string().min(1, "Label wajib diisi"),
  tier: z.enum(["reguler", "utama", "premium"]),
  duration: z.coerce.number().int().positive("Durasi harus lebih dari 0"),
  price: z.coerce.number().positive("Harga harus lebih dari 0"),
  positionType: z.enum(["rotation", "fixed_1", "fixed_2"]),
  sortOrder: z.coerce.number().int().default(0),
});

export async function GET() {
  try {
    await requireSession(["admin"]);

    const packages = await db
      .select()
      .from(adPackages)
      .orderBy(
        desc(adPackages.isActive),
        adPackages.tier,
        adPackages.sortOrder,
      );

    const grouped = packages.reduce<Record<string, typeof packages>>(
      (acc, pkg) => {
        if (!acc[pkg.tier]) acc[pkg.tier] = [];
        acc[pkg.tier].push(pkg);
        return acc;
      },
      {},
    );

    return ok({ packages: grouped });
  } catch (error) {
    logError(error, "GET /api/admin/ad-packages");
    return handleApiError(error, "GET /api/admin/ad-packages");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(["admin"]);

    const body = await req.json();
    const validated = createPackageSchema.parse(body);

    const [existing] = await db
      .select()
      .from(adPackages)
      .where(eq(adPackages.name, validated.name))
      .limit(1);

    if (existing) {
      return fail("Paket dengan nama ini sudah ada", 409);
    }

    const [pkg] = await db
      .insert(adPackages)
      .values({
        name: validated.name,
        label: validated.label,
        tier: validated.tier,
        duration: validated.duration,
        price: validated.price.toString(),
        positionType: validated.positionType,
        sortOrder: validated.sortOrder,
      })
      .returning();

    return ok(pkg, 201);
  } catch (error) {
    logError(error, "POST /api/admin/ad-packages");
    return handleApiError(error, "POST /api/admin/ad-packages");
  }
}
