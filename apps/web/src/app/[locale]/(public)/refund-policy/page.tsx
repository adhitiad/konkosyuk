import { StaticPageLayout } from "@/components/static-page-layout";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Metadata } from "next";
import { locales } from "@/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isIndonesian = locale === "id";

  return {
    title: isIndonesian
      ? "Kebijakan Refund - KonkosYuk"
      : "Refund Policy - KonkosYuk",
    description: isIndonesian
      ? "Ketahui kebijakan refund dan pengembalian dana di KonkosYuk."
      : "Learn about KonkosYuk's refund and money-back policies.",
    alternates: {
      canonical: `/${locale}/refund-policy`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/refund-policy`]),
      ) as Record<string, string>,
      "x-default": "/id/refund-policy",
    },
  };
}

export default function RefundPolicyPage() {
  const locale = useLocale();
  return (
    <StaticPageLayout title="Kebijakan Refund" lastUpdated="18 Agustus 2026">
      <h2>1. Ringkasan</h2>
      <p>
        KonkosYuk berkomitmen untuk menjaga kepuasan pengguna. Kebijakan refund
        ini berlaku untuk semua transaksi pembayaran yang dilakukan melalui
        platform KonkosYuk.
      </p>

      <h2>2. Ketentuan Refund</h2>
      <p>Pengguna berhak atas refund dalam kondisi berikut:</p>
      <ul>
        <li>
          Pembayaran berhasil dilakukan, tetapi pemesanan dibatalkan oleh owner
          sebelum masa berlaku booking.
        </li>
        <li>
          Terjadi kesalahan teknis pada platform yang menyebabkan pemesanan
          tidak dapat diproses.
        </li>
        <li>
          Properti yang dibooking tidak sesuai dengan deskripsi yang diberikan
          dan owner tidak dapat menyediakan solusi pengganti yang memadai.
        </li>
      </ul>

      <h2>3. Proses Pengajuan Refund</h2>
      <p>
        Untuk mengajukan refund, pengguna dapat menghubungi tim support
        KonkosYuk melalui halaman Kontak atau email support@konkosyuk.com dengan
        mencantumkan:
      </p>
      <ul>
        <li>ID booking atau invoice</li>
        <li>Alasan refund</li>
        <li>Bukti transaksi (jika ada)</li>
      </ul>

      <h2>4. Masa Pemrosesan</h2>
      <p>
        Pengajuan refund akan diproses dalam waktu 7-14 hari kerja setelah
        diterima. Dana akan dikembalikan ke metode pembayaran asli atau saldo
        KonkosYuk sesuai dengan kebijakan payment gateway.
      </p>

      <h2>5. Kondisi Non-Refund</h2>
      <p>Refund tidak diberikan dalam kondisi berikut:</p>
      <ul>
        <li>
          Pembatalan oleh pengguna setelah masa booking aktif dimulai (sudah
          masuk masa sewa).
        </li>
        <li>
          Pelanggaran syarat dan ketentuan oleh pengguna yang mengakibatkan
          pembatalan otomatis.
        </li>
        <li>
          Permintaan refund melebihi batas waktu 30 hari setelah transaksi
          selesai.
        </li>
      </ul>

      <h2>6. Hubungi Kami</h2>
      <p>
        Untuk pertanyaan lebih lanjut tentang refund, silakan hubungi kami di{" "}
        <a href="mailto:support@konkosyuk.com">support@konkosyuk.com</a> atau
        melalui halaman <Link href={`/${locale}/contact`}>Hubungi Kami</Link>.
      </p>
    </StaticPageLayout>
  );
}
