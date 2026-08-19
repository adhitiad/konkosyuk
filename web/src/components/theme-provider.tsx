"use client";

import { createContext, useContext, useState } from "react";
import type { Theme } from "@/lib/themes";
import { themes } from "@/lib/themes";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(next: Theme) {
  if (typeof window !== "undefined") {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "aurora");
    root.classList.add(themes[next].class);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored && themes[stored]) {
        applyTheme(stored);
        return stored;
      }
    }
    applyTheme("light");
    return "light";
  });

  function handleSetTheme(next: Theme) {
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
