"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { Copy, Share2, Users, Gift, CheckCircle2, Clock, XCircle } from "lucide-react";
import { apiClient } from "@/lib/axios";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Referral {
  id: string;
  code: string;
  refereeName?: string;
  refereeEmail?: string;
  status: "pending" | "completed" | "cancelled";
  rewardAmount: string;
  completedAt?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  pending: { label: "Menunggu", variant: "secondary" as const, icon: Clock },
  completed: { label: "Selesai", variant: "default" as const, icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan", variant: "destructive" as const, icon: XCircle },
};

export default function ReferralsPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    refereeEmail: "",
    refereeName: "",
    propertyId: "",
    message: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const res = await apiClient.get("/referrals");
      return res.data.data as Referral[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post("/referrals", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      setCreateDialogOpen(false);
      setFormData({ refereeEmail: "", refereeName: "", propertyId: "", message: "" });
      showToastSuccess("Referral berhasil dibuat!");
    },
    onError: () => {
      showToastError("Gagal membuat referral");
    },
  });

  const handleCreateReferral = () => {
    if (!formData.refereeEmail || !formData.refereeName) {
      showToastError("Email dan nama referee harus diisi");
      return;
    }
    createMutation.mutate(formData);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const shareReferral = (code: string) => {
    const text = `Daftar di KonkosYuk dengan kode referral saya: ${code}`;
    if (navigator.share) {
      navigator.share({ title: "Referral KonkosYuk", text });
    } else {
      copyToClipboard(code);
    }
  };

  const referrals = data || [];
  const totalCompleted = referrals.filter((r) => r.status === "completed").length;
  const totalReward = referrals
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + Number(r.rewardAmount), 0);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referral</h1>
          <p className="text-muted-foreground">
            Ajak teman dan dapatkan reward
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Users className="mr-2 size-4" />
          Referral Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referral</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referrals.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalCompleted} berhasil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reward</CardTitle>
            <Gift className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalReward)}
            </div>
            <p className="text-xs text-muted-foreground">
              Dari referral yang berhasil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konversi</CardTitle>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referrals.length > 0 ? `${Math.round((totalCompleted / referrals.length) * 100)}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              Tingkat konversi referral
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Referral</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Belum ada referral. Buat referral pertama Anda!
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => {
                const statusConfig = STATUS_CONFIG[referral.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <StatusIcon className="size-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {referral.refereeName || referral.refereeEmail}
                          </p>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Kode: {referral.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(referral.createdAt), "dd MMM yyyy", { locale: idLocale })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {referral.status === "completed" && (
                        <p className="text-sm font-medium text-green-600">
                          +{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(referral.rewardAmount))}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Referral Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refereeEmail">Email Teman</Label>
              <Input
                id="refereeEmail"
                type="email"
                value={formData.refereeEmail}
                onChange={(e) => setFormData({ ...formData, refereeEmail: e.target.value })}
                placeholder="friend@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refereeName">Nama Teman</Label>
              <Input
                id="refereeName"
                value={formData.refereeName}
                onChange={(e) => setFormData({ ...formData, refereeName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Pesan (Opsional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Ajak mereka bergabung!"
                rows={3}
              />
            </div>
            <Button
              onClick={handleCreateReferral}
              disabled={createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? "Membuat..." : "Buat Referral"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
