import { MetadataRoute } from "next";
import { locales } from "@/config";
import { SITE_URL } from "@/components/seo/schema";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  const localePrefixedDisallow = locales.flatMap((locale) => [
    `/${locale}/dashboard/*`,
    `/${locale}/owner/*`,
    `/${locale}/admin/*`,
    `/${locale}/api/*`,
    `/${locale}/login`,
    `/${locale}/register`,
    `/${locale}/forgot-password`,
    `/${locale}/settings/*`,
    `/${locale}/notifications/*`,
    `/${locale}/saved-searches/*`,
    `/${locale}/chat/*`,
    `/${locale}/payment-result/*`,
    `/${locale}/mock-checkout/*`,
    `/${locale}/ads/submit`,
  ]);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/*", ...localePrefixedDisallow],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/*", ...localePrefixedDisallow],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
