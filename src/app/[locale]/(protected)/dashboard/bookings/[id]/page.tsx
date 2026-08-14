"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useParams } from "next/navigation";
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
} from "@hugeicons/core-free-icons";
import { apiClient } from "@/lib/axios";

interface BookingDetail {
  id: string;
  userId: string;
  propertyId: string;
  unitId: string;
  bookingType: string;
  status: string;
  startDate: string;
  endDate: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  propertyName: string | null;
  propertyAddress: string | null;
  unitName: string | null;
  unitPrice: string | null;
  payments: {
    id: string;
    provider: string;
    purpose: string;
    amount: string;
    currency: string;
    status: string;
    transactionId: string | null;
    paidAt: string | null;
    createdAt: string;
  }[];
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(Number(value ?? 0));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  pending_dp: {
    label: "Menunggu Bayar DP",
    variant: "secondary",
    icon: (
      <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" />
    ),
  },
  awaiting_owner_approval: {
    label: "Menunggu Persetujuan Owner",
    variant: "default",
    icon: (
      <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" />
    ),
  },
  awaiting_full_payment: {
    label: "Menunggu Pelunasan",
    variant: "default",
    icon: (
      <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" />
    ),
  },
  confirmed: {
    label: "Dikonfirmasi",
    variant: "default",
    icon: (
      <HugeiconsIcon
        icon={CheckmarkCircle02Icon}
        strokeWidth={2}
        className="size-4"
      />
    ),
  },
  rejected: {
    label: "Ditolak",
    variant: "destructive",
    icon: (
      <HugeiconsIcon
        icon={CancelCircleIcon}
        strokeWidth={2}
        className="size-4"
      />
    ),
  },
  cancelled: {
    label: "Dibatalkan",
    variant: "destructive",
    icon: (
      <HugeiconsIcon
        icon={CancelCircleIcon}
        strokeWidth={2}
        className="size-4"
      />
    ),
  },
};

const statusSteps = [
  "pending_dp",
  "awaiting_owner_approval",
  "awaiting_full_payment",
  "confirmed",
];

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const { data: session } = useSession();

  const { data, isLoading, isError, error } = useQuery<{ data: BookingDetail }>(
    {
      queryKey: ["booking", bookingId],
      queryFn: async () => {
        const { data } = await apiClient.get(`/api/bookings/${bookingId}`);
        return data;
      },
      staleTime: 30000,
    },
  );

  const booking = data?.data;

  if (isLoading) {
    return (
      <div className="container py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Booking tidak ditemukan."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const metadata = booking.metadata as Record<string, unknown> | undefined;
  const totalPrice = metadata?.totalPrice ? Number(metadata.totalPrice) : 0;
  const dpAmount = metadata?.dpAmount ? Number(metadata.dpAmount) : 0;
  const remainingAmount = metadata?.remainingAmount
    ? Number(metadata.remainingAmount)
    : 0;
  const config = statusConfig[booking.status] ?? {
    label: booking.status,
    variant: "outline",
    icon: null,
  };
  const currentStepIndex = statusSteps.indexOf(booking.status);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detail Booking</h1>
          <p className="text-muted-foreground text-sm font-mono">
            ID: {booking.id}
          </p>
        </div>
        <Badge variant={config.variant} className="flex items-center gap-2">
          {config.icon}
          {config.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Booking</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Properti</p>
                <p className="text-sm font-medium">
                  {booking.propertyName ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {booking.propertyAddress ?? ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit</p>
                <p className="text-sm font-medium">{booking.unitName ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tanggal Mulai</p>
                <p className="text-sm font-medium">
                  {formatDate(booking.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tanggal Selesai</p>
                <p className="text-sm font-medium">
                  {formatDate(booking.endDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipe Booking</p>
                <p className="text-sm font-medium capitalize">
                  {booking.bookingType}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dibuat</p>
                <p className="text-sm font-medium">
                  {formatDate(booking.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative flex items-center justify-between">
                <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-muted" />
                {statusSteps.map((step, index) => {
                  const isCompleted =
                    index < currentStepIndex || booking.status === "confirmed";
                  const isCurrent = index === currentStepIndex;
                  const isRejected =
                    booking.status === "rejected" ||
                    booking.status === "cancelled";

                  return (
                    <div
                      key={step}
                      className="relative flex flex-col items-center gap-2"
                    >
                      <div
                        className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          isRejected
                            ? "border-destructive bg-destructive/10"
                            : isCompleted || isCurrent
                              ? "border-primary bg-primary"
                              : "border-muted bg-background"
                        }`}
                      >
                        {isCompleted && !isRejected ? (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            strokeWidth={2}
                            className="size-4 text-primary-foreground"
                          />
                        ) : isRejected ? (
                          <HugeiconsIcon
                            icon={CancelCircleIcon}
                            strokeWidth={2}
                            className="size-4 text-destructive"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs ${isCurrent ? "font-medium text-foreground" : "text-muted-foreground"}`}
                      >
                        {step.replace(/_/g, " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detail Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada pembayaran.
                </p>
              ) : (
                <div className="space-y-4">
                  {booking.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col gap-2 rounded-xl border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {payment.purpose.replace(/_/g, " ")}
                        </span>
                        <Badge
                          variant={
                            payment.status === "success"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Provider
                          </p>
                          <p className="font-medium capitalize">
                            {payment.provider}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Invoice
                          </p>
                          <p className="font-mono text-xs">
                            {payment.transactionId ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Jumlah
                          </p>
                          <p className="font-medium">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Dibayar
                          </p>
                          <p className="font-medium">
                            {payment.paidAt ? formatDate(payment.paidAt) : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Biaya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">DP 35%</span>
                <span className="font-medium">{formatCurrency(dpAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sisa 65%</span>
                <span className="font-medium">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {booking.status === "pending_dp" && (
                <Button
                  render={
                    <Link
                      href={`/dashboard/bookings/${booking.id}/checkout?purpose=dp`}
                    />
                  }
                  className="w-full"
                  nativeButton={false}
                >
                  Bayar DP
                </Button>
              )}
              {booking.status === "awaiting_full_payment" && (
                <Button
                  render={
                    <Link
                      href={`/dashboard/bookings/${booking.id}/checkout?purpose=full_payment`}
                    />
                  }
                  className="w-full"
                  nativeButton={false}
                >
                  Bayar Pelunasan
                </Button>
              )}
              {booking.status === "confirmed" && (
                <Button
                  render={<Link href={`/properties/${booking.propertyId}`} />}
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                >
                  Lihat Properti
                </Button>
              )}
              {(booking.status === "rejected" ||
                booking.status === "cancelled") && (
                <Button
                  render={<Link href="/properties" />}
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                >
                  Cari Properti Lain
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
