import { getAblyAuth } from "@/lib/ably/server";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await requireSession([
      "owner",
      "cust",
      "admin",
      "staff",
    ] as const);

    const body = await req.json().catch(() => ({}));
    const { channelName } = body as { channelName?: string };

    if (!channelName) {
      return fail("channelName wajib diisi", 400);
    }

    const auth = await getAblyAuth();

    const tokenParams = {
      clientId: session.user.id,
      timestamp: Math.floor(Date.now() / 1000),
      ttl: 3600,
    };

    const tokenResult = await auth.requestToken(tokenParams);

    return ok({
      token: tokenResult.token,
      channelName,
      expiresIn: 3600,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/auth/ably-token");
  }
}
