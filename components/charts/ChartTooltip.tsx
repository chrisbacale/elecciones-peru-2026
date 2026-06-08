"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TooltipPayload = {
  dataKey?: string | number;
  name?: string | number;
  value?: unknown;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  labelFormatter?: (label: string | number | undefined) => ReactNode;
  nameFormatter?: (name: string | number | undefined, entry: TooltipPayload) => ReactNode;
  valueFormatter?: (value: unknown, entry: TooltipPayload) => ReactNode;
  note?: ReactNode;
  className?: string;
};

function defaultValueFormatter(value: unknown) {
  if (typeof value === "number") return value.toFixed(2);
  if (value === null || value === undefined) return "—";
  return String(value);
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  nameFormatter,
  valueFormatter = defaultValueFormatter,
  note,
  className,
}: ChartTooltipProps) {
  const entries = payload?.filter((entry) => entry.value !== null && entry.value !== undefined) ?? [];
  if (!active || entries.length === 0) return null;

  return (
    <div
      className={cn(
        "z-50 min-w-40 max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-card-border bg-card/95 px-3 py-2 text-card-foreground shadow-xl shadow-black/30 ring-1 ring-border/40 backdrop-blur",
        className
      )}
    >
      {label !== undefined && (
        <p className="mb-1.5 text-sm font-semibold text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <ul className="space-y-1">
        {entries.map((entry) => {
          const color = entry.color ?? entry.fill ?? "var(--muted)";
          const name = entry.name ?? entry.dataKey;

          return (
            <li key={`${entry.dataKey ?? entry.name}-${String(entry.value)}`} className="flex items-start gap-2 text-xs">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 text-muted">
                {nameFormatter ? nameFormatter(name, entry) : name}
              </span>
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {valueFormatter(entry.value, entry)}
              </span>
            </li>
          );
        })}
      </ul>
      {note && <p className="mt-2 max-w-64 text-xs leading-relaxed text-muted">{note}</p>}
    </div>
  );
}
