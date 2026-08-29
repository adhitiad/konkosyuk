import type { Metadata } from "next";
import Script from "next/script";
import { Poppins, Inter } from "next/font/google";
import { headers } from "next/headers";
import { VercelAnalytics } from "@/app/analytics";
import { PwaRegister } from "@/components/pwa-register";
import { JsonLd } from "@/components/seo/json-ld";
import {
  organizationSchema,
  websiteSchema,
  SITE_URL,
  DEFAULT_OG_IMAGE,
} from "@/components/seo/schema";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KonkosYuk - Booking Kost & Kontrakan Aman DP 35%",
    template: "%s | KonkosYuk",
  },
  description:
    "Platform booking kost dan kontrakan terpercaya dengan sistem DP 35%. Cari hunian via peta interaktif, review jujur, dan manajemen properti digital. Anti penipulan!",
  keywords: [
    "booking kost",
    "sewa kontrakan",
    "cari kost online",
    "kost murah",
    "DP 35%",
    "booking aman",
    "peta kost",
    "review kost",
    "manajemen kost",
    "tenant scoring",
    "kost Jakarta",
    "kontrakan Bandung",
    "kost Surabaya",
    "kost Bandung",
    "sewa rumah",
    "platform properti",
  ],
  authors: [{ name: "Adhitia Dwima", url: SITE_URL }],
  creator: "KonkosYuk Team",
  publisher: "KonkosYuk",
  formatDetection: { email: false, telephone: false },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/konkoyuk.png", media: "(prefers-color-scheme: light)" },
      { url: "/icons/logo-konkosyuk.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [
      { url: "/icons/konkoyuk.png", media: "(prefers-color-scheme: light)" },
      { url: "/icons/logo-konkosyuk.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "KonkosYuk",
    title: "KonkosYuk - Booking Kost & Kontrakan Aman",
    description:
      "Cari hunian impian dengan DP 35%. Aman, transparan, dan bebas penipuan.",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "KonkosYuk - Platform Sewa Kost & Kontrakan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KonkosYuk - Booking Kost & Kontrakan Aman",
    description:
      "Cari hunian impian dengan DP 35%. Aman, transparan, dan bebas penipuan.",
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/id",
    languages: {
      id: "/id",
      en: "/en",
      my: "/my",
      th: "/th",
      vi: "/vi",
      ko: "/ko",
      zh: "/zh",
      ru: "/ru",
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce");

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${poppins.variable} ${inter.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://utfs.io" />
        <link rel="dns-prefetch" href="https://utfs.io" />
        <link rel="preconnect" href="https://basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://basemaps.cartocdn.com" />
      </head>
      <body className={`${poppins.className} antialiased`}>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        {children}
        <PwaRegister />
        <VercelAnalytics />
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="h/og7b50yXD5Zyi+qhve/A"
          async
          nonce={nonce ?? undefined}
        />
      </body>
    </html>
  );
}
