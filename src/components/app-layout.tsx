'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppNavbar } from '@/components/app-navbar'

export function AppLayout({ children, role }: { children: React.ReactNode; role?: 'cust' | 'owner' | 'admin' | 'staff' }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppNavbar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}