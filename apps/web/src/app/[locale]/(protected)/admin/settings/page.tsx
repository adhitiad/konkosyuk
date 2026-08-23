"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { withAdminAuth } from "@/lib/with-admin-auth";

interface Setting {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newIsSecret, setNewIsSecret] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await apiClient.get("/api/admin/settings")).data,
  });

  const settings: Setting[] = data?.data?.data ?? [];

  const mutation = useMutation({
    mutationFn: async (setting: Partial<Setting>) => {
      return apiClient.post("/api/admin/settings", setting);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      showToastSuccess("Pengaturan berhasil disimpan");
      setNewKey("");
      setNewValue("");
      setNewIsSecret(false);
      setNewDescription("");
      setError(null);
    },
    onError: () => {
      showToastError("Gagal menyimpan pengaturan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      return apiClient.delete(
        `/api/admin/settings?key=${encodeURIComponent(key)}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      showToastSuccess("Pengaturan berhasil dihapus");
    },
    onError: () => {
      showToastError("Gagal menghapus pengaturan");
    },
  });

  const handleUpsert = () => {
    if (!newKey.trim()) {
      setError("Key wajib diisi");
      return;
    }
    setError(null);
    mutation.mutate({
      key: newKey.trim(),
      value: newValue.trim(),
      isSecret: newIsSecret,
      description: newDescription.trim() || null,
    });
  };

  const handleDelete = (key: string) => {
    if (confirm(`Hapus pengaturan "${key}"?`)) {
      deleteMutation.mutate(key);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Pengaturan Aplikasi
        </h1>
        <p className="mt-2 text-muted-foreground">
          Kelola konfigurasi environment variables melalui database.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>KYC Didit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Konfigurasi cepat untuk integrasi Didit KYC. Klik tombol di bawah
            untuk mengisi otomatis.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewKey("DIDIT_API_KEY");
                setNewValue("");
                setNewIsSecret(true);
                setNewDescription("API key untuk Didit KYC service");
              }}
            >
              DIDIT_API_KEY
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewKey("DIDIT_WEBHOOK_SECRET");
                setNewValue("");
                setNewIsSecret(true);
                setNewDescription("Secret untuk verifikasi webhook Didit");
              }}
            >
              DIDIT_WEBHOOK_SECRET
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewKey("NEXT_PUBLIC_DIDIT_API_URL");
                setNewValue("https://api.didit.me");
                setNewIsSecret(false);
                setNewDescription("Base URL API Didit");
              }}
            >
              NEXT_PUBLIC_DIDIT_API_URL
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ably Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Konfigurasi cepat untuk integrasi Ably real-time chat. Klik tombol
            di bawah untuk mengisi otomatis.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewKey("ABLY_API_KEY");
                setNewValue("");
                setNewIsSecret(true);
                setNewDescription("Server-side Ably API key (secret)");
              }}
            >
              ABLY_API_KEY
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewKey("NEXT_PUBLIC_ABLY_KEY");
                setNewValue("");
                setNewIsSecret(true);
                setNewDescription("Client-side Ably API key (public)");
              }}
            >
              NEXT_PUBLIC_ABLY_KEY
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tambah / Ubah Pengaturan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key</label>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="CONTOH: DIDIT_API_KEY"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Masukkan nilai"
                type={newIsSecret ? "password" : "text"}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newIsSecret}
                onChange={(e) => setNewIsSecret(e.target.checked)}
              />
              <span className="text-sm">Rahasia (sembunyikan value)</span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi (opsional)</label>
            <Input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Deskripsi pengaturan"
            />
          </div>
          <Button
            onClick={handleUpsert}
            disabled={mutation.isPending}
            className="w-full md:w-auto"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              className="size-4 mr-2"
            />
            {mutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengaturan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : settings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada pengaturan.
            </p>
          ) : (
            <div className="space-y-3">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{setting.key}</p>
                      {setting.isSecret && (
                        <Badge variant="secondary" className="text-xs">
                          Rahasia
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {setting.description ?? "Tidak ada deskripsi"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {setting.isSecret ? "••••••••" : setting.value}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(setting.key)}
                    disabled={deleteMutation.isPending}
                  >
                    <HugeiconsIcon
                      icon={Delete01Icon}
                      strokeWidth={2}
                      className="size-4 text-destructive"
                    />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAdminAuth(AdminSettingsPage);
