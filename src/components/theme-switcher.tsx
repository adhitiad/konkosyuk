"use client";

import { useTheme } from "@/components/theme-provider";
import { themes } from "@/lib/themes";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sun01Icon,
  Moon02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <HugeiconsIcon
          icon={
            theme === "light"
              ? Sun01Icon
              : theme === "dark"
                ? Moon02Icon
                : SparklesIcon
          }
          strokeWidth={2}
        />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(themes).map(([key, value]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setTheme(key as typeof theme)}
            data-active={theme === key}
          >
            {value.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
