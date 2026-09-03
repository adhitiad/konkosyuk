"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { apiClient } from "@/lib/axios";
import { useLocale } from "next-intl";
import { unwrapApiResponse } from "@/lib/api-response";

interface TenantBookingItem {
  id: string;
  propertyId: string;
  unitId: string;
  bookingType: string;
  status: string;
  startDate: string;
  endDate: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  propertyName: string | null;
  propertyAddress: string | null;
  unitName: string | null;
  unitPrice: string | null;
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(Number(value ?? 0));

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending_dp: { label: "Menunggu Pembayaran DP", variant: "secondary" },
  awaiting_full_payment: { label: "Menunggu Pembayaran Lunas", variant: "secondary" },
  confirmed: { label: "Dikonfirmasi", variant: "default" },
  completed: { label: "Selesai", variant: "default" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  expired: { label: "Kedaluwarsa", variant: "outline" },
};

export default function TenantBookingsPage() {
  const { data: session } = useSession();
  const locale = useLocale();

  const { data, isLoading, isError, error } = useQuery<TenantBookingItem[]>({
    queryKey: ["tenant-bookings"],
    queryFn: async () => {
      const response = await apiClient.get("/api/tenant/bookings");
      const payload = unwrapApiResponse<{ data: TenantBookingItem[] }>(
        response.data,
      );
      return payload.data ?? [];
    },
    staleTime: 30000,
    enabled: !!session?.user?.id,
  });

  const bookings: TenantBookingItem[] = data ?? [];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Booking</h1>
        <p className="text-muted-foreground">
          Lihat status permintaan sewa Anda
        </p>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Gagal memuat data booking."}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="container py-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="size-16 text-muted-foreground/50 mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">
              Belum ada booking
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Anda belum memiliki booking aktif. Jelajahi properti tersedia
              dan temukan kamar ideal Anda.
            </p>
            <Link
              href="/properties"
              className="inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/80 h-9 gap-1.5 px-3"
            >
              Cari Kost Sekarang
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => {
            const config = statusConfig[booking.status] ?? {
              label: booking.status,
              variant: "outline",
            };
            const metadata = booking.metadata as Record<string, unknown> | undefined;
            const totalPrice = metadata?.totalPrice
              ? Number(metadata.totalPrice)
              : null;

            return (
              <Card key={booking.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base leading-tight">
                        {booking.propertyName ?? "Properti"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {booking.unitName ?? "Unit"}
                      </p>
                    </div>
                    <Badge variant={config.variant} className="shrink-0">
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(booking.createdAt)}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        Tanggal Mulai:
                      </span>{" "}
                      <span className="font-medium">
                        {formatDate(booking.startDate)}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        Tanggal Selesai:
                      </span>{" "}
                      <span className="font-medium">
                        {formatDate(booking.endDate)}
                      </span>
                    </p>
                    {totalPrice !== null && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Total Harga:
                        </span>{" "}
                        <span className="font-semibold text-primary">
                          {formatCurrency(totalPrice)}
                        </span>
                      </p>
                    )}
                  </div>

                  {(booking.status === "pending_dp" ||
                    booking.status === "awaiting_full_payment") && (
                    <div className="rounded-4xl border p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {booking.status === "pending_dp"
                          ? "DP 35% yang harus dibayar:"
                          : "Pembayaran lunas yang harus dibayar:"}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {booking.status === "pending_dp"
                          ? formatCurrency(
                              metadata?.dpAmount
                                ? Number(metadata.dpAmount)
                                : (totalPrice ?? 0) * 0.35,
                            )
                          : formatCurrency(
                              metadata?.remainingAmount
                                ? Number(metadata.remainingAmount)
                                : (totalPrice ?? 0) - (metadata?.dpAmount ? Number(metadata.dpAmount) : (totalPrice ?? 0) * 0.35)
                            )}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-end gap-2">
                    {(booking.status === "pending_dp" ||
                      booking.status === "awaiting_full_payment") && (
                      <Link
                        href={`/${locale}/dashboard/bookings/${booking.id}/checkout?purpose=${booking.status === "pending_dp" ? "dp" : "full_payment"}`}
                        className="inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/80 h-9 gap-1.5 px-3"
                      >
                        Bayar Sekarang
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
