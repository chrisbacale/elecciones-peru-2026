"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Cambiar a modo día" : "Cambiar a modo noche";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-card-border bg-card/80 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
