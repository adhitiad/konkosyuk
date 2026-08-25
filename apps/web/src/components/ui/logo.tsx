"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

interface LogoProps {
  /** Extra Tailwind classes for the outer wrapper */
  className?: string;
  /** Show the "KonkosYuk" text beside the logo (default: true) */
  withText?: boolean;
  /** Override the link destination (default: "/") */
  href?: string;
}

/**
 * Reusable brand logo component.
 *
 * - `withText=true`  → logo image + "KonkosYuk" text (navbar, footer, auth pages)
 * - `withText=false` → logo image only (sidebar icon)
 *
 * Always wrapped in a `<Link>` so clicking it navigates home.
 */
export function Logo({ className, withText = true, href = "/" }: LogoProps) {
  const locale = useLocale();
  return (
    <Link
      href={`/${locale}${href}`}
      className={cn("flex items-center gap-2", className)}
    >
      <Image
        src="/logo-icon.svg"
        alt="KonkosYuk"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0"
        priority
      />
      {withText && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          KonkosYuk
        </span>
      )}
    </Link>
  );
}
