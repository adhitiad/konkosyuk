import { MetadataRoute } from "next";
import { locales } from "@/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://konkosyuk.com";

  const localePrefixedDisallow = locales.flatMap((locale) => [
    `/${locale}/dashboard/*`,
    `/${locale}/owner/*`,
    `/${locale}/admin/*`,
    `/${locale}/api/*`,
  ]);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/*", ...localePrefixedDisallow],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
