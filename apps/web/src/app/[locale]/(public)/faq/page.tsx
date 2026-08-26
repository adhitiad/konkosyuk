"use client";

import { StaticPageLayout } from "@/components/static-page-layout";
import { JsonLd } from "@/components/seo/json-ld";
import { faqSchema } from "@/components/seo/schema";

const faqTenants = [
  {
    question: "Bagaimana cara booking di KonkosYuk?",
    answer:
      "Cari properti yang sesuai, pilih unit, lengkapi data diri, bayar DP 35% untuk menjamin booking, dan lakukan pelunasan 65% sebelum tanggal check-in.",
  },
  {
    question: "Apakah DP saya aman?",
    answer:
      "Ya. Dana DP diproses melalui payment gateway resmi (Doku, Sakuku, atau Nicepay) dan hanya diteruskan ke pemilik properti setelah proses verifikasi dan konfirmasi booking.",
  },
  {
    question: "Bagaimana jika saya ingin membatalkan booking?",
    answer:
      "Pembatalan dapat dilakukan melalui halaman booking. Aturan refund mengikuti kebijakan masing-masing pemilik properti. DP akan dikembalikan sebagian atau seluruhnya sesuai ketentuan yang berlaku.",
  },
];

const faqOwners = [
  {
    question: "Bagaimana cara mendaftarkan properti saya?",
    answer:
      "Daftar akun sebagai Owner, lalu pilih menu Tambah Properti. Isi detail properti, foto, paket harga, dan tunggu verifikasi dari tim admin sebelum properti ditampilkan secara publik.",
  },
  {
    question: "Berapa biaya yang dikenakan untuk Owner?",
    answer:
      "Saat ini KonkosYuk gratis untuk mendaftarkan dan mengelola properti. Kami akan mengumumkan biaya layanan di masa depan dengan pemberitahuan sebelumnya.",
  },
];

function AccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-lg border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium">
        {question}
        <svg
          className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </summary>
      <div className="px-4 pb-4 text-sm text-muted-foreground">{answer}</div>
    </details>
  );
}

export default function FaqPage() {
  const allFaq = [...faqTenants, ...faqOwners];

  return (
    <StaticPageLayout title="Pertanyaan Umum (FAQ)">
      <JsonLd data={faqSchema(allFaq)} />
      <h2>Untuk Penyewa (Tenant)</h2>
      <div className="space-y-3">
        {faqTenants.map((item) => (
          <AccordionItem key={item.question} {...item} />
        ))}
      </div>

      <h2>Untuk Pemilik (Owner)</h2>
      <div className="space-y-3">
        {faqOwners.map((item) => (
          <AccordionItem key={item.question} {...item} />
        ))}
      </div>
    </StaticPageLayout>
  );
}
