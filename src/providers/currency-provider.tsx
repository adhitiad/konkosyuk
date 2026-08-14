"use client";

import { createContext, useContext, use, ReactNode } from "react";
import { cookies } from "next/headers";

export type Currency = "IDR" | "USD" | "EUR" | "SGD" | "MYR";

export const currencyConfig: Record<Currency, { locale: string; currency: string; symbol: string }> = {
  IDR: { locale: "id-ID", currency: "IDR", symbol: "Rp" },
  USD: { locale: "en-US", currency: "USD", symbol: "$" },
  EUR: { locale: "de-DE", currency: "EUR", symbol: "€" },
  SGD: { locale: "en-SG", currency: "SGD", symbol: "S$" },
  MYR: { locale: "ms-MY", currency: "MYR", symbol: "RM" },
};

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (value: number) => string;
  convertCurrency: (value: number, from: Currency, to: Currency) => number;
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

async function getCurrencyFromCookie(): Promise<Currency> {
  const cookieStore = await cookies();
  const cookieCurrency = cookieStore.get("currency")?.value;
  if (cookieCurrency && cookieCurrency in currencyConfig) {
    return cookieCurrency as Currency;
  }
  return "IDR";
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const cookieCurrencyPromise = getCurrencyFromCookie();

  return (
    <CurrencyContextInner cookieCurrencyPromise={cookieCurrencyPromise}>
      {children}
    </CurrencyContextInner>
  );
}

function CurrencyContextInner({
  cookieCurrencyPromise,
  children,
}: {
  cookieCurrencyPromise: Promise<Currency>;
  children: ReactNode;
}) {
  const cookieCurrency = use(cookieCurrencyPromise);

  const setCurrency = (currency: Currency) => {
    document.cookie = `currency=${currency}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  const formatCurrencyValue = (value: number): string => {
    const config = currencyConfig[cookieCurrency];
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
    }).format(value);
  };

  const convertCurrency = (value: number, from: Currency, to: Currency): number => {
    if (from === to) return value;
    const rates: Record<Currency, number> = {
      IDR: 1,
      USD: 0.000064,
      EUR: 0.000059,
      SGD: 0.000086,
      MYR: 0.00029,
    };
    const fromRate = rates[from];
    const toRate = rates[to];
    return (value / fromRate) * toRate;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency: cookieCurrency,
        setCurrency,
        formatCurrency: formatCurrencyValue,
        convertCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
