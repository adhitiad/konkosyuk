import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { validateCsrfToken } from "@/lib/csrf";
import { withAdminRateLimit } from "@/lib/admin-rate-limit";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function validateMutationCsrf(req: NextRequest) {
  const result = validateCsrfToken(req);
  return result.success ? null : (result.error as NextResponse);
}

export async function validateActionCsrf(formData: FormData): Promise<string | null> {
  const token = formData.get("csrf") as string | null;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("csrf_token")?.value ?? null;
  if (!cookieToken || !token || !safeCompare(cookieToken, token)) {
    return "Invalid CSRF token";
  }
  return null;
}

export async function requireSession(allowedRoles?: string[]) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as {
    user: { id: string; email: string; name: string; role: string };
  } | null;

  if (!session) {
    throw new Error("Tidak berwenang");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new Error("Dilarang");
  }

  return session;
}

export async function validateAdminRequest(req: NextRequest) {
  const session = await requireSession(["admin", "staff"]);

  const rateLimitResult = await withAdminRateLimit();
  if (rateLimitResult) return rateLimitResult;

  if (
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    req.method !== "OPTIONS"
  ) {
    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.success) {
      return csrfResult.error as NextResponse;
    }
  }

  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  return { session, ipAddress, userAgent };
}

export async function validateAdminOnlyRequest(req: NextRequest) {
  const session = await requireSession(["admin"]);

  const rateLimitResult = await withAdminRateLimit();
  if (rateLimitResult) return rateLimitResult;

  if (
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    req.method !== "OPTIONS"
  ) {
    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.success) {
      return csrfResult.error as NextResponse;
    }
  }

  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  return { session, ipAddress, userAgent };
}
