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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
  adminId: string | null;
  adminName: string | null;
}

interface AuditLogsResponse {
  data: AuditLog[];
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
  { value: "reconcile", label: "Reconcile" },
  { value: "refund", label: "Refund" },
  { value: "config_change", label: "Config Change" },
];

const targetTypeOptions = [
  { value: "", label: "Semua Target" },
  { value: "user", label: "User" },
  { value: "property", label: "Property" },
  { value: "booking", label: "Booking" },
  { value: "payment", label: "Payment" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "kyc", label: "KYC" },
  { value: "notification", label: "Notification" },
  { value: "payment_gateway", label: "Payment Gateway" },
  { value: "platform_setting", label: "Platform Setting" },
  { value: "webhook", label: "Webhook" },
];

export default withAdminAuth(AuditLogsPage);

function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery<AuditLogsResponse>({
    queryKey: ["admin-audit-logs", action, targetType, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (action) params.set("action", action);
      if (targetType) params.set("targetType", targetType);
      if (search) params.set("search", search);

      const res = await apiClient.get(
        `/api/admin/audit-logs?${params.toString()}`,
      );
      const payload = res.data as {
        data?: AuditLog[];
        meta?: { total: number };
      };
      return { data: payload.data ?? [], meta: payload.meta ?? { total: 0 } };
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Gagal memuat audit logs",
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
        type: "error",
      });
    }
  }, [isError, error]);

  const logs: AuditLog[] = Array.isArray(data?.data) ? data.data : [];

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
      reconcile: "secondary",
      refund: "destructive",
      config_change: "outline",
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
      "Tanggal",
      "Admin",
      "Aksi",
      "Target Type",
      "Target ID",
      "Detail",
    ];
    const rows = logs.map((log) => [
      formatDate(log.createdAt),
      log.adminName || "-",
      log.action,
      log.targetType,
      log.targetId,
      JSON.stringify(log.details),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Audit Logs" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Riwayat aksi admin di seluruh sistem
        </p>
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
              <label htmlFor="search-audit" className="sr-only">
                Cari audit logs
              </label>
              <Input
                id="search-audit"
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
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter target" />
              </SelectTrigger>
              <SelectContent>
                {targetTypeOptions.map((opt) => (
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
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
                  : "Gagal memuat audit logs"}
              </AlertDescription>
            </Alert>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Tidak ada audit logs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Tanggal</TableHead>
                    <TableHead scope="col">Admin</TableHead>
                    <TableHead scope="col">Aksi</TableHead>
                    <TableHead scope="col">Target</TableHead>
                    <TableHead scope="col">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>{log.adminName || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getActionBadge(log.action)}
                          className="text-xs"
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium">{log.targetType}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          #{log.targetId.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
