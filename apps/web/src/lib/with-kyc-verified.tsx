"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useKycStatus } from "@/hooks/use-kyc-status";
import { useLocale } from "next-intl";

interface WithKycVerifiedOptions {
  redirectTo?: string;
  showKycPrompt?: boolean;
}

export function withKycVerified<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithKycVerifiedOptions = {},
) {
  const { redirectTo = "/owner/kyc", showKycPrompt = true } = options;

  return function KYCProtectedComponent(props: P) {
    const { data: session, isPending } = useSession();
    const { isVerified, isLoading: kycLoading } = useKycStatus();
    const router = useRouter();
    const locale = useLocale();

    const userRole = (session?.user as { role?: string } | undefined)?.role;
    const isLoadingKyc = kycLoading || isPending;

    useEffect(() => {
      if (!isLoadingKyc && session && userRole === "owner" && !isVerified) {
        router.push(`/${locale}${redirectTo}`);
      }
    }, [session, isLoadingKyc, router, isVerified, userRole, locale]);

    if (isLoadingKyc || !session) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (userRole !== "owner") {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!isVerified) {
      if (!showKycPrompt) {
        return (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
      }

      return (
        <div className="container py-6 max-w-2xl">
          <Alert variant="destructive" className="mb-6">
            <ShieldCheck className="size-4" />
            <AlertDescription>
              Anda perlu menyelesaikan verifikasi KYC sebelum dapat mengakses
              halaman ini.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Link
              href={`/${locale}${redirectTo}`}
              className="inline-flex h-9 items-center justify-center rounded-4xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Verifikasi KYC Sekarang
            </Link>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
