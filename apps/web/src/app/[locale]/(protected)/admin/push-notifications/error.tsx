"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin push notifications page error:", error);
  }, [error]);

  return (
    <div className="container py-6">
      <h2 className="text-2xl font-bold">Push Notifications</h2>
      <p className="text-muted-foreground">
        Gagal memuat data push notification.
      </p>
      <Button onClick={reset} className="mt-4">
        Coba lagi
      </Button>
    </div>
  );
}
