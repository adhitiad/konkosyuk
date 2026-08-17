"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Theme } from "@/lib/themes";
import { themes } from "@/lib/themes";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Initialize theme from localStorage on mount without setState in effect
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored && themes[stored]) {
      applyTheme(stored);
      setTheme(stored);
    } else {
      applyTheme("light");
      setTheme("light");
    }
  }, []);

  function applyTheme(next: Theme) {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "aurora");
    root.classList.add(themes[next].class);
  }

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
