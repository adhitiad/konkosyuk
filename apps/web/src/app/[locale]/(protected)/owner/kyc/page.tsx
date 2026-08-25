"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  Clock,
  XCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Info,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import KYCVerificationFlow from "@/components/kyc/KYCVerificationFlow";
import { withOwnerAuth } from "@/lib/with-owner-auth";

function OwnerKYCPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["owner-kyc-status"],
    queryFn: async () => {
      const res = await fetch("/api/kyc/status");
      if (!res.ok) throw new Error("Failed to fetch KYC status");
      const body = await res.json();
      return body.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const shouldRefetch = data?.kycStatus === "pending";

  useEffect(() => {
    if (!shouldRefetch) return;
    const interval = setInterval(() => refetch(), 1000 * 30);
    return () => clearInterval(interval);
  }, [shouldRefetch, refetch]);

  const verification = data?.verifications?.[0];
  const lastUpdated = verification?.updatedAt
    ? new Date(verification.updatedAt).toLocaleString("id-ID")
    : verification?.createdAt
      ? new Date(verification.createdAt).toLocaleString("id-ID")
      : "-";

  const flowStepRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (data?.kycStatus === "pending") {
      flowStepRef.current = "processing";
    } else if (data?.kycStatus === "verified") {
      flowStepRef.current = "result";
    } else if (data?.kycStatus === "rejected") {
      flowStepRef.current = "result";
    }
  }, [data]);

  const getStatusBadge = () => {
    const status = data?.kycStatus;
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="size-3" />
            Terverifikasi
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            Menunggu Verifikasi
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="size-3" />
            Ditolak
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            Belum Verifikasi
          </Badge>
        );
    }
  };

  const handleKycComplete = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>Gagal Memuat Status KYC</AlertTitle>
          <AlertDescription>
            <p className="mb-3">Gagal memuat status KYC. Silakan coba lagi.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const kycStatus = data?.kycStatus ?? "none";

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Verifikasi Identitas (KYC)
          </h1>
          <p className="mt-2 text-muted-foreground">
            Verifikasi identitas Anda untuk dapat mendaftarkan properti di
            platform KonkosYuk.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Terakhir diperbarui: {lastUpdated}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            />
            <span className="ml-1 hidden sm:inline">Refresh</span>
          </Button>
          {getStatusBadge()}
        </div>
      </div>

      {kycStatus === "none" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              Mengapa Verifikasi KYC Diperlukan?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sebagai Owner, Anda perlu melakukan verifikasi identitas untuk:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Memastikan keamanan dan kepercayaan platform</li>
              <li>Melindungi data pribadi dan properti Anda</li>
              <li>Mencegah penipuan dan identitas palsu</li>
              <li>Memenuhi persyaratan regulasi pemerintah</li>
            </ul>
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Langkah-langkah Verifikasi</AlertTitle>
              <AlertDescription>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Unggah foto KTP yang jelas dan tidak buram</li>
                  <li>Ambil foto selfie dengan pencahayaan yang cukup</li>
                  <li>Kirim untuk diverifikasi (proses ~1-2 menit)</li>
                  <li>Dapatkan notifikasi melalui email setelah selesai</li>
                </ol>
              </AlertDescription>
            </Alert>
            <div className="pt-4">
              <KYCVerificationFlow
                onComplete={handleKycComplete}
                initialStep="upload-ktp"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {kycStatus === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Verifikasi Sedang Diproses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Clock className="size-4" />
              <AlertTitle>Proses Verifikasi Sedang Berjalan</AlertTitle>
              <AlertDescription>
                Verifikasi KYC Anda sedang diproses. Perkiraan waktu
                penyelesaian: 1-2 menit. Anda akan menerima notifikasi melalui
                email setelah verifikasi selesai.
              </AlertDescription>
            </Alert>
            {verification && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>ID Sesi: {verification.diditSessionId}</p>
                <p>Dokumen: {verification.documentType?.toUpperCase()}</p>
                <p>
                  Dikirim:{" "}
                  {new Date(verification.createdAt).toLocaleString("id-ID")}
                </p>
                {verification.diditRedirectUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      window.open(verification.diditRedirectUrl, "_blank")
                    }
                  >
                    <ExternalLink className="size-4 mr-2" />
                    Buka Verifikasi Didit
                  </Button>
                )}
              </div>
            )}
            <KYCVerificationFlow
              onComplete={handleKycComplete}
              initialStep="processing"
            />
          </CardContent>
        </Card>
      )}

      {kycStatus === "verified" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="size-5" />
              Verifikasi Berhasil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default" className="border-green-200 bg-green-50">
              <CheckCircle2 className="size-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Identitas Anda telah berhasil diverifikasi. Anda sekarang bisa
                mendaftarkan properti dan menggunakan semua fitur platform.
              </AlertDescription>
            </Alert>
            {verification && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Diverifikasi pada:{" "}
                  {new Date(verification.updatedAt).toLocaleString("id-ID")}
                </p>
                <p>Dokumen: {verification.documentType?.toUpperCase()}</p>
                {verification.faceMatchScore && (
                  <p>Face Match Score: {verification.faceMatchScore}%</p>
                )}
                {verification.livenessPassed !== null && (
                  <p>
                    Liveness Detection:{" "}
                    {verification.livenessPassed ? "Lulus" : "Tidak Lulus"}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {kycStatus === "rejected" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="size-5" />
              Verifikasi Ditolak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <XCircle className="size-4" />
              <AlertDescription>
                {verification?.rejectionReason ||
                  "Verifikasi KYC Anda ditolak. Silakan coba lagi dengan foto yang lebih jelas."}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <KYCVerificationFlow
                onComplete={handleKycComplete}
                initialStep="upload-ktp"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {!["none", "pending", "verified", "rejected"].includes(kycStatus) && (
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <XCircle className="size-4" />
              <AlertTitle>Status Tidak Diketahui</AlertTitle>
              <AlertDescription>
                <p className="mb-3">
                  Kami tidak dapat menentukan status verifikasi KYC Anda.
                </p>
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                  Coba Lagi
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withOwnerAuth(OwnerKYCPage);
