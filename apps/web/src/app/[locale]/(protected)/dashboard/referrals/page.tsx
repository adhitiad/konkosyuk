"use client";

import { useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import {
  Users,
  Gift,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Wallet,
  Tag,
  FileText,
  TrendingUp,
} from "lucide-react";
import { apiClient } from "@/lib/axios";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useLocale } from "next-intl";

interface Referral {
  id: string;
  code: string;
  refereeName?: string;
  refereeEmail?: string;
  category: "owner" | "tenant";
  status:
    "pending" | "verifying" | "eligible" | "failed" | "completed" | "cancelled";
  baseAmount: string;
  commissionRate: string;
  commissionAmount: string;
  eligibleAt?: string;
  payoutScheduledAt?: string;
  voucherCode?: string;
  offsetApplied: boolean;
  tier: number;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: ComponentType<{ size?: number; className?: string }>;
  }
> = {
  pending: { label: "Menunggu", variant: "secondary", icon: Clock },
  verifying: { label: "Verifikasi", variant: "outline", icon: Search },
  eligible: { label: "Layak Cair", variant: "default", icon: CheckCircle2 },
  failed: { label: "Gagal", variant: "destructive", icon: XCircle },
  completed: { label: "Selesai", variant: "default", icon: Wallet },
  cancelled: { label: "Dibatalkan", variant: "destructive", icon: XCircle },
};

const TIER_THRESHOLDS = [
  { tier: 1, min: 0, max: 100 },
  { tier: 2, min: 101, max: 372 },
  { tier: 3, min: 373, max: 846 },
  { tier: 4, min: 847, max: Infinity },
];

function getTierProgress(completedCount: number): {
  current: number;
  next: number;
  progress: number;
} {
  const current =
    TIER_THRESHOLDS.find(
      (t) => completedCount >= t.min && completedCount <= t.max,
    ) || TIER_THRESHOLDS[0];
  const next = TIER_THRESHOLDS.find((t) => t.tier === current.tier + 1);
  if (!next) return { current: current.tier, next: 4, progress: 100 };
  const range = next.max! - current.max!;
  const progress = Math.min(
    100,
    Math.max(0, ((completedCount - current.max!) / range) * 100),
  );
  return { current: current.tier, next: next.tier, progress };
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(Number(value) || 0);
}

export default function ReferralsPage() {
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("owner");
  const [formData, setFormData] = useState({
    refereeEmail: "",
    refereeName: "",
    category: "tenant" as "owner" | "tenant",
    propertyId: "",
    message: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const res = await apiClient.get("/referrals");
      return res.data as {
        data: Referral[];
        meta: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
        tier: number;
        completedCount: number;
      };
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
      setFormData({
        refereeEmail: "",
        refereeName: "",
        category: "tenant",
        propertyId: "",
        message: "",
      });
      showToastSuccess("Referral berhasil dibuat!");
    },
    onError: () => {
      showToastError("Gagal membuat referral");
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: "convert_voucher" | "apply_offset";
    }) => {
      const res = await apiClient.put(`/referrals/${id}`, { action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      showToastSuccess("Aksi referral berhasil!");
    },
    onError: () => {
      showToastError("Gagal memproses aksi referral");
    },
  });

  const referrals = data?.data || [];
  const totalCompleted = data?.completedCount || 0;
  const currentTier = data?.tier || 1;
  const tierProgress = getTierProgress(totalCompleted);

  const totalCommission = referrals
    .filter((r) => r.status === "completed")
    .reduce(
      (sum, r) => sum + Number(r.commissionAmount || r.baseAmount || 0),
      0,
    );

  const eligibleReferrals = referrals.filter((r) => r.status === "eligible");
  const pendingReferrals = referrals.filter(
    (r) => r.status === "pending" || r.status === "verifying",
  );

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referral</h1>
          <p className="text-muted-foreground">
            Ajak teman dan dapatkan komisi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/referrals/terms`)}
          >
            <FileText className="mr-2 size-4" />
            S&K Referral
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Users className="mr-2 size-4" />
            Referral Baru
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="owner">Kategori Owner</TabsTrigger>
          <TabsTrigger value="tenant">Kategori Penyewa</TabsTrigger>
        </TabsList>
        <TabsContent value="owner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                Tier Komisi Owner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Tier {tierProgress.current}</span>
                <span>Tier {tierProgress.next}</span>
              </div>
              <Progress value={tierProgress.progress} className="h-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Tier 1</div>
                  <div className="font-bold">1.00%</div>
                  <div className="text-xs text-muted-foreground">1-100</div>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Tier 2</div>
                  <div className="font-bold">2.00%</div>
                  <div className="text-xs text-muted-foreground">101-372</div>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Tier 3</div>
                  <div className="font-bold">3.67%</div>
                  <div className="text-xs text-muted-foreground">373-846</div>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Tier 4</div>
                  <div className="font-bold">4.82%</div>
                  <div className="text-xs text-muted-foreground">&ge;847</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tier naik berdasarkan total referral valid yang sudah dicairkan.
                Persentase baru hanya berlaku untuk transaksi setelah tier
                tercapai.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tenant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                Tier Komisi Penyewa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Tier {tierProgress.current}</span>
                <span>Tier {tierProgress.next}</span>
              </div>
              <Progress value={tierProgress.progress} className="h-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Tier 1</div>
                  <div className="font-bold">0.90%</div>
                  <div className="text-xs text-muted-foreground">1-100</div>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Tier 2</div>
                  <div className="font-bold">1.86%</div>
                  <div className="text-xs text-muted-foreground">101-372</div>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Tier 3</div>
                  <div className="font-bold">2.79%</div>
                  <div className="text-xs text-muted-foreground">373-846</div>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Tier 4</div>
                  <div className="font-bold">3.96%</div>
                  <div className="text-xs text-muted-foreground">&ge;847</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Komisi penyewa bersifat one-time per Referee. Jika Referee
                memperpanjang atau pindah kamar, tidak menghasilkan komisi baru.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referral
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referrals.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingReferrals.length} menunggu, {eligibleReferrals.length}{" "}
              layak cair
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Komisi</CardTitle>
            <Gift className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">
              Dari referral yang selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier Aktif</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Tier {currentTier}</div>
            <p className="text-xs text-muted-foreground">
              {totalCompleted} referral valid • Tier selanjutnya{" "}
              {tierProgress.next > 4
                ? "Maks"
                : `dalam ${tierProgress.progress.toFixed(1)}%`}
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
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Belum ada referral. Buat referral pertama Anda!
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => {
                const statusConfig =
                  STATUS_CONFIG[referral.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={referral.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border"
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
                          <Badge variant="outline">
                            {referral.category === "owner"
                              ? "Owner"
                              : "Penyewa"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Kode: {referral.code} • Tier {referral.tier} •{" "}
                          {Number(referral.commissionRate)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(referral.createdAt),
                            "dd MMM yyyy HH:mm",
                            { locale: idLocale },
                          )}
                          {referral.eligibleAt &&
                            ` • Layak cair: ${format(new Date(referral.eligibleAt), "dd MMM yyyy", { locale: idLocale })}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {(referral.status === "completed" ||
                        referral.status === "eligible") && (
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(
                            referral.commissionAmount || referral.baseAmount,
                          )}
                        </p>
                      )}
                      {referral.status === "eligible" && (
                        <div className="flex gap-2">
                          {referral.category === "owner" &&
                            !referral.voucherCode && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  actionMutation.mutate({
                                    id: referral.id,
                                    action: "convert_voucher",
                                  })
                                }
                              >
                                <Tag className="mr-2 size-4" />
                                Tukar Voucher
                              </Button>
                            )}
                          {referral.category === "tenant" &&
                            !referral.offsetApplied && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  actionMutation.mutate({
                                    id: referral.id,
                                    action: "apply_offset",
                                  })
                                }
                              >
                                <Wallet className="mr-2 size-4" />
                                Potong Tagihan
                              </Button>
                            )}
                        </div>
                      )}
                      {referral.category === "owner" &&
                        referral.voucherCode && (
                          <Badge variant="secondary">
                            Voucher: {referral.voucherCode}
                          </Badge>
                        )}
                      {referral.category === "tenant" &&
                        referral.offsetApplied && (
                          <Badge variant="secondary">Offset Diterapkan</Badge>
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
              <Label>Kategori Referral</Label>
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, category: "owner" })
                  }
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                    formData.category === "owner"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, category: "tenant" })
                  }
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                    formData.category === "tenant"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Penyewa
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refereeEmail">Email Teman</Label>
              <Input
                id="refereeEmail"
                type="email"
                value={formData.refereeEmail}
                onChange={(e) =>
                  setFormData({ ...formData, refereeEmail: e.target.value })
                }
                placeholder="friend@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refereeName">Nama Teman</Label>
              <Input
                id="refereeName"
                value={formData.refereeName}
                onChange={(e) =>
                  setFormData({ ...formData, refereeName: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Pesan (Opsional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Ajak mereka bergabung!"
                rows={3}
              />
            </div>
            <Button
              onClick={() => createMutation.mutate(formData)}
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
