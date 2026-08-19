"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/currency";
import { apiClient } from "@/lib/axios";
import { InspectionForm } from "@/components/inspection/inspection-form";
import { InspectionComparison } from "@/components/inspection/inspection-comparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InspectionItem {
  id: string;
  category: string;
  itemName: string;
  condition: string | null;
  notes: string | null;
  repairCost: string | null;
  photoUrls: string[];
  isNewDamage: boolean;
}

interface InspectionDetail extends Inspection {
  items: InspectionItem[];
  propertyName?: string;
  unitName?: string;
  tenantName?: string;
}

interface Inspection {
  id: string;
  bookingId: string;
  propertyId: string;
  unitId: string;
  type: "move_in" | "move_out" | "mid_stay";
  status: string;
  performedBy: string;
  witnessId: string | null;
  overallCondition: string | null;
  notes: string | null;
  damageScore: string | null;
  estimatedRepairCost: string | null;
  securityDeposit: string | null;
  refundAmount: string | null;
  isDisputed: boolean;
  disputeReason: string | null;
  disputeStatus: string | null;
  completedAt: string | null;
  createdAt: string;
}

const TYPE_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  move_in: { label: "Move-in", variant: "default" },
  move_out: { label: "Move-out", variant: "secondary" },
  mid_stay: { label: "Mid-stay", variant: "outline" },
};

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Menunggu", variant: "secondary" },
  in_progress: { label: "Sedang Dikerjakan", variant: "default" },
  completed: { label: "Selesai", variant: "default" },
  disputed: { label: "Dispute", variant: "destructive" },
};

const PROPERTY_TYPES = [
  { value: "kost", label: "Kost" },
  { value: "kontrakan", label: "Kontrakan" },
  { value: "ruko", label: "Ruko" },
];

export default function OwnerInspectionsPage() {
  const [selectedInspection, setSelectedInspection] = useState<InspectionDetail | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>("kost");
  const [activeTab, setActiveTab] = useState("details");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["owner-inspections"],
    queryFn: async () => {
      const res = await apiClient.get("/inspections?page=1&limit=20&type=move_out");
      return res.data;
    },
  });

  const inspections = data?.data || [];

  const detailQuery = useQuery({
    queryKey: ["inspection-detail", selectedInspection?.id],
    queryFn: async () => {
      if (!selectedInspection?.id) return null;
      const res = await apiClient.get(`/inspections/${selectedInspection.id}`);
      return res.data.data as InspectionDetail;
    },
    enabled: !!selectedInspection?.id,
  });

  const compareQuery = useQuery({
    queryKey: ["inspection-compare", selectedInspection?.bookingId],
    queryFn: async () => {
      if (!selectedInspection?.bookingId) return null;
      const res = await apiClient.get(`/inspections/compare?bookingId=${selectedInspection.bookingId}`);
      return res.data.data;
    },
    enabled: !!selectedInspection?.bookingId && activeTab === "comparison",
  });

  const createMutation = useMutation({
    mutationFn: async (propertyType: string) => {
      const res = await apiClient.post("/inspections", {
        propertyId: selectedInspection?.propertyId || "",
        unitId: selectedInspection?.unitId || "",
        bookingId: selectedInspection?.bookingId || "",
        type: "move_out",
        performedBy: selectedInspection?.performedBy || "",
        witnessId: selectedInspection?.witnessId || null,
        propertyType,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-inspections"] });
      setCreateDialogOpen(false);
    },
  });

  const handleCreateInspection = () => {
    if (!selectedPropertyType) return;
    createMutation.mutate(selectedPropertyType);
  };

  const handleItemAdded = () => {
    detailQuery.refetch();
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspeksi Move-out</h1>
          <p className="text-muted-foreground">
            Kelola inspeksi move-out untuk properti Anda
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          Buat Inspeksi Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Inspeksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">
              Gagal memuat data inspeksi
            </div>
          ) : inspections.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Belum ada inspeksi move-out. Inspeksi akan dibuat otomatis saat tenant check-out.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead>Damage Score</TableHead>
                  <TableHead>Estimasi Biaya</TableHead>
                  <TableHead>Dispute</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((inspection: Inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell>
                      <Badge variant={TYPE_LABEL[inspection.type]?.variant || "outline"}>
                        {TYPE_LABEL[inspection.type]?.label || inspection.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_LABEL[inspection.status]?.variant || "secondary"}>
                        {STATUS_LABEL[inspection.status]?.label || inspection.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {inspection.overallCondition || "-"}
                    </TableCell>
                    <TableCell>
                      {inspection.damageScore ? `${Number(inspection.damageScore).toFixed(1)}%` : "-"}
                    </TableCell>
                    <TableCell>
                      {inspection.estimatedRepairCost
                        ? formatCurrency(Number(inspection.estimatedRepairCost))
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {inspection.isDisputed ? (
                        <Badge variant="destructive">Ya</Badge>
                      ) : (
                        <Badge variant="outline">Tidak</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedInspection(inspection as InspectionDetail)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedInspection} onOpenChange={(open) => !open && setSelectedInspection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Inspeksi</DialogTitle>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-4">
              {detailQuery.data && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Detail</TabsTrigger>
                    <TabsTrigger value="items">Item Inspeksi</TabsTrigger>
                    <TabsTrigger value="comparison">Perbandingan</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tipe</p>
                        <Badge variant={TYPE_LABEL[selectedInspection.type]?.variant || "outline"}>
                          {TYPE_LABEL[selectedInspection.type]?.label || selectedInspection.type}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={STATUS_LABEL[selectedInspection.status]?.variant || "secondary"}>
                          {STATUS_LABEL[selectedInspection.status]?.label || selectedInspection.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Kondisi Overall</p>
                        <p className="capitalize">{selectedInspection.overallCondition || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Damage Score</p>
                        <p>{selectedInspection.damageScore ? `${Number(selectedInspection.damageScore).toFixed(1)}%` : "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estimasi Biaya Perbaikan</p>
                        <p>{selectedInspection.estimatedRepairCost ? formatCurrency(Number(selectedInspection.estimatedRepairCost)) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Security Deposit</p>
                        <p>{selectedInspection.securityDeposit ? formatCurrency(Number(selectedInspection.securityDeposit)) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Refund Amount</p>
                        <p>{selectedInspection.refundAmount ? formatCurrency(Number(selectedInspection.refundAmount)) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dispute</p>
                        <p>{selectedInspection.isDisputed ? "Ya" : "Tidak"}</p>
                      </div>
                    </div>
                    {selectedInspection.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Catatan</p>
                        <p className="text-sm">{selectedInspection.notes}</p>
                      </div>
                    )}
                    {selectedInspection.disputeReason && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Alasan Dispute</p>
                        <p className="text-sm text-destructive">{selectedInspection.disputeReason}</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="items" className="space-y-4">
                    {selectedInspection.status !== "completed" && (
                      <InspectionForm
                        inspectionId={selectedInspection.id}
                        items={detailQuery.data.items || []}
                        onItemAdded={handleItemAdded}
                      />
                    )}
                    <div className="space-y-2">
                      <h3 className="font-medium">Item Inspeksi ({detailQuery.data.items?.length || 0})</h3>
                      {detailQuery.data.items?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada item inspeksi</p>
                      ) : (
                        <div className="space-y-2">
                          {detailQuery.data.items.map((item) => (
                            <div key={item.id} className="p-3 rounded-lg border">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{item.itemName}</p>
                                <Badge variant="outline">{item.category}</Badge>
                                {item.isNewDamage && <Badge variant="destructive">Baru</Badge>}
                              </div>
                              {item.condition && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  Kondisi: {item.condition}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-sm text-muted-foreground mb-1">{item.notes}</p>
                              )}
                              {item.repairCost && Number(item.repairCost) > 0 && (
                                <p className="text-sm font-medium text-destructive">
                                  Biaya: {formatCurrency(Number(item.repairCost))}
                                </p>
                              )}
                              {item.photoUrls.length > 0 && (
                                <div className="flex gap-2 mt-2 overflow-x-auto">
                                  {item.photoUrls.map((url, idx) => (
                                    <Image
                                      key={idx}
                                      src={url}
                                      alt={`${item.itemName} - ${idx + 1}`}
                                      width={64}
                                      height={64}
                                      className="object-cover rounded-md border"
                                      unoptimized
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="comparison" className="space-y-4">
                    {compareQuery.data ? (
                      <InspectionComparison
                        comparison={compareQuery.data.comparison}
                        summary={compareQuery.data.summary}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Tidak ada data perbandingan tersedia
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              )}
              {detailQuery.isLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Inspeksi Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipe Properti</Label>
              <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreateInspection}
              disabled={createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? "Membuat..." : "Buat Inspeksi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="text-sm font-medium" {...props}>{children}</label>;
}
