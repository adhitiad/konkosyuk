import { Metadata } from "next";
import { locales } from "@/config";
import { SITE_URL, DEFAULT_OG_IMAGE, breadcrumbSchema } from "@/components/seo/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isIndonesian = locale === "id";

  const alternates = {
    canonical: `/${locale}`,
    languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])) as Record<
      string,
      string
    >,
    "x-default": "/id",
  };

  return {
    title: isIndonesian
      ? "KonkosYuk - Platform Sewa Kost & Ruko Paling Aman di Indonesia"
      : "KonkosYuk - The Safest Boarding House & Shophouse Rental Platform in Indonesia",
    description: isIndonesian
      ? "Cari hunian ideal atau kelola properti Anda tanpa ribet. Pembayaran terjamin, lokasi terverifikasi GPS, dan bebas penipuan."
      : "Find your ideal rental or manage your property hassle-free. Guaranteed payments, GPS-verified locations, and fraud-free.",
    alternates,
    openGraph: {
      title: "KonkosYuk - Sewa Kost & Ruko Aman",
      description:
        "Platform sewa properti terpercaya dengan sistem DP 35% yang aman dan verifikasi lokasi GPS.",
      url: `https://konkosyuk.com/${locale}`,
      siteName: "KonkosYuk",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "KonkosYuk Landing Page",
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "KonkosYuk - Sewa Kost & Ruko Aman",
      description:
        "Platform sewa properti terpercaya dengan sistem DP 35% yang aman.",
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      "zero-threat-verification": "zeroThreat=MTEwMTI=TVRFd01UST0=TVRFd01UST",
    },
  };
}

export async function generateJsonLd({ locale }: { locale: string }) {
  return [
    breadcrumbSchema([
      { name: "Home", url: `${SITE_URL}/${locale}` },
    ]),
  ];
}
