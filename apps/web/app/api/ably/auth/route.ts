import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getAblyAuth } from "@/lib/ably/server";

export async function GET(_request: NextRequest) {
  try {
    const session = await requireSession();

    const auth = await getAblyAuth();

    const tokenParams = {
      clientId: session.user.id,
      capability: {
        [`user:${session.user.id}:notifications`]: ["subscribe"],
        [`user:${session.user.id}:*`]: ["subscribe"],
      } as Record<string, string[]>,
      ttl: 3600,
    };

    const tokenResult = await auth.requestToken(tokenParams);
    const token = (tokenResult as { token: string }).token;
    const expiresIn = (tokenResult as { expiresIn: number }).expiresIn;

    return NextResponse.json({
      token,
      expiresIn,
      clientId: session.user.id,
    });
  } catch (error) {
    console.error("[ably-auth] Error creating token request", error);
    return NextResponse.json(
      { error: "Gagal membuat token Ably" },
      { status: 401 },
    );
  }
}