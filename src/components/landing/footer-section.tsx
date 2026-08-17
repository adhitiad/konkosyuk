"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Link } from "@/config";

export function FooterSection() {
  return (
    <footer className="bg-slate-900 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <Logo withText />
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <Link href="/about" className="transition-colors hover:text-white">
              Tentang Kami
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-white"
            >
              Kontak
            </Link>
            <Link
              href="/umum/syarat-dan-ketentuan"
              className="transition-colors hover:text-white"
            >
              Syarat &amp; Ketentuan
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-white"
            >
              Kebijakan Privasi
            </Link>
          </nav>

          <div className="mt-4 max-w-xl">
            <p className="text-2xl font-semibold">
              Siap Mengubah Cara Anda Sewa-Menyewa?
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Bergabunglah dengan ribuan owner dan tenant yang sudah merasakan
              kemudahan berbagi hunian bersama KonkosYuk.
            </p>
            <Button size="lg" className="mt-6">
              <Link href="/register">Gabung Sekarang</Link>
            </Button>
          </div>

          <p className="mt-10 text-xs text-slate-400">
            &copy; {new Date().getFullYear()} KonkosYuk. Dibuat dengan ❤️ di
            Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
