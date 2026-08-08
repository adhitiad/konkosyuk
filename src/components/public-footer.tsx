'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/logo'

export function PublicFooter() {
  const t = useTranslations('public')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
              <Logo withText />
            <p className="mt-2 text-sm text-muted-foreground">
              {t('tagline')}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">{t('nav')}</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/properties" className="hover:text-foreground">{t('findKost')}</Link></li>
              <li><Link href="/about" className="hover:text-foreground">{t('aboutUs')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">{t('help')}</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/faq" className="hover:text-foreground">{t('faq')}</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">{t('contact')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">{t('legal')}</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">{t('privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">{t('terms')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          {t('copyright', { year })}
        </div>
      </div>
    </footer>
  )
}