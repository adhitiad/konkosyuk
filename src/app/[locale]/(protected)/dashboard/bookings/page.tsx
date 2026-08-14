"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CancelCircleIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { apiClient } from "@/lib/axios";

interface BookingRequestItem {
  id: string;
  numOccupants: number;
  startDate: string;
  status: string;
  agreedPrice: string | null;
  createdAt: string;
  tenantName: string | null;
  tenantEmail: string | null;
  unitName: string | null;
  propertyName: string | null;
  unitCapacity: string | null;
  matchedPrice: number | null;
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
  pending: { label: "Menunggu Persetujuan Owner", variant: "secondary" },
  approved: { label: "Disetujui - Segera Bayar DP", variant: "default" },
  paid: { label: "Aktif / Lunas", variant: "default" },
  confirmed: { label: "Aktif / Lunas", variant: "default" },
  rejected: { label: "Ditolak Owner", variant: "destructive" },
  expired: { label: "Kedaluwarsa (Tidak Dibayar)", variant: "outline" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
};

export default function TenantBookingsPage() {
  const { data: session } = useSession();

  const { data, isLoading, isError, error } = useQuery<{
    data: BookingRequestItem[];
  }>({
    queryKey: ["tenant-booking-requests"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/tenant/booking-requests");
      return data;
    },
    staleTime: 30000,
    enabled: !!session?.user?.id,
  });

  const bookings = data?.data ?? [];

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
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
              Belum ada riwayat booking
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Anda belum pernah melakukan permintaan sewa. Jelajahi properti
              tersedia dan temukan kamar ideal Anda.
            </p>
            <Button render={<Link href="/properties" />} nativeButton={false}>
              Cari Kost Sekarang
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => {
            const config = statusConfig[booking.status] ?? {
              label: booking.status,
              variant: "outline",
            };
            const price =
              booking.matchedPrice ??
              (booking.agreedPrice ? Number(booking.agreedPrice) : null);

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
                        Jumlah Penghuni:
                      </span>{" "}
                      <span className="font-medium">
                        {booking.numOccupants} orang
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        Tanggal Mulai:
                      </span>{" "}
                      <span className="font-medium">
                        {formatDate(booking.startDate)}
                      </span>
                    </p>
                    {price !== null && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          Harga Disetujui:
                        </span>{" "}
                        <span className="font-semibold text-primary">
                          {formatCurrency(price)}
                        </span>
                      </p>
                    )}
                  </div>

                  {booking.status === "approved" && price !== null && (
                    <div className="rounded-4xl border p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        DP 35% yang harus dibayar:
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(price * 0.35)}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-end gap-2">
                    {booking.status === "approved" && (
                      <Button
                        size="sm"
                        render={
                          <Link href={`/dashboard/bookings/${booking.id}`} />
                        }
                        nativeButton={false}
                      >
                        Bayar Sekarang
                      </Button>
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
