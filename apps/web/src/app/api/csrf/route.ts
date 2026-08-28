import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const csrfRateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyPrefix: "rl:csrf",
};

async function csrfHandler(): Promise<NextResponse> {
  const token = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
  const response = NextResponse.json({ success: true });

  response.cookies.set("csrf_token", token, {
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}

export async function GET(_req: NextRequest) {
  return withRateLimit(csrfRateLimitConfig, req, csrfHandler);
}
