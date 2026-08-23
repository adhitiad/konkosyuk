import type { Currency } from "@/providers/currency-provider";

export const currencyConfig: Record<
  Currency,
  { locale: string; currency: string; symbol: string }
> = {
  IDR: { locale: "id-ID", currency: "IDR", symbol: "Rp" },
  USD: { locale: "en-US", currency: "USD", symbol: "$" },
  EUR: { locale: "de-DE", currency: "EUR", symbol: "€" },
  SGD: { locale: "en-SG", currency: "SGD", symbol: "S$" },
  MYR: { locale: "ms-MY", currency: "MYR", symbol: "RM" },
};

export function formatCurrency(
  value: number,
  currency: Currency = "IDR",
): string {
  const config = currencyConfig[currency];
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
  }).format(value);
}
