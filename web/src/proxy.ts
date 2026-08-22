import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "id", "my", "th", "vi", "ko", "zh", "ru"],
  defaultLocale: "id",
  localePrefix: "always",
});

// Keep the proxy limited to locale-aware UI requests. API handlers, metadata,
// service workers, and static assets must execute in their native runtimes.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.webmanifest|sw.js|.*\\..*).*)"],
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
    ? `'self' 'nonce-${nonce}' https://translate.google.com https://va.vercel-scripts.com`
    : `'self' 'nonce-${nonce}' 'unsafe-eval' https://translate.google.com https://va.vercel-scripts.com`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.placehold.co https://via.placeholder.com https://images.unsplash.com https://cdn.jsdelivr.net https://tiles.stadiamaps.com https://basemaps.cartocdn.com https://*.cartocdn.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://translate.google.com https://translate.googleapis.com https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://tiles.openstreetmap.org https://tiles.stadiamaps.com https://basemaps.cartocdn.com https://*.cartocdn.com https://*.cartodb.com https://api.maptiler.com https://tiles.maptiler.com https://*.maptiler.com https://va.vercel-scripts.com https://vitals.vercel-insights.com blob: data: ws: wss:",
    "frame-src 'self' https://translate.google.com",
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

  // Skip Next.js internals and static assets
  if (path.startsWith("/_next") || path.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Service workers must be served directly. A redirect (for example, to a
  // locale-prefixed URL) is forbidden when registering a service worker.
  if (path === "/sw.js") {
    return NextResponse.next();
  }

  if (
    path.endsWith("/manifest.webmanifest") ||
    path === "/manifest.webmanifest"
  ) {
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

  // API routes must bypass next-intl. Authentication, rate limiting, and CSRF
  // validation are handled by the route handlers, not Edge middleware.
  if (path.startsWith("/api/")) {
    return NextResponse.next();
  }

  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = await intlMiddleware(request);
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", buildCsp(nonce, isProd));

  return response;
}

// Keep a default export for hosting adapters that load the request handler
// through the module default, while Next.js 16 also supports the named export.
export default proxy;
