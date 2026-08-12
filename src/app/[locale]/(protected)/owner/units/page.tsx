"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/axios";
import { withOwnerAuth } from "@/lib/with-owner-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Plus, Home, Users } from "lucide-react";

interface Unit {
  id: string;
  name: string;
  propertyId: string;
  propertyName: string | null;
  description: string | null;
  price: string;
  capacity: string | null;
  size: string | null;
  status: "available" | "booked" | "maintenance";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function OwnerUnitsPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");

  const { data, isLoading, isError } = useQuery<Unit[]>({
    queryKey: ["owner-units", propertyId],
    queryFn: async () => {
      const url = propertyId
        ? `/api/owner/units?propertyId=${propertyId}`
        : `/api/owner/units`;
      const response = await apiClient.get(url);
      const body = response.data as { data?: { data?: Unit[] } };
      const items = Array.isArray(body?.data?.data)
        ? body.data.data
        : Array.isArray(body?.data)
          ? (body.data as Unit[])
          : [];
      return items;
    },
  });

  const units = data ?? [];

  const getStatusBadge = (status: string) => {
    const variants = {
      available: "default",
      booked: "secondary",
      maintenance: "destructive",
    } as const;
    const labels = {
      available: "Tersedia",
      booked: "Terisi",
      maintenance: "Maintenance",
    } as const;
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatPrice = (price: number | string | null | undefined) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(price ?? 0));
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BreadcrumbNav
            items={[
              { label: "Dashboard", href: "/owner" },
              { label: "Kelola Unit" },
            ]}
          />
          <h1 className="text-3xl font-bold tracking-tight mt-2">
            {propertyId ? "Unit Properti" : "Semua Unit"}
          </h1>
          <p className="text-muted-foreground">
            {propertyId
              ? "Daftar kamar/unit dalam properti ini"
              : "Kelola semua unit dari seluruh properti Anda"}
          </p>
        </div>
        <Button render={<Link href="/owner/units/add">Tambah Unit</Link>} nativeButton={false}>
          <Plus className="mr-2 h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Gagal memuat data unit.</p>
          </CardContent>
        </Card>
      ) : units.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada unit</h3>
            <p className="text-muted-foreground mb-4">
              Mulai tambahkan kamar/unit untuk properti Anda
            </p>
            <Button render={<Link href="/owner/units/add">Tambah Unit Pertama</Link>} nativeButton={false}>
              <Plus className="mr-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <Card key={unit.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{unit.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {unit.propertyName ?? "-"}
                    </p>
                  </div>
                  {getStatusBadge(unit.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {unit.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {unit.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  {unit.capacity && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{unit.capacity} orang</span>
                    </div>
                  )}
                  {unit.size && (
                    <span className="text-muted-foreground">
                      {unit.size} m²
                    </span>
                  )}
                </div>

                <div className="text-2xl font-bold text-primary">
                  {formatPrice(unit.price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /bulan
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    render={
                      <Link href={`/owner/properties/${unit.propertyId}`}>
                        Detail
                      </Link>
                    }
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    nativeButton={false}
                  >
                    Detail
                  </Button>
                  <Button
                    render={
                      <Link href={`/owner/units/${unit.id}/edit`}>
                        Edit
                      </Link>
                    }
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    nativeButton={false}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default withOwnerAuth(OwnerUnitsPage);
