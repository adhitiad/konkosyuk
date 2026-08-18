"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/error-state";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { apiClient } from "@/lib/axios";
import { withAdminAuth } from "@/lib/with-admin-auth";
import {
  upsertPaymentGatewayAction,
  deletePaymentGatewayAction,
} from "@/actions/admin/payment-gateways";

interface PaymentGatewayConfig {
  id: string;
  provider: string;
  isActive: boolean;
  config: Record<string, unknown>;
  environment: string;
  updatedAt: string;
}

interface PaymentGatewayResponse {
  data: PaymentGatewayConfig[];
}

type PaymentGatewayCacheData = PaymentGatewayResponse | undefined;

export default withAdminAuth(AdminPaymentGatewaysPage);

function AdminPaymentGatewaysPage() {
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<PaymentGatewayConfig | null>(
    null,
  );
  const [formConfig, setFormConfig] = useState<Record<string, string>>({});
  const [formEnvironment, setFormEnvironment] = useState<string>("sandbox");
  const [formActive, setFormActive] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isError, error, refetch } = useQuery<PaymentGatewayResponse>({
    queryKey: ["payment-gateway-configs"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/payment-gateways");
      return res.data as PaymentGatewayResponse;
    },
    staleTime: 30000,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      provider: string;
      config: Record<string, unknown>;
      environment: string;
      isActive: boolean;
    }) => {
      const formData = new FormData();
      formData.append("provider", payload.provider);
      formData.append("config", JSON.stringify(payload.config));
      formData.append("environment", payload.environment);
      formData.append("isActive", String(payload.isActive));

      const result = await upsertPaymentGatewayAction(undefined, formData);
      if (!result.success) {
        throw new Error(result.error || "Gagal menyimpan konfigurasi");
      }
      return result.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: ["payment-gateway-configs"],
      });
      const previous = queryClient.getQueryData<PaymentGatewayCacheData>([
        "payment-gateway-configs",
      ]);
      queryClient.setQueryData<PaymentGatewayCacheData>(
        ["payment-gateway-configs"],
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((config) =>
              config.provider === payload.provider
                ? {
                    ...config,
                    isActive: payload.isActive,
                    environment: payload.environment,
                  }
                : config,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["payment-gateway-configs"], context.previous);
      }
      toast({
        title: "Gagal",
        description:
          err instanceof Error ? err.message : "Gagal menyimpan konfigurasi.",
        type: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateway-configs"] });
      toast({
        title: "Tersimpan",
        description: "Konfigurasi payment gateway berhasil disimpan.",
      });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (provider: string) => {
      const formData = new FormData();
      formData.append("provider", provider);

      const result = await deletePaymentGatewayAction(undefined, formData);
      if (!result.success) {
        throw new Error(result.error || "Gagal menghapus konfigurasi");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateway-configs"] });
      toast({
        title: "Dihapus",
        description: "Konfigurasi payment gateway berhasil dihapus.",
      });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast({
        title: "Gagal",
        description:
          err instanceof Error ? err.message : "Gagal menghapus konfigurasi.",
      });
    },
  });

  const configs: PaymentGatewayConfig[] = Array.isArray(data?.data)
    ? data.data
    : [];

  const resetForm = () => {
    setEditTarget(null);
    setFormConfig({});
    setFormEnvironment("sandbox");
    setFormActive(false);
  };

  // PERBAIKAN 1: Set editTarget ke object dummy agar form muncul saat "Konfigurasi" diklik
  const openCreate = (provider: string) => {
    setEditTarget({
      provider,
      id: "new",
      isActive: false,
      config: {},
      environment: "sandbox",
      updatedAt: new Date().toISOString(),
    } as PaymentGatewayConfig);

    setFormConfig({
      clientId: "",
      secretKey: "",
      webhookSecret: "",
      merchantCode: "",
      baseUrl:
        provider === "doku"
          ? "https://api.doku.com"
          : provider === "ipaymu"
            ? "https://api.ipaymu.com/api/v2"
            : "https://api.nicepay.co.id",
    });
    setFormEnvironment("sandbox");
    setFormActive(false);
  };

  const openEdit = (config: PaymentGatewayConfig) => {
    setEditTarget(config);
    setFormConfig({
      clientId: String(config.config.clientId ?? ""),
      secretKey: "", // Biarkan kosong untuk keamanan, user harus isi ulang jika ingin ganti
      webhookSecret: "",
      merchantCode: String(config.config.merchantCode ?? ""),
      baseUrl: String(config.config.baseUrl ?? ""),
    });
    setFormEnvironment(config.environment);
    setFormActive(config.isActive);
  };

  const handleSave = () => {
    if (
      !formConfig.clientId ||
      ((!editTarget || editTarget.id === "new") && !formConfig.secretKey)
    ) {
      toast({
        title: "Gagal",
        description: "Client ID dan Secret Key wajib diisi.",
        type: "error",
      });
      return;
    }

    const payloadConfig = { ...formConfig };
    if (!payloadConfig.secretKey) delete payloadConfig.secretKey;
    if (!payloadConfig.webhookSecret) delete payloadConfig.webhookSecret;

    saveMutation.mutate({
      provider: editTarget?.provider || "doku",
      config: payloadConfig,
      environment: formEnvironment,
      isActive: formActive,
    });
  };

  const handleDelete = (provider: string) => {
    deleteMutation.mutate(provider);
  };

  const providers = [
    {
      id: "doku",
      name: "DOKU",
      description: "Payment gateway dengan support multi-metode pembayaran.",
    },
    {
      id: "ipaymu",
      name: "iPaymu",
      description: "Payment gateway dengan fitur installment dan subscription.",
    },
    {
      id: "nicepay",
      name: "NicePay",
      description: "Payment gateway dengan support QRIS dan e-wallet.",
    },
  ];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Payment Gateway" },
          ]}
        />
        <h1 className="text-2xl font-bold tracking-tight">
          Konfigurasi Payment Gateway
        </h1>
        <p className="text-muted-foreground">
          Kelola konfigurasi Doku, iPaymu, dan Nicepay
        </p>
      </div>

      {isError && (
        <ErrorState
          title="Gagal Memuat Konfigurasi"
          description={
            error instanceof Error
              ? error.message
              : "Gagal memuat data konfigurasi payment gateway."
          }
          onRetry={() => refetch()}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {providers.map((provider) => {
          const existing = configs.find((c) => c.provider === provider.id);

          return (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{provider.name}</CardTitle>
                  {existing && (
                    <Badge
                      variant={existing.isActive ? "default" : "secondary"}
                    >
                      {existing.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {provider.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {existing ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Status Aktif</Label>
                        <Switch
                          checked={existing.isActive}
                          onCheckedChange={(checked) => {
                            saveMutation.mutate({
                              provider: existing.provider,
                              config: existing.config,
                              environment: existing.environment,
                              isActive: checked,
                            });
                          }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Environment:{" "}
                        <span className="font-medium capitalize">
                          {existing.environment}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Merchant:{" "}
                        <span className="font-medium">
                          {String(existing.config.merchantCode ?? "-")}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Diperbarui:{" "}
                        {new Date(existing.updatedAt).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEdit(existing)}
                      >
                        Edit
                      </Button>

                      {/* PERBAIKAN 2: Gunakan 'asChild' pada DialogTrigger, bukan 'render' */}
                      <Dialog
                        open={deleteTarget === existing.provider}
                        onOpenChange={(open) => !open && setDeleteTarget(null)}
                      >
                        <DialogTrigger>
                          <Button
                            variant="destructive"
                            onClick={() => setDeleteTarget(existing.provider)}
                          >
                            Hapus
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Hapus Konfigurasi</DialogTitle>
                            <DialogDescription>
                              Apakah Anda yakin ingin menghapus konfigurasi{" "}
                              {existing.provider}? Aksi ini tidak dapat
                              dibatalkan.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeleteTarget(null)}
                            >
                              Batal
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={deleteMutation.isPending}
                              onClick={() => handleDelete(existing.provider)}
                            >
                              {deleteMutation.isPending
                                ? "Menghapus..."
                                : "Hapus"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => openCreate(provider.id)}
                  >
                    Konfigurasi
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form ini sekarang akan muncul baik untuk Create maupun Edit */}
      {editTarget && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>
              {editTarget.id === "new" ? "Tambah" : "Edit"} Konfigurasi -{" "}
              {providers.find((p) => p.id === editTarget.provider)?.name ??
                editTarget.provider}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  value={formConfig.clientId ?? ""}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, clientId: e.target.value })
                  }
                  placeholder="Masukkan Client ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Secret Key</Label>
                <Input
                  value={formConfig.secretKey ?? ""}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, secretKey: e.target.value })
                  }
                  type="password"
                  placeholder="Masukkan Secret Key"
                />
                <p className="text-xs text-muted-foreground">
                  *Wajib diisi saat pertama kali atau jika ingin mengubah kunci
                </p>
              </div>
              <div className="space-y-2">
                <Label>Merchant Code</Label>
                <Input
                  value={formConfig.merchantCode ?? ""}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      merchantCode: e.target.value,
                    })
                  }
                  placeholder="Masukkan Merchant Code"
                />
              </div>
              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                <Input
                  value={formConfig.webhookSecret ?? ""}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      webhookSecret: e.target.value,
                    })
                  }
                  placeholder="Opsional"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Base URL</Label>
                <Input
                  value={formConfig.baseUrl ?? ""}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, baseUrl: e.target.value })
                  }
                  placeholder="https://api..."
                />
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={formEnvironment}
                  onValueChange={(v) => v && setFormEnvironment(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                    <SelectItem value="production">
                      Production (Live)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-center gap-3 pt-8">
                <Switch
                  id="active"
                  checked={formActive}
                  onCheckedChange={setFormActive}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Aktifkan gateway ini segera
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Menyimpan..." : "Simpan Konfigurasi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
