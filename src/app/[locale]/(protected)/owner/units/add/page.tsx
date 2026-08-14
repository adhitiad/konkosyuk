"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/axios";
import { withOwnerAuth } from "@/lib/with-owner-auth";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { toast } from "@/components/ui/toast";
import { ArrowLeft, Loader2 } from "lucide-react";

interface PropertyOption {
  id: string;
  name: string;
}

function AddUnitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const preselectedPropertyId = searchParams.get("propertyId");

  const [formData, setFormData] = useState({
    propertyId: preselectedPropertyId || "",
    name: "",
    type: "kamar",
    price: "",
    capacity: "1",
    status: "available",
    description: "",
    facilities: "",
  });

  const { data: properties } = useQuery<PropertyOption[]>({
    queryKey: ["owner-properties-list"],
    queryFn: async () => {
      const response = await apiClient.get("/api/properties", {
        params: { ownerId: session?.user?.id, limit: 100 },
      });
      const body = response.data as { data?: { data?: PropertyOption[] } };
      const items = Array.isArray(body?.data?.data)
        ? body.data.data
        : Array.isArray(body?.data)
          ? (body.data as PropertyOption[])
          : [];
      return items;
    },
    enabled: !!session?.user?.id,
  });

  const addMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiClient.post("/api/owner/units", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-units"] });
      toast({
        title: "Unit berhasil ditambahkan",
        description: "Unit baru telah ditambahkan ke properti Anda.",
        type: "success",
      });
      router.push("/owner/units");
    },
    onError: (err) => {
      toast({
        title: "Gagal menambahkan unit",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        type: "error",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.propertyId) {
      toast({
        title: "Error",
        description: "Pilih properti terlebih dahulu",
        type: "error",
      });
      return;
    }
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Nama unit wajib diisi",
        type: "error",
      });
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast({
        title: "Error",
        description: "Harga harus lebih dari 0",
        type: "error",
      });
      return;
    }

    addMutation.mutate({
      propertyId: formData.propertyId,
      name: formData.name,
      type: formData.type,
      price: Number(formData.price),
      capacity: Number(formData.capacity),
      status: formData.status,
      description: formData.description || null,
      facilities: formData.facilities
        ? formData.facilities.split(",").map((f) => f.trim())
        : [],
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/owner" },
            { label: "Unit", href: "/owner/units" },
            { label: "Tambah Unit" },
          ]}
        />
        <div className="flex items-center gap-4 mt-2">
          <Button
            variant="ghost"
            size="icon"
            render={
              <Link href="/owner/units">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
            nativeButton={false}
          ></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tambah Unit Baru
            </h1>
            <p className="text-muted-foreground">
              Tambahkan kamar atau unit baru ke properti Anda
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Unit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Properti */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="propertyId">Properti *</Label>
                <Select
                  value={formData.propertyId}
                  onValueChange={(v) =>
                    v && setFormData({ ...formData, propertyId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih properti..." />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nama Unit */}
              <div className="space-y-2">
                <Label htmlFor="name">Nama Unit *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Kamar 101, Kamar Deluxe A"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* Tipe */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Unit *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    v && setFormData({ ...formData, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kamar">Kamar</SelectItem>
                    <SelectItem value="ruangan">Ruangan</SelectItem>
                    <SelectItem value="lantai">Lantai</SelectItem>
                    <SelectItem value="bangunan">Bangunan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Harga */}
              <div className="space-y-2">
                <Label htmlFor="price">Harga per Bulan (Rp) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="500000"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>

              {/* Kapasitas */}
              <div className="space-y-2">
                <Label htmlFor="capacity">Kapasitas (orang) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    v && setFormData({ ...formData, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Tersedia</SelectItem>
                    <SelectItem value="occupied">Terisi</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fasilitas */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="facilities">
                  Fasilitas (pisahkan dengan koma)
                </Label>
                <Input
                  id="facilities"
                  placeholder="AC, WiFi, Kamar Mandi Dalam, Lemari"
                  value={formData.facilities}
                  onChange={(e) =>
                    setFormData({ ...formData, facilities: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Contoh: AC, WiFi, Kamar Mandi Dalam, Lemari, Meja Belajar
                </p>
              </div>

              {/* Deskripsi */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi singkat tentang unit ini..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                render={<Link href="/owner/units">Batal</Link>}
                nativeButton={false}
              >
                Batal
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Unit"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default withOwnerAuth(AddUnitPage);
