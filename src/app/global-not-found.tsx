"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function GlobalNotFound() {
  const router = useRouter();

  useEffect(() => {
    const event = new CustomEvent("404", { detail: { path: window.location.pathname } });
    window.dispatchEvent(event);
  }, []);

  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <div
          style={{
            fontFamily: "system-ui",
            maxWidth: 640,
            margin: "20vh auto",
            padding: 24,
          }}
        >
          <Alert className="mb-6">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
            <AlertTitle>Halaman Tidak Ditemukan</AlertTitle>
            <AlertDescription>
              Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
            </AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/")}>
              Kembali ke Beranda
            </Button>
            <Button variant="outline" onClick={() => router.push("/properties")}>
              Cari Properti
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
