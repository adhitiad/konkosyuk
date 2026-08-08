"use client";

import Link from "next/link";
import QuickSearch from "@/components/landing/quick-search";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldCheck,
  MapPinIcon,
  StarIcon,
  BotIcon,
  TrendingUp,
  CreditCardIcon,
  UserIcon,
  WrenchIcon,
  SearchIcon,
  WalletIcon,
  KeyIcon,
  ClockIcon,
  BellIcon,
  GlobeIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Cari Kost & Kontrakan Tanpa Ribet, Booking Aman Hanya dengan DP
              35%!
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Lupakan drama chat WhatsApp dan ketakutan uang hangus. KonkosYuk
              menjembatani kamu dengan ribuan kost dan kontrakan terpercaya.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" nativeButton={false} render={<Link href="/properties" />}>
                🔍 Mulai Cari Kostan & Kontrakan
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/register" />}
              >
                🏢 Daftarkan Kostan & Kontrakan Saya
              </Button>
            </div>
            {/* <p className="mt-6 text-sm text-muted-foreground">
              ✨ Telah dipercaya oleh 500+ pemilik Kostan & Kontrakan dan 2.000+
              penyewa.
            </p> */}
          </div>
        </div>
      </section>

      {/* Quick Search Section */}
      <section className="relative -mt-8 z-10">
        <div className="container mx-auto px-4">
          <QuickSearch />
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Mengapa Ribuan Orang Beralih ke KonkosYuk?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Tenants */}
            <Card>
              <CardHeader>
                <CardTitle>Untuk Pencari Kostan & Kontrakan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <HugeiconsIcon
                      icon={ShieldCheck}
                      strokeWidth={2}
                      className="size-6 text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Anti Penipuan</h3>
                    <p className="text-sm text-muted-foreground">
                      Verifikasi Kostan & Kontrakan dan pemilik. Dana aman
                      sampai check-in.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <HugeiconsIcon
                      icon={MapPinIcon}
                      strokeWidth={2}
                      className="size-6 text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Peta Interaktif</h3>
                    <p className="text-sm text-muted-foreground">
                      Cari Kostan & Kontrakan berdasarkan lokasi favoritmu
                      dengan peta interaktif.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <HugeiconsIcon
                      icon={StarIcon}
                      strokeWidth={2}
                      className="size-6 text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Review Jujur</h3>
                    <p className="text-sm text-muted-foreground">
                      Baca review dari penyewa sebelumnya untuk keputusan yang
                      tepat.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <HugeiconsIcon
                      icon={BotIcon}
                      strokeWidth={2}
                      className="size-6 text-primary"
                    />
                  </div>
                  {/* <div>
                    <h3 className="font-semibold">Asisten AI 24/7</h3>
                    <p className="text-sm text-muted-foreground">
                      Dapatkan bantuan kapan saja dengan asisten AI kami.
                    </p>
                  </div> */}
                </div>
              </CardContent>
            </Card>

            {/* For Owners */}
            <Card>
              <CardHeader>
                <CardTitle>Untuk Pemilik Properti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <HugeiconsIcon
                      icon={TrendingUp}
                      strokeWidth={2}
                      className="size-6 text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Okupansi Meningkat</h3>
                    <p className="text-sm text-muted-foreground">
                      Jangkau lebih banyak calon tenant dan isi kamar kosong
                      lebih cepat.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <HugeiconsIcon
                      icon={CreditCardIcon}
                      strokeWidth={2}
                      className="size-6 text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Pembayaran Otomatis</h3>
                    <p className="text-sm text-muted-foreground">
                      Terima pembayaran DP dan pelunasan secara otomatis tanpa
                      ribet.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <HugeiconsIcon
                      icon={UserIcon}
                      strokeWidth={2}
                      className="size-6 text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Tenant Scoring</h3>
                    <p className="text-sm text-muted-foreground">
                      Lihat reputasi calon Customer sebelum menerima booking.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <HugeiconsIcon
                      icon={WrenchIcon}
                      strokeWidth={2}
                      className="size-6 text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Tiket Maintenance</h3>
                    <p className="text-sm text-muted-foreground">
                      Kelola laporan kerusakan dari tenant dalam satu dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Sewa Hunian Semudah 1-2-3
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <HugeiconsIcon
                    icon={SearchIcon}
                    strokeWidth={2}
                    className="size-6 text-primary"
                  />
                </div>
                <h3 className="font-semibold mb-2">1. Cari & Pilih</h3>
                <p className="text-sm text-muted-foreground">
                  Temukan hunian impianmu dari ribuan pilihan Kostan & Kontrakan
                  terverifikasi.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <HugeiconsIcon
                    icon={WalletIcon}
                    strokeWidth={2}
                    className="size-6 text-primary"
                  />
                </div>
                <h3 className="font-semibold mb-2">
                  2. Booking & Bayar DP 35%
                </h3>
                <p className="text-sm text-muted-foreground">
                  Pilih paket durasi, bayar DP 35%, dan Kostan & Kontrakan
                  terjamin.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <HugeiconsIcon
                    icon={KeyIcon}
                    strokeWidth={2}
                    className="size-6 text-primary"
                  />
                </div>
                <h3 className="font-semibold mb-2">3. Check-in & Nikmati</h3>
                <p className="text-sm text-muted-foreground">
                  Serahkan identitas, terima kunci, dan nikmati Kostan &
                  Kontrakan barumu.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Teknologi Canggih untuk Pengalaman Sewa Terbaik
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <HugeiconsIcon
                    icon={ClockIcon}
                    strokeWidth={2}
                    className="size-6 text-primary"
                  />
                </div>
                <h3 className="font-semibold mb-2">Paket Sewa Fleksibel</h3>
                <p className="text-sm text-muted-foreground">
                  Pilih durasi sesuai kebutuhanmu: dari 6 jam hingga 2 tahun
                  dengan harga transparan.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <HugeiconsIcon
                    icon={BellIcon}
                    strokeWidth={2}
                    className="size-6 text-primary"
                  />
                </div>
                <h3 className="font-semibold mb-2">Notifikasi Real-Time</h3>
                <p className="text-sm text-muted-foreground">
                  Dapatkan update booking, pembayaran, dan maintenance secara
                  langsung.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <HugeiconsIcon
                    icon={GlobeIcon}
                    strokeWidth={2}
                    className="size-6 text-primary"
                  />
                </div>
                <h3 className="font-semibold mb-2">Multi-Bahasa</h3>
                <p className="text-sm text-muted-foreground">
                  Akses platform dalam berbagai bahasa untuk pengalaman yang
                  lebih nyaman.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Siap Menemukan Kostan & Kontrakan Impian atau Mengisi Kamar
            Kosongmu?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Bergabunglah dengan ekosistem KonkosYuk hari ini. Gratis, aman, dan
            transparan.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              render={<Link href="/properties" />}
            >
              🔍 Saya Ingin Ngekost & Ngontrak
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              nativeButton={false}
              render={<Link href="/register" />}
            >
              🏢 Saya Pemilik Kostan & Kontrakan
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
