"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/axios";
import { useLocale } from "next-intl";

export function PublicFooter() {
  const locale = useLocale();
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await apiClient.post("/api/newsletter/subscribe", { email });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t">
      <div className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Logo withText />
            <p className="mt-3 text-sm text-muted-foreground max-w-md">
              Temukan kost dan kontrakan terbaik dengan harga terjangkau.
              KonkosYuk memudahkan Anda mencari tempat tinggal ideal.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="mt-4 flex flex-col sm:flex-row gap-2"
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                className="max-w-sm"
                required
              />
              <Button
                type="submit"
                className="whitespace-nowrap"
                disabled={status === "loading"}
              >
                {status === "loading"
                  ? "Mengirim..."
                  : "Dapatkan Info Kost Terbaru"}
              </Button>
            </form>
            {status === "success" && (
              <p className="mt-2 text-sm text-green-600">
                Terima kasih telah berlangganan!
              </p>
            )}
            {status === "error" && (
              <p className="mt-2 text-sm text-red-600">
                Gagal berlangganan. Coba lagi nanti.
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-sm">Perusahaan</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/properties"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Cara Kerja
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Bantuan
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm">Tipe Properti</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link
                  href="/properties?type=kost"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Kost Putra
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?type=kost"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Kost Putri
                </Link>
              </li>
              <li>
                <Link
                  href="/properties?type=kontrakan"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Kontrakan
                </Link>
              </li>
              <li>
                <Link
                  href="/properties"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Ruko
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm">Layanan</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/umum/syarat-dan-ketentuan`}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  Kebijakan Refund
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-8 border-gray-200 dark:border-gray-700" />

        <div className="flex flex-col items-center gap-6">
          <div className="text-center text-xs text-muted-foreground">
            © {year} KonkosYuk. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
