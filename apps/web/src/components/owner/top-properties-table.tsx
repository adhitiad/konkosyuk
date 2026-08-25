"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";

type TopProperty = {
  propertyId: string;
  propertyName: string;
  revenue: number;
  transactions: number;
  occupancyRate: number;
  avgDailyRate: number;
};

function formatRupiah(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type SortKey = "revenue" | "occupancyRate" | "transactions";
type SortDir = "asc" | "desc";

export function TopPropertiesTable({
  data,
  loading,
}: {
  data: TopProperty[];
  loading: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (sortDir === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Belum ada data properti
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Properti</TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => toggleSort("revenue")}
            >
              <div className="flex items-center gap-1">
                Pendapatan
                {sortKey === "revenue" && (
                  <HugeiconsIcon
                    icon={sortDir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
                    strokeWidth={2}
                    className="size-3"
                  />
                )}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => toggleSort("transactions")}
            >
              <div className="flex items-center gap-1">
                Transaksi
                {sortKey === "transactions" && (
                  <HugeiconsIcon
                    icon={sortDir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
                    strokeWidth={2}
                    className="size-3"
                  />
                )}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => toggleSort("occupancyRate")}
            >
              <div className="flex items-center gap-1">
                Okupansi
                {sortKey === "occupancyRate" && (
                  <HugeiconsIcon
                    icon={sortDir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
                    strokeWidth={2}
                    className="size-3"
                  />
                )}
              </div>
            </TableHead>
            <TableHead>Avg Daily Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((property) => (
            <TableRow key={property.propertyId}>
              <TableCell className="font-medium">
                {property.propertyName}
              </TableCell>
              <TableCell>{formatRupiah(property.revenue)}</TableCell>
              <TableCell>{property.transactions}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={property.occupancyRate}
                    className="h-2 w-24"
                  />
                  <span className="text-xs text-muted-foreground">
                    {property.occupancyRate}%
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatRupiah(property.avgDailyRate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
