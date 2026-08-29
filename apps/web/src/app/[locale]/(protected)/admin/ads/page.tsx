"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  CheckmarkCircle01Icon,
  CancelSquareIcon,
} from "@hugeicons/core-free-icons";

interface Ad {
  id: string;
  title: string;
  type: string;
  advertiserName: string;
  clicks: number;
  impressions: number;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  packageLabel: string | null;
  packageTier: string | null;
  paymentStatus: string;
  paidAt: string | null;
  adminNote: string | null;
  price: string;
}

function AdminAdsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ads", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (filter !== "all") params.set("isActive", filter);

      const res = await fetch(`/api/admin/ads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch ads");
      const json = await res.json();
      const payload = json.data;
      return (Array.isArray(payload) ? payload : payload?.data ?? []) as Ad[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/ads/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to approve ad");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      toast({ title: "Iklan disetujui", type: "success" });
    },
    onError: () => toast({ title: "Gagal menyetujui iklan", type: "error" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const res = await fetch(`/api/admin/ads/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: note }),
      });
      if (!res.ok) throw new Error("Failed to reject ad");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      toast({ title: "Iklan ditolak", type: "success" });
    },
    onError: () => toast({ title: "Gagal menolak iklan", type: "error" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/ads/${id}/cancel`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to cancel ad");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      toast({ title: "Iklan dibatalkan", type: "success" });
    },
    onError: () => toast({ title: "Gagal membatalkan iklan", type: "error" }),
  });

  const ads = data || [];
  const filteredAds =
    filter === "all"
      ? ads
      : ads.filter((ad) => ad.isActive === (filter === "active"));

  const getCtr = (clicks: number, impressions: number) => {
    if (impressions === 0) return "0%";
    return ((clicks / impressions) * 100).toFixed(1) + "%";
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Lunas</Badge>;
      case "pending":
        return <Badge variant="secondary">Menunggu</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      case "expired":
        return <Badge variant="outline">Kedaluwarsa</Badge>;
      case "cancelled":
        return <Badge variant="outline">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kelola Iklan</h1>
          <p className="mt-2 text-muted-foreground">
            Tambah, edit, atau kelola iklan properti di landing page.
          </p>
        </div>
        <Button>
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            className="mr-2 size-4"
          />
          Tambah Iklan
        </Button>
      </div>

      <div className="mt-6">
        <Select
          value={filter}
          onValueChange={(value) => value && setFilter(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Advertiser</TableHead>
              <TableHead>Paket</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status Bayar</TableHead>
              <TableHead>Impressions</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredAds.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center text-muted-foreground"
                >
                  Belum ada iklan.
                </TableCell>
              </TableRow>
            ) : (
              filteredAds.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium">{ad.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ad.type}</Badge>
                  </TableCell>
                  <TableCell>{ad.advertiserName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{ad.packageLabel || "-"}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {ad.packageTier || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ad.price
                      ? `Rp ${Number(ad.price).toLocaleString("id-ID")}`
                      : "-"}
                  </TableCell>
                  <TableCell>{getPaymentBadge(ad.paymentStatus)}</TableCell>
                  <TableCell>{ad.impressions}</TableCell>
                  <TableCell>{ad.clicks}</TableCell>
                  <TableCell>{getCtr(ad.clicks, ad.impressions)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ad.paymentStatus === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => approveMutation.mutate(ad.id)}
                            title="Setujui"
                          >
                            <HugeiconsIcon
                              icon={CheckmarkCircle01Icon}
                              strokeWidth={2}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              const note = prompt(
                                "Alasan penolakan (opsional):",
                              );
                              rejectMutation.mutate({
                                id: ad.id,
                                note: note || undefined,
                              });
                            }}
                            title="Tolak"
                          >
                            <HugeiconsIcon
                              icon={CancelSquareIcon}
                              strokeWidth={2}
                            />
                          </Button>
                        </>
                      )}
                      {ad.paymentStatus !== "cancelled" &&
                        ad.paymentStatus !== "expired" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              if (confirm("Batalkan iklan ini?")) {
                                cancelMutation.mutate(ad.id);
                              }
                            }}
                            title="Batalkan"
                          >
                            <HugeiconsIcon
                              icon={CancelSquareIcon}
                              strokeWidth={2}
                            />
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default withAdminAuth(AdminAdsPage);
