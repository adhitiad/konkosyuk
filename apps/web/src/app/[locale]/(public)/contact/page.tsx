"use client";

import { StaticPageLayout } from "@/components/static-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Metadata } from "next";
import { locales } from "@/config";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, breadcrumbSchema } from "@/components/seo/schema";

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
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <StaticPageLayout title="Hubungi Kami">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/id` },
          { name: "Hubungi Kami", url: `${SITE_URL}/id/contact` },
        ])}
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2>Informasi Kontak</h2>
          <p className="text-muted-foreground">
            Tim support kami siap membantu Anda. Hubungi kami melalui channel di
            bawah ini.
          </p>
          {/* <div className="mt-4 space-y-3">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:support@konkosyuk.com" className="text-primary hover:underline">
                support@konkosyuk.com
              </a>
            </p>
            <p>
              <strong>WhatsApp:</strong>{' '}
              <a href="https://wa.me/6281234567890" className="text-primary hover:underline">
                +62 812-3456-7890
              </a>
            </p>
            <p>
              <strong>Alamat Kantor:</strong>
              <br />
              Jl. Sudirman No. 123, Jakarta Selatan, Indonesia
            </p>
          </div> */}
        </div>

        <div>
          <h2>Kirim Pesan</h2>
          {submitted ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              Pesan Anda telah diterima. Tim kami akan merespons dalam 1x24 jam.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subjek</Label>
                <Input id="subject" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Pesan</Label>
                <Textarea id="message" rows={5} required />
              </div>
              <Button type="submit">Kirim Pesan</Button>
            </form>
          )}
        </div>
      </div>
    </StaticPageLayout>
  );
}
