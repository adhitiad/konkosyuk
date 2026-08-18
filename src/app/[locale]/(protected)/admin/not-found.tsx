import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";

export default function AdminNotFound() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            size={40}
            className="text-destructive"
          />
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          Halaman yang Anda cari tidak ditemukan.
        </p>
        <div className="flex gap-3">
          <Link href="/admin">
            <Button>Kembali ke Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Beranda</Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
