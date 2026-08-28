import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getAblyAuth } from "@/lib/ably/server";

export async function GET(request: NextRequest) {
  try {
    await requireSession(["admin"]);

    const auth = await getAblyAuth();

    const tokenParams = {
      clientId: request.headers.get("x-request-id") || "admin",
      capability: {
        "admin:stats": ["subscribe"],
      } as Record<string, readonly string[]>,
      ttl: 3600,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokenResult = await auth.requestToken(tokenParams as any);
    const token = (tokenResult as unknown as { token: string }).token;

    return NextResponse.json({
      token,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("[admin-ably-auth] Gagal membuat token request", error);
    return NextResponse.json(
      { error: "Gagal membuat token Ably" },
      { status: 401 },
    );
  }
}
