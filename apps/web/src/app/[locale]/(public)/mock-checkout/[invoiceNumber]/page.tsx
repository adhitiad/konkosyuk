"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, Loader2 } from "lucide-react";

const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function MockCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const invoiceNumber = params.invoiceNumber as string;

  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  function handlePay() {
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
    }, 1500);
  }

  if (status === "success") {
    return (
      <main className="min-h-screen bg-[#f6f8fb] px-5 py-16 text-slate-950">
        <section className="mx-auto flex max-w-lg flex-col items-center rounded-3xl bg-white p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="size-8" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-600">
            Pembayaran berhasil
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Terima kasih, pembayaran diproses.
          </h1>
          <p className="mt-3 text-slate-500">
            Ini adalah simulasi pembayaran. Tidak ada transaksi nyata yang dibuat.
          </p>
          <div className="mt-8 w-full rounded-2xl bg-slate-50 p-5 text-left">
            <div className="flex justify-between border-t border-slate-200 pt-3 font-bold">
              <span>Invoice</span>
              <span>{invoiceNumber}</span>
            </div>
          </div>
          <Button
            className="mt-8 w-full rounded-xl bg-[#1157d6] py-6 text-base hover:bg-[#0b46b4]"
            onClick={() => router.push(`/${locale}/dashboard/bookings`)}
          >
            Kembali ke pesanan
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-5 py-16 text-slate-950">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Simulasi Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Invoice Number</p>
              <p className="font-bold">{invoiceNumber}</p>
            </div>
            <p className="text-sm text-slate-500">
              Ini adalah halaman pembayaran simulasi untuk development saja.
              Tidak ada transaksi nyata yang akan diproses.
            </p>
            <Button
              disabled={status === "loading"}
              onClick={handlePay}
              className="w-full rounded-xl bg-[#1157d6] py-6 text-base font-bold hover:bg-[#0b46b4]"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Bayar Sekarang (Simulasi)"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
