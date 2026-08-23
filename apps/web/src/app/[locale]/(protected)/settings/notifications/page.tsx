"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { BellIcon, MailIcon, SmartphoneIcon, ClockIcon } from "lucide-react";
import { apiClient } from "@/lib/axios";

interface NotificationPreferences {
  preferences: Record<
    string,
    { inApp: boolean; email: boolean; push: boolean }
  >;
  emailDigest: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
}

const NOTIFICATION_CATEGORIES = [
  {
    key: "booking",
    label: "Booking",
    description: "Notifikasi terkait booking dan permintaan sewa",
    events: [
      {
        key: "booking_created",
        label: "Booking Dibuat",
        description: "Saat ada booking baru",
      },
      {
        key: "booking_approved",
        label: "Booking Disetujui",
        description: "Saat owner menyetujui booking",
      },
      {
        key: "booking_rejected",
        label: "Booking Ditolak",
        description: "Saat owner menolak booking",
      },
      {
        key: "booking_completed",
        label: "Booking Selesai",
        description: "Saat masa sewa berakhir",
      },
      {
        key: "booking_cancelled",
        label: "Booking Dibatalkan",
        description: "Saat booking dibatalkan",
      },
    ],
  },
  {
    key: "payment",
    label: "Pembayaran",
    description: "Notifikasi terkait pembayaran dan refund",
    events: [
      {
        key: "payment_dp_paid",
        label: "DP Dibayar",
        description: "Saat DP diterima",
      },
      {
        key: "payment_full_paid",
        label: "Pembayaran Lengkap",
        description: "Saat pelunasan diterima",
      },
      {
        key: "payment_failed",
        label: "Pembayaran Gagal",
        description: "Saat pembayaran gagal/kadaluarsa",
      },
      {
        key: "payment_refunded",
        label: "Refund",
        description: "Saat refund diproses",
      },
    ],
  },
  {
    key: "maintenance",
    label: "Maintenance",
    description: "Notifikasi terkait laporan maintenance",
    events: [
      {
        key: "maintenance_created",
        label: "Laporan Dibuat",
        description: "Saat ada laporan maintenance baru",
      },
      {
        key: "maintenance_updated",
        label: "Laporan Diperbarui",
        description: "Saat status maintenance berubah",
      },
      {
        key: "maintenance_resolved",
        label: "Maintenance Selesai",
        description: "Saat maintenance selesai dikerjakan",
      },
    ],
  },
  {
    key: "inspection",
    label: "Inspeksi",
    description: "Notifikasi terkait inspeksi properti",
    events: [
      {
        key: "inspection_created",
        label: "Inspeksi Dibuat",
        description: "Saat inspeksi dibuat",
      },
      {
        key: "inspection_completed",
        label: "Inspeksi Selesai",
        description: "Saat inspeksi selesai",
      },
      {
        key: "inspection_disputed",
        label: "Inspeksi Di-dispute",
        description: "Saat ada sengketa inspeksi",
      },
    ],
  },
  {
    key: "chat",
    label: "Chat",
    description: "Notifikasi pesan chat",
    events: [
      {
        key: "chat_message",
        label: "Pesan Baru",
        description: "Saat ada pesan chat baru",
      },
    ],
  },
  {
    key: "review",
    label: "Review",
    description: "Notifikasi review dan rating",
    events: [
      {
        key: "review_received",
        label: "Review Baru",
        description: "Saat ada review baru",
      },
    ],
  },
];

const EMAIL_DIGEST_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "daily", label: "Daily Digest" },
  { value: "weekly", label: "Weekly Digest" },
  { value: "never", label: "Never" },
];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Jakarta", label: "WIB (Jakarta)" },
  { value: "Asia/Makassar", label: "WITA (Makassar)" },
  { value: "Asia/Jayapura", label: "WIT (Jayapura)" },
];

export default function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("categories");

  const { data: prefs, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications/preferences");
      return res.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const res = await apiClient.patch("/notifications/preferences", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      showToastSuccess("Preferensi notifikasi berhasil disimpan");
    },
    onError: () => {
      showToastError("Gagal menyimpan preferensi");
    },
  });

  const handleToggle = (
    eventKey: string,
    channel: "inApp" | "email" | "push",
  ) => {
    if (!prefs) return;
    updateMutation.mutate({
      preferences: {
        ...prefs.preferences,
        [eventKey]: {
          ...prefs.preferences[eventKey],
          [channel]: !prefs.preferences[eventKey]?.[channel],
        },
      },
    });
  };

  const handleGlobalToggle = (eventKey: string, enabled: boolean) => {
    if (!prefs) return;
    updateMutation.mutate({
      preferences: {
        ...prefs.preferences,
        [eventKey]: {
          inApp: enabled,
          email: enabled,
          push: enabled,
        },
      },
    });
  };

  const handleEmailDigestChange = (value: string | null) => {
    if (value) updateMutation.mutate({ emailDigest: value });
  };

  const handleQuietHoursChange = (
    field: "quietHoursStart" | "quietHoursEnd",
    value: string | null,
  ) => {
    updateMutation.mutate({ [field]: value || null });
  };

  const handleTimezoneChange = (value: string | null) => {
    if (value) updateMutation.mutate({ timezone: value });
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="container py-6">
        <p className="text-muted-foreground">
          Gagal memuat preferensi notifikasi
        </p>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Preferensi Notifikasi
        </h1>
        <p className="text-muted-foreground">
          Kelola cara Anda menerima notifikasi
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">
            <BellIcon className="mr-2 size-4" />
            Kategori Notifikasi
          </TabsTrigger>
          <TabsTrigger value="channels">
            <MailIcon className="mr-2 size-4" />
            Channel & Jadwal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          {NOTIFICATION_CATEGORIES.map((category) => (
            <Card key={category.key}>
              <CardHeader>
                <CardTitle className="text-lg">{category.label}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.events.map((event) => {
                    const eventPrefs = prefs.preferences[event.key];
                    const isEnabled =
                      eventPrefs?.inApp ||
                      eventPrefs?.email ||
                      eventPrefs?.push;

                    return (
                      <div
                        key={event.key}
                        className="flex items-start justify-between p-4 rounded-lg border"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{event.label}</p>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) =>
                                handleGlobalToggle(event.key, checked)
                              }
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <BellIcon className="size-4 text-muted-foreground" />
                            <Switch
                              checked={eventPrefs?.inApp ?? true}
                              onCheckedChange={() =>
                                handleToggle(event.key, "inApp")
                              }
                              disabled={!isEnabled}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <MailIcon className="size-4 text-muted-foreground" />
                            <Switch
                              checked={eventPrefs?.email ?? false}
                              onCheckedChange={() =>
                                handleToggle(event.key, "email")
                              }
                              disabled={!isEnabled}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <SmartphoneIcon className="size-4 text-muted-foreground" />
                            <Switch
                              checked={eventPrefs?.push ?? false}
                              onCheckedChange={() =>
                                handleToggle(event.key, "push")
                              }
                              disabled={!isEnabled}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailIcon className="size-5" />
                Email Digest
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Seberapa sering Anda menerima email notifikasi
              </p>
            </CardHeader>
            <CardContent>
              <Select
                value={prefs.emailDigest || "immediate"}
                onValueChange={handleEmailDigestChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_DIGEST_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="size-5" />
                Jam Tenang (Quiet Hours)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Notifikasi push dan email akan ditunda selama jam tenang
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mulai</Label>
                  <input
                    type="time"
                    value={prefs.quietHoursStart || ""}
                    onChange={(e) =>
                      handleQuietHoursChange("quietHoursStart", e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Selesai</Label>
                  <input
                    type="time"
                    value={prefs.quietHoursEnd || ""}
                    onChange={(e) =>
                      handleQuietHoursChange("quietHoursEnd", e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zona Waktu</CardTitle>
              <p className="text-sm text-muted-foreground">
                Zona waktu untuk penjadwalan notifikasi
              </p>
            </CardHeader>
            <CardContent>
              <Select
                value={prefs.timezone || "Asia/Jakarta"}
                onValueChange={handleTimezoneChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
