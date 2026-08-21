"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

type SummaryCardsProps = {
  data: {
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    comparedToPreviousPeriod: {
      revenueChange: number;
      transactionChange: number;
    };
    overallOccupancy: number;
  };
  loading: boolean;
};

function ChangeBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
        isPositive
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/15 text-red-600 dark:text-red-400",
      )}
    >
      {isPositive ? (
        <ArrowUpIcon className="size-3" />
      ) : (
        <ArrowDownIcon className="size-3" />
      )}
      {Math.abs(value)}%
    </span>
  );
}

export function RevenueSummaryCards({ data, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Total Pendapatan</p>
        <p className="mt-2 text-2xl font-bold">
          {formatRupiah(data.totalRevenue)}
        </p>
        <div className="mt-2">
          <ChangeBadge value={data.comparedToPreviousPeriod.revenueChange} />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Total Transaksi</p>
        <p className="mt-2 text-2xl font-bold">
          {data.totalTransactions} transaksi
        </p>
        <div className="mt-2">
          <ChangeBadge value={data.comparedToPreviousPeriod.transactionChange} />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Rata-rata Transaksi</p>
        <p className="mt-2 text-2xl font-bold">
          {formatRupiah(data.averageTransactionValue)}
        </p>
        <div className="mt-2">
          <ChangeBadge value={data.comparedToPreviousPeriod.revenueChange} />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Rata-rata Okupansi</p>
        <p className="mt-2 text-2xl font-bold">{data.overallOccupancy}%</p>
        <div className="mt-2">
          <ChangeBadge value={data.comparedToPreviousPeriod.revenueChange} />
        </div>
      </div>
    </div>
  );
}
