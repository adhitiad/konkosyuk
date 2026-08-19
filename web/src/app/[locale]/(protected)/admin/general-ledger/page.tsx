"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { apiClient } from "@/lib/axios";
import { withAdminAuth } from "@/lib/with-admin-auth";

interface LedgerEntry {
  id: string;
  transactionDate: string;
  accountCode: string;
  accountName: string;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  debit: string;
  credit: string;
  balance: string | null;
  createdAt: string;
}

interface LedgerResponse {
  data: LedgerEntry[];
  totals: {
    totalDebit: number;
    totalCredit: number;
    balance: number;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(Number(value ?? 0));

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export default withAdminAuth(AdminGeneralLedgerPage);

function AdminGeneralLedgerPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery<LedgerResponse>(
    {
      queryKey: ["general-ledger", startDate, endDate, accountCode, page],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (accountCode) params.set("accountCode", accountCode);
        params.set("page", String(page));
        params.set("limit", "20");

        const res = await apiClient.get(
          `/api/admin/general-ledger?${params.toString()}`,
        );
        return res.data as LedgerResponse;
      },
      staleTime: 30000,
    },
  );

  const entries: LedgerEntry[] = Array.isArray(data?.data) ? data.data : [];
  const totals = data?.totals ?? { totalDebit: 0, totalCredit: 0, balance: 0 };

  const handleExport = () => {
    if (!entries.length) {
      toast({
        title: "Gagal",
        description: "Tidak ada data untuk diekspor.",
        type: "error",
      });
      return;
    }

    const headers = [
      "Tanggal",
      "Kode Akun",
      "Nama Akun",
      "Deskripsi",
      "Debit",
      "Kredit",
      "Saldo",
      "Referensi",
    ];
    const rows = entries.map((entry) => [
      formatDate(entry.transactionDate),
      entry.accountCode,
      entry.accountName,
      entry.description,
      entry.debit,
      entry.credit,
      entry.balance || "0",
      entry.referenceType ? `${entry.referenceType}:${entry.referenceId}` : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `general-ledger-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Berhasil",
      description: "Data berhasil diekspor ke CSV.",
      type: "success",
    });
  };

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <BreadcrumbNav
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Buku Besar" },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight">
            Buku Besar (General Ledger)
          </h1>
          <p className="text-muted-foreground">
            Monitoring pemasukan dan pengeluaran
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          Export CSV
        </Button>
      </div>

      {isError && (
        <ErrorState
          title="Gagal Memuat Buku Besar"
          description={
            error instanceof Error
              ? error.message
              : "Gagal memuat data buku besar."
          }
          onRetry={() => refetch()}
          className="mb-6"
        />
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Mulai</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kode Akun</label>
              <Input
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                placeholder="Contoh: 1000"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setPage(1);
                  refetch();
                }}
                className="w-full"
              >
                Terapkan Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Debit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(totals.totalDebit)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kredit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(totals.totalCredit)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p
                className={`text-2xl font-bold ${totals.balance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(totals.balance)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              title="Tidak Ada Data"
              description="Tidak ada transaksi yang sesuai dengan filter yang dipilih."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Tanggal
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Kode Akun
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Nama Akun
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Deskripsi
                    </th>
                    <th
                      scope="col"
                      className="text-right py-3 px-4 font-medium text-muted-foreground"
                    >
                      Debit
                    </th>
                    <th
                      scope="col"
                      className="text-right py-3 px-4 font-medium text-muted-foreground"
                    >
                      Kredit
                    </th>
                    <th
                      scope="col"
                      className="text-right py-3 px-4 font-medium text-muted-foreground"
                    >
                      Saldo
                    </th>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 font-medium text-muted-foreground"
                    >
                      Referensi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-b-0">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {formatDate(entry.transactionDate)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {entry.accountCode}
                      </td>
                      <td className="py-3 px-4">{entry.accountName}</td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        {Number(entry.debit) > 0
                          ? formatCurrency(entry.debit)
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        {Number(entry.credit) > 0
                          ? formatCurrency(entry.credit)
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        {entry.balance ? formatCurrency(entry.balance) : "-"}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {entry.referenceType
                          ? `${entry.referenceType}:${entry.referenceId?.slice(0, 8)}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data?.meta && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Halaman {data.meta.page} dari {data.meta.totalPages} (
                    {data.meta.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        refetch();
                      }}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= (data.meta?.totalPages ?? 1)}
                      onClick={() => {
                        setPage((p) =>
                          Math.min(data.meta?.totalPages ?? 1, p + 1),
                        );
                        refetch();
                      }}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
