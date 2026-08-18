"use client";

import { useState } from "react";
import { useActionState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Add01Icon } from "@hugeicons/core-free-icons";
import { createMaintenanceTicketAction } from "@/actions/maintenance";

interface MaintenanceTicketFormProps {
  onSuccess?: () => void;
}

export default function MaintenanceTicketForm({
  onSuccess,
}: MaintenanceTicketFormProps) {
  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [state, formAction, isPending] = useActionState(
    createMaintenanceTicketAction,
    undefined,
  );

  const fetchUnits = async () => {
    const res = await fetch("/api/bookings");
    const json = await res.json();
    const bookings = json.data ?? [];

    const activeUnits = new Map<string, string>();
    for (const booking of bookings) {
      if (
        (booking.status === "confirmed" || booking.status === "completed") &&
        booking.unitId
      ) {
        activeUnits.set(booking.unitId, booking.unitName ?? "Unit");
      }
    }

    setUnits(
      Array.from(activeUnits.entries()).map(([id, name]) => ({ id, name })),
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchUnits();
      setSelectedUnitId("");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setImageUrls([]);
      setImageInput("");
    }
    setOpen(newOpen);
  };

  const addImage = () => {
    const url = imageInput.trim();
    if (url && !imageUrls.includes(url)) {
      setImageUrls([...imageUrls, url]);
      setImageInput("");
    }
  };

  const removeImage = (url: string) => {
    setImageUrls(imageUrls.filter((u) => u !== url));
  };

  const handleSubmit = (formData: FormData) => {
    formData.append("images", JSON.stringify(imageUrls));
    formAction(formData);
  };

  if (state?.success) {
    setSelectedUnitId("");
    setTitle("");
    setDescription("");
    setPriority("medium");
    setImageUrls([]);
    setImageInput("");
    onSuccess?.();
    setTimeout(() => setOpen(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              className="size-4 mr-2"
            />
            Buat Tiket Baru
          </Button>
        }
      />
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Tiket Maintenance</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {state?.error && (
            <Alert variant="destructive">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={2}
                className="size-4"
              />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert variant="default">
              <AlertTitle>Berhasil</AlertTitle>
              <AlertDescription>
                Tiket maintenance berhasil dibuat
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select<string>
              value={selectedUnitId}
              onValueChange={(v) => v && setSelectedUnitId(v)}
            >
              <SelectTrigger id="unit">
                <SelectValue placeholder="Pilih unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="unitId" value={selectedUnitId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: AC tidak dingin"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kerusakan yang terjadi..."
              rows={4}
              maxLength={2000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/2000 karakter
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioritas</Label>
            <Select
              value={priority}
              onValueChange={(v) =>
                setPriority(v as "low" | "medium" | "high" | "urgent")
              }
            >
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Rendah</SelectItem>
                <SelectItem value="medium">Sedang</SelectItem>
                <SelectItem value="high">Tinggi</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="priority" value={priority} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Gambar (URL)</Label>
            <div className="flex gap-2">
              <Input
                id="images"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <Button type="button" variant="outline" onClick={addImage}>
                Tambah
              </Button>
            </div>
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                // eslint-disable-next-line @next/next/no-img-element
                {imageUrls.map((url) => (
                  <div key={url} className="relative group">
                    <img
                      src={url}
                      alt="Preview"
                      className="h-16 w-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Mengirim..." : "Buat Tiket"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
