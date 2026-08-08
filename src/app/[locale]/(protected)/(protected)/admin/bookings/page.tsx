'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Eye } from 'lucide-react';

type Booking = {
  id: string;
  code: string;
  customerName: string;
  propertyTitle: string;
  unitName: string;
  startDate: string;
  status: string;
  totalPrice: string;
};

export default function AdminBookingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && (!session || !['admin', 'staff'].includes((session.user as any).role))) {
      router.push('/login');
      return;
    }

    fetch('/api/bookings')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch bookings')
        return res.json()
      })
      .then(data => {
        const items = Array.isArray(data.data) ? data.data : []
        const mapped = items.map((b: any) => ({
          id: b.id,
          code: b.id.slice(0, 8),
          customerName: b.userName || b.userEmail || '-',
          propertyTitle: b.propertyName || '-',
          unitName: b.unitName || '-',
          startDate: b.startDate,
          status: b.status,
          totalPrice: b.metadata?.totalPrice ? String(b.metadata.totalPrice) : '0',
        }))
        setBookings(mapped)
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [session, isPending, router]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending_dp: { label: 'Pending DP', variant: 'secondary' },
      awaiting_owner_approval: { label: 'Menunggu Owner', variant: 'outline' },
      awaiting_full_payment: { label: 'Menunggu Pembayaran', variant: 'secondary' },
      confirmed: { label: 'Dikonfirmasi', variant: 'default' },
      rejected: { label: 'Ditolak', variant: 'destructive' },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' }
    };
    const { label, variant } = config[status] || { label: status.replace(/_/g, ' ').toUpperCase(), variant: 'outline' as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isPending || loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Manajemen Booking
        </h1>
        <p className="text-muted-foreground">Lihat semua booking dalam sistem</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Properti</TableHead>
                <TableHead>Tanggal Mulai</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-sm">{booking.code}</TableCell>
                  <TableCell>{booking.customerName}</TableCell>
                  <TableCell>{booking.propertyTitle} - {booking.unitName}</TableCell>
                  <TableCell>{new Date(booking.startDate).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>Rp {parseInt(booking.totalPrice).toLocaleString('id-ID')}</TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/bookings/${booking.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
