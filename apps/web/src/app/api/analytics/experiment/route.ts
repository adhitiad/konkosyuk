import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail, handleApiError } from "@/lib/api";

export async function POST(_request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }

    const { experimentId, event, properties } = await request.json();

    if (!experimentId || !event) {
      return fail("experimentId and event are required", 400);
    }

    const { trackExperimentEvent } = await import("@/lib/experiments/experiment-manager");
    await trackExperimentEvent(session.user.id, experimentId, event, properties);

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "POST /api/analytics/experiment");
  }
}
