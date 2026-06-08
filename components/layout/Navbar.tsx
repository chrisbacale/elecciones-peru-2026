"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  History,
  LayoutDashboard,
  Map,
  Scale,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/estadistica", label: "Estadística", icon: BarChart3 },
  { href: "/prediccion", label: "Predicción", icon: TrendingUp },
  { href: "/territorial", label: "Territorial", icon: Map },
  { href: "/consistencia", label: "Consistencia", icon: Scale },
  { href: "/metodologia", label: "Metodología", icon: BookOpen },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-card-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-keiko to-sanchez text-sm font-bold text-white shadow-lg shadow-keiko/20"
            aria-hidden="true"
          >
            PE
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Radar Electoral
            </p>
            <p className="text-[11px] text-muted">Segunda vuelta 2001–2026</p>
          </div>
        </Link>

        <nav
          className="flex flex-1 items-center gap-1 overflow-x-auto pb-1"
          aria-label="Navegación principal"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "bg-accent text-foreground shadow-sm"
                    : "text-muted hover:bg-accent/50 hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
