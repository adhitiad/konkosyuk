"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { withAdminAuth } from "@/lib/with-admin-auth";

interface PushSubscription {
  id: string;
  endpoint: string;
  createdAt: string;
}

function AdminPushNotificationsPage() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.pushNotifications");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["push-subscriptions"],
    queryFn: async () => (await apiClient.get("/api/admin/push/subscriptions")).data,
  });

  const subscriptions: PushSubscription[] = data?.data?.subscriptions ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/admin/push/subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (payload: { title: string; message: string }) => {
      return apiClient.post("/api/admin/push/broadcast", payload);
    },
    onSuccess: () => {
      alert(t("broadcastSuccess"));
    },
    onError: () => {
      setError(t("broadcastError"));
    },
  });

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  const handleBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setError(t("titleAndMessageRequired"));
      return;
    }
    setError(null);
    broadcastMutation.mutate({
      title: broadcastTitle,
      message: broadcastMessage,
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("broadcastTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("broadcastLabel")}</label>
            <input
              type="text"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder={t("broadcastPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("messageLabel")}</label>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              placeholder={t("messagePlaceholder")}
            />
          </div>
          <Button onClick={handleBroadcast} disabled={broadcastMutation.isPending}>
            {broadcastMutation.isPending ? t("sending") : t("sendBroadcast")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("subscriptionsTitle", { count: subscriptions.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noSubscriptions")}</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="size-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{t("subscriptionLabel")}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {sub.endpoint.slice(0, 50)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(sub.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAdminAuth(AdminPushNotificationsPage, ["admin"]);
