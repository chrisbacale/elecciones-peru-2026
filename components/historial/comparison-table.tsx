import { formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { YearRow } from "./utils";
import { formatLeaderLabel } from "./utils";

type ComparisonTableProps = {
  rows: YearRow[];
};

function DeltaCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted">—</span>;
  }

  const sign = value > 0 ? "+" : "";
  const color =
    Math.abs(value) >= 1
      ? value > 0
        ? "text-alerta"
        : "text-onpe"
      : "text-muted";

  return (
    <span className={cn("font-mono text-sm tabular-nums", color)}>
      {sign}
      {value.toFixed(2)} pp
    </span>
  );
}

function StageCell({ row, stageIndex }: { row: YearRow; stageIndex: number }) {
  const stage = row.stages[stageIndex];

  if (stage.pending) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-alerta/30 bg-alerta-muted px-2.5 py-1 text-xs font-medium text-foreground">
        Pendiente
      </span>
    );
  }

  if (stage.marginPp === null || !stage.pair) {
    return <span className="text-muted">—</span>;
  }

  const leader = formatLeaderLabel(
    stage.leader,
    stage.pair,
    row.election
  );

  return (
    <div className="space-y-0.5">
      <div className="font-mono text-sm font-semibold tabular-nums">
        {stage.marginPp.toFixed(2)} pp
      </div>
      <div className="text-xs text-muted">
        {leader} · {formatPct(stage.pair.a, 1)} / {formatPct(stage.pair.b, 1)}
      </div>
    </div>
  );
}

export function ComparisonTable({ rows }: ComparisonTableProps) {
  return (
    <>
    <p className="mb-3 text-xs text-muted">
      Δ firmado: positivo mueve el margen hacia el candidato A de ese año;
      negativo lo mueve hacia el candidato B. El margen mostrado dentro de cada
      etapa sigue siendo absoluto.
    </p>
    <div className="hidden overflow-x-auto rounded-xl border border-card-border bg-card/70 lg:block">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <caption className="sr-only">
          Tabla técnica de deltas por año entre simulacro, boca de urna, conteo
          rápido y ONPE.
        </caption>
        <thead>
          <tr className="border-b border-card-border bg-accent/45">
            <th scope="col" className="px-4 py-3 font-semibold text-muted">
              Año
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-muted">
              Candidatos
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-muted">
              Simulacro
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-muted">
              Δ
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-muted">
              Boca
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-muted">
              Δ
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-muted">
              CR
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-muted">
              Δ
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-muted">
              ONPE 100% / parcial
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.year}
              className={cn(
                "border-b border-card-border/70 transition-colors last:border-0 hover:bg-accent/30",
                row.highlight === "2011-boca-error" &&
                  "bg-alerta-muted",
                row.highlight === "2021-leader-flip" &&
                  "bg-accent/50"
              )}
            >
              <th scope="row" className="px-4 py-4 align-top text-left">
                <div className="font-semibold tabular-nums">{row.year}</div>
                {row.winner && (
                  <div className="mt-1 text-xs text-muted">
                    Ganó: {row.winner.split(" ").pop()}
                  </div>
                )}
                {row.note && (
                  <div
                    className={cn(
                      "mt-2 max-w-[140px] text-xs leading-snug",
                      row.highlight === "2011-boca-error" &&
                        "font-medium text-alerta",
                      row.highlight === "2021-leader-flip" &&
                        "font-medium text-foreground"
                    )}
                  >
                    {row.note}
                  </div>
                )}
              </th>
              <td className="px-4 py-4 align-top text-xs leading-relaxed text-muted">
                {row.candidates}
              </td>
              <td className="px-4 py-4 align-top">
                <StageCell row={row} stageIndex={0} />
              </td>
              <td className="px-4 py-4 align-top">
                <DeltaCell value={row.deltas.simToBoca} />
              </td>
              <td className="px-4 py-4 align-top">
                <StageCell row={row} stageIndex={1} />
              </td>
              <td className="px-4 py-4 align-top">
                <DeltaCell value={row.deltas.bocaToCr} />
              </td>
              <td className="px-4 py-4 align-top">
                <StageCell row={row} stageIndex={2} />
              </td>
              <td className="px-4 py-4 align-top">
                <DeltaCell value={row.deltas.crToOnpe} />
              </td>
              <td className="px-4 py-4 align-top">
                <StageCell row={row} stageIndex={3} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <article
          key={row.year}
          className={cn(
            "rounded-xl border border-card-border bg-card/70 p-4",
            row.highlight === "2011-boca-error" && "bg-alerta-muted",
            row.highlight === "2021-leader-flip" && "bg-accent/50"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tabular-nums">{row.year}</h3>
              <p className="mt-1 text-sm text-muted">{row.candidates}</p>
            </div>
            {row.winner && (
              <span className="rounded-md border border-onpe/30 bg-onpe-muted px-2 py-1 text-xs font-semibold text-foreground">
                Ganó {row.winner.split(" ").pop()}
              </span>
            )}
          </div>
          {row.note && <p className="mt-3 text-sm leading-relaxed text-muted">{row.note}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {row.stages.map((stage, index) => (
              <div key={`${row.year}-${stage.stage}`} className="rounded-lg border border-card-border bg-background/40 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {stage.label}
                </p>
                <StageCell row={row} stageIndex={index} />
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-md border border-card-border bg-background/40 p-2">
              Sim {"->"} boca <DeltaCell value={row.deltas.simToBoca} />
            </div>
            <div className="rounded-md border border-card-border bg-background/40 p-2">
              Boca {"->"} CR <DeltaCell value={row.deltas.bocaToCr} />
            </div>
            <div className="rounded-md border border-card-border bg-background/40 p-2">
              CR {"->"} ONPE <DeltaCell value={row.deltas.crToOnpe} />
            </div>
          </div>
        </article>
      ))}
    </div>
    </>
  );
}
