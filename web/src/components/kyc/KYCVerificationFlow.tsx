"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Loader2,
  Upload,
  Camera,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { csrfFetch } from "@/lib/axios";

export type KycStep = "upload-ktp" | "selfie" | "processing" | "result";

export interface KYCVerificationFlowProps {
  onComplete?: (
    status: "approved" | "rejected" | "pending",
    reason?: string,
  ) => void;
  initialStep?: KycStep;
}

const STEPS: { key: KycStep; label: string; description: string }[] = [
  {
    key: "upload-ktp",
    label: "Upload KTP",
    description: "Unggah foto KTP Anda",
  },
  {
    key: "selfie",
    label: "Selfie",
    description: "Ambil foto selfie untuk liveness detection",
  },
  {
    key: "processing",
    label: "Verifikasi",
    description: "Menunggu proses verifikasi",
  },
  { key: "result", label: "Hasil", description: "Hasil verifikasi KYC" },
];

export default function KYCVerificationFlow({
  onComplete,
  initialStep = "upload-ktp",
}: KYCVerificationFlowProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<KycStep>(initialStep);
  const [ktpImage, setKtpImage] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    status: "approved" | "rejected" | "pending";
    reason?: string;
  } | null>(null);

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleKtpUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("Ukuran file maksimal 10MB");
        return;
      }

      setKtpImage(file);
      setKtpPreview(URL.createObjectURL(file));
      setError(null);
    },
    [],
  );

  const handleSelfieUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("Ukuran file maksimal 10MB");
        return;
      }

      setSelfieImage(file);
      setSelfiePreview(URL.createObjectURL(file));
      setError(null);
    },
    [],
  );

  const uploadToStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "ktp");

    const response = await csrfFetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = typeof errorData.error === "string"
          ? errorData.error
          : errorData.error?.message;
        throw new Error(err || "Gagal mengupload file");
      }

    const data = await response.json();
    return data.url;
  };

  const handleNext = async () => {
    setError(null);

    if (currentStep === "upload-ktp") {
      if (!ktpImage) {
        setError("Foto KTP wajib diupload");
        return;
      }
      setCurrentStep("selfie");
    } else if (currentStep === "selfie") {
      if (!selfieImage) {
        setError("Foto selfie wajib diupload");
        return;
      }
      setCurrentStep("processing");
      await submitVerification();
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === "selfie") {
      setCurrentStep("upload-ktp");
    } else if (currentStep === "processing") {
      setCurrentStep("selfie");
    }
  };

  const submitVerification = async () => {
    setIsSubmitting(true);
    try {
      let ktpImageUrl: string | undefined;
      let selfieImageUrl: string | undefined;

      if (ktpImage) {
        ktpImageUrl = await uploadToStorage(ktpImage);
      }
      if (selfieImage) {
        selfieImageUrl = await uploadToStorage(selfieImage);
      }

      const response = await fetch("/api/kyc/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "ktp",
          ktpImageUrl,
          selfieImageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errMsg = typeof data.error === "string"
          ? data.error
          : data.error?.message || "Gagal memulai verifikasi KYC";
        throw new Error(errMsg);
      }

      const body = await response.json();
      const data = body.data ?? body;

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setCurrentStep("result");
        setVerificationResult({ status: "pending" });
        onComplete?.("pending");

        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        queryClient.invalidateQueries({ queryKey: ["owner-kyc-status"] });
        await authClient.getSession();
      }
     } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setCurrentStep("selfie");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setCurrentStep("selfie");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "upload-ktp":
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Petunjuk Foto KTP</AlertTitle>
              <AlertDescription>
                Pastikan foto KTP jelas, tidak buram, dan semua sudut terlihat.
                Cahaya harus cukup dan tidak ada bayangan yang menghalangi.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8">
              {ktpPreview ? (
                <div className="relative mx-auto aspect-[4/3] w-full max-w-xs max-h-64">
                  <Image
                    src={ktpPreview}
                    alt="Preview KTP"
                    fill
                    unoptimized
                    className="object-contain rounded-lg"
                    sizes="(max-width: 768px) 90vw, 50vw"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setKtpImage(null);
                      setKtpPreview(null);
                    }}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <XCircle className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Klik atau seret foto KTP ke sini
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Format: JPG, PNG. Maksimal 10MB
                  </p>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleKtpUpload}
                className="mt-4"
              />
            </div>
          </div>
        );

      case "selfie":
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Petunjuk Selfie</AlertTitle>
              <AlertDescription>
                Pastikan wajah berada di dalam bingkai, pencahayaan cukup, dan
                tidak memakai kacamata atau masker. Ekspresi wajah harus alami.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8">
              {selfiePreview ? (
                <div className="relative mx-auto aspect-[4/3] w-full max-w-xs max-h-64">
                  <Image
                    src={selfiePreview}
                    alt="Preview Selfie"
                    fill
                    unoptimized
                    className="object-contain rounded-lg"
                    sizes="(max-width: 768px) 90vw, 50vw"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelfieImage(null);
                      setSelfiePreview(null);
                    }}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <XCircle className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="size-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Klik atau seret foto selfie ke sini
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gunakan kamera depan untuk hasil terbaik
                  </p>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleSelfieUpload}
                className="mt-4"
              />
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium">
              Memverifikasi identitas Anda...
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Proses ini biasanya memakan waktu 1-2 menit
            </p>
            <Progress value={66} className="mt-6 w-full max-w-md" />
          </div>
        );

      case "result":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            {verificationResult?.status === "approved" ? (
              <>
                <CheckCircle2 className="size-16 text-green-500" />
                <p className="mt-4 text-lg font-medium">Verifikasi Berhasil</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Identitas Anda telah diverifikasi. Anda sekarang bisa
                  mendaftarkan properti.
                </p>
              </>
            ) : verificationResult?.status === "rejected" ? (
              <>
                <XCircle className="size-16 text-destructive" />
                <p className="mt-4 text-lg font-medium">Verifikasi Ditolak</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {verificationResult.reason ||
                    "Foto KTP atau selfie tidak jelas. Silakan coba lagi."}
                </p>
              </>
            ) : (
              <>
                <Loader2 className="size-12 animate-spin text-primary" />
                <p className="mt-4 text-lg font-medium">
                  Menunggu Hasil Verifikasi
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hasil verifikasi akan dikirimkan melalui email dan ditampilkan
                  di sini.
                </p>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Verifikasi Identitas (KYC)</CardTitle>
        <div className="mt-4">
          <Progress value={progress} />
          <div className="mt-2 flex justify-between">
            {STEPS.map((step, index) => (
              <div
                key={step.key}
                className={`flex flex-col items-center gap-1 ${
                  index <= currentStepIndex
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <span className="text-xs font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertTitle>Terjadi Kesalahan</AlertTitle>
            <AlertDescription>
              <p className="mb-2">{error}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRetry}
              >
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {renderStepContent()}

        {currentStep !== "processing" && currentStep !== "result" && (
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === "upload-ktp" || isSubmitting}
            >
              Kembali
            </Button>
            <Button type="button" onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses...
                </>
              ) : currentStep === "upload-ktp" ? (
                "Lanjutkan"
              ) : (
                "Kirim Verifikasi"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
