"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { Gift, History, Star, CheckCircle2, XCircle } from "lucide-react";
import { apiClient } from "@/lib/axios";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface LoyaltyTransaction {
  id: string;
  amount: number;
  type: "earn" | "redeem" | "expire" | "bonus";
  description: string;
  createdAt: string;
}

interface Reward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  value: string;
  isActive: boolean;
}

const TYPE_CONFIG = {
  earn: { label: "Earn", variant: "default" as const, icon: Star },
  redeem: { label: "Redeem", variant: "secondary" as const, icon: Gift },
  expire: { label: "Expire", variant: "destructive" as const, icon: XCircle },
  bonus: { label: "Bonus", variant: "default" as const, icon: CheckCircle2 },
};

export default function LoyaltyPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("history");

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["loyalty-transactions"],
    queryFn: async () => {
      const res = await apiClient.get("/loyalty/transactions");
      return res.data.data as {
        data: LoyaltyTransaction[];
        meta: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
        balance: number;
      };
    },
  });

  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const res = await apiClient.get("/loyalty/rewards");
      return res.data.data as Reward[];
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
       const res = await apiClient.post("/api/loyalty/rewards/redeem", { rewardId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-transactions"] });
      showToastSuccess("Reward berhasil ditebus!");
    },
    onError: () => {
      showToastError("Gagal menebus reward");
    },
  });

  const transactions = transactionsData?.data || [];
  const balance = transactionsData?.balance || 0;
  const rewards = rewardsData || [];

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Loyalty</h1>
        <p className="text-muted-foreground">Kumpulkan poin dan tebus reward</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Poin Saya</CardTitle>
            <Star className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              Poin loyalty tersedia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transaksi
            </CardTitle>
            <History className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Riwayat transaksi loyalty
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reward Tersedia
            </CardTitle>
            <Gift className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewards.filter((r) => r.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Reward yang bisa ditebus
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">
            <History className="mr-2 size-4" />
            Riwayat
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Gift className="mr-2 size-4" />
            Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Belum ada transaksi loyalty
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const typeConfig = TYPE_CONFIG[tx.type];
                    const TypeIcon = typeConfig.icon;

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-primary/10">
                            <TypeIcon className="size-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{tx.description}</p>
                              <Badge variant={typeConfig.variant}>
                                {typeConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(tx.createdAt),
                                "dd MMM yyyy HH:mm",
                                { locale: idLocale },
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-medium ${tx.amount > 0 ? "text-green-600" : "text-destructive"}`}
                          >
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount.toLocaleString("id-ID")} poin
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reward Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              {rewardsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : rewards.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Belum ada reward tersedia
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className={`p-4 rounded-lg border ${!reward.isActive ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{reward.name}</h3>
                          {reward.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {reward.description}
                            </p>
                          )}
                          <p className="text-sm font-medium mt-2">
                            {reward.pointsCost.toLocaleString("id-ID")} poin
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Nilai:{" "}
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            }).format(Number(reward.value))}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={
                            !reward.isActive || balance < reward.pointsCost
                          }
                          onClick={() => redeemMutation.mutate(reward.id)}
                        >
                          {reward.isActive ? "Tebus" : "Nonaktif"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
