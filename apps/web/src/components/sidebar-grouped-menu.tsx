"use client";

import type { ElementType } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { localeHref } from "@/lib/i18n";
import { sidebarMenuButtonVariants } from "@/components/ui/sidebar";

interface SidebarItem {
  title: string;
  href: string;
  icon: ElementType;
}

export interface SidebarGroup {
  label: string;
  icon: ElementType;
  items: SidebarItem[];
}

interface SidebarGroupedMenuProps {
  groups: SidebarGroup[];
}

export function SidebarGroupedMenu({ groups }: SidebarGroupedMenuProps) {
  const t = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();

  return (
    <SidebarMenu>
      {groups.map((group, gi) => (
        <SidebarMenuItem key={`${group.label}-${gi}`}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                sidebarMenuButtonVariants({ variant: "default", size: "default" }),
                "w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                state === "collapsed" && "justify-center",
              )}
            >
              <group.icon className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "whitespace-nowrap",
                  state === "collapsed" && "sr-only",
                )}
              >
                {tSidebar(group.label)}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              sideOffset={8}
              align="start"
              className="w-64 min-w-48 bg-sidebar p-1"
            >
              {group.items.map((item) => {
                const href = localeHref(locale, item.href);
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <DropdownMenuItem
                    key={item.title}
                    onClick={() => router.push(href)}
                    className={cn(
                      "cursor-pointer text-sm outline-hidden select-none",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive &&
                        "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{t(item.title)}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
