import { NextRequest } from "next/server";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { validateAdminRequest } from "@/lib/api-auth";
import { ok, handleApiError } from "@/lib/api";
import { enforceRateLimit, adminRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, adminRateLimit);
    if (limited) return limited;

    const authResult = await validateAdminRequest(req);
    if (authResult instanceof Response) return authResult;
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    const status = searchParams.get("status");

    const conditions = [];
    if (provider) {
      conditions.push(eq(webhookEvents.provider, provider));
    }
    if (status === "processed") {
      conditions.push(sql`${webhookEvents.processedAt} IS NOT NULL`);
    } else if (status === "pending") {
      conditions.push(sql`${webhookEvents.processedAt} IS NULL`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(webhookEvents)
      .where(where)
      .orderBy(desc(webhookEvents.createdAt))
      .limit(100);

    return ok({ data, meta: { total: data.length } });
  } catch (error) {
    return handleApiError(error);
  }
}
