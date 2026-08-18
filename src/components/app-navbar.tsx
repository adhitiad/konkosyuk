"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import NotificationBell from "@/components/notification-bell";
import { PushNotificationToggle } from "@/components/push-notification-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "@/config";
import type { SessionUserWithRole } from "@/lib/auth-client";
import { useTranslations } from "next-intl";

export function AppNavbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("common");
  const user = session?.user as SessionUserWithRole | undefined;

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  return (
    <header className="flex h-16 items-center justify-between border-b px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <span className="font-semibold">{t("appName")}</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <LanguageSwitcher />
        <NotificationBell />
        <PushNotificationToggle />
        <DropdownMenu>
          <Button
            render={<DropdownMenuTrigger />}
            variant="ghost"
            className="relative h-9 w-9 rounded-full"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={user?.image ?? undefined}
                alt={user?.name ?? ""}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {user?.role && (
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="w-fit"
                    >
                      {user.role}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/settings/profile")}
              >
                <HugeiconsIcon
                  icon={Settings01Icon}
                  strokeWidth={2}
                  className="mr-2 size-4"
                />
                {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.href = "/login";
                }}
              >
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="mr-2 size-4"
                />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
