"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AuditLogsTable,
  type AuditLog,
} from "@/components/admin/audit-logs-table";
import { AuditLogsFilters } from "@/components/admin/audit-logs-filters";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";

export default withAdminAuth(AuditLogsPage);

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogsChange = useCallback(
    (data: AuditLog[], meta?: { page: number; limit: number; total: number; totalPages: number } | null) => {
      setLogs(data);
      setPagination(meta ?? null);
      setIsLoading(false);
    },
    [],
  );

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
        <p className="text-muted-foreground">Log aktivitas semua pengguna</p>
      </div>

      <Card>
        <CardHeader>
          <AuditLogsFilters onLogsChange={handleLogsChange} />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Tidak ada audit logs</p>
            </div>
          ) : null}
          <AuditLogsTable
            logs={logs}
            isLoading={false}
            pagination={pagination}
          />
        </CardContent>
      </Card>
    </div>
  );
}
