import { notFound } from "next/navigation";
import { ComparisonTable } from "@/components/comparison/comparison-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftIcon } from "@hugeicons/core-free-icons";

interface ComparisonsPageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparisonsPage({
  searchParams,
}: ComparisonsPageProps) {
  const params = await searchParams;
  const idsParam = params.ids;

  let propertyIds: string[] = [];
  if (idsParam) {
    const parsed = idsParam.split(",").filter(Boolean);
    if (parsed.length >= 2 && parsed.length <= 4) {
      propertyIds = parsed;
    }
  }

  if (propertyIds.length < 2) {
    notFound();
  }

  return (
    <main className="max-w-screen-xl mx-auto px-4 lg:px-0 py-10">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/properties" />}
          nativeButton={false}
          className="mb-4"
        >
          <HugeiconsIcon
            icon={ArrowLeftIcon}
            strokeWidth={2}
            className="size-4 mr-1"
          />
          Kembali ke Pencarian
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Perbandingan Properti
        </h1>
        <p className="mt-2 text-muted-foreground">
          Bandingkan {propertyIds.length} properti secara side-by-side
        </p>
      </div>

      <ComparisonTable propertyIds={propertyIds} />
    </main>
  );
}
