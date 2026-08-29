"use client";

import { useSession } from "@/lib/auth-client";
import type { Role } from "@/lib/auth";
import type { SessionUserWithRole } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
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
  Wrench,
  MessageSquare,
  BadgePercentIcon,
  Heart,
  Landmark,
  Receipt,
  RefreshCw,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { SidebarGroupedMenu } from "@/components/sidebar-grouped-menu";
import type { SidebarGroup } from "@/components/sidebar-grouped-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";

const custDashboardGroup: SidebarGroup = {
  label: "dashboard",
  icon: LayoutDashboard,
  items: [
    { title: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "myBookings", href: "/dashboard/bookings", icon: CalendarDays },
    { title: "groupBookings", href: "/dashboard/group-bookings", icon: Users },
    { title: "inspections", href: "/dashboard/inspections", icon: FileText },
    { title: "favorites", href: "/dashboard/favorites", icon: Heart },
    { title: "loyalty", href: "/dashboard/loyalty", icon: BadgePercentIcon },
    { title: "maintenance", href: "/dashboard/maintenance", icon: Wrench },
    { title: "referrals", href: "/dashboard/referrals", icon: Users },
    { title: "payment", href: "/dashboard/payments", icon: CreditCard },
  ],
};

const keuanganGroup: SidebarGroup = {
  label: "keuangan",
  icon: Wallet,
  items: [{ title: "wallet", href: "/owner/wallet", icon: Wallet }],
};

const bookGroup: SidebarGroup = {
  label: "book",
  icon: CalendarDays,
  items: [
    { title: "myBookings", href: "/owner/bookings", icon: CalendarDays },
    { title: "bookingRequests", href: "/owner/booking-requests", icon: Users },
    { title: "groupBookings", href: "/owner/group-bookings", icon: Users },
  ],
};

const analitikGroup: SidebarGroup = {
  label: "analitik",
  icon: BarChart3,
  items: [
    { title: "analytics", href: "/owner/analytics", icon: BarChart3 },
    { title: "insights", href: "/owner/insights", icon: Activity },
    { title: "reports", href: "/owner/reports", icon: FileText },
    { title: "generalLedger", href: "/admin/general-ledger", icon: Landmark },
    { title: "auditLogs", href: "/admin/audit-logs", icon: Shield },
  ],
};

const alatGroup: SidebarGroup = {
  label: "alat",
  icon: Wrench,
  items: [
    { title: "savedSearches", href: "/saved-searches", icon: Search },
    { title: "maintenance", href: "/owner/maintenance", icon: Wrench },
    { title: "pricing", href: "/owner/pricing", icon: BadgePercentIcon },
    { title: "units", href: "/owner/units", icon: Layers },
    { title: "kyc", href: "/owner/kyc", icon: IdCard },
    { title: "myProperties", href: "/owner/properties", icon: Building2 },
    { title: "ads", href: "/admin/ads", icon: Globe },
    { title: "adPackages", href: "/admin/ad-packages", icon: BadgePercentIcon },
    { title: "featureFlags", href: "/admin/feature-flags", icon: BadgePercentIcon },
    { title: "systemHealth", href: "/admin/system-health", icon: Shield },
    { title: "webhookLog", href: "/admin/webhooks", icon: Activity },
    { title: "activityLogs", href: "/admin/activity-logs", icon: FileText },
  ],
};

const chatGroup: SidebarGroup = {
  label: "chat",
  icon: MessageSquare,
  items: [{ title: "chat", href: "/chat", icon: MessageSquare }],
};

const notifikasiGroup: SidebarGroup = {
  label: "notifikasi",
  icon: Bell,
  items: [
    { title: "notifications", href: "/notifications", icon: Bell },
    { title: "pushNotifications", href: "/admin/push-notifications", icon: Bell },
    { title: "notificationSettings", href: "/admin/settings/notifications", icon: Settings },
  ],
};

const profilGroup: SidebarGroup = {
  label: "profil",
  icon: User,
  items: [
    { title: "pengaturanProfil", href: "/settings/profile", icon: User },
  ],
};

const adminDashboardGroup: SidebarGroup = {
  label: "dashboard",
  icon: LayoutDashboard,
  items: [
    { title: "dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "analytics", href: "/admin/analytics", icon: BarChart3 },
    { title: "users", href: "/admin/users", icon: Users },
    { title: "properties", href: "/admin/properties", icon: Building2 },
    { title: "payment", href: "/admin/payments", icon: CreditCard },
    { title: "paymentGateways", href: "/admin/payment-gateways", icon: Wallet },
    { title: "kycRequests", href: "/admin/kyc-requests", icon: IdCard },
    { title: "maintenance", href: "/admin/maintenance-reports", icon: Wrench },
    { title: "refundRequests", href: "/admin/refund-requests", icon: RefreshCw },
    { title: "adRevenue", href: "/admin/ad-revenue", icon: Receipt },
    { title: "costs", href: "/admin/costs", icon: Receipt },
  ],
};

const menuConfig: Record<Role, SidebarGroup[]> = {
  cust: [
    custDashboardGroup,
    keuanganGroup,
    bookGroup,
    analitikGroup,
    alatGroup,
    chatGroup,
    notifikasiGroup,
    profilGroup,
  ],
  owner: [
    {
      label: "dashboard",
      icon: LayoutDashboard,
      items: [
        { title: "dashboard", href: "/owner", icon: LayoutDashboard },
        { title: "favorites", href: "/dashboard/favorites", icon: Heart },
        { title: "loyalty", href: "/dashboard/loyalty", icon: BadgePercentIcon },
        { title: "maintenance", href: "/owner/maintenance", icon: Wrench },
        { title: "inspections", href: "/owner/inspections", icon: FileText },
        { title: "payment", href: "/dashboard/payments", icon: CreditCard },
        { title: "referrals", href: "/dashboard/referrals", icon: Users },
      ],
    },
    keuanganGroup,
    bookGroup,
    {
      label: "analitik",
      icon: BarChart3,
      items: [
        { title: "analytics", href: "/owner/analytics", icon: BarChart3 },
        { title: "insights", href: "/owner/insights", icon: Activity },
        { title: "reports", href: "/owner/reports", icon: FileText },
    ],
    },
    {
      label: "alat",
      icon: Wrench,
      items: [
        { title: "pricing", href: "/owner/pricing", icon: BadgePercentIcon },
        { title: "units", href: "/owner/units", icon: Layers },
        { title: "kyc", href: "/owner/kyc", icon: IdCard },
        { title: "myProperties", href: "/owner/properties", icon: Building2 },
    ],
    },
    chatGroup,
    notifikasiGroup,
    profilGroup,
  ],
  admin: [
    adminDashboardGroup,
    {
      label: "keuangan",
      icon: Wallet,
      items: [
        { title: "wallet", href: "/owner/wallet", icon: Wallet },
        { title: "bankAccounts", href: "/owner/settings/bank-accounts", icon: CreditCard },
        { title: "refundRequests", href: "/admin/refund-requests", icon: RefreshCw },
        { title: "adRevenue", href: "/admin/ad-revenue", icon: Receipt },
        { title: "costs", href: "/admin/costs", icon: Receipt },
    ],
    },
    {
      label: "book",
      icon: CalendarDays,
      items: [
        { title: "incomingBookings", href: "/admin/bookings", icon: CalendarDays },
    ],
    },
    analitikGroup,
    {
      label: "alat",
      icon: Wrench,
      items: [
        { title: "systemHealth", href: "/admin/system-health", icon: Shield },
        { title: "featureFlags", href: "/admin/feature-flags", icon: BadgePercentIcon },
        { title: "webhookLog", href: "/admin/webhooks", icon: Activity },
        { title: "activityLogs", href: "/admin/activity-logs", icon: FileText },
        { title: "ads", href: "/admin/ads", icon: Globe },
        { title: "adPackages", href: "/admin/ad-packages", icon: BadgePercentIcon },
        { title: "appSettings", href: "/admin/settings", icon: Settings },
        { title: "settings", href: "/admin/settings/monetization", icon: BadgePercentIcon },
      ],
    },
    chatGroup,
    notifikasiGroup,
    profilGroup,
  ],
  staff: [
    adminDashboardGroup,
    {
      label: "keuangan",
      icon: Wallet,
      items: [
        { title: "wallet", href: "/owner/wallet", icon: Wallet },
        { title: "bankAccounts", href: "/owner/settings/bank-accounts", icon: CreditCard },
        { title: "refundRequests", href: "/admin/refund-requests", icon: RefreshCw },
      ],
    },
    {
      label: "book",
      icon: CalendarDays,
      items: [
        { title: "incomingBookings", href: "/admin/bookings", icon: CalendarDays },
      ],
    },
    analitikGroup,
    {
      label: "alat",
      icon: Wrench,
      items: [
        { title: "systemHealth", href: "/admin/system-health", icon: Shield },
        { title: "webhookLog", href: "/admin/webhooks", icon: Activity },
        { title: "activityLogs", href: "/admin/activity-logs", icon: FileText },
        { title: "appSettings", href: "/admin/settings", icon: Settings },
      ],
    },
    chatGroup,
    notifikasiGroup,
    profilGroup,
  ],
};

export function AppSidebar() {
  const { data: session } = useSession();
  const t = useTranslations("common");
  const user = session?.user as SessionUserWithRole | undefined;

  const role = (user?.role as Role | undefined) ?? "cust";
  const groups = menuConfig[role] ?? menuConfig.cust;

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
        <SidebarGroupedMenu groups={groups} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
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
