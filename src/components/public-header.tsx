"use client";

import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/logo";

const publicNavItems = [
  {
    title: "findKost",
    href: "/properties",
    icon: Home01Icon,
    description: "findKostDesc",
  },
  {
    title: "aboutUs",
    href: "/about",
    icon: InformationCircleIcon,
    description: "aboutUsDesc",
  },
];

export function PublicHeader() {
  const t = useTranslations("public");
  const tCommon = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo withText />
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {publicNavItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuTrigger>{t(item.title)}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
                      <Link
                        href={item.href}
                        className="flex items-start gap-4 rounded-lg p-3 hover:bg-muted"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <HugeiconsIcon
                            icon={item.icon}
                            strokeWidth={2}
                            className="size-5"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t(item.title)}</p>
                          <p className="text-xs text-muted-foreground">
                            {t(item.description)}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
              <NavigationMenuItem>
                <Link href="/properties" className={navigationMenuTriggerStyle()}>
                  {t("viewAll")}
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Button render={<Link href="/login">Masuk</Link>} variant="ghost" nativeButton={false} />
          <Button render={<Link href="/register">Daftar</Link>} nativeButton={false} />
        </div>
      </div>
    </header>
  );
}
