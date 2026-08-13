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
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|.*\\..*).*)',
  ],
};

const intlMiddleware = createMiddleware(routing);

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

  // API routes must bypass next-intl. Authentication, rate limiting, and CSRF
  // validation are handled by the route handlers, not Edge middleware.
  if (path.startsWith("/api/")) {
    return NextResponse.next()
  }

  return intlMiddleware(request);
}

// Keep a default export for hosting adapters that load the request handler
// through the module default, while Next.js 16 also supports the named export.
export default proxy;
