import { createNavigation } from 'next-intl/navigation'

export const locales = ['en', 'id', 'my', 'th', 'vi', 'ko', 'zh', 'ru'] as const
export type Locale = (typeof locales)[number]
export const localePrefix = 'always'
export const { Link, redirect, usePathname, useRouter } = createNavigation({ locales, localePrefix })