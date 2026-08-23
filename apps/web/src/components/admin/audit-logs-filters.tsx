"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, type QueryFunction } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { AuditLog } from "@/components/admin/audit-logs-table";
import { useDebounce } from "use-debounce";

const actions = [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "reconcile",
  "refund",
  "refund_request",
  "refund_rejected",
  "login",
  "logout",
  "config_change",
];

const resources = [
  "user",
  "property",
  "booking",
  "payment",
  "withdrawal",
  "kyc",
  "notification",
  "payment_gateway",
  "platform_setting",
  "ledger",
  "webhook",
  "refund_request",
];

type AuditLogsApiResponse = {
  data?: AuditLog[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

export function AuditLogsFilters({
  onLogsChange,
}: {
  onLogsChange: (logs: AuditLog[], pagination?: { page: number; limit: number; total: number; totalPages: number } | null) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localSearch, setLocalSearch] = useState(
    searchParams.get("search") ?? "",
  );

  const page = searchParams.get("page") ?? "1";
  const limit = searchParams.get("limit") ?? "50";
  const userId = searchParams.get("userId") ?? undefined;
  const action = searchParams.get("action") ?? undefined;
  const resource = searchParams.get("resource") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const [debouncedSearch] = useDebounce(localSearch, 300);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`?${params.toString()}`);
  };

  const queryFn: QueryFunction<AuditLogsApiResponse> = async () => {
    const params = new URLSearchParams();
    if (page) params.set("page", page);
    if (limit) params.set("limit", limit);
    if (userId) params.set("userId", userId);
    if (action) params.set("action", action);
    if (resource) params.set("resource", resource);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (debouncedSearch) params.set("search", debouncedSearch);

    const response = await apiClient.get(
      `/api/admin/audit-logs?${params.toString()}`,
    );
    return response.data as AuditLogsApiResponse;
  };

  const { data } = useQuery({
    queryKey: [
      "admin-audit-logs",
      page,
      limit,
      userId,
      action,
      resource,
      startDate,
      endDate,
      debouncedSearch,
    ],
    queryFn,
  });

  if (data) {
    onLogsChange(data?.data ?? [], data?.meta ?? null);
  }

  const hasFilters =
    userId || action || resource || startDate || endDate || search;

  const resetFilters = () => {
    setLocalSearch("");
    router.push("?");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Input
          placeholder="Cari di details..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pr-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
            onClick={() => {
              setLocalSearch("");
              updateParams({ search: null, page: "1" });
            }}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>

      <Select
        value={action ?? "all"}
        onValueChange={(value) => {
          updateParams({ action: value === "all" ? null : value, page: "1" });
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Action</SelectItem>
          {actions.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={resource ?? "all"}
        onValueChange={(value) => {
          updateParams({ resource: value === "all" ? null : value, page: "1" });
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Resource" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Resource</SelectItem>
          {resources.map((item) => (
            <SelectItem key={item} value={item}>
              {item.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="date"
            value={startDate ?? ""}
            onChange={(e) =>
              updateParams({
                startDate: e.target.value || null,
                page: "1",
              })
            }
            className="h-9 w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {startDate && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-6 -translate-y-1/2"
              onClick={() => updateParams({ startDate: null, page: "1" })}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
        <span className="text-sm text-muted-foreground">-</span>
        <div className="relative">
          <input
            type="date"
            value={endDate ?? ""}
            onChange={(e) =>
              updateParams({
                endDate: e.target.value || null,
                page: "1",
              })
            }
            className="h-9 w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {endDate && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-6 -translate-y-1/2"
              onClick={() => updateParams({ endDate: null, page: "1" })}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      <Input
        placeholder="User ID"
        value={userId ?? ""}
        onChange={(e) => {
          updateParams({ userId: e.target.value || null, page: "1" });
        }}
        className="w-[180px]"
      />

      {hasFilters && (
        <Button variant="ghost" onClick={resetFilters}>
          <X className="mr-2 size-4" />
          Reset
        </Button>
      )}
    </div>
  );
}
