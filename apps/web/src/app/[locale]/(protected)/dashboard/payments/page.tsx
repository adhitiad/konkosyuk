"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { apiClient } from "@/lib/axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Receipt,
  Building2,
  ArrowUpRight,
  Wallet,
  ExternalLink,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

interface PaymentItem {
  id: string;
  bookingId: string;
  provider: string;
  purpose: string;
  amount: string;
  currency: string;
  status: "pending" | "success" | "failed" | "expired" | "refunded";
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  propertyName: string | null;
  propertyAddress: string | null;
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const statusConfig: Record<
  PaymentItem["status"],
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
    badgeClass: string;
  }
> = {
  success: {
    label: "Berhasil",
    variant: "default",
    icon: CheckCircle2,
    badgeClass:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-200 dark:border-emerald-800",
  },
  pending: {
    label: "Menunggu Pembayaran",
    variant: "secondary",
    icon: Clock,
    badgeClass:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border-amber-200 dark:border-amber-800",
  },
  failed: {
    label: "Gagal",
    variant: "destructive",
    icon: XCircle,
    badgeClass:
      "bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 border-red-200 dark:border-red-800",
  },
  expired: {
    label: "Kedaluwarsa",
    variant: "outline",
    icon: AlertCircle,
    badgeClass: "bg-muted text-muted-foreground",
  },
  refunded: {
    label: "Dikembalikan",
    variant: "secondary",
    icon: RotateCcwIcon,
    badgeClass:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 border-blue-200 dark:border-blue-800",
  },
};

function RotateCcwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

const purposeLabel: Record<string, string> = {
  dp: "Uang Muka (DP)",
  full_payment: "Pelunasan Sewa",
  featured_listing: "Featured Listing",
};

export default function TenantPaymentsPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(
    null,
  );

  const {
    data: queryData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["tenant-payments"],
    queryFn: async () => {
      const response = await apiClient.get("/api/payments");
      return response.data;
    },
    staleTime: 30000,
    enabled: !!session?.user?.id,
  });

  const paymentsList: PaymentItem[] = Array.isArray(queryData?.data)
    ? queryData.data
    : [];

  // Summary metrics
  const totalSpent = paymentsList
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const successCount = paymentsList.filter(
    (p) => p.status === "success",
  ).length;
  const pendingCount = paymentsList.filter(
    (p) => p.status === "pending",
  ).length;

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Riwayat Pembayaran
        </h1>
        <p className="text-muted-foreground mt-1">
          Daftar seluruh riwayat transaksi dan pembayaran sewa kost Anda
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pengeluaran
            </CardTitle>
            <Wallet className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari {successCount} transaksi berhasil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pembayaran Berhasil
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Transaksi telah terkonfirmasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Menunggu Pembayaran
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Transaksi belum selesai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Gagal memuat data</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat memuat riwayat pembayaran."}
          </AlertDescription>
        </Alert>
      )}

      {/* Content Table / Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="size-5 text-primary" />
            Semua Transaksi
          </CardTitle>
          <CardDescription>
            Rincian pembayaran sewa kamar dan tagihan lainnya
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : paymentsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="size-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-semibold">
                Belum Ada Riwayat Pembayaran
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
                Anda belum melakukan transaksi pembayaran apa pun. Silakan
                ajukan booking kost untuk memulai.
              </p>
              <Button render={<Link href="/properties" />} nativeButton={false}>
                Jelajahi Kost <ArrowUpRight className="ml-1.5 size-4" />
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Properti</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsList.map((payment) => {
                    const status = statusConfig[payment.status] || {
                      label: payment.status,
                      variant: "outline" as const,
                      icon: Clock,
                      badgeClass: "",
                    };
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={payment.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-muted-foreground shrink-0" />
                            <div>
                              <div className="font-semibold text-foreground">
                                {payment.propertyName ?? "Kost/Kontrakan"}
                              </div>
                              {payment.transactionId && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  #{payment.transactionId}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {purposeLabel[payment.purpose] || payment.purpose}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs uppercase font-semibold bg-muted px-2 py-1 rounded">
                            {payment.provider}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={status.variant}
                            className={`inline-flex items-center gap-1.5 font-medium ${status.badgeClass}`}
                          >
                            <StatusIcon className="size-3.5" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(payment.paidAt || payment.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {payment.status === "success" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = `/api/payments/${payment.id}/receipt`;
                                  link.download = `receipt-${payment.id}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="mr-1.5 size-3.5" />
                                Receipt
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              Detail
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Detail Dialog */}
      <Dialog
        open={!!selectedPayment}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              Detail Pembayaran
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap transaksi sewa kost
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/40 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Nomor Invoice</span>
                  <span className="font-mono font-medium">
                    {selectedPayment.transactionId ||
                      selectedPayment.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Properti</span>
                  <span className="font-semibold text-right">
                    {selectedPayment.propertyName ?? "Properti"}
                  </span>
                </div>
                {selectedPayment.propertyAddress && (
                  <div className="flex justify-between items-start text-xs text-muted-foreground">
                    <span>Alamat</span>
                    <span className="text-right max-w-[200px]">
                      {selectedPayment.propertyAddress}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Tujuan</span>
                  <span>
                    {purposeLabel[selectedPayment.purpose] ||
                      selectedPayment.purpose}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Payment Gateway</span>
                  <span className="uppercase font-semibold text-xs bg-background px-2 py-0.5 rounded border">
                    {selectedPayment.provider}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      statusConfig[selectedPayment.status]?.variant || "outline"
                    }
                    className={statusConfig[selectedPayment.status]?.badgeClass}
                  >
                    {statusConfig[selectedPayment.status]?.label ||
                      selectedPayment.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Waktu Transaksi</span>
                  <span>{formatDate(selectedPayment.createdAt)}</span>
                </div>
                {selectedPayment.paidAt && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Waktu Dibayar</span>
                    <span>{formatDate(selectedPayment.paidAt)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between items-center font-bold">
                  <span>Total Tagihan</span>
                  <span className="text-lg text-primary">
                    {formatCurrency(selectedPayment.amount)}
                  </span>
                </div>
              </div>

              {selectedPayment.status === "pending" &&
                selectedPayment.transactionId && (
                  <Button
                    className="w-full"
                    render={
                      <Link
                        href={`/${locale}/checkout/${selectedPayment.transactionId}`}
                        target="_blank"
                      />
                    }
                    nativeButton={false}
                  >
                    Lanjutkan Pembayaran{" "}
                    <ExternalLink className="ml-1.5 size-4" />
                  </Button>
                )}

              {selectedPayment.status === "success" && (
                <Button
                  className="w-full"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `/api/payments/${selectedPayment.id}/receipt`;
                    link.download = `receipt-${selectedPayment.id}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="mr-1.5 size-4" />
                  Download Receipt
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
