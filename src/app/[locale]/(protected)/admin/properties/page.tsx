"use client";

import { useState, useActionState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ModalVerifGps } from "@/components/ModalVerifGps";
import { Pagination } from "@/components/ui/pagination";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Edit01Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "@/components/ui/toast";
import {
  updatePropertyAction,
  deletePropertyAction,
} from "@/actions/properties";
import { withAdminAuth } from "@/lib/with-admin-auth";

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  city: string | null;
  basePrice: string | null;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  gpsVerified: boolean;
  ownerId: string;
  createdAt: string;
}

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
  ruko: "Ruko",
};

export default withAdminAuth(AdminPropertiesPage);

function AdminPropertiesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [gpsVerifyProperty, setGpsVerifyProperty] = useState<Property | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editBasePrice, setEditBasePrice] = useState("");
  const [editIsActive, setEditIsActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [updateState, updateAction, isUpdatePending] = useActionState(
    updatePropertyAction,
    undefined,
  );
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deletePropertyAction,
    undefined,
  );

  const limit = 10;

  const { data, isLoading, isError, error } = useQuery<PropertyResponse>({
    queryKey: ["admin-properties", page, search, cityFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (cityFilter) params.set("city", cityFilter);
      if (typeFilter) params.set("type", typeFilter);

      const response = await fetch(`/api/properties?${params.toString()}`);
      const json = await response.json();
      return { data: json.data?.data, meta: json.data?.meta };
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (updateState?.success) {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "Properti diperbarui",
        description: "Data properti telah berhasil diperbarui.",
        type: "success",
      });
      setSelectedProperty(null);
    } else if (updateState?.error) {
      toast({
        title: "Gagal",
        description: updateState.error,
        type: "error",
      });
    }
  }, [updateState, queryClient]);

  useEffect(() => {
    if (deleteState?.success) {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "Properti dihapus",
        description: "Properti telah berhasil dihapus.",
        type: "success",
      });
      setDeleteTarget(null);
    } else if (deleteState?.error) {
      toast({
        title: "Gagal",
        description: deleteState.error,
        type: "error",
      });
    }
  }, [deleteState, queryClient]);

  const properties: Property[] = Array.isArray(data?.data) ? data.data : [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  const openEdit = (property: Property) => {
    setSelectedProperty(property);
    setEditName(property.name);
    setEditBasePrice(property.basePrice ?? "");
    setEditIsActive(property.isActive);
  };

  const handleSaveEdit = () => {
    if (!selectedProperty) return;
    const formData = new FormData();
    formData.append("propertyId", selectedProperty.id);
    if (editName !== selectedProperty.name) {
      formData.append("name", editName);
    }
    if (editBasePrice !== selectedProperty.basePrice) {
      formData.append("basePrice", editBasePrice);
    }
    if (editIsActive !== selectedProperty.isActive) {
      formData.append("isActive", editIsActive.toString());
    }
    updateAction(formData);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const formData = new FormData();
    formData.append("propertyId", deleteTarget.id);
    deleteAction(formData);
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Manajemen Properti" },
          ]}
        />
        <h1 className="text-2xl font-bold tracking-tight">
          Manajemen Properti
        </h1>
        <p className="text-muted-foreground">Kelola semua properti di sistem</p>
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

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Cari properti..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <Input
          placeholder="Kota"
          value={cityFilter}
          onChange={(e) => {
            setCityFilter(e.target.value);
            setPage(1);
          }}
          className="w-40"
        />
        <Select<string>
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v ?? "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Tipe</SelectItem>
            <SelectItem value="kost">Kost</SelectItem>
            <SelectItem value="kontrakan">Kontrakan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Tidak ada properti untuk filter ini.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Nama</TableHead>
                    <TableHead scope="col">Tipe</TableHead>
                    <TableHead scope="col">Kota</TableHead>
                    <TableHead scope="col">Harga Dasar</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col">Aktif</TableHead>
                    <TableHead scope="col">Featured</TableHead>
                    <TableHead scope="col">Status GPS</TableHead>
                    <TableHead scope="col">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">
                        {property.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeLabel[property.type] ?? property.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{property.city ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {property.basePrice
                          ? formatCurrency(property.basePrice)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            property.status === "nonaktif"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {property.status === "nonaktif"
                            ? "Nonaktif"
                            : "Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={property.isActive ? "default" : "secondary"}
                        >
                          {property.isActive ? "Disetujui" : "Menunggu"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {property.isFeatured ? (
                          <Badge
                            variant="default"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Featured
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            property.gpsVerified ? "default" : "secondary"
                          }
                        >
                          {property.gpsVerified ? "Terverifikasi" : "Belum"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {property.gpsVerified ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isUpdatePending}
                              onClick={() => {
                                const formData = new FormData();
                                formData.append("propertyId", property.id);
                                formData.append("gpsVerified", "false");
                                updateAction(formData);
                              }}
                            >
                              {isUpdatePending
                                ? "Membatalkan..."
                                : "Batal Verifikasi"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isUpdatePending}
                              onClick={() => setGpsVerifyProperty(property)}
                            >
                              {isUpdatePending
                                ? "Memverifikasi..."
                                : "Verifikasi GPS"}
                            </Button>
                          )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(property)}
                  >
                    <HugeiconsIcon
                      icon={Edit01Icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </Button>
                  <Dialog>
                    <DialogTrigger
                      render={
                        <Button size="sm" variant="destructive">
                          <HugeiconsIcon
                            icon={Delete01Icon}
                            strokeWidth={2}
                            className="size-4"
                          />
                        </Button>
                      }
                    />
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
                          render={
                            <Button variant="outline">Batal</Button>
                          }
                        />
                        <Button
                          variant="destructive"
                          disabled={isDeletePending}
                          onClick={handleDelete}
                        >
                          {isDeletePending ? "Menghapus..." : "Hapus"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <Dialog
        open={!!selectedProperty}
        onOpenChange={(open) => !open && setSelectedProperty(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Properti</DialogTitle>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Properti</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga Dasar</label>
                <Input
                  value={editBasePrice}
                  onChange={(e) => setEditBasePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Aktif</label>
                <Select<string>
                  value={editIsActive ? "true" : "false"}
                  onValueChange={(v) => setEditIsActive(v === "true")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Disetujui</SelectItem>
                    <SelectItem value="false">Menunggu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProperty(null)}
                >
                  Batal
                </Button>
                <Button
                  disabled={isUpdatePending}
                  onClick={handleSaveEdit}
                >
                  {isUpdatePending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Properti</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Apakah kamu yakin ingin menghapus properti &quot;
                {deleteTarget.name}&quot;? Aksi ini tidak bisa dibatalkan.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  disabled={isDeletePending}
                  onClick={handleDelete}
                >
                  {isDeletePending ? "Menghapus..." : "Hapus"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ModalVerifGps
        open={!!gpsVerifyProperty}
        onOpenChange={(open) => !open && setGpsVerifyProperty(null)}
        propertyId={gpsVerifyProperty?.id ?? ""}
        propertyName={gpsVerifyProperty?.name ?? ""}
        propertyCity={gpsVerifyProperty?.city ?? null}
        onConfirm={(id) => {
          const formData = new FormData();
          formData.append("propertyId", id);
          formData.append("gpsVerified", "true");
          updateAction(formData);
          setGpsVerifyProperty(null);
        }}
        isPending={isUpdatePending}
      />
    </div>
  );
}
