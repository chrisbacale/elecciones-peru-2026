"use client";

import { cn } from "@/lib/utils";
import type { InstrumentProvider } from "./utils";

type InstrumentFilterProps = {
  value: InstrumentProvider;
  onChange: (value: InstrumentProvider) => void;
  showDatum: boolean;
};

const OPTIONS: Array<{ id: InstrumentProvider; label: string }> = [
  { id: "ipsos", label: "Ipsos" },
  { id: "datum", label: "Datum" },
];

export function InstrumentFilter({
  value,
  onChange,
  showDatum,
}: InstrumentFilterProps) {
  const visible = showDatum ? OPTIONS : OPTIONS.filter((o) => o.id === "ipsos");

  return (
    <div
      className="inline-flex rounded-lg border border-card-border bg-card/70 p-1"
      role="group"
      aria-label="Filtrar por instrumento"
    >
      {visible.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            value === option.id
              ? "bg-accent text-foreground shadow-sm"
              : "text-muted hover:bg-accent/50 hover:text-foreground"
          )}
          aria-pressed={value === option.id}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
