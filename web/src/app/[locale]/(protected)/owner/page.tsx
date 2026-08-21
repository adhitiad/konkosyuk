"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { withOwnerAuth } from "@/lib/with-owner-auth";
import { KycGuard } from "@/components/kyc/kyc-guard";

function OwnerDashboardPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Owner</h1>
        <p className="text-muted-foreground">
          Kelola properti dan lihat performa Anda
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Properti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Properti aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Booking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 0</div>
            <p className="text-xs text-muted-foreground">Total pendapatan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Rating rata-rata</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <KycGuard>
            <Link href="/owner/properties">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                Tambah Properti
              </button>
            </Link>
          </KycGuard>
          <Link href="/owner/bookings">
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80">
              Lihat Booking
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default withOwnerAuth(OwnerDashboardPage);
