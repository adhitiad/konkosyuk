"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Check, X } from "lucide-react";
import { updateReportAction } from "@/actions/reports";

type Report = {
  id: string;
  category: string;
  description: string;
  images: string[] | null;
  status: string;
  propertyName: string;
  unitName: string | null;
  tenantName: string | null;
  createdAt: string;
};
const categoryLabels: Record<string, string> = {
  air: "Air",
  listrik: "Listrik",
  kunci_pintu: "Kunci pintu",
  ac: "AC",
  furniture: "Furniture",
  lainnya: "Lainnya",
};
const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Ditolak",
};

function ReportItem({
  report,
  onUpdate,
}: {
  report: Report;
  onUpdate: (
    _id: string,
    _status: "in_progress" | "resolved" | "rejected",
  ) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateReportAction,
    undefined,
  );

  return (
    <div key={report.id} className="rounded-xl border p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {categoryLabels[report.category] ?? report.category} ·{" "}
            {report.propertyName}
            {report.unitName ? ` · ${report.unitName}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {report.tenantName ?? "Tenant"} ·{" "}
            {new Date(report.createdAt).toLocaleDateString("id-ID")}
          </p>
        </div>
        <Badge
          className={
            report.status === "resolved"
              ? "bg-green-100 text-green-700"
              : report.status === "in_progress"
                ? "bg-blue-100 text-blue-700"
                : report.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : ""
          }
        >
          {statusLabels[report.status] ?? report.status}
        </Badge>
      </div>
      <p className="text-sm whitespace-pre-wrap">{report.description}</p>
      {report.images?.length ? (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="flex flex-wrap gap-2">
          {report.images.map((url) => (
            <img
              key={url}
              src={url}
              alt="Lampiran laporan"
              className="size-20 rounded-md border object-cover"
            />
          ))}
        </div>
      ) : null}
      {report.status !== "resolved" && report.status !== "rejected" && (
        <div className="flex flex-wrap gap-2">
          <form action={formAction}>
            <input type="hidden" name="id" value={report.id} />
            <input type="hidden" name="status" value="in_progress" />
            <input type="hidden" name="resolutionNote" value="" />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={isPending}
            >
              {isPending ? "Memproses..." : "Tandai Diproses"}
            </Button>
          </form>
          <form action={formAction}>
            <input type="hidden" name="id" value={report.id} />
            <input type="hidden" name="status" value="resolved" />
            <input
              type="hidden"
              name="resolutionNote"
              value="Masalah telah ditangani."
            />
            <Button type="submit" size="sm" disabled={isPending}>
              <Check className="size-4" />
              {isPending ? "Memproses..." : "Tandai Selesai"}
            </Button>
          </form>
          <form action={formAction}>
            <input type="hidden" name="id" value={report.id} />
            <input type="hidden" name="status" value="rejected" />
            <input type="hidden" name="resolutionNote" value="" />
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={isPending}
            >
              <X className="size-4" />
              {isPending ? "Memproses..." : "Tolak"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function OwnerReportList() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["maintenance-reports"],
    queryFn: async () => (await apiClient.get("/api/reports")).data,
  });
  const reports: Report[] = data?.data?.data ?? [];

  function handleUpdate(
    _id: string,
    _status: "in_progress" | "resolved" | "rejected",
  ) {
    queryClient.invalidateQueries({ queryKey: ["maintenance-reports"] });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="size-5" />
          Laporan Masalah Tenant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat laporan...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada laporan masalah.
          </p>
        ) : (
          reports.map((report) => (
            <ReportItem
              key={report.id}
              report={report}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
