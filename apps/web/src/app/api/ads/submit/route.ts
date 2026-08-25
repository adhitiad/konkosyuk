import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds, adPackages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/lib/api";
import { enforceRateLimit, publicRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { logApiRequest, logError } from "@/lib/logger";
import { validateMutationCsrf } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const submitAdSchema = z.object({
  advertiserName: z.string().min(1, "Nama lengkap wajib diisi"),
  advertiserPhone: z.string().min(1, "No. HP/WA wajib diisi"),
  advertiserWhatsApp: z.string().optional(),
  title: z.string().min(1, "Judul iklan wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi").max(200, "Deskripsi maksimal 200 karakter"),
  imageUrl: z.string().url("URL gambar tidak valid"),
  targetUrl: z.string().url("URL tujuan tidak valid").optional().or(z.literal("")),
  location: z.string().min(1, "Lokasi wajib diisi"),
  type: z.enum(["kos", "kontrakan", "apartemen", "rumah"]),
  packageId: z.string().uuid("Paket iklan tidak valid"),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;

    const limited = await enforceRateLimit(req, publicRateLimit);
    if (limited) return limited;

    const body = await req.json();
    const validated = submitAdSchema.parse(body);

    const [pkg] = await db
      .select()
      .from(adPackages)
      .where(and(eq(adPackages.id, validated.packageId), eq(adPackages.isActive, true)))
      .limit(1);

    if (!pkg) {
      return fail("Paket iklan tidak ditemukan atau tidak aktif", 400);
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + pkg.duration * 24 * 60 * 60 * 1000);

    const [ad] = await db
      .insert(propertyAds)
      .values({
        advertiserName: validated.advertiserName,
        advertiserPhone: validated.advertiserPhone,
        advertiserWhatsApp: validated.advertiserWhatsApp || null,
        title: validated.title,
        description: validated.description,
        imageUrl: validated.imageUrl,
        targetUrl: validated.targetUrl || null,
        location: validated.location,
        price: pkg.price.toString(),
        type: validated.type,
        packageId: validated.packageId,
        paymentStatus: "pending",
        isActive: false,
        startDate: now,
        endDate,
      })
      .returning();

    const duration = Date.now() - startTime;
    logApiRequest("POST", "/api/ads/submit", 201, duration);

    return ok(
      {
        success: true,
        message: "Iklan Anda akan ditinjau dalam 1x24 jam",
        data: ad,
      },
      201,
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, "POST /api/ads/submit");
    logApiRequest("POST", "/api/ads/submit", 400, duration);
    return handleApiError(error, "POST /api/ads/submit");
  }
}
