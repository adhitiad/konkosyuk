import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/config";
import { Providers } from "@/app/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <ThemeProvider>
      <LanguageProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TooltipProvider>
            <Providers>{children}</Providers>
          </TooltipProvider>
        </NextIntlClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
