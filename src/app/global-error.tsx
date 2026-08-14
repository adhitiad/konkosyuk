"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as Sentry from '@sentry/nextjs';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
    });
  }, [error]);

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
          <Alert variant="destructive" className="mb-6">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
            <AlertTitle>Terjadi kesalahan sistem</AlertTitle>
            <AlertDescription>
              Aplikasi mengalami masalah. Silakan refresh halaman atau coba lagi
              nanti.
            </AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button onClick={reset}>Coba Lagi</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
