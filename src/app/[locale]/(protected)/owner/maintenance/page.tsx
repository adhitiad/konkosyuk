"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useState, useActionState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { EyeIcon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Wrench } from "lucide-react";
import type { MaintenanceTicket } from "@/db/schema";
import { updateMaintenanceTicketAction } from "@/actions/maintenance";

interface MaintenanceTicketWithNames extends MaintenanceTicket {
  unitName: string | null;
  propertyName: string | null;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  reported: { label: "Dilaporkan", variant: "secondary" },
  in_progress: { label: "Ditangani", variant: "default" },
  resolved: { label: "Selesai", variant: "default" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
};

const priorityConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  low: { label: "Rendah", variant: "outline" },
  medium: { label: "Sedang", variant: "secondary" },
  high: { label: "Tinggi", variant: "default" },
  urgent: { label: "Urgent", variant: "destructive" },
};

export default function OwnerMaintenancePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicketWithNames | null>(null);
  const [ownerNotes, setOwnerNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [state, formAction, isPending] = useActionState(
    updateMaintenanceTicketAction,
    undefined,
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["maintenance-tickets", statusFilter],
    queryFn: async () => {
      const response = await fetch(
        `/api/maintenance?${statusFilter === "all" ? "" : `status=${statusFilter}`}`,
      );
      const body = await response.json();
      const items = Array.isArray(body?.data?.data)
        ? body.data.data
        : Array.isArray(body?.data)
          ? (body.data as MaintenanceTicketWithNames[])
          : [];
      return { data: items, meta: { total: items.length } };
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (state?.success) {
      queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] });
    } else if (state?.error) {
      alert(state.error);
    }
  }, [state, queryClient]);

  const tickets = data?.data ?? [];

  const handleOpenTicket = (ticket: MaintenanceTicketWithNames) => {
    setSelectedTicket(ticket);
    setOwnerNotes(ticket.ownerNotes ?? "");
    setNewStatus(ticket.status);
  };

  const handleSave = () => {
    if (!selectedTicket) return;
    const formData = new FormData();
    formData.append("id", selectedTicket.id);
    formData.append("status", newStatus);
    formData.append("ownerNotes", ownerNotes.trim() || "");
    formAction(formData);
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
        <p className="text-muted-foreground">
          Kelola tiket kerusakan dari tenant
        </p>
      </div>

      {isError && (
        <ErrorState
          title="Gagal Memuat Tiket"
          description={
            error instanceof Error ? error.message : "Gagal memuat data tiket."
          }
          onRetry={() => refetch()}
          className="mb-6"
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Tiket</CardTitle>
            <Select<string>
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v ?? "all")}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="reported">Dilaporkan</SelectItem>
                <SelectItem value="in_progress">Ditangani</SelectItem>
                <SelectItem value="resolved">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="Semua Aman!"
              description="Tidak ada laporan kerusakan yang perlu ditindaklanjuti saat ini."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Properti</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket: MaintenanceTicketWithNames) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        {ticket.title}
                      </TableCell>
                      <TableCell>
                        {ticket.unitName ?? ticket.unitId.slice(0, 8)}
                      </TableCell>
                      <TableCell>{ticket.propertyName ?? "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            priorityConfig[ticket.priority]?.variant ??
                            "outline"
                          }
                        >
                          {priorityConfig[ticket.priority]?.label ??
                            ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusConfig[ticket.status]?.variant ?? "outline"
                          }
                        >
                          {statusConfig[ticket.status]?.label ?? ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenTicket(ticket)}
                        >
                          <HugeiconsIcon
                            icon={EyeIcon}
                            strokeWidth={2}
                            className="size-4"
                          />
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

      <Dialog
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kelola Tiket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Judul</p>
                  <p className="text-sm font-medium">{selectedTicket.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prioritas</p>
                  <Badge
                    variant={
                      priorityConfig[selectedTicket.priority]?.variant ??
                      "outline"
                    }
                  >
                    {priorityConfig[selectedTicket.priority]?.label ??
                      selectedTicket.priority}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Deskripsi</p>
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>
                {selectedTicket.images && selectedTicket.images.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-2">Gambar</p>
                    <div className="flex flex-wrap gap-2">
                      // eslint-disable-next-line @next/next/no-img-element
                      {selectedTicket.images.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Attachment ${idx + 1}`}
                          className="h-20 w-20 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select<string>
                  value={newStatus}
                  onValueChange={(v) => v && setNewStatus(v)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reported">Dilaporkan</SelectItem>
                    <SelectItem value="in_progress">Ditangani</SelectItem>
                    <SelectItem value="resolved">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerNotes">Catatan Owner</Label>
                <Textarea
                  id="ownerNotes"
                  value={ownerNotes}
                  onChange={(e) => setOwnerNotes(e.target.value)}
                  placeholder="Tambahkan catatan untuk tenant..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSave}
                className="w-full"
                disabled={isPending}
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
