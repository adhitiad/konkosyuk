"use client";

import { useState, useMemo, useActionState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { createBookingRequestAction } from "@/actions/booking-requests";

export interface PricingTier {
  id: string;
  unitId: string;
  maxOccupants: number;
  price: number | string;
  createdAt: string;
}

interface RequestBookingFormProps {
  unitId: string;
  propertyId: string;
  pricingTiers: PricingTier[];
  unitCapacity?: number;
  children: React.ReactNode;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);

export default function RequestBookingForm({
  unitId,
  propertyId,
  pricingTiers,
  unitCapacity,
  children,
}: RequestBookingFormProps) {
  const { data: _session } = useSession();
  const [open, setOpen] = useState(false);
  const [numOccupants, setNumOccupants] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [formState, formAction, isPending] = useActionState(
    createBookingRequestAction,
    { success: undefined, error: undefined, data: undefined },
  );
  const [formKey, setFormKey] = useState(0);

  const capacity =
    unitCapacity ??
    (pricingTiers.length > 0
      ? Math.max(...pricingTiers.map((t) => t.maxOccupants))
      : 1);
  const maxOccupants = Math.max(1, capacity);

  const matchedTier = useMemo(() => {
    return (
      pricingTiers
        .filter((t) => t.maxOccupants >= numOccupants)
        .sort((a, b) => a.maxOccupants - b.maxOccupants)[0] ?? null
    );
  }, [pricingTiers, numOccupants]);

  const estimatedPrice = matchedTier ? Number(matchedTier.price) : null;
  const isOverCapacity = numOccupants > capacity;

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const handleFormAction = async (formData: FormData) => {
    formData.append("unitId", unitId);
    formData.append("propertyId", propertyId);
    formData.append("numOccupants", String(numOccupants));
    formData.append("startDate", new Date(startDate).toISOString());
    await formAction(formData);
  };

  // Handle form action result
  useEffect(() => {
    if (formState?.error) {
      showToastError(formState.error);
    } else if (formState?.success) {
      showToastSuccess(
        "Permintaan booking berhasil dikirim. Silakan tunggu approval pemilik.",
      );
      setOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
      setNumOccupants(1);
      setStartDate("");
      setFormKey((k) => k + 1); // Reset form by changing key
    }
  }, [formState, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Minta Sewa Kamar</DialogTitle>
        </DialogHeader>

        <form key={formKey} action={handleFormAction} className="space-y-4">
          {formState?.error && (
            <Alert variant="destructive">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={2}
                className="size-4"
              />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formState.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="numOccupants">Jumlah Penghuni</Label>
            <Input
              id="numOccupants"
              type="number"
              min={1}
              max={maxOccupants}
              value={numOccupants}
              onChange={(e) => setNumOccupants(Number(e.target.value))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Kapasitas maksimal: {capacity} orang
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Tanggal Mulai Sewa</Label>
            <Input
              id="startDate"
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="rounded-4xl border p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Estimasi Harga</p>
            {estimatedPrice !== null ? (
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(estimatedPrice)}
                <span className="text-xs text-muted-foreground">/bulan</span>
              </p>
            ) : (
              <Badge variant="destructive">
                Jumlah orang melebihi kapasitas kamar
              </Badge>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || isOverCapacity || estimatedPrice === null}
            >
              {isPending ? "Mengirim..." : "Kirim Permintaan Sewa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
