"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import {
  Add01Icon,
  PencilIcon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import AddPropertyDialog from "./add-property-dialog";
import type { Property } from "@/db/schema";
import type { PropertyPackages } from "@/lib/types/property-packages";
import { apiClient } from "@/lib/axios";

interface PropertyResponse {
  data: Property[];
  meta: {
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

const typeLabel: Record<string, string> = {
  kost: "Kost",
  kontrakan: "Kontrakan",
};

export default function PropertiesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<PropertyResponse>({
    queryKey: ["owner-properties-v2"],
    queryFn: async () => {
      const response = await apiClient.get('/api/properties', {
        params: { ownerId: session?.user?.id },
      })
      const body = response.data as any
      const items = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.data?.data)
          ? body.data.data
          : []
      return { data: items, meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }
    },
    staleTime: 30000,
    enabled: !!session?.user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/api/properties/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-properties-v2"] });
    },
  });

  const rawProperties = Array.isArray(data?.data) ? data.data : (data as any)?.data?.data
  const properties = Array.isArray(rawProperties) ? rawProperties : []

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Properti Saya</h1>
          <p className="text-muted-foreground">
            Kelola daftar properti kost dan kontrakan Anda
          </p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button />}>
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              className="size-4"
            />
            Tambah Properti Baru
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Properti Baru</DialogTitle>
            </DialogHeader>
            <AddPropertyDialog />
          </DialogContent>
        </Dialog>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Gagal memuat data properti."}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Belum ada properti. Tambahkan properti pertama Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kota</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {properties.map((property) => {
                const city = property.city ?? "-";
                const status = property.status;
                const packages = (property.packages ?? {}) as PropertyPackages;
                const availablePackages = packages.predefined?.filter((p) => p.isAvailable) ?? [];
                const customEnabled = packages.custom?.enabled ?? false;
                const totalPackages = availablePackages.length + (customEnabled ? 1 : 0);

                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      {property.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabel[property.type] ?? property.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{city}</TableCell>
                    <TableCell>
                      {totalPackages > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">
                            {totalPackages} paket aktif
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Mulai dari {formatCurrency(Math.min(...availablePackages.map(p => p.finalPrice)))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Belum ada paket</span>
                      )}
                    </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            status === "nonaktif" ? "destructive" : "default"
                          }
                        >
                          {status === "nonaktif" ? "Nonaktif" : "Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            render={
                              <Link href={`/owner/properties/${property.id}`} />
                            }
                            size="sm"
                            variant="outline"
                            nativeButton={false}
                          >
                            <HugeiconsIcon
                              icon={PencilIcon}
                              strokeWidth={2}
                              className="size-3"
                            />
                            Edit
                          </Button>
                          <Dialog>
                            <DialogTrigger
                              render={
                                <Button size="sm" variant="destructive" />
                              }
                            >
                              <HugeiconsIcon
                                icon={Delete01Icon}
                                strokeWidth={2}
                                className="size-3"
                              />
                              Hapus
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Konfirmasi Hapus</DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">
                                Apakah Anda yakin ingin menghapus properti
                                &quot;{property.name}&quot;? Tindakan ini tidak
                                dapat dibatalkan.
                              </p>
                              <div className="flex justify-end gap-2">
                                <DialogTrigger
                                  render={<Button variant="outline" />}
                                >
                                  Batal
                                </DialogTrigger>
                                <Button
                                  variant="destructive"
                                  disabled={deleteMutation.isPending}
                                  onClick={() =>
                                    deleteMutation.mutate(property.id)
                                  }
                                >
                                  {deleteMutation.isPending
                                    ? "Menghapus..."
                                    : "Hapus"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
