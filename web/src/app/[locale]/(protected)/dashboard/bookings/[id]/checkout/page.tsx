"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { showToastError } from "@/lib/use-toast-custom";
import { apiClient } from "@/lib/axios";

export default function BookingCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const purpose = searchParams.get("purpose") as "dp" | "full_payment" | null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initiateCheckout = async () => {
      if (!purpose) {
        setError("Parameter pembayaran tidak valid");
        setLoading(false);
        return;
      }

      try {
        const pathname = window.location.pathname;
        const bookingId = pathname.split("/").filter(Boolean)[3];

        if (!bookingId) {
          setError("Booking tidak ditemukan");
          setLoading(false);
          return;
        }

        const provider = "mock";

        const { data } = await apiClient.post(
          `/api/bookings/${bookingId}/checkout`,
          { paymentProvider: provider },
        );

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.redirectUrl) {
          router.push(data.redirectUrl);
        } else if (data.invoiceNumber) {
          router.push(`/mock-checkout/${data.invoiceNumber}`);
        } else {
          throw new Error("Respons pembayaran tidak valid");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal memproses pembayaran";
        setError(message);
        showToastError(message);
        setLoading(false);
      }
    };

    initiateCheckout();
  }, [purpose, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Memproses Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Pembayaran Gagal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => router.push("/dashboard/bookings")}>
              Kembali ke Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
