import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isIndonesian = locale === "id";

  return {
    title: isIndonesian
      ? "KonkosYuk - Platform Sewa Kost & Ruko Paling Aman di Indonesia"
      : "KonkosYuk - The Safest Boarding House & Shophouse Rental Platform in Indonesia",
    description: isIndonesian
      ? "Cari hunian ideal atau kelola properti Anda tanpa ribet. Pembayaran terjamin, lokasi terverifikasi GPS, dan bebas penipuan."
      : "Find your ideal rental or manage your property hassle-free. Guaranteed payments, GPS-verified locations, and fraud-free.",
    openGraph: {
      title: "KonkosYuk - Sewa Kost & Ruko Aman",
      description:
        "Platform sewa properti terpercaya dengan sistem DP 35% yang aman dan verifikasi lokasi GPS.",
      url: `https://konkosyuk.com/${locale}`,
      siteName: "KonkosYuk",
      images: [
        {
          url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=630&fit=crop",
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
      images: [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=630&fit=crop",
      ],
    },
  };
}
