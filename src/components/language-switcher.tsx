"use client";

import { useLanguage } from "@/components/language-provider";
import { languages } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const current = languages[language];

  function handleLanguageChange(next: string) {
    setLanguage(next as typeof language);
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
          <DropdownMenuItem
            key={key}
            onClick={() => handleLanguageChange(key)}
            data-active={language === key}
          >
            <span className="mr-2">{value.flag}</span>
            {value.nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
