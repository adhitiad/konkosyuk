"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import {
  Add01Icon,
  PencilIcon,
  Delete01Icon,
  MapPinIcon,
  Image01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import type { Property } from "@/db/schema";
import type { PropertyPackages } from "@/lib/types/property-packages";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { deletePropertyAction } from "@/actions/properties";

const formatCurrency = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const typeLabel: Record<string, string> = {
  kost: "Kost",
  kontrakan: "Kontrakan",
  ruko: "Ruko",
};

function PropertyCard({ property }: { property: Property }) {
  const packages = (property.packages ?? {}) as PropertyPackages;
  const availablePackages =
    packages.predefined?.filter((p) => p.isAvailable) ?? [];
  const customEnabled = packages.custom?.enabled ?? false;
  const totalPackages = availablePackages.length + (customEnabled ? 1 : 0);
  const minPrice =
    availablePackages.length > 0
      ? Math.min(...availablePackages.map((p) => p.finalPrice))
      : null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">
            {property.name}
          </CardTitle>
          <Badge
            variant={property.status === "nonaktif" ? "destructive" : "default"}
            className="shrink-0"
          >
            {property.status === "nonaktif" ? "Nonaktif" : "Aktif"}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
          <HugeiconsIcon
            icon={MapPinIcon}
            strokeWidth={2}
            className="size-3.5 shrink-0"
          />
          <span className="truncate">
            {property.city || property.address || "-"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {typeLabel[property.type] ?? property.type}
          </Badge>
          {totalPackages > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalPackages} paket
            </Badge>
          )}
          {property.images && property.images.length > 0 && (
            <Badge
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              <HugeiconsIcon
                icon={Image01Icon}
                strokeWidth={2}
                className="size-3"
              />
              {property.images.length}
            </Badge>
          )}
        </div>

        {minPrice !== null && (
          <p className="text-sm font-semibold text-primary">
            {formatCurrency(minPrice)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              / bulan
            </span>
          </p>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <HugeiconsIcon
            icon={Calendar03Icon}
            strokeWidth={2}
            className="size-3.5"
          />
          <span>
            {new Date(property.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            render={<Link href={`/owner/properties/${property.id}`} />}
            size="sm"
            variant="outline"
            className="flex-1"
            nativeButton={false}
          >
            <HugeiconsIcon
              icon={PencilIcon}
              strokeWidth={2}
              className="size-3"
            />
            Edit
          </Button>
          <DeletePropertyButton
            propertyId={property.id}
            propertyName={property.name}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DeletePropertyButton({
  propertyId,
  propertyName,
}: {
  propertyId: string;
  propertyName: string;
}) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const formData = new FormData();
    formData.append("propertyId", propertyId);
    const result = await deletePropertyAction(undefined, formData);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["owner-properties-v2"] });
      showToastSuccess("Properti berhasil dihapus");
    } else if (result.error) {
      showToastError(result.error);
    }
    setIsDeleting(false);
  };

  return (
    <Dialog>
      <DialogTrigger
        render={<Button size="sm" variant="destructive" className="flex-1" />}
      >
        <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3" />
        Hapus
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Hapus</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Apakah Anda yakin ingin menghapus properti &quot;{propertyName}&quot;?
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-2">
          <DialogTrigger render={<Button variant="outline" />}>
            Batal
          </DialogTrigger>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Menghapus..." : "Hapus"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PropertiesPage() {
  const { data: session } = useSession();

  interface ApiResponse<T> {
    success: boolean;
    data: {
      data: T;
      meta?: Record<string, unknown>;
    };
  }

  const { data, isLoading, isError, error } = useQuery<ApiResponse<Property[]>>(
    {
      queryKey: ["owner-properties-v2"],
      queryFn: async () => {
        const response = await fetch("/api/owner/properties");
        const body = await response.json();
        return body as ApiResponse<Property[]>;
      },
      staleTime: 30000,
      enabled: !!session?.user?.id,
    },
  );

  const properties = data?.data?.data ?? [];

  return (
    <div className="container py-4 md:py-6">
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Properti Saya</h1>
          <p className="text-muted-foreground text-sm">
            Kelola daftar properti kost dan kontrakan Anda
          </p>
        </div>
        <Button
          render={
            <Link href="/owner/properties/add">Tambah Properti Baru</Link>
          }
          nativeButton={false}
          className="w-full sm:w-auto"
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          Tambah Properti Baru
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-4 md:mb-6">
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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Belum ada properti. Tambahkan properti pertama Anda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Card Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:hidden">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {/* Tablet/Desktop: Table Layout */}
          <div className="hidden md:block rounded-xl border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => {
                    const city = property.city ?? "-";
                    const status = property.status;
                    const packages = (property.packages ??
                      {}) as PropertyPackages;
                    const availablePackages =
                      packages.predefined?.filter((p) => p.isAvailable) ?? [];
                    const customEnabled = packages.custom?.enabled ?? false;
                    const totalPackages =
                      availablePackages.length + (customEnabled ? 1 : 0);

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
                                Mulai dari{" "}
                                {formatCurrency(
                                  Math.min(
                                    ...availablePackages.map(
                                      (p) => p.finalPrice,
                                    ),
                                  ),
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Belum ada paket
                            </span>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              render={
                                <Link
                                  href={`/owner/properties/${property.id}`}
                                />
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
                            <DeletePropertyButton
                              propertyId={property.id}
                              propertyName={property.name}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
