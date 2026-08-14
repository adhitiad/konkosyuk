"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRightIcon } from "@hugeicons/core-free-icons";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Booking Kost & Kontrakan{" "}
              <span className="text-primary">Aman</span> dengan DP 35%
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Cari hunian impian dengan sistem booking aman dan transparan. 
              DP hanya 35%, verifikasi properti, dan review jujur dari tenant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2">
                Cari Properti
                <HugeiconsIcon icon={ArrowRightIcon} size={18} />
              </Button>
              <Button variant="outline" size="lg">
                Cara Kerja
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src="/hero-property.jpg"
                alt="Properti unggulan KonkosYuk"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                placeholder="blur"
                blurDataURL="/placeholder-blur.jpg"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-xl bg-white p-4 shadow-lg">
              <p className="text-2xl font-bold text-primary">35%</p>
              <p className="text-xs text-muted-foreground">DP Termurah</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}