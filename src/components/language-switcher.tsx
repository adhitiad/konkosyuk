"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Language, languages } from "@/lib/i18n";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const current =
    languages[locale as keyof typeof languages] || languages["id"];

  function handleLanguageChange(nextLocale: string) {
    if (nextLocale !== locale) {
      router.push(pathname, { locale: nextLocale });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <span className="text-base">{current.flag}</span>
        <span className="sr-only">Switch language</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([key, value]) => (
          <DropdownMenuItem key={key} onClick={() => handleLanguageChange(key)}>
            <span className="mr-2">{value.flag}</span>
            {value.nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
