"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Megaphone01Icon } from "@hugeicons/core-free-icons";
import { MapPin } from "lucide-react";
import { useAds } from "@/hooks/use-ads";
import type { Ad } from "@/hooks/use-ads";
import { useLocale } from "next-intl";

const TYPE_COLORS: Record<string, string> = {
  kos: "bg-blue-100 text-blue-700 border-blue-200",
  kontrakan: "bg-green-100 text-green-700 border-green-200",
  apartemen: "bg-purple-100 text-purple-700 border-purple-200",
  rumah: "bg-orange-100 text-orange-700 border-orange-200",
};

const TYPE_LABELS: Record<string, string> = {
  kos: "Kos",
  kontrakan: "Kontrakan",
  apartemen: "Apartemen",
  rumah: "Rumah",
};

function AdCard({ ad }: { ad: Ad }) {
  const router = useRouter();
  const locale = useLocale();

  const handleClick = async () => {
    try {
      await fetch(`/api/ads/${ad.id}/click`, {
        method: "POST",
      });
    } catch {
      // silent fail for click tracking
    }

    if (ad.targetUrl) {
      router.push(ad.targetUrl as any);
    }
  };

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all hover:shadow-md h-full cursor-pointer"
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div className="relative aspect-video w-full bg-muted">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[ad.type] || "bg-gray-100 text-gray-700 border-gray-200"}`}
          >
            {TYPE_LABELS[ad.type] || ad.type}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-semibold">{ad.title}</h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{ad.location}</span>
        </div>
        {ad.price && (
          <p className="mt-1 text-sm font-medium text-primary">{ad.price}</p>
        )}
      </div>

      <div className="mt-auto border-t p-4">
        <p className="text-xs text-muted-foreground">oleh {ad.advertiserName}</p>
      </div>
    </div>
  );
}

function CtaCard() {
  const router = useRouter();
  const locale = useLocale();
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-primary/30 bg-gradient-to-b from-primary/5 to-primary/10 p-8 text-center h-full">
      <HugeiconsIcon
        icon={Megaphone01Icon}
        strokeWidth={1.5}
        className="size-12 text-primary mb-4"
      />
      <h3 className="text-lg font-semibold">Punya Kosan atau Kontrakan?</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        Tampilkan properti Anda di sini dan jangkau ribuan pencari hunian setiap hari.
      </p>
        <Button render={<Link href={`/${locale}/ads/submit`} />} nativeButton={false} className="mt-4" size="sm">
          Iklankan Sekarang
        </Button>
    </div>
  );
}

export function AdCarousel() {
  const { ads, loading } = useAds();

  if (loading) {
    return (
      <section className="py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-video w-full rounded-lg bg-muted animate-pulse" />
                <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ads.length === 0) {
    return (
      <section className="py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CtaCard />
            <CtaCard />
            <CtaCard />
          </div>
        </div>
      </section>
    );
  }

  const showDots = ads.length > 1;
  const loop = ads.length >= 3;

  return (
    <section className="py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <Carousel
          opts={{
            align: "start",
            loop,
            slidesToScroll: 1,
            dragFree: false,
          }}
          className="relative"
        >
          <CarouselContent>
            {ads.map((ad) => (
              <CarouselItem key={ad.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <AdCard ad={ad} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {showDots && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
}
