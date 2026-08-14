import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
