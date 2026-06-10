"use client";

import type { CandidatePair, ElectionRecord } from "@/lib/types";
import { formatPct, formatVotes } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getProviderPair,
  getSimulacroPair,
  type InstrumentProvider,
} from "./utils";

type CandidateSide = "a" | "b";

type MatrixStage = {
  key: "simulacro" | "boca" | "cr" | "onpe";
  label: string;
  pair: CandidatePair | null;
  source?: string;
  state?: "final" | "partial" | "missing";
};

const PROVIDER_LABEL: Record<InstrumentProvider, string> = {
  ipsos: "Ipsos",
  datum: "Datum",
};

function getMargin(pair: CandidatePair | null): number | null {
  if (!pair) return null;
  return pair.marginPp ?? Math.abs(pair.a - pair.b);
}

function getLeader(pair: CandidatePair | null): CandidateSide | null {
  if (!pair) return null;
  return (pair.marginLeader as CandidateSide | undefined) ?? (pair.a >= pair.b ? "a" : "b");
}

function getCandidateValue(pair: CandidatePair | null, side: CandidateSide) {
  if (!pair) return null;
  return side === "a" ? pair.a : pair.b;
}

function getCandidateVotes(pair: CandidatePair | null, side: CandidateSide) {
  if (!pair) return null;
  return side === "a" ? pair.votesA : pair.votesB;
}

function getMoeLabel(stage: MatrixStage): string {
  if (stage.key === "onpe") return "sin MOE muestral";
  if (!stage.pair) return "MOE no publicado";
  if (stage.pair.marginOfError !== undefined) {
    return `MOE +/-${formatPct(stage.pair.marginOfError, 1)}`;
  }
  return stage.pair.marginOfErrorNote ?? "MOE no publicado";
}

function getStatStatus(stage: MatrixStage): string {
  if (stage.key === "onpe") return stage.state === "partial" ? "avance oficial" : "resultado oficial";
  const margin = getMargin(stage.pair);
  const moe = stage.pair?.marginOfError;
  if (margin === null || moe === undefined) return "estado estadístico no calculable";
  if (margin <= moe) return "empate técnico";
  if (margin <= moe * 2) return "ventaja estimada, no concluyente";
  return "ventaja clara, no oficial";
}

function buildStages(
  election: ElectionRecord,
  provider: InstrumentProvider
): MatrixStage[] {
  const onpePair = election.instruments.onpe100 ?? election.instruments.onpePartial ?? null;

  return [
    {
      key: "simulacro",
      label: "Simulacro",
      pair: getSimulacroPair(election, provider) ?? null,
      source: getSimulacroPair(election, provider)?.source,
      state: getSimulacroPair(election, provider) ? undefined : "missing",
    },
    {
      key: "boca",
      label: "Boca de urna",
      pair: getProviderPair(election, "boca", provider) ?? null,
      source: getProviderPair(election, "boca", provider)?.source,
      state: getProviderPair(election, "boca", provider) ? undefined : "missing",
    },
    {
      key: "cr",
      label: "Conteo rápido",
      pair: getProviderPair(election, "cr", provider) ?? null,
      source: getProviderPair(election, "cr", provider)?.source,
      state: getProviderPair(election, "cr", provider) ? undefined : "missing",
    },
    {
      key: "onpe",
      label: election.instruments.onpe100 ? "ONPE 100%" : "ONPE parcial",
      pair: onpePair,
      source: onpePair?.source ?? "ONPE/JNE",
      state: election.instruments.onpe100 ? "final" : "partial",
    },
  ];
}

function CandidateStageCell({
  stage,
  side,
}: {
  stage: MatrixStage;
  side: CandidateSide;
}) {
  const value = getCandidateValue(stage.pair, side);
  const votes = getCandidateVotes(stage.pair, side);
  const leader = getLeader(stage.pair);
  const isLeader = leader === side;

  if (value === null) {
    return (
      <td className="border-l border-card-border px-3 py-3 text-center text-xs text-muted">
        s/f pública
      </td>
    );
  }

  return (
    <td
      className={cn(
        "border-l border-card-border px-3 py-3 text-center align-middle",
        isLeader && "bg-alerta text-background",
        stage.state === "partial" && !isLeader && "bg-accent/45"
      )}
    >
      <div className="font-mono text-base font-black tabular-nums">
        {formatPct(value, 2)}
      </div>
      {votes != null && (
        <div
          className={cn(
            "mt-1 text-[11px] font-medium tabular-nums",
            isLeader ? "text-background" : "text-muted"
          )}
        >
          {formatVotes(votes)} votos
        </div>
      )}
      {stage.state === "partial" && (
        <div
          className={cn(
            "mt-1 text-[11px] font-semibold uppercase tracking-wide",
            isLeader ? "text-background" : "text-alerta"
          )}
        >
          parcial {formatPct(stage.pair?.advancePct ?? 0, 1)}
        </div>
      )}
    </td>
  );
}

function DifferenceCell({ stage }: { stage: MatrixStage }) {
  const margin = getMargin(stage.pair);
  if (margin === null) {
    return (
      <td className="border-l border-card-border px-3 py-2 text-center text-xs text-muted">
        sin serie
      </td>
    );
  }

  const leader = getLeader(stage.pair);
  const leaderLabel = leader === "a" ? stage.pair?.labelA : stage.pair?.labelB;

  return (
    <td className="border-l border-card-border px-3 py-2 text-center">
      <div className="font-mono text-sm font-semibold tabular-nums">
        {margin.toFixed(2)} pp
      </div>
      <div className="mt-0.5 text-[11px] text-muted">{leaderLabel}</div>
    </td>
  );
}

function SourceStrip({ stages }: { stages: MatrixStage[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted">
      {stages.map((stage) => (
        <span
          key={stage.key}
          className="rounded-md border border-card-border bg-card px-2 py-1"
        >
          {stage.label}: {stage.source ?? "sin fuente pública homogénea"} ·{" "}
          {getMoeLabel(stage)} · {getStatStatus(stage)}
        </span>
      ))}
    </div>
  );
}

function MobileStage({
  stage,
  election,
}: {
  stage: MatrixStage;
  election: ElectionRecord;
}) {
  const margin = getMargin(stage.pair);
  const leader = getLeader(stage.pair);
  const candidateA = getCandidateValue(stage.pair, "a");
  const candidateB = getCandidateValue(stage.pair, "b");

  return (
    <div className="rounded-lg border border-card-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{stage.label}</h4>
          <p className="mt-0.5 text-[11px] text-muted">
            {stage.source ?? "sin fuente pública homogénea"}
          </p>
          <p className="mt-1 text-[11px] font-medium text-poll">
            {getMoeLabel(stage)}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-alerta">
            {getStatStatus(stage)}
          </p>
        </div>
        {stage.state === "partial" && (
          <span className="rounded-md border border-alerta/30 bg-alerta-muted px-2 py-1 text-[11px] font-semibold text-foreground">
            parcial {formatPct(stage.pair?.advancePct ?? 0, 1)}
          </span>
        )}
      </div>

      {stage.pair ? (
        <div className="mt-3 space-y-2">
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-md px-2 py-1.5",
              leader === "a" && "bg-alerta text-background"
            )}
          >
            <span className="truncate text-sm font-medium">{election.candidates.a}</span>
            <span className="font-mono text-sm font-bold tabular-nums">
              {formatPct(candidateA ?? 0, 2)}
            </span>
          </div>
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-md px-2 py-1.5",
              leader === "b" && "bg-alerta text-background"
            )}
          >
            <span className="truncate text-sm font-medium">{election.candidates.b}</span>
            <span className="font-mono text-sm font-bold tabular-nums">
              {formatPct(candidateB ?? 0, 2)}
            </span>
          </div>
          <p className="text-xs text-muted">
            Diferencia:{" "}
            <span className="font-mono font-semibold text-foreground">
              {(margin ?? 0).toFixed(2)} pp
            </span>
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Sin fuente pública homogénea para esta etapa.
        </p>
      )}
    </div>
  );
}

export function HistoricalResultMatrix({
  elections,
  provider,
}: {
  elections: ElectionRecord[];
  provider: InstrumentProvider;
}) {
  const ordered = [...elections].sort((a, b) => b.year - a.year);
  const providerLabel = PROVIDER_LABEL[provider];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Resultados históricos por encuestadora
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Matriz tipo Ipsos: dos filas por elección, diferencia bajo cada
            bloque y ONPE final cuando existe. Para 2026 se muestra ONPE
            parcial porque el 100% aún no está proclamado.
          </p>
        </div>
        <div className="rounded-lg border border-card-border bg-card px-3 py-2 text-xs text-muted">
          Vista activa: <span className="font-semibold text-foreground">{providerLabel}</span>
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-card-border bg-card/80 shadow-sm shadow-black/20 lg:block">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <caption className="sr-only">
            Matriz histórica de resultados por elección, candidato, encuestadora,
            simulacro, boca de urna, conteo rápido y ONPE.
          </caption>
          <thead>
            <tr className="border-b border-card-border bg-accent/45 text-left">
              <th scope="col" className="w-24 px-4 py-3 text-center font-semibold text-muted">Año</th>
              <th scope="col" className="w-72 px-4 py-3 font-semibold text-muted">Candidato</th>
              <th scope="col" className="px-3 py-3 text-center font-semibold text-poll">
                Simulacro {providerLabel}
              </th>
              <th scope="col" className="px-3 py-3 text-center font-semibold text-poll">
                Boca de urna {providerLabel}
              </th>
              <th scope="col" className="px-3 py-3 text-center font-semibold text-poll">
                Conteo rápido {providerLabel}
              </th>
              <th scope="col" className="px-3 py-3 text-center font-semibold text-onpe">
                ONPE/JNE
              </th>
            </tr>
          </thead>
          {ordered.map((election) => {
            const stages = buildStages(election, provider);
            const candidateA = election.candidates.a;
            const candidateB = election.candidates.b;
            const isPending = !election.instruments.onpe100;

            return (
              <tbody
                key={election.year}
                className="border-b-8 border-background last:border-b-0"
              >
                <tr className="border-b border-card-border/80">
                  <th
                    scope="rowgroup"
                    rowSpan={2}
                    className="border-r border-card-border px-4 py-4 text-center align-middle"
                  >
                    <div className="text-2xl font-bold tabular-nums">
                      {election.year}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-muted">
                      {isPending ? "en curso" : "final"}
                    </div>
                  </th>
                  <th scope="row" className="px-4 py-3 align-middle text-left">
                    <div className="font-semibold text-foreground">{candidateA}</div>
                    <div className="text-xs text-muted">{election.candidates.partyA}</div>
                  </th>
                  {stages.map((stage) => (
                    <CandidateStageCell key={stage.key} stage={stage} side="a" />
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 align-middle text-left">
                    <div className="font-semibold text-foreground">{candidateB}</div>
                    <div className="text-xs text-muted">{election.candidates.partyB}</div>
                  </th>
                  {stages.map((stage) => (
                    <CandidateStageCell key={stage.key} stage={stage} side="b" />
                  ))}
                </tr>
                <tr className="border-t border-card-border/80 bg-accent/35">
                  <td colSpan={2} className="px-4 py-2 text-right">
                    <span className="text-sm font-semibold italic text-muted underline decoration-border underline-offset-4">
                      diferencia
                    </span>
                  </td>
                  {stages.map((stage) => (
                    <DifferenceCell key={stage.key} stage={stage} />
                  ))}
                </tr>
                <tr className="bg-card/60">
                  <td colSpan={6} className="px-4 pb-4 pt-1">
                    <SourceStrip stages={stages} />
                  </td>
                </tr>
              </tbody>
            );
          })}
        </table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {ordered.map((election) => {
          const stages = buildStages(election, provider);
          const isPending = !election.instruments.onpe100;

          return (
            <article
              key={election.year}
              className="rounded-xl border border-card-border bg-card/80 p-4 shadow-sm shadow-black/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold tabular-nums">{election.year}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {election.candidates.a} vs {election.candidates.b}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs font-semibold",
                    isPending
                      ? "border-alerta/30 bg-alerta-muted text-foreground"
                      : "border-onpe/30 bg-onpe-muted text-foreground"
                  )}
                >
                  {isPending ? "en curso" : "final"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {stages.map((stage) => (
                  <MobileStage
                    key={`${election.year}-${stage.key}`}
                    stage={stage}
                    election={election}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Nota de cobertura: el balotaje de 2000 se excluye por no ser comparable
        (retiro de Toledo de la segunda vuelta). La serie presidencial
        verificable se organiza con 2001, 2006, 2011, 2016, 2021 y el proceso
        2026 en curso.
      </p>
    </section>
  );
}
