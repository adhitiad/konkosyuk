import { StaticPageLayout } from "@/components/static-page-layout";
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
      ? "Kebijakan Privasi - KonkosYuk"
      : "Privacy Policy - KonkosYuk",
    description: isIndonesian
      ? "Pelajari bagaimana KonkosYuk mengumpulkan, menggunakan, dan melindungi data pribadi Anda."
      : "Learn how KonkosYuk collects, uses, and protects your personal data.",
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/privacy`]),
      ) as Record<string, string>,
    } as Metadata["alternates"] & { "x-default": string },
    openGraph: {
      title: "Kebijakan Privasi - KonkosYuk",
      description:
        "Pelajari bagaimana KonkosYuk mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
      url: `${SITE_URL}/${locale}/privacy`,
      siteName: "KonkosYuk",
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: "Kebijakan Privasi KonkosYuk",
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Kebijakan Privasi - KonkosYuk",
      description:
        "Pelajari bagaimana KonkosYuk mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
      images: [`${SITE_URL}/og-image.jpg`],
    },
  };
}

export default function PrivacyPage() {
  return (
    <StaticPageLayout title="Kebijakan Privasi" lastUpdated="7 Agustus 2026">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/id` },
          { name: "Kebijakan Privasi", url: `${SITE_URL}/id/privacy` },
        ])}
      />
      <h2>1. Informasi yang Kami Kumpulkan</h2>
      <p>
        Kami mengumpulkan informasi yang Anda berikan saat mendaftar, melakukan
        booking, atau menghubungi layanan kami, termasuk:
      </p>
      <ul>
        <li>Data profil (nama, email, nomor telepon)</li>
        <li>
          Data pembayaran (transaksi yang dilakukan melalui payment gateway)
        </li>
        <li>Data lokasi (alamat properti yang Anda cari atau daftarkan)</li>
      </ul>

      <h2>2. Bagaimana Kami Menggunakan Informasi Anda</h2>
      <p>
        Informasi Anda digunakan untuk memproses booking, memverifikasi
        identitas, mengirim notifikasi penting seputar akun dan transaksi, serta
        meningkatkan kualitas layanan KonkosYuk.
      </p>

      <h2>3. Berbagi Informasi dengan Pihak Ketiga</h2>
      <p>
        Kami hanya membagikan data Anda kepada pihak ketiga yang diperlukan
        untuk proses layanan, yaitu:
      </p>
      <ul>
        <li>
          Payment Gateway (Doku, Sakuku, Nicepay) untuk memproses pembayaran
          Anda.
        </li>
        <li>
          Kami tidak menjual, menyewakan, atau membagikan data Anda kepada pihak
          lain untuk kepentingan pemasaran tanpa izin Anda.
        </li>
      </ul>

      <h2>4. Keamanan Data</h2>
      <p>
        Kami menerapkan enkripsi password, secure session, dan praktik keamanan
        standar industri untuk melindungi data pribadi Anda.
      </p>

      <h2>5. Hak Anda</h2>
      <p>
        Anda memiliki hak untuk meminta penghapusan atau koreksi data pribadi
        Anda dengan menghubungi support@konkosyuk.com.
      </p>
    </StaticPageLayout>
  );
}
