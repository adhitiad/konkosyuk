import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authRateLimit, bookingRateLimit } from "@/lib/rate-limit";
import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { auth } from "@/lib/auth";
import { locales } from "@/config";

const protectedRoutes: Record<string, string[]> = {
  "/dashboard": ["cust"],
  "/owner": ["owner"],
  "/admin": ["admin", "staff"],
};

const roleHome: Record<string, string> = {
  cust: "/dashboard",
  owner: "/owner",
  admin: "/admin",
  staff: "/admin",
};

export const routing = defineRouting({
  locales: ["en", "id", "my", "th", "vi", "ko", "zh", "ru"],
  defaultLocale: "id",
  localePrefix: "always",
});

const intlMiddleware = createMiddleware(routing);

function getLocaleFromPath(pathname: string): string | null {
  const first = pathname.split("/")[1];
  if (first && locales.includes(first as (typeof locales)[number])) {
    return first;
  }
  return null;
}

function getPathWithoutLocale(pathname: string): string {
  const locale = getLocaleFromPath(pathname);
  if (!locale) return pathname;
  return pathname.slice(locale.length + 1) || "/";
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip Next.js internals and static assets
  if (path.startsWith("/_next") || path.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Skip static assets from internationalization
  const staticAssetExtensions = [
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".webp",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
  ];
  if (staticAssetExtensions.some((ext) => path.endsWith(ext))) {
    return NextResponse.next();
  }

  // 1. API routes: Apply rate limiting, do NOT apply next-intl
  if (path.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    if (path.startsWith("/api/auth")) {
      const result = authRateLimit({ ip });
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: "Too many requests" },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(
                (result.resetAt.getTime() - Date.now()) / 1000,
              ).toString(),
            },
          },
        );
      }
    }

    if (path.startsWith("/api/bookings") && request.method === "POST") {
      const result = bookingRateLimit({ ip });
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: "Too many requests" },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(
                (result.resetAt.getTime() - Date.now()) / 1000,
              ).toString(),
            },
          },
        );
      }
    }

    return NextResponse.next();
  }

  // 2. Auth checks for protected pages
  const pathWithoutLocale = getPathWithoutLocale(path);
  const locale = getLocaleFromPath(path) || routing.defaultLocale;

  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (
      pathWithoutLocale === route ||
      pathWithoutLocale.startsWith(`${route}/`)
    ) {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set("redirect", pathWithoutLocale);
        return NextResponse.redirect(loginUrl);
      }

      const userRole = session.user.role as string;
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(
          new URL(`/${locale}${roleHome[userRole] || "/"}`, request.url),
        );
      }

      // Allow it to fall through to next-intl middleware
      break;
    }
  }

  // 3. next-intl routing for UI pages
  return intlMiddleware(request);
}
