"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Add01Icon,
  MultiplicationSignIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "@/components/ui/toast";
import {
  createManualPaymentAction,
  cancelPaymentAction,
  reconcilePaymentAction,
} from "@/actions/admin/payments";
import { withAdminAuth } from "@/lib/with-admin-auth";

interface Payment {
  id: string;
  bookingId: string;
  provider: string;
  purpose: string;
  amount: string;
  currency: string;
  status: string;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  bookingCode: string | null;
  userName: string | null;
  propertyName: string | null;
  unitName: string | null;
}

interface PaymentResponse {
  data: Payment[];
  meta: {
    total: number;
  };
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(Number(value ?? 0));

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Pending", variant: "outline" },
  success: { label: "Success", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  expired: { label: "Expired", variant: "destructive" },
  refunded: { label: "Refunded", variant: "secondary" },
};

export default withAdminAuth(AdminPaymentsPage);

function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [reconcileId, setReconcileId] = useState<string | null>(null);
  const [reconcileReason, setReconcileReason] = useState("");
  const [reconcileTransactionId, setReconcileTransactionId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [manualUserId, setManualUserId] = useState("");
  const [manualBookingId, setManualBookingId] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualProvider, setManualProvider] = useState<
    "doku" | "ipaymu" | "nicepay" | "otto"
  >("doku");
  const [manualPurpose, setManualPurpose] = useState<"dp" | "full_payment">(
    "dp",
  );
  const [manualStatus, setManualStatus] = useState<"pending" | "success">(
    "pending",
  );

  const [createState, createAction, isCreatePending] = useActionState(
    createManualPaymentAction,
    undefined,
  );
  const [cancelState, cancelAction, isCancelPending] = useActionState(
    cancelPaymentAction,
    undefined,
  );
  const [reconcileState, reconcileAction, isReconcilePending] = useActionState(
    reconcilePaymentAction,
    undefined,
  );

  const { data, isLoading, isError, error } = useQuery<PaymentResponse>({
    queryKey: ["admin-payments", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      const json = await response.json();
      return { data: json.data?.data, meta: json.data?.meta };
    },
    staleTime: 30000,
  });

  const createOpenRef = useRef(createOpen);
  const manualUserIdRef = useRef(manualUserId);
  const manualBookingIdRef = useRef(manualBookingId);
  const manualAmountRef = useRef(manualAmount);
  const manualProviderRef = useRef(manualProvider);
  const manualPurposeRef = useRef(manualPurpose);
  const manualStatusRef = useRef(manualStatus);

  useEffect(() => {
    if (createState?.success) {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast({
        title: "Payment dibuat",
        description: "Payment manual berhasil dibuat.",
        type: "success",
      });
      // Store values in refs to avoid setState in effect
      createOpenRef.current = false;
      manualUserIdRef.current = "";
      manualBookingIdRef.current = "";
      manualAmountRef.current = "";
      manualProviderRef.current = "doku";
      manualPurposeRef.current = "dp";
      manualStatusRef.current = "pending";
    } else if (createState?.error) {
      toast({
        title: "Gagal",
        description: createState.error,
        type: "error",
      });
    }
  }, [createState, queryClient]);

  useEffect(() => {
    if (cancelState?.success) {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast({
        title: "Payment dibatalkan",
        description: "Payment telah dibatalkan.",
        type: "success",
      });
      // Store values in refs to avoid setState in effect
      createOpenRef.current = false;
      manualUserIdRef.current = "";
      manualBookingIdRef.current = "";
      manualAmountRef.current = "";
      manualProviderRef.current = "doku";
      manualPurposeRef.current = "dp";
      manualStatusRef.current = "pending";
    } else if (cancelState?.error) {
      toast({
        title: "Gagal",
        description: cancelState.error,
        type: "error",
      });
    }
  }, [cancelState, queryClient]);

  useEffect(() => {
    if (reconcileState?.success) {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast({
        title: "Rekonsiliasi berhasil",
        description: "Payment telah ditandai sebagai success.",
        type: "success",
      });
      // Store values in refs to avoid setState in effect
      createOpenRef.current = false;
      manualUserIdRef.current = "";
      manualBookingIdRef.current = "";
      manualAmountRef.current = "";
      manualProviderRef.current = "doku";
      manualPurposeRef.current = "dp";
      manualStatusRef.current = "pending";
    } else if (reconcileState?.error) {
      toast({
        title: "Gagal",
        description: reconcileState.error,
        type: "error",
      });
    }
  }, [reconcileState, queryClient]);

  const payments: Payment[] = Array.isArray(data?.data) ? data.data : [];
  const selectedPayment = payments.find((p: Payment) => p.id === reconcileId);

  const handleReconcile = () => {
    if (!reconcileId || !reconcileReason.trim()) return;
    const formData = new FormData();
    formData.append("paymentId", reconcileId);
    formData.append("transactionId", reconcileTransactionId || "");
    formData.append("reason", reconcileReason);
    reconcileAction(formData);
  };

  const handleCreate = () => {
    if (!manualUserId || !manualBookingId || !manualAmount) {
      toast({
        title: "Gagal",
        description: "UserId, BookingId, dan Amount wajib diisi.",
        type: "error",
      });
      return;
    }
    const formData = new FormData();
    formData.append("userId", manualUserId);
    formData.append("bookingId", manualBookingId);
    formData.append("amount", manualAmount);
    formData.append("provider", manualProvider);
    formData.append("purpose", manualPurpose);
    formData.append("status", manualStatus);
    createAction(formData);
  };

  const handleCancel = () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    const formData = new FormData();
    formData.append("paymentId", cancelTarget.id);
    formData.append("reason", cancelReason);
    cancelAction(formData);
  };

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <BreadcrumbNav
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Manajemen Pembayaran" },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Pembayaran
          </h1>
          <p className="text-muted-foreground">
            Monitor dan rekonsiliasi pembayaran
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon
            icon={Add01Icon}
            strokeWidth={2}
            className="mr-2 size-4"
          />
          Buat Payment Manual
        </Button>
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
              : "Gagal memuat data pembayaran."}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <Select<string>
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v ?? "")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada pembayaran untuk filter ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Invoice
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Booking Code
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Provider
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Purpose
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Paid At
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const config = statusConfig[payment.status] ?? {
                      label: payment.status,
                      variant: "outline",
                    };

                    return (
                      <tr key={payment.id} className="border-b last:border-b-0">
                        <td className="py-3 px-4 font-mono text-xs">
                          {payment.transactionId ?? payment.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {payment.bookingCode?.slice(0, 8) ?? "-"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="capitalize">
                            {payment.provider}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 capitalize">
                          {payment.purpose}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {formatDate(payment.paidAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {payment.status === "pending" && (
                              <Dialog>
                                <DialogTrigger
                                  render={
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => setReconcileId(payment.id)}
                                    >
                                      Mark as Success
                                    </Button>
                                  }
                                />
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Rekonsiliasi Manual
                                    </DialogTitle>
                                  </DialogHeader>
                                  {selectedPayment &&
                                    selectedPayment.id === payment.id && (
                                      <div className="space-y-4">
                                        <div className="rounded-lg border p-3 space-y-1">
                                          <p className="text-sm">
                                            <span className="font-medium">
                                              Booking:
                                            </span>{" "}
                                            {selectedPayment.bookingCode?.slice(
                                              0,
                                              8,
                                            ) ?? "-"}
                                          </p>
                                          <p className="text-sm">
                                            <span className="font-medium">
                                              Amount:
                                            </span>{" "}
                                            {formatCurrency(
                                              selectedPayment.amount,
                                            )}
                                          </p>
                                          <p className="text-sm">
                                            <span className="font-medium">
                                              Provider:
                                            </span>{" "}
                                            {selectedPayment.provider}
                                          </p>
                                        </div>
                                        <div className="space-y-2">
                                          <label
                                            htmlFor="reconcile-transaction-id"
                                            className="text-sm font-medium"
                                          >
                                            Transaction ID (opsional)
                                          </label>
                                          <input
                                            id="reconcile-transaction-id"
                                            type="text"
                                            value={reconcileTransactionId}
                                            onChange={(e) =>
                                              setReconcileTransactionId(
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Masukkan transaction ID dari gateway"
                                            className="w-full rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label
                                            htmlFor="reconcile-reason"
                                            className="text-sm font-medium"
                                          >
                                            Alasan Rekonsiliasi *
                                          </label>
                                          <textarea
                                            id="reconcile-reason"
                                            value={reconcileReason}
                                            onChange={(e) =>
                                              setReconcileReason(e.target.value)
                                            }
                                            placeholder="Berikan alasan untuk rekonsiliasi manual..."
                                            className="w-full min-h-[80px] rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm"
                                          />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="outline"
                                            onClick={() => setReconcileId(null)}
                                          >
                                            Batal
                                          </Button>
                                          <Button
                                            disabled={
                                              isReconcilePending ||
                                              !reconcileReason.trim()
                                            }
                                            onClick={handleReconcile}
                                          >
                                            {isReconcilePending
                                              ? "Memproses..."
                                              : "Konfirmasi"}
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                </DialogContent>
                              </Dialog>
                            )}
                            {(payment.status === "pending" ||
                              payment.status === "success") && (
                              <Dialog>
                                <DialogTrigger
                                  render={
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setCancelTarget(payment)}
                                    >
                                      <HugeiconsIcon
                                        icon={MultiplicationSignIcon}
                                        strokeWidth={2}
                                        className="mr-1 size-4"
                                      />
                                      Batalkan
                                    </Button>
                                  }
                                />
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Batalkan Payment</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                      Apakah kamu yakin ingin membatalkan
                                      payment ini? Status booking akan menjadi
                                      &quot;cancelled&quot;.
                                    </p>
                                    <div className="space-y-2">
                                      <label
                                        htmlFor="cancel-reason"
                                        className="text-sm font-medium"
                                      >
                                        Alasan Pembatalan *
                                      </label>
                                      <textarea
                                        id="cancel-reason"
                                        value={cancelReason}
                                        onChange={(e) =>
                                          setCancelReason(e.target.value)
                                        }
                                        placeholder="Berikan alasan pembatalan..."
                                        className="w-full min-h-[80px] rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setCancelTarget(null);
                                          setCancelReason("");
                                        }}
                                      >
                                        Batal
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        disabled={
                                          isCancelPending ||
                                          !cancelReason.trim()
                                        }
                                        onClick={handleCancel}
                                      >
                                        {isCancelPending
                                          ? "Memproses..."
                                          : "Batalkan"}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Payment Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                placeholder="UUID user"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Booking ID</label>
              <Input
                value={manualBookingId}
                onChange={(e) => setManualBookingId(e.target.value)}
                placeholder="UUID booking"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (IDR)</label>
              <Input
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="Contoh: 350000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select<string>
                value={manualProvider}
                onValueChange={(v) =>
                  setManualProvider(v as "doku" | "ipaymu" | "nicepay" | "otto")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doku">Doku</SelectItem>
                  <SelectItem value="ipaymu">iPaymu</SelectItem>
                  <SelectItem value="nicepay">NicePay</SelectItem>
                  <SelectItem value="otto">Otto Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purpose</label>
              <Select<string>
                value={manualPurpose}
                onValueChange={(v) =>
                  setManualPurpose(v as "dp" | "full_payment")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dp">DP</SelectItem>
                  <SelectItem value="full_payment">Full Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select<string>
                value={manualStatus}
                onValueChange={(v) =>
                  setManualStatus(v as "pending" | "success")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Batal
              </Button>
              <Button disabled={isCreatePending} onClick={handleCreate}>
                {isCreatePending ? "Menyimpan..." : "Buat Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
