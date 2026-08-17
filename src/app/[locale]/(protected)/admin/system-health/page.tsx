"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HeartPulse,
  Database,
  CreditCard,
  Cloud,
  Activity,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "@/lib/axios";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { withAdminAuth } from "@/lib/with-admin-auth";

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "down" | "checking";
  latency?: number;
  message?: string;
}

interface SystemHealth {
  overall: "healthy" | "degraded" | "down";
  checks: HealthCheck[];
  stats: {
    activeUsers: number;
    errorRate24h: number;
    avgResponseTime: number;
  };
  lastChecked: string;
}

export default withAdminAuth(SystemHealthPage);

function SystemHealthPage() {
  const [mounted, setMounted] = useState(false);

  // Set mounted on initial mount without setState in effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Alternative: just use the initial state value
  // mounted is already false by default, and we can set it in the component

  const { data, isLoading, refetch } = useQuery<SystemHealth>({
    queryKey: ["system-health"],
    queryFn: async () => {
      const checks: HealthCheck[] = [
        {
          name: "Database",
          status: "checking",
        },
        {
          name: "Payment Gateway",
          status: "checking",
        },
        {
          name: "Cloud Storage",
          status: "checking",
        },
      ];

      const startTime = Date.now();

      try {
        const dbRes = await apiClient.get("/api/health/db");
        checks[0] = {
          name: "Database",
          status: dbRes.status < 400 ? "healthy" : "down",
          latency: Date.now() - startTime,
          message: dbRes.data.message,
        };
      } catch {
        checks[0] = {
          name: "Database",
          status: "down",
          message: "Tidak dapat terhubung",
        };
      }

      const paymentStart = Date.now();
      try {
        const paymentRes = await apiClient.get("/api/health/payment");
        checks[1] = {
          name: "Payment Gateway",
          status: paymentRes.status < 400 ? "healthy" : "degraded",
          latency: Date.now() - paymentStart,
          message: paymentRes.data.message,
        };
      } catch {
        checks[1] = {
          name: "Payment Gateway",
          status: "degraded",
          message: "Service unavailable",
        };
      }

      const storageStart = Date.now();
      try {
        const storageRes = await apiClient.get("/api/health/storage");
        checks[2] = {
          name: "Cloud Storage",
          status: storageRes.status < 400 ? "healthy" : "degraded",
          latency: Date.now() - storageStart,
          message: storageRes.data.message,
        };
      } catch {
        checks[2] = {
          name: "Cloud Storage",
          status: "degraded",
          message: "Service unavailable",
        };
      }

      const overall = checks.every((c) => c.status === "healthy")
        ? "healthy"
        : checks.some((c) => c.status === "down")
          ? "down"
          : "degraded";

      let stats = {
        activeUsers: 0,
        errorRate24h: 0,
        avgResponseTime: 0,
      };

      try {
        const statsRes = await apiClient.get("/api/admin/health/stats");
        if (statsRes.status < 400 && statsRes.data?.data) {
          stats = {
            activeUsers: statsRes.data.data.activeUsers ?? 0,
            errorRate24h: statsRes.data.data.errorRate24h ?? 0,
            avgResponseTime: statsRes.data.data.avgResponseTime ?? 0,
          };
        }
      } catch {
        // stats endpoint not available, use defaults
      }

      return {
        overall,
        checks,
        stats,
        lastChecked: new Date().toISOString(),
      };
    },
    refetchInterval: 30000,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
            Healthy
          </Badge>
        );
      case "degraded":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            Degraded
          </Badge>
        );
      case "down":
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="secondary">Checking...</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="size-5 text-green-600" />;
      case "degraded":
        return <AlertCircle className="size-5 text-yellow-600" />;
      case "down":
        return <AlertCircle className="size-5 text-red-600" />;
      default:
        return (
          <Activity className="size-5 animate-pulse text-muted-foreground" />
        );
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "System Health" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground">
          Last checked:{" "}
          {data?.lastChecked
            ? new Date(data.lastChecked).toLocaleTimeString("id-ID")
            : "-"}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <Button onClick={() => refetch()} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Status
            </CardTitle>
            <HeartPulse className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                {getStatusIcon(data?.overall || "checking")}
                {getStatusBadge(data?.overall || "checking")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.stats.activeUsers ?? "-"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.stats.avgResponseTime ?? "-"}ms
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {data?.checks.map((check) => (
                <div
                  key={check.name}
                  className="flex items-center justify-between rounded-4xl border p-4"
                >
                  <div className="flex items-center gap-3">
                    {check.status === "healthy" ? (
                      <CheckCircle2 className="size-5 text-green-600" />
                    ) : check.status === "down" ? (
                      <AlertCircle className="size-5 text-red-600" />
                    ) : (
                      <AlertCircle className="size-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{check.name}</p>
                      {check.message && (
                        <p className="text-xs text-muted-foreground">
                          {check.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {check.latency && (
                      <span className="text-xs text-muted-foreground">
                        {check.latency}ms
                      </span>
                    )}
                    {getStatusBadge(check.status)}
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
