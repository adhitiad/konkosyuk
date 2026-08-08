'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, CreditCard, Shield, Bell } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (!session || (session.user as any).role !== 'admin')) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  if (isPending) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!session) return null;

  const menus = [
    {
      title: 'Monetisasi & Fee',
      description: 'Atur persentase fee platform dan harga featured listing',
      icon: CreditCard,
      href: '/admin/settings/monetization'
    },
    {
      title: 'Keamanan & KYC',
      description: 'Kelola aturan verifikasi dokumen owner',
      icon: Shield,
      href: '/admin/kyc-requests'
    },
    {
      title: 'Notifikasi Sistem',
      description: 'Atur template email dan push notification',
      icon: Bell,
      href: '/admin/settings/notifications'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Pengaturan Sistem
        </h1>
        <p className="text-muted-foreground">Kelola konfigurasi global platform KonkosYuk</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menus.map((menu) => (
          <Card key={menu.title} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(menu.href)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <menu.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{menu.title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{menu.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
