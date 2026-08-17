"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Add01Icon } from "@hugeicons/core-free-icons";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import AddUnitDialog from "./add-unit-dialog";
import type { Unit } from "@/db/schema";
import { updateUnitAction, UpdateUnitState } from "@/actions/units";

interface UnitResponse {
  data: Unit[];
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

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  available: { label: "Available", variant: "default" },
  booked: { label: "Booked", variant: "secondary" },
  maintenance: { label: "Maintenance", variant: "destructive" },
};

export default function UnitsPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<UnitResponse>({
    queryKey: ["units", propertyId],
    queryFn: async () => {
      const res = await fetch(`/api/units?propertyId=${propertyId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat data unit.");
      return data;
    },
    staleTime: 30000,
    enabled: !!propertyId,
  });

  const handleStatusChange = async (unitId: string, status: string) => {
    const formData = new FormData();
    formData.append("id", unitId);
    formData.append("status", status);

    const result: UpdateUnitState = await updateUnitAction(undefined, formData);

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["units", propertyId] });
    } else {
      // Show error toast or set error state
      console.error("Failed to update unit:", result.error);
    }
  };

  const units = data?.data ?? [];

  return (
    <div className="container py-6">
      <div className="mb-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard Owner", href: "/owner/dashboard" },
            { label: "Properti Saya", href: "/owner/properties" },
            {
              label: "Detail Properti",
              href: `/owner/properties/${propertyId}`,
            },
            { label: "Unit" },
          ]}
        />
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Unit</h1>
          <p className="text-muted-foreground">
            Kelola kamar dan unit untuk properti ini
          </p>
        </div>
        <Dialog>
          <DialogTrigger
            render={
              <Button>
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                Tambah Unit
              </Button>
            }
          />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Unit Baru</DialogTitle>
            </DialogHeader>
            <AddUnitDialog propertyId={propertyId} />
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
            {error instanceof Error ? error.message : "Gagal memuat data unit."}
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
        ) : units.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Belum ada unit. Tambahkan unit pertama untuk properti ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Kapasitas</TableHead>
                  <TableHead>Ukuran (m2)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => {
                  const config = statusConfig[unit.status] ?? {
                    label: unit.status,
                    variant: "outline",
                  };

                  return (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatCurrency(unit.price)}
                      </TableCell>
                      <TableCell>{unit.capacity ?? "-"}</TableCell>
                      <TableCell>{unit.size ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={unit.status}
                          onValueChange={(value) =>
                            value && handleStatusChange(unit.id, value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Ubah status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="booked">Booked</SelectItem>
                            <SelectItem value="maintenance">
                              Maintenance
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button
          variant="outline"
          render={<Link href={`/owner/properties/${propertyId}`} />}
          nativeButton={false}
        >
          Kembali ke Detail Properti
        </Button>
      </div>
    </div>
  );
}
