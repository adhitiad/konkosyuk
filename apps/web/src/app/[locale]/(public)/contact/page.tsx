import { Metadata } from "next";
import { locales } from "@/config";
import { SITE_URL } from "@/components/seo/schema";
import { ContactForm } from "./contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isIndonesian = locale === "id";

  return {
    title: isIndonesian
      ? "Hubungi Kami - KonkosYuk"
      : "Contact Us - KonkosYuk",
    description: isIndonesian
      ? "Hubungi tim support KonkosYuk untuk bantuan sewa kost dan kontrakan."
      : "Contact KonkosYuk support team for rental assistance.",
    alternates: {
      canonical: `/${locale}/contact`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/contact`]),
      ) as Record<string, string>,
    } as Metadata["alternates"] & { "x-default": string },
    openGraph: {
      title: "Hubungi Kami - KonkosYuk",
      description: "Tim support kami siap membantu Anda.",
      url: `${SITE_URL}/${locale}/contact`,
      siteName: "KonkosYuk",
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: "Hubungi KonkosYuk",
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Hubungi Kami - KonkosYuk",
      description: "Tim support kami siap membantu Anda.",
      images: [`${SITE_URL}/og-image.jpg`],
    },
  };
}

export default function ContactPage() {
  return <ContactForm />;
}
