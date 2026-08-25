"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { withOwnerAuth } from "@/lib/with-owner-auth";
import { RevenueSummaryCards } from "@/components/owner/revenue-summary-cards";
import { RevenueChart } from "@/components/owner/revenue-chart";
import { OccupancyChart } from "@/components/owner/occupancy-chart";
import { TopPropertiesTable } from "@/components/owner/top-properties-table";
import { PeriodSelector } from "@/components/owner/period-selector";
import { useOwnerRevenue } from "@/hooks/use-owner-revenue";
import { useOwnerOccupancy } from "@/hooks/use-owner-occupancy";

export default withOwnerAuth(OwnerDashboardPage);

function OwnerDashboardPage() {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);

  const {
    data: revenueData,
    loading: revenueLoading,
    error: revenueError,
  } = useOwnerRevenue({ period, propertyId, year, month });

  const {
    data: occupancyData,
    loading: occupancyLoading,
    error: occupancyError,
  } = useOwnerOccupancy({ propertyId, year, month });

  const loading = revenueLoading || occupancyLoading;
  const error = revenueError || occupancyError;

  return (
    <div className="container py-6 space-y-6">
      <div className="mb-4">
        <BreadcrumbNav
          items={[
            { label: "Dashboard Owner", href: "/owner" },
            { label: "Dashboard" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat pagi, lihat ringkasan bisnis Anda
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertDescription>
            {error instanceof Error ? error.message : "Gagal memuat data"}
          </AlertDescription>
        </Alert>
      )}

      <PeriodSelector
        period={period}
        year={year}
        month={month}
        propertyId={propertyId}
        onPeriodChange={setPeriod}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onPropertyIdChange={setPropertyId}
      />

      <RevenueSummaryCards
        data={{
          totalRevenue: revenueData?.totalRevenue ?? 0,
          totalTransactions: revenueData?.totalTransactions ?? 0,
          averageTransactionValue: revenueData?.averageTransactionValue ?? 0,
          comparedToPreviousPeriod: revenueData?.comparedToPreviousPeriod ?? {
            revenueChange: 0,
            transactionChange: 0,
          },
          overallOccupancy: occupancyData?.overallOccupancy ?? 0,
        }}
        loading={loading}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart
              data={revenueData?.monthlyData ?? []}
              loading={revenueLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Okupansi</CardTitle>
          </CardHeader>
          <CardContent>
            <OccupancyChart
              data={occupancyData?.dailyData ?? []}
              loading={occupancyLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Properti Teratas</CardTitle>
        </CardHeader>
        <CardContent>
          <TopPropertiesTable
            data={
              (revenueData?.topProperties ?? []) as Array<{
                propertyId: string;
                propertyName: string;
                revenue: number;
                transactions: number;
                occupancyRate: number;
                avgDailyRate: number;
              }>
            }
            loading={revenueLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
