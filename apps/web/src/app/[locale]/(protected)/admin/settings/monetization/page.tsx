"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import type { SessionUserWithRole } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/axios";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { updatePlatformFeeAction } from "@/actions/admin/settings";

interface PlatformSettings {
  platformFeePercent: string;
  featuredListingPrice: string;
}

export default withAdminAuth(MonetizationSettingsPage, ["admin"]);

function MonetizationSettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [feePercent, setFeePercent] = useState("1.8");
  const [featuredPrice, setFeaturedPrice] = useState("50000");

  useEffect(() => {
    const userRole = (session?.user as SessionUserWithRole | undefined)?.role;
    if (!isPending && (!session || userRole !== "admin")) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const { data: settings, isLoading } = useQuery<PlatformSettings>({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data: json } = await apiClient.get(
        "/api/admin/settings/platform-fee",
      );
      return json.data;
    },
    enabled:
      !!session && (session.user as SessionUserWithRole).role === "admin",
  });

  const mutation = useMutation({
    mutationFn: async (values: {
      platformFeePercent: number;
      featuredListingPrice?: number;
    }) => {
      const formData = new FormData();
      formData.append("platformFeePercent", String(values.platformFeePercent));
      if (values.featuredListingPrice !== undefined) {
        formData.append(
          "featuredListingPrice",
          String(values.featuredListingPrice),
        );
      }

      const response = await updatePlatformFeeAction(undefined, formData);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update settings");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast({
        title: "Pengaturan Disimpan",
        description: "Pengaturan monetisasi berhasil diperbarui.",
        type: "success",
      });
    },
    onError: (err) => {
      toast({
        title: "Gagal Menyimpan",
        description:
          err instanceof Error ? err.message : "Gagal menyimpan pengaturan.",
        type: "error",
      });
    },
  });

  const queryClient = useQueryClient();

  const feePercentRef = useRef<string | undefined>(undefined);
  const featuredPriceRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (settings) {
      feePercentRef.current = settings.platformFeePercent;
      featuredPriceRef.current = settings.featuredListingPrice;
    }
  }, [settings]);

  const handleSave = () => {
    const fee = parseFloat(feePercentRef.current ?? "0");
    if (isNaN(fee) || fee < 0 || fee > 10) {
      toast({
        title: "Input Tidak Valid",
        description: "Fee harus antara 0% - 10%",
        type: "error",
      });
      return;
    }
    mutation.mutate({
      platformFeePercent: fee,
      featuredListingPrice: parseInt(featuredPriceRef.current ?? "0", 10),
    });
  };

  if (isPending)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  if (!session) return null;

  const exampleFee = parseFloat(feePercent) || 0;
  const exampleAmount = 1_000_000;
  const exampleFeeAmount = exampleAmount * (exampleFee / 100);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan Monetisasi</h1>
        <p className="text-muted-foreground">
          Kelola fee platform dan harga featured listing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Komisi Transaksi</CardTitle>
          <CardDescription>
            Persentase fee yang diambil dari setiap transaksi sukses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="fee">Platform Fee (%)</Label>
                <Input
                  id="fee"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Saat ini: {feePercent}% — Dari transaksi Rp{" "}
                  {exampleAmount.toLocaleString("id-ID")}, platform dapat Rp{" "}
                  {exampleFeeAmount.toLocaleString("id-ID")}
                </p>
              </div>
              <Button onClick={handleSave} disabled={mutation.isPending}>
                {mutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Featured Listing (Ads)</CardTitle>
          <CardDescription>
            Harga untuk menampilkan properti di halaman utama
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="featured">Harga Featured (Rp)</Label>
                <Input
                  id="featured"
                  type="number"
                  value={featuredPrice}
                  onChange={(e) => setFeaturedPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Default: Rp{" "}
                  {parseInt(featuredPrice, 10).toLocaleString("id-ID")} per
                  properti per 30 hari
                </p>
              </div>
              <Alert>
                <AlertDescription>
                  Fitur ini akan tersedia di Phase berikutnya. Owner bisa bayar
                  untuk menampilkan properti mereka di posisi teratas.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleSave}
                disabled={mutation.isPending}
                variant="outline"
              >
                {mutation.isPending ? "Menyimpan..." : "Simpan Harga Featured"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
