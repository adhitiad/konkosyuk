import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

const csrfTokenKey = "x-csrf-token";
const csrfCookieName = "csrf_token";

export function getCsrfToken(req: NextRequest): string | null {
  return req.cookies.get(csrfCookieName)?.value ?? null;
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function validateCsrfToken(req: NextRequest): {
  success: boolean;
  error?: NextResponse;
} {
  const token = getCsrfToken(req);
  const headerToken = req.headers.get(csrfTokenKey);

  if (!token || !headerToken || !safeCompare(token, headerToken)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 },
      ),
    };
  }

  return { success: true };
}
