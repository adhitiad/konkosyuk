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
      ? "Syarat & Ketentuan - KonkosYuk"
      : "Terms & Conditions - KonkosYuk",
    description: isIndonesian
      ? "Baca syarat dan ketentuan penggunaan platform KonkosYuk."
      : "Read KonkosYuk's terms and conditions for using our platform.",
    alternates: {
      canonical: `/${locale}/umum/syarat-dan-ketentuan`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/umum/syarat-dan-ketentuan`]),
      ) as Record<string, string>,
    } as Metadata["alternates"] & { "x-default": string },
    openGraph: {
      title: "Syarat & Ketentuan - KonkosYuk",
      description: "Baca syarat dan ketentuan penggunaan platform KonkosYuk.",
      url: `${SITE_URL}/${locale}/umum/syarat-dan-ketentuan`,
      siteName: "KonkosYuk",
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: "Syarat & Ketentuan KonkosYuk",
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Syarat & Ketentuan - KonkosYuk",
      description: "Baca syarat dan ketentuan penggunaan platform KonkosYuk.",
      images: [`${SITE_URL}/og-image.jpg`],
    },
  };
}

export default function TermsPage() {
  return (
    <StaticPageLayout title="Syarat & Ketentuan" lastUpdated="7 Agustus 2026">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/id` },
          {
            name: "Syarat & Ketentuan",
            url: `${SITE_URL}/id/umum/syarat-dan-ketentuan`,
          },
        ])}
      />
      <h2>1. Penerimaan Syarat</h2>
      <p>
        Dengan menggunakan KonkosYuk, Anda menyetujui seluruh aturan dan
        ketentuan yang berlaku. Jika Anda tidak menyetujui, mohon untuk tidak
        menggunakan layanan kami.
      </p>

      <h2>2. Akun Pengguna</h2>
      <p>
        Anda bertanggung jawab untuk menjaga kerahasiaan akun dan password Anda.
        Dilarang membuat akun palsu, menggunakan identitas orang lain, atau
        menyalahgunakan layanan untuk kegiatan ilegal.
      </p>

      <h2>3. Aturan Booking & Pembayaran</h2>
      <ul>
        <li>
          Tenant wajib melakukan pembayaran DP sebesar 35% untuk menjamin
          booking.
        </li>
        <li>Pelunasan 65% harus dilakukan sebelum tanggal check-in.</li>
        <li>
          Dilarang melakukan penipuan, chargeback tanpa alasan yang sah, atau
          memanipulasi data booking.
        </li>
      </ul>

      <h2>4. Peran KonkosYuk</h2>
      <p>
        KonkosYuk berperan sebagai platform perantara. Kami bukan pemilik
        properti dan tidak bertanggung jawab atas kondisi fisik hunian. Sengketa
        antara tenant dan owner diselesaikan melalui Pusat Resolusi KonkosYuk
        dengan prinsip fairness dan transparansi.
      </p>

      <h2>5. Pembatasan Tanggung Jawab</h2>
      <p>
        Kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul
        dari penggunaan layanan. KonkosYuk tidak menjamin ketersediaan unit
        properti 100% karena ketergantungan pada data yang diberikan oleh owner.
      </p>
    </StaticPageLayout>
  );
}
