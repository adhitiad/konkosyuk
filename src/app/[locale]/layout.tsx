import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/config';
import { Providers } from '@/app/providers';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/components/language-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <NextIntlClientProvider messages={messages}>
              <TooltipProvider>
                <Providers>{children}</Providers>
              </TooltipProvider>
            </NextIntlClientProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
