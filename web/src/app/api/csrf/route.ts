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
  const response = NextResponse.json({ success: true, token });

  response.cookies.set("csrf_token", token, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}

export async function GET(req: NextRequest) {
  return withRateLimit(csrfRateLimitConfig, req, csrfHandler);
}
