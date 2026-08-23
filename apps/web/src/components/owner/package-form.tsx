"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  PropertyPackages,
  PackageItem,
  DurationUnit,
} from "@/lib/types/property-packages";

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

const KOST_PACKAGES: Omit<PackageItem, "basePrice" | "finalPrice">[] = [
  {
    id: "kost-6h",
    label: "6 Jam",
    unit: "hours",
    value: 6,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kost-1d",
    label: "1 Hari",
    unit: "days",
    value: 1,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kost-3d",
    label: "3 Hari",
    unit: "days",
    value: 3,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kost-7d",
    label: "7 Hari",
    unit: "days",
    value: 7,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kost-14d",
    label: "14 Hari",
    unit: "days",
    value: 14,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kost-1m",
    label: "1 Bulan",
    unit: "months",
    value: 1,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kost-3m",
    label: "3 Bulan",
    unit: "months",
    value: 3,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kost-6m",
    label: "6 Bulan",
    unit: "months",
    value: 6,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kost-1y",
    label: "1 Tahun",
    unit: "years",
    value: 1,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kost-2y",
    label: "2 Tahun",
    unit: "years",
    value: 2,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
];

const KONTRAKAN_PACKAGES: Omit<PackageItem, "basePrice" | "finalPrice">[] = [
  {
    id: "kontrakan-1m",
    label: "1 Bulan",
    unit: "months",
    value: 1,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kontrakan-3m",
    label: "3 Bulan",
    unit: "months",
    value: 3,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kontrakan-6m",
    label: "6 Bulan",
    unit: "months",
    value: 6,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kontrakan-1y",
    label: "1 Tahun",
    unit: "years",
    value: 1,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
  {
    id: "kontrakan-2y",
    label: "2 Tahun",
    unit: "years",
    value: 2,
    discountPercent: 0,
    ppnPercent: 11,
    appFeePercent: 0.63,
    isAvailable: true,
  },
];

interface PackageFormProps {
  type: "kost" | "kontrakan" | "apartemen" | "rumah" | "ruko";
  initialData?: PropertyPackages;
  onChange: (packages: PropertyPackages) => void;
}

function calculateFinalPrice(
  basePrice: number,
  discountPercent: number,
  ppnPercent: number,
  appFeePercent: number,
): number {
  const discounted = basePrice - (basePrice * discountPercent) / 100;
  const final =
    discounted +
    (discounted * ppnPercent) / 100 +
    (discounted * appFeePercent) / 100;
  return Math.round(final);
}

export default function PackageForm({
  type,
  initialData,
  onChange,
}: PackageFormProps) {
  const defaultPackages: PropertyPackages = useMemo(
    () => ({
      predefined: (type === "kost" ? KOST_PACKAGES : KONTRAKAN_PACKAGES).map(
        (pkg) => ({
          ...pkg,
          basePrice: 0,
          finalPrice: 0,
        }),
      ),
      custom: {
        enabled: false,
        label: "Custom Duration",
        unit: "days",
        pricePerUnit: 0,
        minDuration: 1,
        maxDuration: type === "kost" ? 365 : 365,
      },
    }),
    [type],
  );

  const [packages, setPackages] = useState<PropertyPackages>(
    initialData ?? defaultPackages,
  );

  useEffect(() => {
    onChange(packages);
  }, [packages, onChange]);

  const updatePackage = (
    index: number,
    field: keyof PackageItem,
    value: PackageItem[keyof PackageItem],
  ) => {
    setPackages((prev) => {
      const updated = [...prev.predefined];
      updated[index] = { ...updated[index], [field]: value };

      if (
        field === "basePrice" ||
        field === "discountPercent" ||
        field === "ppnPercent" ||
        field === "appFeePercent"
      ) {
        const pkg = updated[index] as PackageItem;
        updated[index] = {
          ...pkg,
          finalPrice: calculateFinalPrice(
            pkg.basePrice,
            pkg.discountPercent,
            pkg.ppnPercent,
            pkg.appFeePercent,
          ),
        };
      }

      return { ...prev, predefined: updated };
    });
  };

  const toggleAvailable = (index: number) => {
    setPackages((prev) => {
      const updated = [...prev.predefined];
      updated[index] = {
        ...updated[index],
        isAvailable: !updated[index].isAvailable,
      };
      return { ...prev, predefined: updated };
    });
  };

  const updateCustom = (
    field: string,
    value: PropertyPackages["custom"][keyof PropertyPackages["custom"]],
  ) => {
    setPackages((prev) => ({
      ...prev,
      custom: { ...prev.custom, [field]: value },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Paket Harga</Label>
        <div className="space-y-3">
          {packages.predefined.map((pkg, index) => (
            <div key={pkg.id} className="rounded-4xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{pkg.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatDuration(pkg.value, pkg.unit)})
                  </span>
                </div>
                <Switch
                  checked={pkg.isAvailable}
                  onCheckedChange={() => toggleAvailable(index)}
                />
              </div>

              {pkg.isAvailable && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`price-${pkg.id}`} className="text-xs">
                      Harga Dasar
                    </Label>
                    <Input
                      id={`price-${pkg.id}`}
                      type="number"
                      value={pkg.basePrice || ""}
                      onChange={(e) =>
                        updatePackage(
                          index,
                          "basePrice",
                          Number(e.target.value),
                        )
                      }
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`discount-${pkg.id}`} className="text-xs">
                      Diskon (%)
                    </Label>
                    <Input
                      id={`discount-${pkg.id}`}
                      type="number"
                      value={pkg.discountPercent || ""}
                      onChange={(e) =>
                        updatePackage(
                          index,
                          "discountPercent",
                          Number(e.target.value),
                        )
                      }
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`ppn-${pkg.id}`} className="text-xs">
                      PPN (%)
                    </Label>
                    <Input
                      id={`ppn-${pkg.id}`}
                      type="number"
                      value={pkg.ppnPercent || ""}
                      onChange={(e) =>
                        updatePackage(
                          index,
                          "ppnPercent",
                          Number(e.target.value),
                        )
                      }
                      placeholder="11"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`app-${pkg.id}`} className="text-xs">
                      Biaya App (%)
                    </Label>
                    <Input
                      id={`app-${pkg.id}`}
                      type="number"
                      value={pkg.appFeePercent || ""}
                      onChange={(e) =>
                        updatePackage(
                          index,
                          "appFeePercent",
                          Number(e.target.value),
                        )
                      }
                      placeholder="0.63"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              {pkg.isAvailable && pkg.basePrice > 0 && (
                <div className="text-sm text-muted-foreground">
                  Harga Final:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(pkg.finalPrice)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-4xl border p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Paket Opsional (Custom)</Label>
          <Switch
            checked={packages.custom.enabled}
            onCheckedChange={(checked) => updateCustom("enabled", checked)}
          />
        </div>

        {packages.custom.enabled && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="custom-label" className="text-xs">
                Label
              </Label>
              <Input
                id="custom-label"
                value={packages.custom.label}
                onChange={(e) => updateCustom("label", e.target.value)}
                placeholder="Custom Duration"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-unit" className="text-xs">
                Satuan
              </Label>
              <select
                id="custom-unit"
                value={packages.custom.unit}
                onChange={(e) =>
                  updateCustom("unit", e.target.value as DurationUnit)
                }
                className="h-9 rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm"
              >
                <option value="hours">Jam</option>
                <option value="days">Hari</option>
                <option value="months">Bulan</option>
                <option value="years">Tahun</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-price" className="text-xs">
                Harga per Unit
              </Label>
              <Input
                id="custom-price"
                type="number"
                value={packages.custom.pricePerUnit || ""}
                onChange={(e) =>
                  updateCustom("pricePerUnit", Number(e.target.value))
                }
                placeholder="0"
                min="0"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-min" className="text-xs">
                Min Durasi
              </Label>
              <Input
                id="custom-min"
                type="number"
                value={packages.custom.minDuration || ""}
                onChange={(e) =>
                  updateCustom("minDuration", Number(e.target.value))
                }
                placeholder="1"
                min="1"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-max" className="text-xs">
                Max Durasi
              </Label>
              <Input
                id="custom-max"
                type="number"
                value={packages.custom.maxDuration || ""}
                onChange={(e) =>
                  updateCustom("maxDuration", Number(e.target.value))
                }
                placeholder="365"
                min="1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
