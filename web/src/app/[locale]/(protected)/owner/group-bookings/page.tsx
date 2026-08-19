"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarIcon, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { apiClient } from "@/lib/axios";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface GroupBooking {
  id: string;
  leadUserId: string;
  propertyId: string;
  unitId: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  totalAmount: string;
  depositAmount: string;
  startDate: string;
  endDate: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  members?: Array<{
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    sharePercentage: string;
    shareAmount: string;
    paidAmount: string;
    status: "invited" | "accepted" | "rejected" | "paid";
  }>;
}

const STATUS_CONFIG = {
  pending: { label: "Menunggu", variant: "secondary" as const, icon: Clock },
  confirmed: { label: "Dikonfirmasi", variant: "default" as const, icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan", variant: "destructive" as const, icon: XCircle },
  completed: { label: "Selesai", variant: "default" as const, icon: CheckCircle2 },
};

export default function OwnerGroupBookingsPage() {
  const [selectedGroup, setSelectedGroup] = useState<GroupBooking | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["owner-group-bookings"],
    queryFn: async () => {
      const res = await apiClient.get("/group-bookings");
      return res.data.data as GroupBooking[];
    },
  });

  const groupBookings = data || [];

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Group Booking</h1>
        <p className="text-muted-foreground">
          Kelola booking kelompok untuk properti Anda
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groupBookings.map((group) => {
          const statusConfig = STATUS_CONFIG[group.status];
          const StatusIcon = statusConfig.icon;

          return (
            <Card
              key={group.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedGroup(group)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Group Booking #{group.id.slice(0, 8)}
                  </CardTitle>
                  <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                    <StatusIcon className="size-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="size-4" />
                  {format(new Date(group.startDate), "dd MMM yyyy", { locale: idLocale })} - {format(new Date(group.endDate), "dd MMM yyyy", { locale: idLocale })}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  {group.members?.length || 0} anggota
                </div>
                <div className="text-sm font-medium">
                  Total: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(group.totalAmount))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {groupBookings.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada group booking untuk properti Anda
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Group Booking</DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={STATUS_CONFIG[selectedGroup.status]?.variant || "secondary"}>
                    {STATUS_CONFIG[selectedGroup.status]?.label || selectedGroup.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(selectedGroup.totalAmount))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p>{format(new Date(selectedGroup.startDate), "dd MMMM yyyy", { locale: idLocale })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p>{format(new Date(selectedGroup.endDate), "dd MMMM yyyy", { locale: idLocale })}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Anggota ({selectedGroup.members?.length || 0})</p>
                <div className="space-y-2">
                  {selectedGroup.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{member.userName || member.userEmail}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.sharePercentage}% · {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(member.shareAmount))}
                        </p>
                      </div>
                      <Badge variant={
                        member.status === "accepted" || member.status === "paid" ? "default" :
                        member.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {member.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
