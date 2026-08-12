'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppNavbar } from '@/components/app-navbar'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}

export function AppLayout({ children, role }: { children: React.ReactNode; role?: 'cust' | 'owner' | 'admin' | 'staff' }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppNavbar />
        <Suspense fallback={<PageSkeleton />}>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}