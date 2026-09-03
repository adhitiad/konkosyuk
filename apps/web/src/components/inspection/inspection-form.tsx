"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { CameraIcon, AddCircleIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { apiClient } from "@/lib/axios";

interface InspectionItemFormData {
  category: string;
  itemName: string;
  condition: string;
  notes: string;
  repairCost: string;
  isNewDamage: boolean;
}

interface InspectionFormProps {
  inspectionId: string;
  items: Array<{
    id: string;
    category: string;
    itemName: string;
    condition: string | null;
    notes: string | null;
    repairCost: string | null;
    photoUrls: string[];
    isNewDamage: boolean;
  }>;
  onItemAdded?: () => void;
}

const CATEGORIES = [
  { value: "furniture", label: "Furnitur" },
  { value: "electrical", label: "Kelistrikan" },
  { value: "plumbing", label: "Pipa & Air" },
  { value: "walls", label: "Dinding" },
  { value: "floor", label: "Lantai" },
  { value: "doors_windows", label: "Pintu & Jendela" },
  { value: "ac", label: "AC" },
  { value: "kitchen", label: "Dapur" },
  { value: "bathroom", label: "Kamar Mandi" },
  { value: "other", label: "Lainnya" },
];

const CONDITIONS = [
  { value: "excellent", label: "Sangat Baik" },
  { value: "good", label: "Baik" },
  { value: "fair", label: "Cukup" },
  { value: "poor", label: "Buruk" },
  { value: "damaged", label: "Rusak" },
  { value: "missing", label: "Hilang" },
];

export function InspectionForm({
  inspectionId,
  items,
  onItemAdded,
}: InspectionFormProps) {
  const [formData, setFormData] = useState<InspectionItemFormData>({
    category: "furniture",
    itemName: "",
    condition: "good",
    notes: "",
    repairCost: "0",
    isNewDamage: false,
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const queryClient = useQueryClient();

  const addItemMutation = useMutation({
    mutationFn: async (data: InspectionItemFormData) => {
       const res = await apiClient.post(`/api/inspections/${inspectionId}/items`, {
        ...data,
        repairCost: data.repairCost ? Number(data.repairCost) : undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inspections", inspectionId],
      });
      setFormData({
        category: "furniture",
        itemName: "",
        condition: "good",
        notes: "",
        repairCost: "0",
        isNewDamage: false,
      });
      onItemAdded?.();
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: async ({ itemId, url }: { itemId: string; url: string }) => {
       const res = await apiClient.post(`/api/inspections/${inspectionId}/photos`, {
        itemId,
        type: "damage",
        url,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inspections", inspectionId],
      });
      setPhotoUrl("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName.trim()) return;
    addItemMutation.mutate(formData);
  };

  const handleAddPhoto = (itemId: string) => {
    if (!photoUrl.trim()) return;
    addPhotoMutation.mutate({ itemId, url: photoUrl });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Item Inspeksi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    value && setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Kondisi</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) =>
                    value && setFormData({ ...formData, condition: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">Nama Item</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) =>
                  setFormData({ ...formData, itemName: e.target.value })
                }
                placeholder="misal: Lemari, Kasur, AC, dll"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Deskripsi kerusakan atau catatan tambahan"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repairCost">
                  Estimasi Biaya Perbaikan (Rp)
                </Label>
                <Input
                  id="repairCost"
                  type="number"
                  value={formData.repairCost}
                  onChange={(e) =>
                    setFormData({ ...formData, repairCost: e.target.value })
                  }
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  id="isNewDamage"
                  type="checkbox"
                  checked={formData.isNewDamage}
                  onChange={(e) =>
                    setFormData({ ...formData, isNewDamage: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isNewDamage" className="cursor-pointer">
                  Kerusakan Baru
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={addItemMutation.isPending}
              className="w-full"
            >
              <HugeiconsIcon
                icon={AddCircleIcon}
                strokeWidth={2}
                className="size-4 mr-1"
              />
              {addItemMutation.isPending ? "Menyimpan..." : "Tambah Item"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Item ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{item.itemName}</p>
                      <Badge variant="outline">{item.category}</Badge>
                      {item.isNewDamage && (
                        <Badge variant="destructive">Baru</Badge>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {item.notes}
                      </p>
                    )}
                    {item.repairCost && Number(item.repairCost) > 0 && (
                      <p className="text-sm font-medium text-destructive">
                        Biaya:{" "}
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(Number(item.repairCost))}
                      </p>
                    )}
                    {item.photoUrls.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {item.photoUrls.map((url, idx) => (
                          <Image
                            key={idx}
                            src={url}
                            alt={`${item.itemName} - ${idx + 1}`}
                            width={64}
                            height={64}
                            className="object-cover rounded-md border"
                            unoptimized
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="URL foto..."
                        className="h-8 text-xs w-40"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddPhoto(item.id)}
                        disabled={
                          !photoUrl.trim() || addPhotoMutation.isPending
                        }
                      >
                        <HugeiconsIcon
                          icon={CameraIcon}
                          strokeWidth={2}
                          className="size-3"
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
