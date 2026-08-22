import { db } from "@/db";
import { tags } from "@/db/schema";
import { ok, handleApiError } from "@/lib/api";
import { desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession(["owner", "admin", "staff"]);
    const data = await db
      .select({
        id: tags.id,
        name: tags.name,
        category: tags.category,
      })
      .from(tags)
      .orderBy(desc(tags.category), tags.name);

    return ok({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
