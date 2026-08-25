"use client";

import { useState } from "react";
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
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type AuditLog = {
  id: string;
  adminId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
};

const actionColors: Record<string, string> = {
  create: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  update: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  delete: "bg-red-500/15 text-red-600 dark:text-red-400",
  approve: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  reject: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  reconcile: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  refund: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  refund_request: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  refund_rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  login: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
  logout: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
  config_change: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
};

function formatJson(value: Record<string, unknown>): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function truncateDetails(details: Record<string, unknown>): string {
  const json = formatJson(details);
  if (json.length <= 120) return json;
  return json.slice(0, 120) + "...";
}

export function AuditLogsTable({
  logs,
  isLoading,
  pagination,
}: {
  logs: AuditLog[];
  isLoading: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-semibold">Belum ada audit log</p>
        <p className="text-sm text-muted-foreground mt-1">
          Aktivitas admin akan tercatat di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">Timestamp</TableHead>
            <TableHead className="w-[180px]">User</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
            <TableHead className="w-[120px]">Resource</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-[120px]">Target ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isExpanded = expandedRows.has(log.id);
            const fullDetails = formatJson(log.details);
            const isLong = fullDetails.length > 120;

            return (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {log.userName ?? "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {log.userEmail ?? log.adminId?.slice(0, 8)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={actionColors[log.action] ?? ""}
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {log.targetType.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-muted-foreground">
                      {isExpanded ? fullDetails : truncateDetails(log.details)}
                    </code>
                    {isLong && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => toggleRow(log.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-3" />
                        ) : (
                          <ChevronRight className="size-3" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => copyToClipboard(fullDetails, log.id)}
                    >
                      {copiedId === log.id ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs font-mono text-muted-foreground">
                    {log.targetId.slice(0, 8)}
                  </code>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {pagination && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} (
            {pagination.total} logs)
          </p>
        </div>
      )}
    </div>
  );
}
