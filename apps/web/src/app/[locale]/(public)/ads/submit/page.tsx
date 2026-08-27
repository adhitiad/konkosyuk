import { Metadata } from "next";
import { locales } from "@/config";
import { SITE_URL } from "@/components/seo/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isIndonesian = locale === "id";

  return {
    title: isIndonesian
      ? "Pasang Iklan Properti - KonkosYuk"
      : "Advertise Property - KonkosYuk",
    description: isIndonesian
      ? "Tampilkan properti Anda di KonkosYuk dan jangkau ribuan pencari hunian."
      : "List your property on KonkosYuk and reach thousands of renters.",
    alternates: {
      canonical: `/${locale}/ads/submit`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/ads/submit`]),
      ) as Record<string, string>,
    } as Metadata["alternates"] & { "x-default": string },
    openGraph: {
      title: "Pasang Iklan Properti - KonkosYuk",
      description: "Tampilkan properti Anda di KonkosYuk.",
      url: `${SITE_URL}/${locale}/ads/submit`,
      siteName: "KonkosYuk",
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: "Pasang Iklan Properti KonkosYuk",
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Pasang Iklan Properti - KonkosYuk",
      description: "Tampilkan properti Anda di KonkosYuk.",
      images: [`${SITE_URL}/og-image.jpg`],
    },
  };
}

import { SubmitAdForm } from "./submit-ad-form";

export default function SubmitAdPage() {
  return <SubmitAdForm />;
}
