"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function RegisterError({
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
        description={error.message || "Gagal memuat halaman registrasi."}
        onRetry={reset}
      />
    </div>
  );
}
