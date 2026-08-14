"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import IndonesiaMap from "@/components/admin/indonesia-map";

interface ModalVerifGpsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName: string;
  propertyCity?: string | null;
  onConfirm: (propertyId: string) => void;
  isPending?: boolean;
}

export function ModalVerifGps({
  open,
  onOpenChange,
  propertyId,
  propertyName,
  propertyCity,
  onConfirm,
  isPending,
}: ModalVerifGpsProps) {
  const mapData = propertyCity
    ? [{ province: propertyCity, city: propertyCity, count: 1 }]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Konfirmasi Verifikasi GPS</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Apakah Anda yakin ingin memverifikasi lokasi GPS untuk properti &quot;
          {propertyName}&quot;?
        </p>
        <div className="rounded-lg overflow-hidden border">
          <IndonesiaMap data={mapData} filterType="owner" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => onConfirm(propertyId)} disabled={isPending}>
            {isPending ? "Memverifikasi..." : "Verifikasi"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
