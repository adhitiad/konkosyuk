"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import type { FeatureFlag } from "@/components/admin/feature-flags-table";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
  { value: "tenant", label: "Tenant" },
  { value: "staff", label: "Staff" },
];

type CreateFeatureFlagDialogProps = {
  onCreated?: (flag: FeatureFlag) => void;
  editFlag?: FeatureFlag | null;
};

export function CreateFeatureFlagDialog({
  onCreated,
  editFlag,
}: CreateFeatureFlagDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(100);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setKey("");
    setName("");
    setDescription("");
    setEnabled(false);
    setRolloutPercentage(100);
    setAllowedRoles([]);
  }, []);

  useEffect(() => {
    if (editFlag) {
      setKey(editFlag.key); // eslint-disable-line react-hooks/set-state-in-effect
      setName(editFlag.name);
      setDescription(editFlag.description ?? "");
      setEnabled(editFlag.enabled);
      setRolloutPercentage(editFlag.rolloutPercentage);
      setAllowedRoles(editFlag.allowedRoles ?? []);
      setOpen(true);
    } else {
      resetForm();
    }
  }, [editFlag, resetForm]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (editFlag) {
        return apiClient.put(`/api/admin/feature-flags/${editFlag.id}`, {
          key,
          name,
          description: description || undefined,
          enabled,
          rolloutPercentage,
          allowedRoles,
        });
      }
      return apiClient.post("/api/admin/feature-flags", {
        key,
        name,
        description: description || undefined,
        enabled,
        rolloutPercentage,
        allowedRoles,
      });
    },
    onSuccess: (response) => {
      const flag = response.data.data;
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      showToastSuccess(
        editFlag
          ? "Feature flag berhasil diperbarui"
          : "Feature flag berhasil dibuat",
      );
      resetForm();
      setOpen(false);
      onCreated?.(flag);
    },
    onError: () => {
      showToastError(
        editFlag
          ? "Gagal memperbarui feature flag"
          : "Gagal membuat feature flag",
      );
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      resetForm();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !name.trim()) return;
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="default">
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              className="size-4 mr-2"
            />
            Create Flag
          </Button>
        }
      />
      <DialogContent showCloseButton={!editFlag}>
        <DialogHeader>
          <DialogTitle>
            {editFlag ? "Edit Feature Flag" : "Create Feature Flag"}
          </DialogTitle>
        </DialogHeader>
        <form
          key={editFlag?.id ?? "new"}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              value={key}
              onChange={(e) =>
                setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
              }
              placeholder="new_payment_flow"
              disabled={!!editFlag}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Payment Flow"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enabled</Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rollout">Rollout Percentage</Label>
            <Input
              id="rollout"
              type="number"
              min={0}
              max={100}
              value={rolloutPercentage}
              onChange={(e) => setRolloutPercentage(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Allowed Roles</Label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={allowedRoles.includes(role.value)}
                    onChange={(e) => {
                      setAllowedRoles((prev) =>
                        e.target.checked
                          ? [...prev, role.value]
                          : prev.filter((r) => r !== role.value),
                      );
                    }}
                  />
                  {role.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button type="submit" disabled={mutation.isPending}>
              {editFlag ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
