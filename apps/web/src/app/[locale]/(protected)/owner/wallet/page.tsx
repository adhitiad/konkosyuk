"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import type { SessionUserWithRole } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { WalletIcon } from "@hugeicons/core-free-icons";
import type { OwnerBankAccount } from "@/db/schema";
import { createWithdrawalAction } from "@/actions/withdrawals";
import type { CreateWithdrawalState } from "@/types/action";
import { apiClient } from "@/lib/axios";

interface Withdrawal {
  id: string;
  amount: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  bankAccount: {
    id: string;
    providerName: string;
    accountNumber: string;
    accountName: string;
    accountType: string;
  };
}

const STATUS_LABEL: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Menunggu", variant: "secondary" },
  processing: { label: "Diproses", variant: "secondary" },
  success: { label: "Berhasil", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
};

export default function WalletPage() {
  const { data: session } = useSession();
  const user = session?.user as SessionUserWithRole | undefined;
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const balance = Number(user?.balance || 0);

  const { data: accountsData, isLoading: accountsLoading } = useQuery<
    OwnerBankAccount[]
  >({
    queryKey: ["owner-bank-accounts"],
    queryFn: async () => {
      const res = await apiClient.get("/api/owner/bank-accounts");
      return res.data.data || [];
    },
    staleTime: 30000,
  });

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery<
    Withdrawal[]
  >({
    queryKey: ["owner-withdrawals"],
    queryFn: async () => {
      const res = await apiClient.get("/api/owner/withdrawals");
      return res.data.data || [];
    },
    staleTime: 30000,
  });

  const accounts = useMemo(() => accountsData ?? [], [accountsData]);
  const withdrawals = withdrawalsData ?? [];
  const loading = accountsLoading || withdrawalsLoading;

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [accounts, selectedAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("bank_account_id", selectedAccount);
      formData.append("amount", amount);

      const result: CreateWithdrawalState = await createWithdrawalAction(
        undefined,
        formData,
      );

      if (result.success) {
        setAmount("");
        setSuccess("Permintaan penarikan berhasil dikirim.");
      } else {
        setError(result.error || "Gagal mengajukan penarikan");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Dompet Saya
        </h1>
        <p className="mt-2 text-muted-foreground">
          Kelola saldo dan penarikan dana Anda
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 text-green-700">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={WalletIcon}
              strokeWidth={2}
              className="size-5"
            />
            Saldo Tersedia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatCurrency(balance)}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tarik Dana</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Anda belum memiliki rekening bank. Silakan tambahkan rekening
              terlebih dahulu.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account">Rekening Tujuan</Label>
                <Select<string>
                  value={selectedAccount}
                  onValueChange={(v) => v && setSelectedAccount(v)}
                >
                  <SelectTrigger id="bank_account">
                    <SelectValue placeholder="Pilih rekening" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.providerName} • {acc.accountNumber} (
                        {acc.accountName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Penarikan (IDR)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Masukkan jumlah"
                  required
                  min="1"
                  step="0.01"
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Memproses..." : "Ajukan Penarikan"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penarikan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada riwayat penarikan.
            </p>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((w) => {
                const statusInfo =
                  STATUS_LABEL[w.status] || STATUS_LABEL.pending;
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {formatCurrency(Number(w.amount))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {w.bankAccount.providerName} •{" "}
                        {w.bankAccount.accountNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(w.createdAt).toLocaleString("id-ID")}
                      </p>
                      {w.adminNote && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Catatan: {w.adminNote}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
