import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authRateLimit, bookingRateLimit, adminRateLimit } from "@/lib/rate-limit";
import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { auth } from "@/lib/auth";
import { locales } from "@/config";
import { getOrCreateDeviceId, getDeviceName, generateDeviceId } from "@/lib/device";
import { validateCsrfToken } from "@/lib/csrf";

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

  // Service workers must be served directly. A redirect (for example, to a
  // locale-prefixed URL) is forbidden when registering a service worker.
  if (path === "/sw.js") {
    return NextResponse.next();
  }

  if (path.endsWith("/manifest.webmanifest") || path === "/manifest.webmanifest") {
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
    ".geojson",
    ".js",
  ];
  if (staticAssetExtensions.some((ext) => path.endsWith(ext))) {
    return NextResponse.next();
  }

  // 1. API routes: Apply rate limiting, do NOT apply next-intl
  if (path.startsWith("/api/")) {
    let deviceId = request.cookies.get("device_id")?.value
    if (!deviceId) {
      deviceId = generateDeviceId()
    }

    const deviceName = request.cookies.get("device_name")?.value || "unknown"

    if (path.startsWith("/api/auth")) {
      const result = await authRateLimit({ deviceId, deviceName })
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
        )
      }
    }

    if (path.startsWith("/api/bookings") && request.method === "POST") {
      const result = await bookingRateLimit({ deviceId, deviceName })
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
        )
      }
    }

    if (path.startsWith("/api/admin")) {
      const result = await adminRateLimit({ deviceId, deviceName })
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
        )
      }

      if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
        const csrfToken = request.headers.get("x-csrf-token")
        const csrfCookie = request.cookies.get("csrf_token")?.value
        if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
          return NextResponse.json(
            { success: false, error: "Invalid or missing CSRF token" },
            { status: 403 }
          )
        }
      }
    }

    const response = NextResponse.next()
    if (!request.cookies.has("device_id")) {
      response.cookies.set("device_id", deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      })
    }
    if (!request.cookies.has("device_name")) {
      response.cookies.set("device_name", deviceName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      })
    }
    if (!request.cookies.has("csrf_token")) {
      const csrfToken = crypto.randomUUID().replace(/-/g, "")
      response.cookies.set("csrf_token", csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      })
    }

    return response
  }

  // 2. Auth checks for protected pages
  const pathWithoutLocale = getPathWithoutLocale(path);
  const locale = getLocaleFromPath(path) || routing.defaultLocale;

  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (
      pathWithoutLocale === route ||
      pathWithoutLocale.startsWith(`${route}/`)
    ) {
      let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null
      try {
        session = await auth.api.getSession({
          headers: request.headers,
        });
      } catch {
        session = null
      }

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
