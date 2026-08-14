"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ShieldCheck, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import KYCVerificationFlow, { type KycStep } from "@/components/kyc/KYCVerificationFlow";
import { withOwnerAuth } from "@/lib/with-owner-auth";

function OwnerKYCPage() {
  const [flowStep, setFlowStep] = useState<KycStep>("upload-ktp");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kyc-status"],
    queryFn: async () => {
      const res = await fetch("/api/kyc/status");
      if (!res.ok) throw new Error("Failed to fetch KYC status");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.kycStatus === "pending") {
      setFlowStep("processing");
    } else if (data?.kycStatus === "verified") {
      setFlowStep("result");
    } else if (data?.kycStatus === "rejected") {
      setFlowStep("result");
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

  const handleKycComplete = (status: "approved" | "rejected" | "pending", reason?: string) => {
    if (status === "approved") {
      setFlowStep("result");
    } else if (status === "rejected") {
      setFlowStep("result");
    }
    refetch();
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
          <AlertDescription>
            Gagal memuat status KYC. Silakan coba lagi.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const kycStatus = data?.kycStatus;
  const verification = data?.verification;

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verifikasi Identitas (KYC)</h1>
          <p className="mt-2 text-muted-foreground">
            Verifikasi identitas Anda untuk dapat mendaftarkan properti di platform KonkosYuk.
          </p>
        </div>
        {getStatusBadge()}
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
            <div className="pt-4">
              <KYCVerificationFlow onComplete={handleKycComplete} initialStep="upload-ktp" />
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
              <AlertDescription>
                Verifikasi KYC Anda sedang diproses. Proses ini biasanya memakan waktu 1-2 menit.
                Anda akan mendapatkan notifikasi melalui email setelah verifikasi selesai.
              </AlertDescription>
            </Alert>
            {verification && (
              <div className="text-sm text-muted-foreground">
                <p>ID Sesi: {verification.diditSessionId}</p>
                <p>Dokumen: {verification.documentType?.toUpperCase()}</p>
                <p>Dikirim: {new Date(verification.createdAt).toLocaleString("id-ID")}</p>
              </div>
            )}
            <KYCVerificationFlow onComplete={handleKycComplete} initialStep="processing" />
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
                Identitas Anda telah berhasil diverifikasi. Anda sekarang bisa mendaftarkan properti dan
                menggunakan semua fitur platform.
              </AlertDescription>
            </Alert>
            {verification && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Diverifikasi pada: {new Date(verification.updatedAt).toLocaleString("id-ID")}</p>
                <p>Dokumen: {verification.documentType?.toUpperCase()}</p>
                {verification.faceMatchScore && (
                  <p>Face Match Score: {verification.faceMatchScore}%</p>
                )}
                {verification.livenessPassed !== null && (
                  <p>Liveness Detection: {verification.livenessPassed ? "Lulus" : "Tidak Lulus"}</p>
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
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="size-4" />
              <AlertDescription>
                {verification?.rejectionReason || "Verifikasi KYC Anda ditolak. Silakan coba lagi dengan foto yang lebih jelas."}
              </AlertDescription>
            </Alert>
            <KYCVerificationFlow onComplete={handleKycComplete} initialStep="upload-ktp" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withOwnerAuth(OwnerKYCPage);
