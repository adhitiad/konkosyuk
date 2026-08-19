"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { withAdminAuth } from "@/lib/with-admin-auth";

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  userId: string;
  userName: string | null;
  userRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface ActivityLogsResponse {
  data: ActivityLog[];
  meta: {
    total: number;
  };
}

const actionOptions = [
  { value: "", label: "Semua Aksi" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
];

export default withAdminAuth(ActivityLogsPage);

function ActivityLogsPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string | null>(null);
  const [userId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery<ActivityLogsResponse>({
    queryKey: ["admin-activity-logs", action, userId, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (action) params.set("action", action);
      if (userId) params.set("userId", userId);
      if (search) params.set("search", search);

      const res = await apiClient.get(
        `/api/admin/activity-logs?${params.toString()}`,
      );
      const payload = res.data as {
        data?: ActivityLog[];
        meta?: { total: number };
      };
      return { data: payload.data ?? [], meta: payload.meta ?? { total: 0 } };
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Gagal memuat activity logs",
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
        type: "error",
      });
    }
  }, [isError, error]);

  const logs: ActivityLog[] = Array.isArray(data?.data) ? data.data : [];

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  };

  const getActionBadge = (action: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      create: "default",
      update: "secondary",
      delete: "destructive",
      approve: "default",
      reject: "destructive",
    };
    return variants[action] || "outline";
  };

  const exportToCsv = () => {
    if (!logs.length) return;

    const escapeCsv = (value: string) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      "Waktu",
      "Aksi",
      "Deskripsi",
      "User",
      "Role",
      "IP Address",
    ];
    const rows = logs.map((log) => [
      formatDate(log.createdAt),
      log.action,
      log.description,
      log.userName || "-",
      log.userRole || "-",
      log.ipAddress || "-",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Activity Logs" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">Audit trail semua aksi admin</p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={exportToCsv} variant="outline" disabled={!logs.length}>
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label htmlFor="search-activity" className="sr-only">
                Cari logs
              </label>
              <Input
                id="search-activity"
                placeholder="Cari logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter aksi" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={2}
                className="size-4"
              />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Gagal memuat activity logs"}
              </AlertDescription>
            </Alert>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Tidak ada activity logs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between rounded-4xl border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getActionBadge(log.action)}
                        className="text-xs"
                      >
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium">
                        {log.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDate(log.createdAt)}</span>
                      <span>
                        User: {log.userName || "-"} ({log.userRole || "-"})
                      </span>
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
