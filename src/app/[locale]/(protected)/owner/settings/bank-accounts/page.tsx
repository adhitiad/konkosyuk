"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import type { SessionUserWithRole } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { KYCBankForm } from "@/components/owner/kyc-bank-form";
import type { OwnerBankAccount } from "@/db/schema";
import {
  deleteBankAccountAction,
  DeleteBankAccountState,
  updateBankAccountAction,
  UpdateBankAccountState,
} from "@/actions/bank-accounts";

const KYC_STATUS_LABEL: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  none: { label: "Belum Verifikasi", variant: "outline" },
  pending: { label: "Menunggu Verifikasi", variant: "secondary" },
  verified: { label: "Terverifikasi", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
};

export default function BankAccountsPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<OwnerBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/owner/bank-accounts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat data");
      setAccounts(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const accountsFetchRef = useRef(false);

  useEffect(() => {
    if (!accountsFetchRef.current) {
      fetchAccounts();
      accountsFetchRef.current = true;
    }
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    const formData = new FormData();
    formData.append("id", id);

    const result: DeleteBankAccountState = await deleteBankAccountAction(
      undefined,
      formData,
    );

    if (result.success) {
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      setDeleteTargetId(null);
    } else {
      setError(result.error || "Gagal menghapus rekening");
    }
    setDeleteLoading(false);
  };

  const handleSetPrimary = async (id: string) => {
    setUpdateLoading(true);
    const formData = new FormData();
    formData.append("id", id);
    formData.append("is_primary", "true");

    const result: UpdateBankAccountState = await updateBankAccountAction(
      undefined,
      formData,
    );

    if (result.success) {
      setAccounts((prev) =>
        prev.map((acc) => ({
          ...acc,
          isPrimary: acc.id === id,
        })),
      );
    } else {
      setError(result.error || "Gagal mengubah rekening utama");
    }
    setUpdateLoading(false);
  };

  const kycStatus = (session?.user as SessionUserWithRole)?.kycStatus || "none";
  const kycInfo = KYC_STATUS_LABEL[kycStatus] || KYC_STATUS_LABEL.none;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Rekening Bank & E-Wallet
        </h1>
        <p className="mt-2 text-muted-foreground">
          Kelola rekening untuk menerima pembayaran dari tenant.
        </p>
      </div>

      <div className="mb-6">
        <Badge variant={kycInfo.variant}>KYC: {kycInfo.label}</Badge>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Rekening</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada rekening yang ditambahkan.
              </p>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{account.providerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.accountType === "bank" ? "Bank" : "E-Wallet"} •{" "}
                        {account.accountNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {account.accountName}
                      </p>
                      {account.isPrimary && (
                        <Badge variant="secondary" className="mt-1">
                          Utama
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!account.isPrimary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(account.id)}
                        >
                          Jadikan Utama
                        </Button>
                      )}
                      {!account.isPrimary && (
                        <Dialog
                          open={deleteTargetId === account.id}
                          onOpenChange={(open) =>
                            !open && setDeleteTargetId(null)
                          }
                        >
                          <DialogTrigger
                            render={
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteTargetId(account.id)}
                                disabled={account.isPrimary}
                              />
                            }
                          >
                            Hapus
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Hapus Rekening</DialogTitle>
                              <DialogDescription>
                                Apakah Anda yakin ingin menghapus rekening ini?
                                Aksi ini tidak dapat dibatalkan.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setDeleteTargetId(null)}
                                disabled={deleteLoading}
                              >
                                Batal
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(account.id)}
                                disabled={deleteLoading}
                              >
                                Hapus
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {showForm ? "Tambah Rekening Baru" : "Tambah Rekening"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showForm ? (
              <KYCBankForm
                userName={session?.user?.name || ""}
                onSuccess={() => {
                  setShowForm(false);
                  fetchAccounts();
                }}
              />
            ) : (
              <Button onClick={() => setShowForm(true)}>Tambah Rekening</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
