import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.placehold.co",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "tiles.stadiamaps.com",
      },
      {
        protocol: "https",
        hostname: "basemaps.cartocdn.com",
      },
      {
        protocol: "https",
        hostname: "*.cartocdn.com",
      },
      {
        protocol: "https",
        hostname: "tile.openstreetmap.org",
      },
      {
        protocol: "https",
        hostname: "*.tile.openstreetmap.org",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },
  turbopack: {},
  experimental: {
    optimizePackageImports: [
      "@tanstack/react-query",
      "framer-motion",
      "react-map-gl/maplibre",
      "maplibre-gl",
      "lucide-react",
      "@hugeicons/react",
      "@hugeicons/core-free-icons",
      "recharts",
      "date-fns",
    ],
    scrollRestoration: true,
  },
  typedRoutes: false,
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            key: "X-Download-Options",
            value: "noopen",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              isProd
                ? "script-src 'self' 'unsafe-inline' https://translate.google.com https://va.vercel-scripts.com"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.google.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
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
            ].join("; "),
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
