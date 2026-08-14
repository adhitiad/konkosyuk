"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function PropertyDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container py-12">
      <ErrorState
        title="Terjadi Kesalahan"
        description={error.message || "Gagal memuat detail properti."}
        onRetry={reset}
      />
    </div>
  );
}