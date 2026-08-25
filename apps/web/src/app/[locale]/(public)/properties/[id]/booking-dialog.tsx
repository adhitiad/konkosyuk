"use client";

import { useState, useMemo, useActionState, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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
import { AlertCircleIcon, TagIcon } from "@hugeicons/core-free-icons";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import type {
  PropertyPackages,
  DurationUnit,
} from "@/lib/types/property-packages";
import { createBookingOrGroupAction } from "@/actions/bookings";
import { calculatePackageEndDate } from "@/lib/packages/calculator";
import type { AppliedSeasonalRule } from "@/lib/pricing/seasonal";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
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

interface UnitOption {
  id: string;
  name: string;
}

interface BookingDialogClientProps {
  propertyId: string;
  units: UnitOption[];
  packages: PropertyPackages;
  seasonalRules: Array<{
    id: string;
    ruleType: "percentage" | "fixed" | "multiplier";
    adjustmentValue: string;
    startDate: string;
    endDate: string;
    minNights: number | null;
    maxNights: number | null;
    priority: number;
  }>;
  children: React.ReactNode;
}

export default function BookingDialogClient({
  propertyId,
  units,
  packages,
  seasonalRules,
  children,
}: BookingDialogClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    units[0]?.id || "",
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [customDuration, setCustomDuration] = useState<number>(1);
  const [startDate, setStartDate] = useState("");
  const [paymentType, setPaymentType] = useState<"dp" | "full">("dp");
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [memberEmails, setMemberEmails] = useState("");
  const [state, formAction, isPending] = useActionState(
    createBookingOrGroupAction,
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const selectedUnit = useMemo(
    () => units.find((u) => u.id === selectedUnitId) ?? null,
    [units, selectedUnitId],
  );

  const [today, setToday] = useState("");
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    });
  }, []);

  const availablePackages = useMemo(
    () => packages.predefined.filter((p) => p.isAvailable),
    [packages.predefined],
  );

  const selectedPackage = useMemo(
    () => availablePackages.find((p) => p.id === selectedPackageId) ?? null,
    [availablePackages, selectedPackageId],
  );

  const seasonalPriceResult = useMemo(() => {
    if (!selectedPackage || !startDate) return null;

    const checkIn = new Date(startDate);
    let checkOut: Date;
    let basePrice: number;

    if (selectedPackageId === "custom" && packages.custom.enabled) {
      basePrice = packages.custom.pricePerUnit * customDuration;
      checkOut = calculatePackageEndDate(
        startDate,
        packages.custom.unit,
        customDuration,
      );
    } else {
      basePrice = selectedPackage.basePrice;
      checkOut = calculatePackageEndDate(
        startDate,
        selectedPackage.unit,
        selectedPackage.value,
      );
    }

    const rule = seasonalRules.find((r) => {
      const ruleStart = new Date(r.startDate);
      const ruleEnd = new Date(r.endDate);
      const overlaps =
        (checkIn >= ruleStart && checkIn <= ruleEnd) ||
        (checkOut >= ruleStart && checkOut <= ruleEnd) ||
        (ruleStart <= checkIn && ruleEnd >= checkOut);

      if (!overlaps) return false;

      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (r.minNights !== null && nights < r.minNights) return false;
      if (r.maxNights !== null && nights > r.maxNights) return false;

      return true;
    });

    if (!rule) return null;

    const value = Number(rule.adjustmentValue);
    let adjustedBase = basePrice;

    switch (rule.ruleType) {
      case "percentage":
        adjustedBase = basePrice + (basePrice * value) / 100;
        break;
      case "fixed":
        adjustedBase = basePrice + value;
        break;
      case "multiplier":
        adjustedBase = basePrice * value;
        break;
    }

    return {
      ruleId: rule.id,
      ruleName: rule.id,
      ruleType: rule.ruleType,
      adjustmentValue: value,
      originalPrice: basePrice,
      adjustedPrice: adjustedBase,
    } satisfies AppliedSeasonalRule;
  }, [
    selectedPackage,
    selectedPackageId,
    startDate,
    customDuration,
    packages,
    seasonalRules,
  ]);

  const effectiveBasePrice =
    seasonalPriceResult?.adjustedPrice ?? selectedPackage?.basePrice ?? 0;

  const totalPrice = useMemo(() => {
    if (!selectedPackage) return 0;
    if (selectedPackageId === "custom" && packages.custom.enabled) {
      const base =
        seasonalPriceResult?.adjustedPrice ??
        packages.custom.pricePerUnit * customDuration;
      return Math.round(base + (base * 11) / 100 + (base * 0.63) / 100);
    }
    const base =
      seasonalPriceResult?.adjustedPrice ?? selectedPackage.basePrice;
    const discounted = base - (base * selectedPackage.discountPercent) / 100;
    const final =
      discounted +
      (discounted * selectedPackage.ppnPercent) / 100 +
      (discounted * selectedPackage.appFeePercent) / 100;
    return Math.round(final);
  }, [
    selectedPackage,
    selectedPackageId,
    customDuration,
    packages,
    seasonalPriceResult,
  ]);

  const groupTotalPrice = useMemo(() => {
    if (!isGroupBooking || totalPrice <= 0) return 0;
    const memberCount =
      memberEmails.split(",").filter((e) => e.trim()).length + 1;
    return totalPrice * memberCount;
  }, [isGroupBooking, totalPrice, memberEmails]);

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
      isGroupBooking
        ? "Group booking berhasil dibuat! Undangan telah dikirim ke anggota."
        : paymentType === "full"
          ? "Booking berhasil! Silakan lanjutkan pembayaran lunas."
          : "Booking berhasil! Silakan bayar DP 35% untuk mengunci kamar.",
    );
    setOpen(false);
    setIsGroupBooking(false);
    setMemberEmails("");
    router.push(
      isGroupBooking
        ? `/${locale}/dashboard/group-bookings`
        : `/${locale}/dashboard/bookings`,
    );
  } else if (state?.error) {
    setError(state.error);
    showToastError(state.error);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Booking {selectedUnit?.name || ""}</DialogTitle>
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

          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="unitId" value={selectedUnitId} />
          <input
            type="hidden"
            name="isGroupBooking"
            value={isGroupBooking ? "true" : "false"}
          />
          {isGroupBooking && (
            <input type="hidden" name="memberEmails" value={memberEmails} />
          )}

          {units.length > 1 && (
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
            </div>
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
                <span>{formatCurrency(effectiveBasePrice)}</span>
              </div>
              {seasonalPriceResult && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>
                    Penyesuaian Musiman ({seasonalPriceResult.ruleType})
                  </span>
                  <span>
                    {seasonalPriceResult.ruleType === "percentage" &&
                      `+${seasonalPriceResult.adjustmentValue}%`}
                    {seasonalPriceResult.ruleType === "fixed" &&
                      `+${formatCurrency(seasonalPriceResult.adjustmentValue)}`}
                    {seasonalPriceResult.ruleType === "multiplier" &&
                      `x${seasonalPriceResult.adjustmentValue}`}
                  </span>
                </div>
              )}
              {selectedPackageId !== "custom" && (
                <>
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
                </>
              )}
              <div className="flex justify-between font-semibold">
                <span>Harga Final</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              {seasonalPriceResult && (
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <HugeiconsIcon
                    icon={TagIcon}
                    strokeWidth={2}
                    className="h-3 w-3"
                  />
                  Harga musiman diterapkan berdasarkan tanggal booking
                </div>
              )}
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

          <div className="flex items-center gap-2">
            <input
              id="isGroupBooking"
              type="checkbox"
              checked={isGroupBooking}
              onChange={(e) => setIsGroupBooking(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isGroupBooking" className="cursor-pointer">
              Buat sebagai Group Booking
            </Label>
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

          {isGroupBooking && (
            <div className="space-y-2">
              <Label htmlFor="memberEmails">
                Email Anggota (pisah dengan koma)
              </Label>
              <Input
                id="memberEmails"
                value={memberEmails}
                onChange={(e) => setMemberEmails(e.target.value)}
                placeholder="friend1@example.com, friend2@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Total{" "}
                {groupTotalPrice > 0
                  ? formatCurrency(groupTotalPrice)
                  : formatCurrency(totalPrice)}{" "}
                untuk{" "}
                {memberEmails.split(",").filter((e) => e.trim()).length + 1}{" "}
                orang
              </p>
            </div>
          )}

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
              disabled={
                isPending || !selectedPackageId || !startDate || !selectedUnitId
              }
            >
              {isPending ? "Memproses..." : "Booking Sekarang"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
