import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { auth } from "@/lib/auth";

export const routing = defineRouting({
  locales: ["en", "id", "my", "th", "vi", "ko", "zh", "ru"],
  defaultLocale: "id",
  localePrefix: "always",
});

// Keep the proxy limited to locale-aware UI requests. API handlers, metadata,
// service workers, and static assets must execute in their native runtimes.
export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.webmanifest|sw.js|.*\\..*).*)",
  ],
};

function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function buildCsp(nonce: string, isProd: boolean): string {
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' https://va.vercel-scripts.com https://analytics.ahrefs.com`
    : `'self' 'nonce-${nonce}' 'unsafe-eval' https://va.vercel-scripts.com https://analytics.ahrefs.com`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://tiles.stadiamaps.com https://basemaps.cartocdn.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://tile.openstreetmap.org https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://nominatim.openstreetmap.org https://tile.openstreetmap.org https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org https://tiles.openstreetmap.org https://tiles.stadiamaps.com https://basemaps.cartocdn.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://*.cartodb.com https://api.maptiler.com https://tiles.maptiler.com https://*.maptiler.com https://demotiles.maplibre.org https://va.vercel-scripts.com https://vitals.vercel-insights.com https://analytics.ahrefs.com blob: data: ws: wss:",
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "manifest-src 'self'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProd = process.env.NODE_ENV === "production";

  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  // Skip Next.js internals and static assets
  if (path.startsWith("/_next") || path.startsWith("/favicon")) {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Service workers must be served directly. A redirect (for example, to a
  // locale-prefixed URL) is forbidden when registering a service worker.
  if (path === "/sw.js") {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  if (
    path.endsWith("/manifest.webmanifest") ||
    path === "/manifest.webmanifest"
  ) {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
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
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // API routes must bypass next-intl. Authentication, rate limiting, and CSRF
  // validation are handled by the route handlers, not Edge middleware.
  if (path.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Admin routes require ADMIN role
  if (path.startsWith("/admin/") || path === "/admin") {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }

    if (session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = await intlMiddleware(request);
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", buildCsp(nonce, isProd));

  return response;
}

// Keep a default export for hosting adapters that load the request handler
// through the module default, while Next.js 16 also supports the named export.
export default proxy;
