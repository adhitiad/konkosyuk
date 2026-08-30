"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileText,
  Users,
  MapPin,
  TrendingUp,
  Receipt,
} from "@hugeicons/core-free-icons";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";

import type { IconSvgElement } from "@hugeicons/react";

interface ReportCard {
  title: string;
  description: string;
  href: string;
  icon: IconSvgElement;
  color: string;
}

const reports: ReportCard[] = [
  {
    title: "Demografi Pengguna",
    description: "Distribusi user dan owner berdasarkan wilayah di Indonesia",
    href: "/admin/reports/demographics",
    icon: MapPin,
    color: "text-blue-600",
  },
  {
    title: "Pendapatan Platform",
    description: "Laporan pendapatan dan fee platform",
    href: "/admin/ad-revenue",
    icon: Receipt,
    color: "text-green-600",
  },
  {
    title: "Analitik Keuntungan",
    description: "Dashboard keuntungan platform dan owner",
    href: "/admin/analytics",
    icon: TrendingUp,
    color: "text-purple-600",
  },
  {
    title: "Audit Logs",
    description: "Log aktivitas semua pengguna",
    href: "/admin/audit-logs",
    icon: FileText,
    color: "text-orange-600",
  },
  {
    title: "Data Pengguna",
    description: "Kelola dan ekspor data pengguna",
    href: "/admin/users",
    icon: Users,
    color: "text-cyan-600",
  },
];

export default withAdminAuth(AdminReportsPage);

function AdminReportsPage() {
  const locale = useLocale();

  return (
    <div className="container py-6 space-y-6">
      <div>
        <BreadcrumbNav
          items={[
            { label: "Dashboard Admin", href: "/admin" },
            { label: "Laporan" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight mt-2">Laporan</h1>
        <p className="text-muted-foreground">
          Akses semua laporan dan analitik platform
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.href} href={`/${locale}${report.href}`}>
            <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-accent ${report.color}`}>
                    <HugeiconsIcon
                      icon={report.icon}
                      strokeWidth={2}
                      className="size-6"
                    />
                  </div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
