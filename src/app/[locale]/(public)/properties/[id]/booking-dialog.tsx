"use client";

import { useState, useMemo, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import type {
  PropertyPackages,
  DurationUnit,
} from "@/lib/types/property-packages";
import { createBookingAction } from "@/actions/bookings";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);

const formatDuration = (value: number, unit: DurationUnit) => {
  const unitLabels: Record<DurationUnit, string> = {
    hours: "Jam",
    days: "Hari",
    months: "Bulan",
    years: "Tahun",
  };
  return `${value} ${unitLabels[unit]}`;
};

interface BookingDialogClientProps {
  unitName: string;
  packages: PropertyPackages;
  children: React.ReactNode;
}

export default function BookingDialogClient({
  unitName,
  packages,
  children,
}: BookingDialogClientProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [customDuration, setCustomDuration] = useState<number>(1);
  const [startDate, setStartDate] = useState("");
  const [paymentType, setPaymentType] = useState<"dp" | "full">("dp");
  const [state, formAction, isPending] = useActionState(
    createBookingAction,
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const availablePackages = useMemo(
    () => packages.predefined.filter((p) => p.isAvailable),
    [packages.predefined],
  );

  const selectedPackage = useMemo(
    () => availablePackages.find((p) => p.id === selectedPackageId) ?? null,
    [availablePackages, selectedPackageId],
  );

  const totalPrice = useMemo(() => {
    if (!selectedPackage) return 0;
    if (selectedPackageId === "custom" && packages.custom.enabled) {
      return packages.custom.pricePerUnit * customDuration;
    }
    return selectedPackage.finalPrice;
  }, [selectedPackage, selectedPackageId, customDuration, packages.custom]);

  const { dpAmount, remainingAmount } = useMemo(() => {
    if (paymentType === "full") {
      return { dpAmount: 0, remainingAmount: totalPrice };
    }
    const dpRatio = 0.35;
    const dp = Math.round(totalPrice * dpRatio);
    return { dpAmount: dp, remainingAmount: totalPrice - dp };
  }, [totalPrice, paymentType]);

  const isStartDateValid =
    startDate === "" || new Date(startDate) >= new Date(today.slice(0, 10));

  if (state?.success) {
    showToastSuccess(
      paymentType === "full"
        ? "Booking berhasil! Silakan lanjutkan pembayaran lunas."
        : "Booking berhasil! Silakan bayar DP 35% untuk mengunci kamar.",
    );
    setOpen(false);
    router.push("/dashboard/bookings");
  } else if (state?.error) {
    setError(state.error);
    showToastError(state.error);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Booking {unitName}</DialogTitle>
          <DialogDescription>
            Pilih paket durasi untuk mengunci kamar.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={2}
                className="size-4"
              />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="package">Paket</Label>
            <Select<string>
              value={selectedPackageId}
              onValueChange={(v) => v && setSelectedPackageId(v)}
            >
              <SelectTrigger id="package">
                <SelectValue placeholder="Pilih paket" />
              </SelectTrigger>
              <SelectContent>
                {availablePackages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.label} ({formatDuration(pkg.value, pkg.unit)}) -{" "}
                    {formatCurrency(pkg.finalPrice)}
                  </SelectItem>
                ))}
                {packages.custom.enabled && (
                  <SelectItem value="custom">
                    {packages.custom.label}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedPackageId === "custom" && packages.custom.enabled && (
            <div className="space-y-2">
              <Label htmlFor="customDuration">
                Durasi ({packages.custom.unit})
              </Label>
              <Input
                id="customDuration"
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
                min={packages.custom.minDuration}
                max={packages.custom.maxDuration}
                required
              />
              <p className="text-xs text-muted-foreground">
                Rentang: {packages.custom.minDuration} -{" "}
                {packages.custom.maxDuration} {packages.custom.unit}
              </p>
            </div>
          )}

          {selectedPackage && (
            <div className="rounded-4xl border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Harga Dasar</span>
                <span>{formatCurrency(selectedPackage.basePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Diskon</span>
                <span>-{selectedPackage.discountPercent}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">PPN + App Fee</span>
                <span>
                  +{selectedPackage.ppnPercent}% +{" "}
                  {selectedPackage.appFeePercent}%
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Harga Final</span>
                <span>{formatCurrency(selectedPackage.finalPrice)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="startDate">Tanggal Mulai</Label>
            <Input
              id="startDate"
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            {!isStartDateValid && (
              <p className="text-xs text-destructive">
                Tanggal mulai tidak boleh di masa lalu.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Metode Pembayaran</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType("dp")}
                className={`rounded-4xl border p-3 text-sm transition-all ${
                  paymentType === "dp"
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
              >
                <p className="font-semibold">DP 35%</p>
                <p className="text-xs text-muted-foreground">
                  Bayar {formatCurrency(dpAmount)} sekarang
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("full")}
                className={`rounded-4xl border p-3 text-sm transition-all ${
                  paymentType === "full"
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
              >
                <p className="font-semibold">Lunas</p>
                <p className="text-xs text-muted-foreground">
                  Bayar {formatCurrency(totalPrice)} sekarang
                </p>
              </button>
            </div>
            <input type="hidden" name="paymentType" value={paymentType} />
          </div>

          {totalPrice > 0 && (
            <div className="rounded-4xl border p-4 space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              {paymentType === "dp" ? (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>DP (35%)</span>
                    <span>{formatCurrency(dpAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Sisa</span>
                    <span>{formatCurrency(remainingAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm text-primary">
                  <span>Pembayaran Lunas</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || !selectedPackageId || !startDate}
            >
              {isPending ? "Memproses..." : "Booking Sekarang"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
