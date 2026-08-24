import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { VercelAnalytics } from "@/app/analytics";
import { PwaRegister } from "@/components/pwa-register";
import { JsonLd } from "@/components/seo/json-ld";
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
  metadataBase: new URL("https://konkosyuk.com"),
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
  ],
  authors: [{ name: "Adhitia Dwima", url: "https://konkosyuk.com" }],
  creator: "KonkosYuk Team",
  publisher: "KonkosYuk",
  formatDetection: { email: false, telephone: false },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://konkosyuk.com",
    siteName: "KonkosYuk",
    title: "KonkosYuk - Booking Kost & Kontrakan Aman",
    description:
      "Cari hunian impian dengan DP 35%. Aman, transparan, dan bebas penipuan.",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "KonkosYuk - Booking Kost & Kontrakan Aman",
    description:
      "Cari hunian impian dengan DP 35%. Aman, transparan, dan bebas penipuan.",
    images: ["/og-image.jpg"],
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
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "KonkosYuk",
            url: "https://konkosyuk.com",
            logo: "https://konkosyuk.com/logo.png",
            description:
              "Platform booking kost dan kontrakan terpercaya dengan sistem DP 35%",
            sameAs: [],
          }}
        />
        {children}
        <PwaRegister />
        <VercelAnalytics />
      </body>
    </html>
  );
}
