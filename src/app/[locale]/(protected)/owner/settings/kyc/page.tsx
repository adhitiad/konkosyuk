"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import type { SessionUserWithRole } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KYCUploadForm } from "@/components/owner/kyc-upload-form";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { apiClient } from "@/lib/axios";

const KYC_STATUS_LABEL: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  none: { label: "Belum Verifikasi", variant: "outline" },
  pending: { label: "Menunggu Verifikasi", variant: "secondary" },
  verified: { label: "Terverifikasi", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
};

export default function OwnerKYCPage() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: userData } = useQuery({
    queryKey: ["current-user-kyc"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/users/me");
      return data.data;
    },
    enabled: !!session?.user?.id,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const kycStatus =
    userData?.kycStatus || (session?.user as SessionUserWithRole)?.kycStatus || "none";
  const kycInfo = KYC_STATUS_LABEL[kycStatus] || KYC_STATUS_LABEL.none;

  const maskKtp = (ktp: string | null) => {
    if (!ktp || ktp.length < 8) return ktp || "-";
    return `${ktp.slice(0, 4)}****${ktp.slice(-4)}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Verifikasi KYC
        </h1>
        <p className="mt-2 text-muted-foreground">
          Upload KTP untuk verifikasi identitas Anda.
        </p>
      </div>

      <div className="mb-6">
        <Badge variant={kycInfo.variant}>KYC: {kycInfo.label}</Badge>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(kycStatus === "none" || kycStatus === "rejected") && (
        <Card>
          <CardHeader>
            <CardTitle>
              {kycStatus === "rejected" ? "Upload Ulang KTP" : "Upload KTP"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showForm ? (
              <KYCUploadForm onSuccess={() => setShowForm(false)} />
            ) : (
              <Button onClick={() => setShowForm(true)}>
                {kycStatus === "rejected" ? "Upload Ulang" : "Mulai Verifikasi"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {kycStatus === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Clock01Icon}
                strokeWidth={2}
                className="size-5 text-orange-500"
              />
              Sedang Diverifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Admin sedang memeriksa dokumen Anda. Estimasi 5-25 menit.
            </p>
          </CardContent>
        </Card>
      )}

      {kycStatus === "verified" && userData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={2}
                className="size-5 text-green-500"
              />
              Terverifikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Identitas Anda telah terverifikasi.
            </p>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Detail KTP</p>
              <p className="text-sm text-muted-foreground">
                NIK: {maskKtp(userData.ktpNumber || null)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {kycStatus === "rejected" && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                className="size-5 text-red-500"
              />
              Verifikasi Ditolak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Verifikasi KYC Anda ditolak. Silakan upload ulang KTP dengan data
              yang jelas dan valid.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
