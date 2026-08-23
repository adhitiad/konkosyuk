"use client";

import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/logo";
import { Menu, LogOut } from "lucide-react";
import { useLocale } from "next-intl";

const publicNavItems = [
  { title: "findKost", href: "/properties" },
  { title: "aboutUs", href: "/about" },
  { title: "faq", href: "/faq" },
  { title: "contact", href: "/contact" },
];

export function Navbar() {
  const t = useTranslations("public");
  const { data: session } = useSession();
  const user = session?.user;
  const locale = useLocale();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Logo withText href="/" />

        <div className="hidden md:flex items-center gap-6">
          {publicNavItems.map((item) => (
            <Link
              key={item.title}
              href={`/${locale}${item.href}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t(item.title)}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {!user ? (
            <>
              <Button
                render={<Link href={`/${locale}/login`}>Masuk</Link>}
                variant="outline"
                nativeButton={false}
              />
              <Button
                render={<Link href={`/${locale}/register`}>Daftar</Link>}
                variant="default"
                nativeButton={false}
              />
            </>
          ) : (
            <DropdownMenu>
              <Button
                render={<DropdownMenuTrigger />}
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <Link href={`/${locale}/dashboard`}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/${locale}/settings/profile`}>Pengaturan</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOut();
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                    window.location.href = `/${locale}/login`;
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="md:hidden">
          <Sheet>
            <Button
              render={<SheetTrigger />}
              variant="ghost"
              size="icon"
              aria-label="Menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              {!user ? (
                <div className="flex flex-col gap-2 mt-6">
                  <SheetClose>
                    <Button
                      render={<Link href={`/${locale}/login`}>Masuk</Link>}
                      variant="outline"
                      nativeButton={false}
                      className="w-full"
                    />
                  </SheetClose>
                  <SheetClose>
                    <Button
                      render={<Link href={`/${locale}/register`}>Daftar</Link>}
                      variant="default"
                      nativeButton={false}
                      className="w-full"
                    />
                  </SheetClose>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.image ?? undefined}
                        alt={user.name}
                      />
                      <AvatarFallback>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <SheetClose>
                    <Button
                      render={<Link href={`/${locale}/dashboard`}>Dashboard</Link>}
                      variant="default"
                      nativeButton={false}
                      className="w-full"
                    />
                  </SheetClose>
                  <SheetClose>
                    <Button
                      variant="destructive"
                      nativeButton={false}
                      className="w-full"
                      onClick={async () => {
                        await signOut();
                        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                        window.location.href = `/${locale}/login`;
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </SheetClose>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-4 pt-6 border-t">
                {publicNavItems.map((item) => (
                  <SheetClose key={item.title}>
                    <Link
                      href={`/${locale}${item.href}`}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary py-2"
                    >
                      {t(item.title)}
                    </Link>
                  </SheetClose>
                ))}
                <div className="flex flex-col gap-2 pt-2">
                  <ThemeSwitcher />
                  <LanguageSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
