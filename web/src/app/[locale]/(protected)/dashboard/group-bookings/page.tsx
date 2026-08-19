"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { CalendarIcon, Users, Clock, CheckCircle2, XCircle } from "lucide-react";
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

export default function GroupBookingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<GroupBooking | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: "",
    unitId: "",
    startDate: "",
    endDate: "",
    maxMembers: 10,
    memberEmails: "",
    metadata: {},
  });

  const { data, isLoading } = useQuery({
    queryKey: ["group-bookings"],
    queryFn: async () => {
      const res = await apiClient.get("/group-bookings");
      return res.data.data as GroupBooking[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post("/group-bookings", {
        ...data,
        memberEmails: data.memberEmails.split(",").map((e) => e.trim()).filter(Boolean),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-bookings"] });
      setCreateDialogOpen(false);
      setFormData({
        propertyId: "",
        unitId: "",
        startDate: "",
        endDate: "",
        maxMembers: 10,
        memberEmails: "",
        metadata: {},
      });
      showToastSuccess("Group booking berhasil dibuat!");
    },
    onError: () => {
      showToastError("Gagal membuat group booking");
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ groupId, status }: { groupId: string; status: "accepted" | "rejected" }) => {
      const res = await apiClient.put(`/group-bookings/${groupId}/members/me`, { status });
      return res.data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["group-bookings"] });
      if (status === "accepted") {
        showToastSuccess("Undangan diterima! Silakan lanjutkan pembayaran di halaman bookings.");
        setTimeout(() => {
          router.push("/dashboard/bookings");
        }, 1500);
      } else {
        showToastSuccess("Undangan ditolak");
      }
    },
    onError: () => {
      showToastError("Gagal mengirim respon");
    },
  });

  const handleCreateGroup = () => {
    if (!formData.propertyId || !formData.unitId || !formData.startDate || !formData.endDate) {
      showToastError("Mohon lengkapi semua field yang required");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleRespond = (groupId: string, status: "accepted" | "rejected") => {
    respondMutation.mutate({ groupId, status });
  };

  const groupBookings = data || [];

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Group Booking</h1>
          <p className="text-muted-foreground">
            Kelola booking kelompok Anda
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Users className="mr-2 size-4" />
          Buat Group Booking
        </Button>
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
            Belum ada group booking. Buat group booking pertama Anda!
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
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          member.status === "accepted" || member.status === "paid" ? "default" :
                          member.status === "rejected" ? "destructive" : "secondary"
                        }>
                          {member.status}
                        </Badge>
                        {member.status === "invited" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleRespond(selectedGroup.id, "accepted")}
                            >
                              Terima
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRespond(selectedGroup.id, "rejected")}
                            >
                              Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Group Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property ID</Label>
              <Input
                id="propertyId"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                placeholder="UUID properti"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitId">Unit ID</Label>
              <Input
                id="unitId"
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                placeholder="UUID unit"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberEmails">Email Anggota (pisah dengan koma)</Label>
              <Textarea
                id="memberEmails"
                value={formData.memberEmails}
                onChange={(e) => setFormData({ ...formData, memberEmails: e.target.value })}
                placeholder="friend1@example.com, friend2@example.com"
                rows={3}
              />
            </div>
            <Button
              onClick={handleCreateGroup}
              disabled={createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? "Membuat..." : "Buat Group Booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
