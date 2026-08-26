import { MetadataRoute } from "next";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { locales } from "@/config";
import { SITE_URL } from "@/components/seo/schema";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    SITE_URL;
  const generatedAt = new Date();

  let activeProperties: { id: string; updatedAt: Date }[] = [];
  try {
    activeProperties = await db
      .select({
        id: properties.id,
        updatedAt: properties.updatedAt,
      })
      .from(properties)
      .where(eq(properties.status, "aktif"));
  } catch {
    // Database tidak tersedia saat build — gunakan URL statis saja
  }

  const alternates = Object.fromEntries(
    locales.map((locale) => [locale, `${baseUrl}/${locale}`]),
  );

  const staticUrls = locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: generatedAt,
    changeFrequency: "daily" as const,
    priority: 1,
    alternates: { languages: alternates },
  }));

  const propertyUrls = activeProperties.flatMap((property) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/properties/${property.id}`,
      lastModified: property.updatedAt,
      changeFrequency: "weekly" as const,
      alternates: { languages: alternates },
    })),
  );

  const staticPages = [
    { path: "/properties", priority: 0.9 },
    { path: "/about", priority: 0.8 },
    { path: "/faq", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
    { path: "/privacy", priority: 0.5 },
    { path: "/refund-policy", priority: 0.5 },
    { path: "/umum/syarat-dan-ketentuan", priority: 0.5 },
    { path: "/ads/submit", priority: 0.6 },
  ];

  const staticPageUrls = staticPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${page.path}`,
      lastModified: generatedAt,
      changeFrequency: "monthly" as const,
      priority: page.priority,
      alternates: { languages: alternates },
    })),
  );

  return [
    ...staticUrls,
    ...staticPageUrls,
    ...propertyUrls,
  ];
}
