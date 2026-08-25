"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Edit01Icon,
  Delete01Icon,
  EyeOffIcon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AdPackage {
  id: string;
  name: string;
  label: string;
  tier: "reguler" | "utama" | "premium";
  duration: number;
  price: string;
  positionType: string;
  sortOrder: number;
  isActive: boolean;
}

const TIER_COLORS: Record<string, string> = {
  reguler: "border-blue-200 bg-blue-50/50",
  utama: "border-purple-200 bg-purple-50/50",
  premium: "border-amber-200 bg-amber-50/50",
};

function AdminPackagesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<AdPackage | null>(null);
  const [form, setForm] = useState({
    name: "",
    label: "",
    tier: "reguler" as "reguler" | "utama" | "premium",
    duration: 30,
    price: "",
    positionType: "rotation" as "rotation" | "fixed_1" | "fixed_2",
    sortOrder: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ad-packages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ad-packages");
      if (!res.ok) throw new Error("Failed to fetch packages");
      const json = await res.json();
      return json.packages as Record<string, AdPackage[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/admin/ad-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-packages"] });
      toast({ title: "Paket berhasil dibuat", type: "success" });
      setOpen(false);
      resetForm();
    },
    onError: () => toast({ title: "Gagal membuat paket", type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<typeof form>;
    }) => {
      const res = await fetch(`/api/admin/ad-packages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-packages"] });
      toast({ title: "Paket berhasil diperbarui", type: "success" });
      setOpen(false);
      setEditingPkg(null);
      resetForm();
    },
    onError: () => toast({ title: "Gagal memperbarui paket", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/ad-packages/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-packages"] });
      toast({ title: "Paket berhasil dihapus", type: "success" });
    },
    onError: () => toast({ title: "Gagal menghapus paket", type: "error" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (pkg: AdPackage) => {
      const res = await fetch(`/api/admin/ad-packages/${pkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !pkg.isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-packages"] });
      toast({ title: "Paket diperbarui", type: "success" });
    },
    onError: () => toast({ title: "Gagal memperbarui paket", type: "error" }),
  });

  function resetForm() {
    setForm({
      name: "",
      label: "",
      tier: "reguler",
      duration: 30,
      price: "",
      positionType: "rotation",
      sortOrder: 0,
    });
  }

  function handleEdit(pkg: AdPackage) {
    setEditingPkg(pkg);
    setForm({
      name: pkg.name,
      label: pkg.label,
      tier: pkg.tier,
      duration: pkg.duration,
      price: pkg.price,
      positionType: pkg.positionType as "rotation" | "fixed_1" | "fixed_2",
      sortOrder: pkg.sortOrder,
    });
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingPkg) {
      updateMutation.mutate({ id: editingPkg.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paket Iklan</h1>
          <p className="mt-2 text-muted-foreground">
            Kelola paket harga iklan yang tersedia.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                className="mr-2 size-4"
              />
              Tambah Paket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPkg ? "Edit Paket" : "Tambah Paket"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={!!editingPkg}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={form.tier}
                  onValueChange={(v) =>
                    setForm({ ...form, tier: v as typeof form.tier })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reguler">Reguler</SelectItem>
                    <SelectItem value="utama">Utama</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Durasi (hari)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="positionType">Posisi</Label>
                <Select
                  value={form.positionType}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      positionType: v as typeof form.positionType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rotation">Rotasi</SelectItem>
                    <SelectItem value="fixed_1">
                      Fixed 1 (Paling Depan)
                    </SelectItem>
                    <SelectItem value="fixed_2">Fixed 2 (Tengah)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingPkg ? "Simpan Perubahan" : "Buat Paket"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {["reguler", "utama", "premium"].map((tier) => (
        <div
          key={tier}
          className={`mt-6 rounded-lg border p-4 ${TIER_COLORS[tier]}`}
        >
          <h3 className="mb-4 text-lg font-semibold capitalize">{tier}</h3>
          <div className="rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Urutan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data && data[tier] && data[tier].length > 0 ? (
                  data[tier].map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.label}</TableCell>
                      <TableCell>{pkg.duration} hari</TableCell>
                      <TableCell>
                        Rp {Number(pkg.price).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {pkg.positionType.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{pkg.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEdit(pkg)}
                          >
                            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleMutation.mutate(pkg)}
                          >
                            <HugeiconsIcon icon={EyeOffIcon} strokeWidth={2} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              if (confirm("Hapus paket ini?")) {
                                deleteMutation.mutate(pkg.id);
                              }
                            }}
                          >
                            <HugeiconsIcon
                              icon={Delete01Icon}
                              strokeWidth={2}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      Belum ada paket.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default withAdminAuth(AdminPackagesPage);
