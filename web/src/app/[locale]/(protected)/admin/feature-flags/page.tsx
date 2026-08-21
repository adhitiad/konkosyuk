"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { FeatureFlagsTable } from "@/components/admin/feature-flags-table";
import { CreateFeatureFlagDialog } from "@/components/admin/create-feature-flag-dialog";
import type { FeatureFlag } from "@/components/admin/feature-flags-table";

export default withAdminAuth(AdminFeatureFlagsPage);

function AdminFeatureFlagsPage() {
  const queryClient = useQueryClient();
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);

  const handleCreated = () => {
    setEditingFlag(null);
    queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
  };

  const handleEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Feature Flags" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Feature Flags
        </h1>
        <p className="mt-2 text-muted-foreground">
          Kelola fitur yang dapat di-toggle tanpa deployment
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Feature Flags</CardTitle>
          <CreateFeatureFlagDialog
            editFlag={editingFlag}
            onCreated={handleCreated}
          />
        </CardHeader>
        <CardContent>
          <FeatureFlagsTable onEdit={handleEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
