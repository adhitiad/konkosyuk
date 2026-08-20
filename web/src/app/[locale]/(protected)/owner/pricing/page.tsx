"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TrendingUpDownIcon,
  Tag01Icon,
  AddCircleIcon,
  Edit01Icon,
  Delete01Icon,
  LightbulbOffIcon,
} from "@hugeicons/core-free-icons";
import { formatCurrency } from "@/lib/utils/currency";
import { apiClient } from "@/lib/axios";

interface PricingRule {
  id: string;
  propertyId: string;
  unitId: string | null;
  name: string;
  ruleType: "percentage" | "fixed" | "multiplier";
  adjustmentValue: string | number;
  startDate: string;
  endDate: string;
  minNights: number | null;
  maxNights: number | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

interface PricingAnalytic {
  id: string;
  propertyId: string;
  month: string;
  avgOccupancy: string | null;
  avgBookingValue: string | null;
  totalBookings: number;
  recommendedPrice: string | null;
  recommendedAdjustment: string | null;
  confidenceScore: string | null;
}

interface PricingSuggestion {
  id: string;
  propertyId: string;
  suggestedValue: string;
  reason: string;
  priority: "high" | "medium" | "low";
  status: string;
  expiresAt: string | null;
}

export default function OwnerPricingPage() {
  const [activeTab, setActiveTab] = useState<
    "rules" | "analytics" | "suggestions"
  >("rules");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const queryClient = useQueryClient();

  const { data: propertiesData } = useQuery({
    queryKey: ["owner-properties"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/properties");
      return res.data.data as Array<{ id: string; name: string }>;
    },
  });

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ["owner-pricing-rules", selectedPropertyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPropertyId) params.set("propertyId", selectedPropertyId);
      const res = await apiClient.get(`/owner/pricing?${params}`);
      return res.data.data as PricingRule[];
    },
    enabled: activeTab === "rules",
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["owner-pricing-analytics", selectedPropertyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPropertyId) params.set("propertyId", selectedPropertyId);
      const res = await apiClient.get(`/owner/pricing/analytics?${params}`);
      return res.data.data as PricingAnalytic[];
    },
    enabled: activeTab === "analytics",
  });

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["owner-pricing-suggestions", selectedPropertyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPropertyId) params.set("propertyId", selectedPropertyId);
      const res = await apiClient.get(`/owner/pricing/suggestions?${params}`);
      return res.data.data as PricingSuggestion[];
    },
    enabled: activeTab === "suggestions",
  });

  const createRuleMutation = useMutation({
    mutationFn: async (rule: Partial<PricingRule>) => {
      const res = await apiClient.post("/owner/pricing", rule);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pricing-rules"] });
      setIsRuleDialogOpen(false);
      setEditingRule(null);
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({
      id,
      rule,
    }: {
      id: string;
      rule: Partial<PricingRule>;
    }) => {
      const res = await apiClient.put(`/owner/pricing/${id}`, rule);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pricing-rules"] });
      setIsRuleDialogOpen(false);
      setEditingRule(null);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/owner/pricing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pricing-rules"] });
    },
  });

  const handleSaveRule = (rule: Partial<PricingRule>) => {
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, rule });
    } else {
      createRuleMutation.mutate(rule);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Pricing
          </h1>
          <p className="text-muted-foreground">
            Kelola harga musiman dan lihat rekomendasi pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedPropertyId}
            onValueChange={(value) => value && setSelectedPropertyId(value)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Pilih properti" />
            </SelectTrigger>
            <SelectContent>
              {propertiesData?.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setEditingRule(null);
              setIsRuleDialogOpen(true);
            }}
            disabled={!selectedPropertyId}
          >
            <HugeiconsIcon
              icon={AddCircleIcon}
              strokeWidth={2}
              className="size-4 mr-1"
            />
            Tambah Rule
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "rules" ? "default" : "ghost"}
          onClick={() => setActiveTab("rules")}
        >
          <HugeiconsIcon
            icon={Tag01Icon}
            strokeWidth={2}
            className="size-4 mr-1"
          />
          Aturan Pricing
        </Button>
        <Button
          variant={activeTab === "analytics" ? "default" : "ghost"}
          onClick={() => setActiveTab("analytics")}
        >
          <HugeiconsIcon
            icon={TrendingUpDownIcon}
            strokeWidth={2}
            className="size-4 mr-1"
          />
          Analytics
        </Button>
        <Button
          variant={activeTab === "suggestions" ? "default" : "ghost"}
          onClick={() => setActiveTab("suggestions")}
        >
          <HugeiconsIcon
            icon={LightbulbOffIcon}
            strokeWidth={2}
            className="size-4 mr-1"
          />
          Rekomendasi
        </Button>
      </div>

      {activeTab === "rules" && (
        <Card>
          <CardHeader>
            <CardTitle>Aturan Harga Musiman</CardTitle>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rulesData && rulesData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Adjustment</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesData.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.ruleType}</Badge>
                      </TableCell>
                      <TableCell>
                        {rule.ruleType === "percentage" &&
                          `${rule.adjustmentValue}%`}
                        {rule.ruleType === "fixed" &&
                          formatCurrency(Number(rule.adjustmentValue))}
                        {rule.ruleType === "multiplier" &&
                          `${rule.adjustmentValue}x`}
                      </TableCell>
                      <TableCell>
                        {new Date(rule.startDate).toLocaleDateString("id-ID")} -{" "}
                        {new Date(rule.endDate).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.isActive ? "default" : "secondary"}
                        >
                          {rule.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              setEditingRule(rule);
                              setIsRuleDialogOpen(true);
                            }}
                          >
                            <HugeiconsIcon
                              icon={Edit01Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                          >
                            <HugeiconsIcon
                              icon={Delete01Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada aturan pricing. Klik &quot;Tambah Rule&quot; untuk
                membuat aturan baru.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "analytics" && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics Okupansi & Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : analyticsData && analyticsData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Okupansi Rata-rata</TableHead>
                    <TableHead>Nilai Booking Rata-rata</TableHead>
                    <TableHead>Total Booking</TableHead>
                    <TableHead>Harga Rekomendasi</TableHead>
                    <TableHead>Adjustment</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.month}
                      </TableCell>
                      <TableCell>
                        {item.avgOccupancy
                          ? `${Number(item.avgOccupancy).toFixed(1)}%`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {item.avgBookingValue
                          ? formatCurrency(Number(item.avgBookingValue))
                          : "-"}
                      </TableCell>
                      <TableCell>{item.totalBookings}</TableCell>
                      <TableCell>
                        {item.recommendedPrice
                          ? formatCurrency(Number(item.recommendedPrice))
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {item.recommendedAdjustment
                          ? `${item.recommendedAdjustment}%`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {item.confidenceScore
                          ? `${item.confidenceScore}%`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada data analytics untuk properti ini.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "suggestions" && (
        <Card>
          <CardHeader>
            <CardTitle>Rekomendasi Harga dari Sistem</CardTitle>
          </CardHeader>
          <CardContent>
            {suggestionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : suggestionsData && suggestionsData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nilai Rekomendasi</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kadaluarsa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestionsData.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(suggestion.suggestedValue))}
                      </TableCell>
                      <TableCell>{suggestion.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            suggestion.priority === "high"
                              ? "destructive"
                              : suggestion.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {suggestion.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{suggestion.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {suggestion.expiresAt
                          ? new Date(suggestion.expiresAt).toLocaleDateString(
                              "id-ID",
                            )
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada rekomendasi untuk properti ini.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Aturan Pricing" : "Tambah Aturan Pricing"}
            </DialogTitle>
          </DialogHeader>
          <PricingRuleForm
            propertyId={selectedPropertyId}
            rule={editingRule}
            onSave={handleSaveRule}
            onCancel={() => {
              setIsRuleDialogOpen(false);
              setEditingRule(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PricingRuleForm({
  propertyId,
  rule,
  onSave,
  onCancel,
}: {
  propertyId: string;
  rule: PricingRule | null;
  onSave: (rule: Partial<PricingRule>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    propertyId: rule?.propertyId || propertyId,
    unitId: rule?.unitId || "",
    name: rule?.name || "",
    ruleType: rule?.ruleType || "percentage",
    adjustmentValue: rule?.adjustmentValue || "",
    startDate: rule?.startDate
      ? new Date(rule.startDate).toISOString().slice(0, 16)
      : "",
    endDate: rule?.endDate
      ? new Date(rule.endDate).toISOString().slice(0, 16)
      : "",
    minNights: rule?.minNights || "",
    maxNights: rule?.maxNights || "",
    priority: rule?.priority || 0,
    isActive: rule?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      unitId: formData.unitId || null,
      minNights: formData.minNights ? Number(formData.minNights) : null,
      maxNights: formData.maxNights ? Number(formData.maxNights) : null,
      adjustmentValue: Number(formData.adjustmentValue),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Rule</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="misal: Liburan Natal"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ruleType">Tipe Rule</Label>
          <Select
            value={formData.ruleType}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                ruleType: value as "percentage" | "fixed" | "multiplier",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Persentase (%)</SelectItem>
              <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
              <SelectItem value="multiplier">Multiplier (x)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adjustmentValue">
            {formData.ruleType === "percentage" && "Persentase (%)"}
            {formData.ruleType === "fixed" && "Nominal (Rp)"}
            {formData.ruleType === "multiplier" && "Multiplier"}
          </Label>
          <Input
            id="adjustmentValue"
            type="number"
            step="0.01"
            value={formData.adjustmentValue}
            onChange={(e) =>
              setFormData({ ...formData, adjustmentValue: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Tanggal Mulai</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Tanggal Selesai</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minNights">Minimal Malam</Label>
          <Input
            id="minNights"
            type="number"
            value={formData.minNights}
            onChange={(e) =>
              setFormData({ ...formData, minNights: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxNights">Maksimal Malam</Label>
          <Input
            id="maxNights"
            type="number"
            value={formData.maxNights}
            onChange={(e) =>
              setFormData({ ...formData, maxNights: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.target.checked })
          }
        />
        <Label htmlFor="isActive">Aktif</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Simpan</Button>
      </div>
    </form>
  );
}
