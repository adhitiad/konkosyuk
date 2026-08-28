import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { ok, handleApiError } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const session = await requireSession();
    const { key } = await params;

    const enabled = await isFeatureEnabled(
      key,
      session.user.id,
      session.user.role,
    );

    return ok({ enabled });
  } catch (error) {
    return handleApiError(error, "GET /api/feature-flags/[key]");
  }
}
