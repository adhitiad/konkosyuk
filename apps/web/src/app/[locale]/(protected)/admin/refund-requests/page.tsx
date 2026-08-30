"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { reviewRefundAction } from "@/actions/admin/refund-requests";
import { apiClient } from "@/lib/axios";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { useTransition, useState } from "react";

interface RefundRequestItem {
  id: string;
  bookingId: string;
  paymentId: string;
  userId: string;
  amount: string;
  reason: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string | null;
  bookingCode: string;
  propertyName: string | null;
}

export default withAdminAuth(AdminRefundRequestsPage);

function AdminRefundRequestsPage() {
  const { data: session } = useSession();
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeRefundId, setActiveRefundId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [isPendingReview, startReviewTransition] = useTransition();

  const { data, isLoading, refetch } = useQuery<{
    items: RefundRequestItem[];
    total: number;
  }>({
    queryKey: ["admin-refund-requests", filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "50");
      params.set("offset", "0");
      if (filterStatus !== "all") {
        params.set("status", filterStatus);
      }
      const res = await apiClient.get(
        `/api/admin/refund-requests?${params.toString()}`,
      );
      return res.data as { items: RefundRequestItem[]; total: number };
    },
    staleTime: 30000,
    enabled: !!session,
  });

  const handleReview = async (
    refundId: string,
    action: "approve" | "reject",
  ) => {
    startReviewTransition(async () => {
      const formData = new FormData();
      formData.append("refundRequestId", refundId);
      formData.append("action", action);
      formData.append("note", reviewNote);
      if (action === "approve" && approvedAmount) {
        formData.append("approvedAmount", approvedAmount);
      }

      const finalResult = await reviewRefundAction(undefined, formData);
      if (finalResult.success) {
        showToastSuccess(
          action === "approve" ? "Refund disetujui" : "Refund ditolak",
        );
        setActiveRefundId(null);
        setReviewNote("");
        setApprovedAmount("");
        refetch();
      } else {
        showToastError(finalResult.error ?? "Gagal memproses refund");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      pending: { label: "Menunggu", variant: "secondary" },
      approved: { label: "Disetujui", variant: "default" },
      rejected: { label: "Ditolak", variant: "destructive" },
    };
    const c = config[status] ?? { label: status, variant: "outline" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="container py-6 space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pengajuan Refund" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengajuan Refund</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Semua
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("pending")}
            >
              Menunggu
            </Button>
            <Button
              variant={filterStatus === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("approved")}
            >
              Disetujui
            </Button>
            <Button
              variant={filterStatus === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("rejected")}
            >
              Ditolak
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Properti</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      Tidak ada pengajuan refund
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.bookingCode?.slice(0, 8) ??
                          item.bookingId?.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {item.userName ?? "-"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.userEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.propertyName ?? "-"}</TableCell>
                      <TableCell className="font-medium">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(Number(item.amount))}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {item.reason}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        {item.status === "pending" && (
                          <Dialog
                            open={activeRefundId === item.id}
                            onOpenChange={(open) => {
                              setActiveRefundId(open ? item.id : null);
                              setReviewNote("");
                            }}
                          >
                            <DialogTrigger
                              render={
                                <Button size="sm" variant="outline">
                                  Review
                                </Button>
                              }
                            />
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Review Refund</DialogTitle>
                                <DialogDescription>
                                  {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                  }).format(Number(item.amount))}{" "}
                                  - {item.reason}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2">
                                <Label htmlFor="approvedAmount">
                                  Jumlah Refund Disetujui (opsional)
                                </Label>
                                <Input
                                  id="approvedAmount"
                                  type="number"
                                  value={approvedAmount}
                                  onChange={(e) =>
                                    setApprovedAmount(e.target.value)
                                  }
                                  placeholder={`Maks: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(item.amount))}`}
                                  max={Number(item.amount)}
                                  step={1000}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Kosongkan untuk refund penuh. Potongan admin
                                  2.2% dan owner 1.8% akan dipotong dari jumlah
                                  yang disetujui.
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="note">Catatan</Label>
                                <Textarea
                                  id="note"
                                  value={reviewNote}
                                  onChange={(e) =>
                                    setReviewNote(e.target.value)
                                  }
                                  placeholder="Tambahkan catatan..."
                                />
                              </div>
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    handleReview(item.id, "reject")
                                  }
                                  disabled={isPendingReview}
                                >
                                  Tolak
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleReview(item.id, "approve")
                                  }
                                  disabled={isPendingReview}
                                >
                                  Setujui
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
