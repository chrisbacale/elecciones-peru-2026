"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const STORAGE_KEY = "radar-electoral-theme";
const DEFAULT_THEME: Theme = "dark";
const ThemeContext = createContext<ThemeContextValue | null>(null);

const themeSubscribers = new Set<() => void>();

function isTheme(value: string | null | undefined): value is Theme {
  return value === "dark" || value === "light";
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : DEFAULT_THEME;
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

function getBrowserThemeSnapshot(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;

  const currentTheme = document.documentElement.dataset.theme;
  if (isTheme(currentTheme)) return currentTheme;

  return getStoredTheme() ?? getSystemTheme();
}

function getServerThemeSnapshot(): Theme {
  return DEFAULT_THEME;
}

function emitThemeChange() {
  themeSubscribers.forEach((callback) => callback());
}

function subscribeToTheme(callback: () => void) {
  themeSubscribers.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    themeSubscribers.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The DOM theme still updates if storage is unavailable.
    }
  }

  emitThemeChange();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getBrowserThemeSnapshot,
    getServerThemeSnapshot,
  );

  const toggleTheme = useCallback(() => {
    const currentTheme = getBrowserThemeSnapshot();
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
