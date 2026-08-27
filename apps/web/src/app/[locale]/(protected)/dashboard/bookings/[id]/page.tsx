"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
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
import { getBookingByIdAction } from "@/actions/bookings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { requestRefundAction } from "@/actions/refund-requests";
import { ChatTriggerButton } from "@/components/chat/chat-trigger-button";
import { useLocale } from "next-intl";
import { localeHref } from "@/lib/i18n";

interface BookingDetail {
  id: string;
  userId: string;
  propertyId: string;
  unitId: string;
  bookingType: string;
  status: string;
  startDate: Date;
  endDate: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
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
    paidAt: Date | null;
    createdAt: Date;
  }[];
  refundRequests?: {
    id: string;
    amount: string;
    approvedAmount: string | null;
    reason: string;
    status: string;
    reviewNote: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(Number(value ?? 0));

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value instanceof Date ? value : new Date(value));

const getWorkingDaysBetween = (start: Date, end: Date): number => {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const getRemainingWorkingDays = (createdAt: string): number => {
  const created = new Date(createdAt);
  const deadline = new Date(created);
  deadline.setDate(deadline.getDate() + 14);
  const remaining = getWorkingDaysBetween(new Date(), deadline);
  return Math.max(0, remaining);
};

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
  const locale = useLocale();

  const { data, isLoading, isError, error } = useQuery<{ data: BookingDetail }>(
    {
      queryKey: ["booking", bookingId],
      queryFn: async () => {
        const result = await getBookingByIdAction(bookingId);
        if (!result.success) {
          throw new Error("Gagal memuat detail booking");
        }
        return { data: result.data as unknown as BookingDetail };
      },
      staleTime: 30000,
    },
  );

  const booking = data?.data;

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [isPendingRefund, startRefundTransition] = useTransition();

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
  const paymentType = metadata?.paymentType as "dp" | "full" | undefined;
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

          {booking.refundRequests && booking.refundRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status Refund</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {booking.refundRequests.map((refund) => {
                    const remainingDays =
                      refund.status === "pending"
                        ? getRemainingWorkingDays(refund.createdAt)
                        : 0;
                    const progressValue =
                      refund.status === "pending"
                        ? Math.max(0, 100 - (remainingDays / 14) * 100)
                        : refund.status === "approved"
                          ? 100
                          : 0;

                    return (
                      <div
                        key={refund.id}
                        className="flex flex-col gap-3 rounded-xl border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Pengajuan Refund
                          </span>
                          <Badge
                            variant={
                              refund.status === "approved"
                                ? "default"
                                : refund.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {refund.status === "pending" && "Menunggu"}
                            {refund.status === "approved" && "Disetujui"}
                            {refund.status === "rejected" && "Ditolak"}
                          </Badge>
                        </div>

                        {refund.status === "pending" && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Batas proses refund
                              </span>
                              <span className="font-medium">
                                {remainingDays} hari kerja tersisa
                              </span>
                            </div>
                            <Progress value={progressValue} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              Refund akan diproses maksimal 14 hari kerja sejak
                              pengajuan.
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Jumlah Diajukan
                            </p>
                            <p className="font-medium">
                              {formatCurrency(refund.amount)}
                            </p>
                          </div>
                          {refund.approvedAmount && (
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Jumlah Disetujui
                              </p>
                              <p className="font-medium">
                                {formatCurrency(refund.approvedAmount)}
                              </p>
                            </div>
                          )}
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">
                              Alasan
                            </p>
                            <p className="text-sm">{refund.reason}</p>
                          </div>
                          {refund.reviewNote && (
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground">
                                Catatan Admin
                              </p>
                              <p className="text-sm">{refund.reviewNote}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Tanggal Pengajuan
                            </p>
                            <p className="font-medium">
                              {formatDate(refund.createdAt)}
                            </p>
                          </div>
                          {refund.reviewedAt && (
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Tanggal Review
                              </p>
                              <p className="font-medium">
                                {formatDate(refund.reviewedAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
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
              {paymentType === "full" ? (
                <div className="flex items-center justify-between text-sm text-primary">
                  <span>Pembayaran Lunas</span>
                  <span className="font-medium">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">DP 35%</span>
                    <span className="font-medium">
                      {formatCurrency(dpAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sisa 65%</span>
                    <span className="font-medium">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ChatTriggerButton
                propertyId={booking.propertyId}
                propertyName={booking.propertyName ?? "Properti"}
                variant="outline"
                className="w-full"
              />
              {booking.status === "pending_dp" && (
                <Button
                  render={
                    <Link
                      href={localeHref(
                        locale,
                        `/dashboard/bookings/${booking.id}/checkout?purpose=dp`,
                      )}
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
                      href={localeHref(
                        locale,
                        `/dashboard/bookings/${booking.id}/checkout?purpose=full_payment`,
                      )}
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
                  render={
                    <Link
                      href={`/${locale}/properties/${booking.propertyId}`}
                    />
                  }
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
                  render={<Link href={`/${locale}/properties`} />}
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                >
                  Cari Properti Lain
                </Button>
              )}
              {booking.status !== "rejected" &&
                booking.status !== "cancelled" &&
                booking.status !== "completed" &&
                booking.startDate > new Date() &&
                booking.payments.some((p) => p.status === "success") && (
                  <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
                    <DialogTrigger>
                      <Button
                        variant="destructive"
                        className="w-full"
                        nativeButton={false}
                      >
                        Ajukan Refund
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajukan Refund</DialogTitle>
                        <DialogDescription>
                          Ajukan pengembalian dana untuk booking ini. Refund
                          akan diproses oleh admin.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        action={async (formData) => {
                          startRefundTransition(async () => {
                            const result = await requestRefundAction(
                              undefined,
                              formData,
                            );
                            if (result.success) {
                              showToastSuccess(
                                "Pengajuan refund berhasil dikirim",
                              );
                              setRefundOpen(false);
                              setRefundReason("");
                            } else {
                              showToastError(
                                result.error ?? "Gagal mengajukan refund",
                              );
                            }
                          });
                        }}
                      >
                        <input
                          type="hidden"
                          name="bookingId"
                          value={booking.id}
                        />
                        <input
                          type="hidden"
                          name="paymentId"
                          value={
                            booking.payments.find((p) => p.status === "success")
                              ?.id ?? ""
                          }
                        />
                        <div className="space-y-2">
                          <Label htmlFor="reason">Alasan Refund</Label>
                          <Textarea
                            id="reason"
                            name="reason"
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="Jelaskan alasan refund..."
                            required
                            minLength={10}
                          />
                        </div>
                        <DialogFooter className="mt-4">
                          <Button
                            type="submit"
                            disabled={isPendingRefund || !refundReason.trim()}
                            variant="destructive"
                          >
                            {isPendingRefund ? "Mengirim..." : "Ajukan Refund"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
