"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2 } from "lucide-react";
import KYCVerificationFlow from "@/components/kyc/KYCVerificationFlow";
import { useKycStatus } from "@/hooks/use-kyc-status";

interface KycGuardProps {
  children: React.ReactNode;
}

function getStatusMessage(kycStatus: string): string {
  switch (kycStatus) {
    case "pending":
      return "Verifikasi KYC Anda sedang diproses oleh tim kami.";
    case "rejected":
      return "Verifikasi KYC Anda ditolak. Silakan lakukan verifikasi ulang.";
    case "none":
    default:
      return "Anda belum memiliki verifikasi KYC. Selesaikan verifikasi untuk dapat menambah properti.";
  }
}

export function KycGuard({ children }: KycGuardProps) {
  const queryClient = useQueryClient();
  const { isLoading, isError, isVerified, kycStatus, refetch } = useKycStatus();
  const [dialogRequested, setDialogRequested] = useState(false);

  const shouldPoll = dialogRequested && kycStatus === "pending";

  useEffect(() => {
    if (!shouldPoll) return;
    const interval = setInterval(() => refetch(), 1000 * 30);
    return () => clearInterval(interval);
  }, [shouldPoll, refetch]);

  const handleKycComplete = (status: "approved" | "rejected" | "pending") => {
    queryClient.invalidateQueries({ queryKey: ["owner-kyc-status"] });
    if (status === "approved") {
      setDialogRequested(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="default">
        <ShieldAlert className="size-4" />
        <AlertTitle>Gagal memuat status KYC</AlertTitle>
        <AlertDescription>
          Silakan refresh halaman atau coba lagi.
        </AlertDescription>
      </Alert>
    );
  }

  if (isVerified) {
    return <>{children}</>;
  }

  const isBlocked = kycStatus === "pending";
  const isDialogOpen = dialogRequested && !isVerified;

  return (
    <div className="flex flex-col gap-3">
      <Alert variant={isBlocked ? "default" : "destructive"}>
        {isBlocked ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ShieldAlert className="size-4" />
        )}
        <AlertTitle>Verifikasi KYC Diperlukan</AlertTitle>
        <AlertDescription>{getStatusMessage(kycStatus)}</AlertDescription>
      </Alert>

      {!isBlocked && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) setDialogRequested(false);
            if (open) setDialogRequested(true);
          }}
        >
          <DialogTrigger
            render={
              <Button>
                <ShieldAlert className="mr-2 size-4" />
                Verifikasi Identitas Sekarang
              </Button>
            }
          />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verifikasi Identitas (KYC)</DialogTitle>
            </DialogHeader>
            <KYCVerificationFlow
              onComplete={handleKycComplete}
              initialStep="upload-ktp"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
