import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function manifest({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<MetadataRoute.Manifest> {
  const { locale: rawLocale } = await params;
  const locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : "id";

  return {
    name: "KonkosYuk",
    short_name: "KonkosYuk",
    description: "Booking kost dan kontrakan dengan aman.",
    start_url: `/${locale}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
