"use client";

import { createContext, useContext, useState } from "react";
import type { Language } from "@/lib/i18n";
import { languages } from "@/lib/i18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("language") as Language | null;
      if (stored && languages[stored]) {
        return stored;
      }
    }
    return "id";
  });

  function handleSetLanguage(next: Language) {
    setLanguage(next);
    localStorage.setItem("language", next);
    document.cookie = `googtrans=/${next}; path=/`;
    document.cookie = `googtrans=/${next}; path=/; domain=${window.location.hostname}`;
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
