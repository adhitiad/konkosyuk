"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Edit01Icon } from "@hugeicons/core-free-icons";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";

export type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutPercentage: number;
  allowedRoles: string[];
  allowedUsers: string[];
  createdAt: string;
  updatedAt: string;
};

type FeatureFlagsTableProps = {
  onEdit: (flag: FeatureFlag) => void;
};

export function FeatureFlagsTable({ onEdit }: FeatureFlagsTableProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: async () => (await apiClient.get("/api/admin/feature-flags")).data,
  });

  const flags: FeatureFlag[] = data?.data ?? [];

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return apiClient.put(`/api/admin/feature-flags/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      showToastSuccess("Feature flag berhasil diperbarui");
    },
    onError: () => {
      showToastError("Gagal memperbarui feature flag");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/admin/feature-flags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      showToastSuccess("Feature flag berhasil dihapus");
      setDeletingId(null);
    },
    onError: () => {
      showToastError("Gagal menghapus feature flag");
      setDeletingId(null);
    },
  });

  const handleToggle = (flag: FeatureFlag) => {
    toggleMutation.mutate({ id: flag.id, enabled: !flag.enabled });
  };

  const handleDelete = (flag: FeatureFlag) => {
    setDeletingId(flag.id);
    deleteMutation.mutate(flag.id);
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

  if (flags.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Belum ada feature flags
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Key</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[100px]">Enabled</TableHead>
            <TableHead className="w-[100px]">Rollout</TableHead>
            <TableHead className="w-[200px]">Allowed Roles</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flags.map((flag) => (
            <TableRow key={flag.id}>
              <TableCell>
                <code className="text-xs font-mono">{flag.key}</code>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{flag.name}</span>
                  {flag.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {flag.description}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={() => handleToggle(flag)}
                />
              </TableCell>
              <TableCell>
                <span className="text-sm">{flag.rolloutPercentage}%</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {flag.allowedRoles.length === 0 ? (
                    <Badge variant="secondary">All</Badge>
                  ) : (
                    flag.allowedRoles.map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(flag)}
                  >
                    <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(flag)}
                    disabled={deletingId === flag.id}
                  >
                    <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
