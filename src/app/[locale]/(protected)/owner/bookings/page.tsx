"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, UserIcon } from "@hugeicons/core-free-icons";
import ReviewBookingDialog from "./review-booking-dialog";
import TenantDetailDialog from "./tenant-detail-dialog";
import ReviewForm from "@/components/review-form";
import type { Booking } from "@/db/schema";
import { apiClient } from "@/lib/axios";

export interface OwnerBooking extends Booking {
  propertyName: string | null;
  propertyAddress: string | null;
  unitName: string | null;
  unitPrice: string | null;
  userName: string | null;
  userEmail: string | null;
  rejectionReason: string | null;
}

type BookingStatus = Booking["status"];

const tabOptions: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "awaiting_owner_approval", label: "Menunggu Approval" },
  { value: "awaiting_full_payment", label: "Diterima" },
  { value: "rejected", label: "Ditolak" },
];

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending_dp: { label: "Pending DP", variant: "outline" },
  awaiting_owner_approval: { label: "Menunggu Approval", variant: "secondary" },
  awaiting_full_payment: { label: "Menunggu Pembayaran", variant: "default" },
  confirmed: { label: "Dikonfirmasi", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
};

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(Number(value ?? 0));

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

export default function OwnerBookingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery<{
    data: OwnerBooking[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: ["owner-bookings", activeTab, page],
    queryFn: async () => {
      const response = await apiClient.get("/api/bookings", {
        params: {
          status: activeTab === "all" ? "" : activeTab,
          page,
          limit,
        },
      });
      const body = response.data as {
        success?: boolean;
        data?: {
          data: OwnerBooking[];
          meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      };
      const payload = body.data;
      return (
        payload ?? { data: [], meta: { total: 0, page, limit, totalPages: 0 } }
      );
    },
    staleTime: 30000,
  });

  const rawBookings = Array.isArray(data?.data)
    ? data.data
    : (data as any)?.data?.data;
  const bookings = Array.isArray(rawBookings) ? rawBookings : [];
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Booking Requests</h1>
        <p className="text-muted-foreground">
          Kelola permintaan booking untuk properti Anda
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

      <div className="mb-4 flex flex-wrap gap-2">
        {tabOptions.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Tidak ada booking untuk filter ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Properti</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead>DP Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const metadata = booking.metadata as
                    Record<string, unknown> | undefined;
                  const dpAmount = metadata?.dpAmount
                    ? Number(metadata.dpAmount)
                    : 0;
                  const config = statusConfig[booking.status] ?? {
                    label: booking.status,
                    variant: "outline",
                  };

                  return (
                    <TableRow key={booking.id} className="cursor-pointer">
                      <TableCell className="font-medium">
                        {booking.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {booking.userName ?? booking.userEmail ?? "-"}
                      </TableCell>
                      <TableCell>{booking.propertyName ?? "-"}</TableCell>
                      <TableCell>{booking.unitName ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(booking.startDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatCurrency(dpAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger
                              render={
                                <Button size="sm" variant="ghost">
                                  <HugeiconsIcon
                                    icon={UserIcon}
                                    strokeWidth={2}
                                    className="size-4"
                                  />
                                  Detail
                                </Button>
                              }
                            />
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detail Tenant</DialogTitle>
                              </DialogHeader>
                              <TenantDetailDialog booking={booking} />
                            </DialogContent>
                          </Dialog>

                          {(booking.status === "confirmed" ||
                            booking.status === "completed") &&
                            new Date(booking.endDate) < new Date() && (
                              <Dialog
                                open={reviewBookingId === booking.id}
                                onOpenChange={(open) =>
                                  !open && setReviewBookingId(null)
                                }
                              >
                                <DialogTrigger
                                  render={
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setReviewBookingId(booking.id)
                                      }
                                    >
                                      Beri Rating
                                    </Button>
                                  }
                                />
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Beri Rating Tenant
                                    </DialogTitle>
                                  </DialogHeader>
                                  <ReviewForm
                                    bookingId={booking.id}
                                    type="tenant"
                                    targetId={booking.userId}
                                    targetName={booking.userName ?? "Tenant"}
                                    onSuccess={() => setReviewBookingId(null)}
                                  />
                                </DialogContent>
                              </Dialog>
                            )}

                          {booking.status === "awaiting_owner_approval" && (
                            <ReviewBookingDialog
                              bookingId={booking.id}
                              propertyName={booking.propertyName ?? "Properti"}
                              unitName={booking.unitName ?? "Unit"}
                              tenantName={booking.userName ?? "Tenant"}
                            >
                              <Button size="sm" variant="outline">
                                Review
                              </Button>
                            </ReviewBookingDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-center">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
