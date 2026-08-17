"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, MessageCircle, Bell } from "lucide-react";
import { withAdminAuth } from "@/lib/with-admin-auth";

type NotificationSettings = {
  email: { configured: boolean; sender: string };
  whatsapp: {
    configured: boolean;
    createdTemplate: string;
    updatedTemplate: string;
  };
};

function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [emailKey, setEmailKey] = useState("");
  const [emailSender, setEmailSender] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waCreatedTemplate, setWaCreatedTemplate] = useState("");
  const [waUpdatedTemplate, setWaUpdatedTemplate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () =>
      (await apiClient.get("/api/admin/settings/notifications")).data,
  });

  const settings = data?.data as NotificationSettings | undefined;

  const emailSenderRef = useRef<string>("");
  const waCreatedTemplateRef = useRef<string>("");
  const waUpdatedTemplateRef = useRef<string>("");

  useEffect(() => {
    if (settings) {
      emailSenderRef.current = settings.email.sender || "";
      waCreatedTemplateRef.current =
        settings.whatsapp.createdTemplate || "maintenance_report_created";
      waUpdatedTemplateRef.current =
        settings.whatsapp.updatedTemplate || "maintenance_report_updated";
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      return apiClient.post("/api/admin/settings/notifications", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      setError(null);
    },
  });

  const handleSaveEmail = () => {
    setError(null);
    mutation.mutate({
      resendApiKey: emailKey,
      resendFromEmail: emailSender,
    });
  };

  const handleSaveWhatsApp = () => {
    setError(null);
    mutation.mutate({
      metaAccessToken: waToken,
      metaPhoneNumberId: waPhoneId,
      metaMaintenanceCreatedTemplate: waCreatedTemplate,
      metaMaintenanceUpdatedTemplate: waUpdatedTemplate,
    });
  };

  const status = (configured?: boolean) => (
    <Badge variant={configured ? "default" : "destructive"}>
      {configured ? "Aktif" : "Belum dikonfigurasi"}
    </Badge>
  );

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan Notifikasi</h1>
        <p className="text-muted-foreground">
          Konfigurasi pengiriman Email dan WhatsApp. Data sensitif disimpan
          terenkripsi di database.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-5" />
                Email Resend {status(settings?.email.configured)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Resend API Key</label>
                <Input
                  type="password"
                  value={emailKey}
                  onChange={(e) => setEmailKey(e.target.value)}
                  placeholder="re_..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sender Email</label>
                <Input
                  type="email"
                  value={emailSender}
                  onChange={(e) => setEmailSender(e.target.value)}
                  placeholder="KonkosYuk <onboarding@resend.dev>"
                />
              </div>
              <Button onClick={handleSaveEmail} disabled={mutation.isPending}>
                {mutation.isPending ? "Menyimpan..." : "Simpan Email"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="size-5" />
                WhatsApp Meta {status(settings?.whatsapp.configured)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Access Token</label>
                <Input
                  type="password"
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  placeholder="Meta access token"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number ID</label>
                <Input
                  value={waPhoneId}
                  onChange={(e) => setWaPhoneId(e.target.value)}
                  placeholder="Phone number ID"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Template Laporan Baru
                </label>
                <Input
                  value={waCreatedTemplate}
                  onChange={(e) => setWaCreatedTemplate(e.target.value)}
                  placeholder="maintenance_report_created"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Template Status Update
                </label>
                <Input
                  value={waUpdatedTemplate}
                  onChange={(e) => setWaUpdatedTemplate(e.target.value)}
                  placeholder="maintenance_report_updated"
                />
              </div>
              <Button
                onClick={handleSaveWhatsApp}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Menyimpan..." : "Simpan WhatsApp"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5" />
                Push Notifications (Web Push)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">VAPID Public Key</label>
                <Input
                  value={window.location.hostname === "localhost" ? "" : ""}
                  onChange={(e) => {}}
                  placeholder="Disediakan dari env / settings"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">
                VAPID keys digunakan untuk autentikasi Web Push. Generate via:
                <code className="ml-1">web-push generate-vapid-keys</code>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default withAdminAuth(NotificationSettingsPage, ["admin"]);
