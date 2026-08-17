"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import type { SessionUserWithRole } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Eye } from "lucide-react";
import { apiClient } from "@/lib/axios";
import { withAdminAuth } from "@/lib/with-admin-auth";

type Booking = {
  id: string;
  code: string;
  customerName: string;
  propertyTitle: string;
  unitName: string;
  startDate: string;
  status: string;
  totalPrice: string;
};

export default withAdminAuth(AdminBookingsPage);

function AdminBookingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const res = await apiClient.get("/api/bookings");
      const payload = res.data as { data?: unknown[] };
      const items = (payload.data ?? []) as Record<string, unknown>[];
      return items.map((b) => ({
        id: b.id as string,
        code: String(b.id).slice(0, 8),
        customerName: (b.userName as string) || (b.userEmail as string) || "-",
        propertyTitle: (b.propertyName as string) || "-",
        unitName: (b.unitName as string) || "-",
        startDate: b.startDate as string,
        status: b.status as string,
        totalPrice: (b.metadata as Record<string, unknown> | undefined)
          ?.totalPrice
          ? String((b.metadata as Record<string, unknown>).totalPrice)
          : "0",
      }));
    },
    staleTime: 30000,
    enabled: !!session,
  });

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      pending_dp: { label: "Pending DP", variant: "secondary" },
      awaiting_owner_approval: { label: "Menunggu Owner", variant: "outline" },
      awaiting_full_payment: {
        label: "Menunggu Pembayaran",
        variant: "secondary",
      },
      confirmed: { label: "Dikonfirmasi", variant: "default" },
      rejected: { label: "Ditolak", variant: "destructive" },
      cancelled: { label: "Dibatalkan", variant: "destructive" },
    };
    const { label, variant } = config[status] || {
      label: status.replace(/_/g, " ").toUpperCase(),
      variant: "outline" as const,
    };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (
    !session ||
    !["admin", "staff"].includes((session.user as SessionUserWithRole).role)
  ) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Manajemen Booking" },
          ]}
        />
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Manajemen Booking
        </h1>
        <p className="text-muted-foreground">
          Lihat semua booking dalam sistem
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Booking</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada booking
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Kode</TableHead>
                    <TableHead scope="col">Customer</TableHead>
                    <TableHead scope="col">Properti</TableHead>
                    <TableHead scope="col">Tanggal Mulai</TableHead>
                    <TableHead scope="col">Total</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col" className="text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        {booking.code}
                      </TableCell>
                      <TableCell>{booking.customerName}</TableCell>
                      <TableCell>
                        {booking.propertyTitle} - {booking.unitName}
                      </TableCell>
                      <TableCell>
                        {new Date(booking.startDate).toLocaleDateString(
                          "id-ID",
                        )}
                      </TableCell>
                      <TableCell>
                        Rp{" "}
                        {parseInt(booking.totalPrice).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/bookings/${booking.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
