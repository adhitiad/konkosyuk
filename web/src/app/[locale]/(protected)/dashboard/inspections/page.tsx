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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import { ClipboardCheckIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/currency";
import { apiClient } from "@/lib/axios";
import { InspectionForm } from "@/components/inspection/inspection-form";
import { InspectionComparison } from "@/components/inspection/inspection-comparison";

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

export default function TenantInspectionsPage() {
  const [selectedInspection, setSelectedInspection] = useState<InspectionDetail | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tenant-inspections"],
    queryFn: async () => {
      const res = await apiClient.get("/inspections");
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

  const handleItemAdded = () => {
    detailQuery.refetch();
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inspeksi Saya</h1>
        <p className="text-muted-foreground">
          Lihat riwayat inspeksi move-in dan move-out Anda
        </p>
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
              Belum ada inspeksi untuk booking Anda
            </div>
          ) : (
            <div className="space-y-3">
              {inspections.map((inspection: Inspection) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => setSelectedInspection(inspection as InspectionDetail)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <HugeiconsIcon icon={ClipboardCheckIcon} strokeWidth={2} className="size-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {TYPE_LABEL[inspection.type]?.label || inspection.type}
                        </p>
                        <Badge variant={TYPE_LABEL[inspection.type]?.variant || "outline"}>
                          {inspection.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Booking: {inspection.bookingId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={inspection.isDisputed ? "destructive" : "secondary"}>
                      {inspection.isDisputed ? "Dispute" : STATUS_LABEL[inspection.status]?.label || inspection.status}
                    </Badge>
                    {inspection.damageScore && Number(inspection.damageScore) > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        Damage: {Number(inspection.damageScore).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                        <p className="capitalize">{selectedInspection.status}</p>
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
                        <p className="text-sm text-muted-foreground">Estimasi Biaya</p>
                        <p>{selectedInspection.estimatedRepairCost ? formatCurrency(Number(selectedInspection.estimatedRepairCost)) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Refund</p>
                        <p>{selectedInspection.refundAmount ? formatCurrency(Number(selectedInspection.refundAmount)) : "-"}</p>
                      </div>
                    </div>
                    {selectedInspection.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Catatan</p>
                        <p className="text-sm">{selectedInspection.notes}</p>
                      </div>
                    )}
                    {selectedInspection.isDisputed && selectedInspection.disputeReason && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm font-medium text-destructive mb-1">Alasan Dispute</p>
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
    </div>
  );
}
