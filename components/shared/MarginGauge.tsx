"use client";

import { formatPct } from "@/lib/format";

type Band = { label: string; max: number; color: string };

export function MarginGauge({
  marginPp,
  leader,
  bands,
  className,
}: {
  marginPp: number;
  leader: string;
  bands: Band[];
  className?: string;
}) {
  const maxScale = Math.max(8, ...bands.map((b) => b.max), marginPp + 1);
  const position = Math.min((marginPp / maxScale) * 100, 100);

  return (
    <div className={className}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Margen actual
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {marginPp.toFixed(2)} pp
          </p>
        </div>
        <p className="text-sm text-muted">
          Líder:{" "}
          <span className="font-medium text-foreground">{leader}</span>
        </p>
      </div>

      <div
        className="relative h-8 overflow-hidden rounded-lg bg-accent"
        role="meter"
        aria-valuenow={marginPp}
        aria-valuemin={0}
        aria-valuemax={maxScale}
        aria-label={`Margen de ${marginPp.toFixed(2)} puntos porcentuales, líder ${leader}`}
      >
        {bands.map((band, i) => {
          const prevMax = i === 0 ? 0 : bands[i - 1].max;
          const width = ((band.max - prevMax) / maxScale) * 100;
          return (
            <div
              key={band.label}
              className="absolute inset-y-0 opacity-30"
              style={{
                left: `${(prevMax / maxScale) * 100}%`,
                width: `${width}%`,
                backgroundColor: band.color,
              }}
              title={`${band.label}: ≤ ${band.max} pp`}
            />
          );
        })}
        <div
          className="absolute inset-y-0 w-1 rounded-full bg-foreground shadow-lg shadow-foreground/30"
          style={{ left: `calc(${position}% - 2px)` }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {bands.map((band) => (
          <div
            key={band.label}
            className="flex items-center gap-1.5 text-xs text-muted"
          >
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: band.color }}
              aria-hidden="true"
            />
            {band.label}: ≤ {formatPct(band.max, 2).replace("%", " pp")}
          </div>
        ))}
      </div>
    </div>
  );
}
