import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
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
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production'

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                } as const,
              ]
            : []),
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.google.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "img-src 'self' data: https://cdn.jsdelivr.net https://*.openstreetmap.org https://*.tile.openstreetmap.org https://*.uploadthing.com https://utfs.io https://res.cloudinary.com https://*.placehold.co https://via.placeholder.com",
              "font-src 'self' data: https://cdn.jsdelivr.net",
              "connect-src 'self' https://nominatim.openstreetmap.org https://translate.google.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              ...(isProd ? ["upgrade-insecure-requests"] : []),
            ].join("; "),
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);