import { NextRequest } from "next/server";
import { db } from "@/db";
import { inspectionTemplates } from "@/db/schema";
import { ok, handleApiError } from "@/lib/api";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyType = searchParams.get("propertyType") as "kost" | "kontrakan" | "ruko" | null;

    const conditions = [];
    if (propertyType) {
      conditions.push(eq(inspectionTemplates.propertyType, propertyType));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const templates = await db
      .select()
      .from(inspectionTemplates)
      .where(where)
      .orderBy(desc(inspectionTemplates.isDefault), desc(inspectionTemplates.createdAt));

    return ok(templates);
  } catch (error) {
    return handleApiError(error, "GET /api/inspections/templates");
  }
}
