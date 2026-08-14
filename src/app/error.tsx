"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex justify-center-safe py-6">
      <Alert variant="destructive" className="mb-6">
        <HugeiconsIcon
          icon={AlertCircleIcon}
          strokeWidth={2}
          className="size-4"
        />
        <AlertTitle>Terjadi kesalahan</AlertTitle>
        <AlertDescription>
          Halaman ini mengalami masalah. Silakan coba lagi.
        </AlertDescription>
      </Alert>
      <Button onClick={reset}>Coba Lagi</Button>
    </div>
  );
}
