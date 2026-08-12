"use client";

import { Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/config";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 px-6 py-20 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)_0,_transparent_35%),radial-gradient(circle_at_bottom_left,_var(--secondary)_0,_transparent_35%)] opacity-10" />
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            KonkosYuk: Platform Sewa Kost &amp; Ruko{" "}
            <span className="text-primary">Paling Aman</span> dan Transparan di
            Indonesia.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Cari hunian ideal atau kelola properti Anda tanpa ribet. Pembayaran
            terjamin, lokasi terverifikasi, dan bebas penipuan.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex flex-col items-center gap-4 p-8 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Saya Pemilik Kost/Ruko</h2>
              <p className="text-muted-foreground">
                Kelola properti, terima pembayaran otomatis, dan hindari
                double-booking.
              </p>
              <Button size="lg" className="mt-2">
                <Link href="/register" className="w-full">
                  Daftarkan Properti Saya
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex flex-col items-center gap-4 p-8 text-center">
              <div className="rounded-full bg-secondary/20 p-4">
                <Search className="h-10 w-10 text-secondary-foreground" />
              </div>
              <h2 className="text-xl font-semibold">Saya Pencari Hunian</h2>
              <p className="text-muted-foreground">
                Temukan kost dan ruko terverifikasi di dekat kampus atau kantor
                Anda.
              </p>
              <Button size="lg" variant="outline" className="mt-2">
                <Link href="/properties" className="w-full">
                  Cari Hunian Sekarang
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
