"use client";

import { useSession } from "@/lib/auth-client";
import type { Role } from "@/lib/auth";
import type { SessionUserWithRole } from "@/lib/auth-client";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Search,
  User,
  Building2,
  Layers,
  BarChart3,
  Users,
  Activity,
  IdCard,
  Wallet,
  Settings,
  Bell,
  FileText,
  Shield,
  HeartPulse,
  Wrench,
  MessageSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/logo";

const menuConfig: Record<
  Role,
  { title: string; href: string; icon: React.ElementType }[]
> = {
  cust: [
    { title: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "myBookings", href: "/dashboard/bookings", icon: CalendarDays },
    { title: "payment", href: "/dashboard/payments", icon: CreditCard },
    { title: "maintenance", href: "/dashboard/maintenance", icon: Wrench },
    { title: "search", href: "/properties", icon: Search },
    { title: "chat", href: "/chat", icon: MessageSquare },
    { title: "notifications", href: "/notifications", icon: Bell },
    { title: "pengaturanProfil", href: "/settings/profile", icon: User },
  ],
  owner: [
    { title: "dashboard", href: "/owner", icon: LayoutDashboard },
    { title: "myProperties", href: "/owner/properties", icon: Building2 },
    { title: "units", href: "/owner/units", icon: Layers },
    { title: "incomingBookings", href: "/owner/bookings", icon: CalendarDays },
    { title: "bookingRequests", href: "/owner/booking-requests", icon: Users },
    { title: "chat", href: "/chat", icon: MessageSquare },
    { title: "maintenance", href: "/owner/maintenance", icon: Wrench },
    { title: "analytics", href: "/owner/analytics", icon: BarChart3 },
    { title: "reports", href: "/owner/reports", icon: FileText },
    { title: "notifications", href: "/notifications", icon: Bell },
    { title: "wallet", href: "/owner/wallet", icon: Wallet },
    {
      title: "bankAccounts",
      href: "/owner/settings/bank-accounts",
      icon: CreditCard,
    },
    { title: "kyc", href: "/owner/kyc", icon: IdCard },
    { title: "pengaturanProfil", href: "/settings/profile", icon: User },
  ],
  admin: [
    { title: "dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "analytics", href: "/admin/analytics", icon: BarChart3 },
    { title: "users", href: "/admin/users", icon: Users },
    { title: "properties", href: "/admin/properties", icon: Building2 },
    { title: "booking", href: "/admin/bookings", icon: CalendarDays },
    { title: "payment", href: "/admin/payments", icon: CreditCard },
    { title: "paymentGateways", href: "/admin/payment-gateways", icon: Wallet },
    { title: "webhookLog", href: "/admin/webhooks", icon: Activity },
    { title: "kycRequests", href: "/admin/kyc-requests", icon: IdCard },
    { title: "notifications", href: "/admin/notifications", icon: Bell },
    {
      title: "notificationSettings",
      href: "/admin/settings/notifications",
      icon: Settings,
    },
    { title: "maintenance", href: "/admin/maintenance-reports", icon: Wrench },
    { title: "systemHealth", href: "/admin/system-health", icon: HeartPulse },
    { title: "activityLogs", href: "/admin/activity-logs", icon: FileText },
    { title: "auditLogs", href: "/admin/audit-logs", icon: Shield },
    { title: "generalLedger", href: "/admin/general-ledger", icon: FileText },
    { title: "reports", href: "/admin/reports/demographics", icon: BarChart3 },
    { title: "appSettings", href: "/admin/settings", icon: Settings },
    { title: "settings", href: "/admin/settings/monetization", icon: Settings },
    { title: "pengaturanProfil", href: "/settings/profile", icon: User },
  ],
  staff: [
    { title: "dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "analytics", href: "/admin/analytics", icon: BarChart3 },
    { title: "users", href: "/admin/users", icon: Users },
    { title: "properties", href: "/admin/properties", icon: Building2 },
    { title: "booking", href: "/admin/bookings", icon: CalendarDays },
    { title: "payment", href: "/admin/payments", icon: CreditCard },
    { title: "paymentGateways", href: "/admin/payment-gateways", icon: Wallet },
    { title: "webhookLog", href: "/admin/webhooks", icon: Activity },
    { title: "kycRequests", href: "/admin/kyc-requests", icon: IdCard },
    { title: "notifications", href: "/admin/notifications", icon: Bell },
    {
      title: "notificationSettings",
      href: "/admin/settings/notifications",
      icon: Settings,
    },
    { title: "maintenance", href: "/admin/maintenance-reports", icon: Wrench },
    { title: "systemHealth", href: "/admin/system-health", icon: HeartPulse },
    { title: "activityLogs", href: "/admin/activity-logs", icon: FileText },
    { title: "auditLogs", href: "/admin/audit-logs", icon: Shield },
    { title: "generalLedger", href: "/admin/general-ledger", icon: FileText },
    { title: "reports", href: "/admin/reports/demographics", icon: BarChart3 },
    { title: "pengaturanProfil", href: "/settings/profile", icon: User },
  ],
};

export function AppSidebar() {
  const { data: session } = useSession();
  const t = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const user = session?.user as SessionUserWithRole | undefined;

  const role = (user?.role as Role | undefined) ?? "cust";
  const items = menuConfig[role] ?? menuConfig.cust;

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Logo withText={false} className="shrink-0" />
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            {t("appName")}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{tSidebar("menu")}</SidebarGroupLabel>
          <SidebarMenu>
            {items?.map((item: any) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={
                    <Link href={item.href}>
                      <item.icon />
                      <span>{t(item.title)}</span>
                    </Link>
                  }
                  tooltip={t(item.title)}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.image ?? undefined}
              alt={user?.name ?? ""}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            {user?.reputationScore !== undefined && (
              <span className="text-xs text-muted-foreground">
                Reputasi: {Number(user.reputationScore).toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <div className="px-2 group-data-[collapsible=icon]:px-0">
          <LogoutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
