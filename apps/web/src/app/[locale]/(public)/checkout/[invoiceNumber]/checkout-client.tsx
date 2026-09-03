"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  CreditCard,
  Wallet,
  Building2,
  QrCode,
  Smartphone,
  Loader2,
} from "lucide-react";

type Method = "ewallet" | "va" | "card" | "qris" | "paylater";

const methods: {
  id: Method;
  label: string;
  detail: string;
  icon: typeof Wallet;
}[] = [
  { id: "ewallet", label: "E-Wallet", detail: "GoPay, OVO, DANA", icon: Wallet },
  { id: "va", label: "Virtual Account", detail: "BCA, BNI, BRI, Mandiri", icon: Building2 },
  { id: "card", label: "Kartu", detail: "Kartu kredit atau debit", icon: CreditCard },
  { id: "qris", label: "QRIS", detail: "Scan dengan aplikasi bank", icon: QrCode },
  { id: "paylater", label: "PayLater", detail: "Cicilan hingga 12 bulan", icon: Smartphone },
];

const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export function CheckoutClient({
  invoiceNumber,
  amount,
  purpose,
  propertyName,
  bookingId,
}: {
  invoiceNumber: string;
  amount: number;
  purpose: string;
  propertyName: string;
  bookingId: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const [method, setMethod] = useState<Method>("ewallet");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const methodLabel = methods.find((m) => m.id === method)?.label ?? method;
  const isDP = purpose === "dp";

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
          <div className="mt-8 w-full rounded-2xl bg-slate-50 p-5 text-left space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Invoice</span>
              <span className="font-semibold text-slate-900">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Metode pembayaran</span>
              <span className="font-semibold text-slate-900">{methodLabel}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 font-bold">
              <span>Total</span>
              <span>{formatIDR(amount)}</span>
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
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Ringkasan Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Properti</span>
                <span className="font-semibold">{propertyName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tipe Pembayaran</span>
                <span className="font-semibold">{isDP ? "Down Payment" : "Pelunasan"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Invoice</span>
                <span className="font-semibold">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-[#1157d6]">{formatIDR(amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pilih Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {methods.map((item) => {
                const Icon = item.icon;
                const active = method === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setMethod(item.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[#1157d6] bg-blue-50/60 ring-2 ring-blue-100"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        active ? "bg-[#1157d6] text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{item.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {item.detail}
                      </span>
                    </span>
                    <span
                      className={`size-4 rounded-full border-4 ${
                        active ? "border-[#1157d6]" : "border-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <Button
              disabled={status === "loading"}
              onClick={handlePay}
              className="mt-6 w-full rounded-xl bg-[#1157d6] py-6 text-base font-bold hover:bg-[#0b46b4]"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                `Bayar ${formatIDR(amount)}`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
