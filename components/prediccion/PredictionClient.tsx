"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Clock3,
  ExternalLink,
  Globe2,
  RefreshCw,
  ShieldCheck,
  Sigma,
} from "lucide-react";
import { ONPE_POLL_INTERVAL_MS } from "@/components/providers/query-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveTable, type ResponsiveColumn } from "@/components/ui/responsive-table";
import { formatDateTime, formatPct, formatPp, formatVotes } from "@/lib/format";
import type {
  CriticalDriverRow,
  ErrorBudgetRow,
  PredictionSnapshot,
  RequirementRow,
  ScenarioRow,
  TrendSignalRow,
} from "@/lib/prediction";
import { cn } from "@/lib/utils";

type PredictionResponse = PredictionSnapshot & {
  meta?: {
    resolvedElectionId: number | null;
    resolvedBase: string | null;
  };
  error?: string;
};

async function fetchPrediction(): Promise<PredictionResponse> {
  const res = await fetch("/api/prediccion", { cache: "no-store" });
  if (!res.ok) throw new Error(`Predicción: HTTP ${res.status}`);
  return res.json() as Promise<PredictionResponse>;
}

function maybeVotes(value: number | null) {
  return value == null ? "No disponible" : formatVotes(value);
}

function maybePct(value: number | null | undefined, decimals = 2) {
  return value == null ? "No disponible" : formatPct(value, decimals);
}

function formatProbability(value: number) {
  return `${value.toFixed(2)}%`;
}

function toneClass(tone: ScenarioRow["tone"]) {
  if (tone === "keiko") return "text-keiko";
  if (tone === "sanchez") return "text-sanchez";
  return "text-muted";
}

function formatSignalValue(row: TrendSignalRow) {
  if (row.unit === "pct") return formatPct(row.value, 2);
  if (row.unit === "pp") return formatPp(row.value, 3);
  if (row.unit === "votes" || row.unit === "actas") return formatVotes(row.value);
  return String(row.value);
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value * 100));
}

function StatusPanel({
  prediction,
  isFetching,
}: {
  prediction: PredictionResponse;
  isFetching: boolean;
}) {
  const tieRequirement = prediction.requirements.find((row) => row.id === "tie");
  const ipsosRequirement = prediction.requirements.find((row) => row.id === "ipsos-cr");

  return (
    <section className="rounded-2xl border border-card-border bg-card p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning" className="uppercase tracking-widest">
              Predicción no oficial
            </Badge>
            <Badge variant={prediction.onpe.status === "live" ? "live" : "snapshot"}>
              ONPE {prediction.onpe.status}
            </Badge>
            <Badge variant={isFetching ? "warning" : "snapshot"}>
              {isFetching ? "Actualizando..." : "Actualizado"}
            </Badge>
            {prediction.meta?.resolvedElectionId && (
              <Badge variant="onpe">idEleccion {prediction.meta.resolvedElectionId}</Badge>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Escenarios de cierre ONPE 2026
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
              {prediction.headline} El sistema combina el corte ONPE parcial,
              conteos rápidos y sensibilidad territorial sin proclamar ganador.
            </p>
          </div>
          <p className="text-xs text-muted">
            Corte usado: <time dateTime={prediction.asOf}>{formatDateTime(prediction.asOf)}</time>
          </p>
          {prediction.error && (
            <p className="text-xs text-alerta">
              API en fallback: {prediction.error}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-alerta/35 bg-alerta-muted p-4">
          <div className="flex items-center gap-2 text-alerta">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm font-semibold">{prediction.statusLabel}</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Sánchez necesita{" "}
            <strong className="font-mono text-foreground">
              {maybePct(tieRequirement?.requiredPendingSanchezPct)}
            </strong>{" "}
            del bloque no contabilizado para empatar y{" "}
            <strong className="font-mono text-foreground">
              {maybePct(ipsosRequirement?.requiredPendingSanchezPct)}
            </strong>{" "}
            para reproducir el CR Ipsos.
          </p>
        </div>
      </div>
    </section>
  );
}

function KpiGrid({ prediction, isFetching }: { prediction: PredictionResponse; isFetching: boolean }) {
  const tieRequirement = prediction.requirements.find((row) => row.id === "tie");

  const items = [
    {
      label: "ONPE contabilizado",
      value: formatPct(prediction.onpe.advancePct, 3),
      detail:
        prediction.onpe.actasContabilizadas != null && prediction.onpe.actasTotal != null
          ? `${formatVotes(prediction.onpe.actasContabilizadas)} / ${formatVotes(prediction.onpe.actasTotal)} actas`
          : "Actas absolutas no disponibles",
      tone: "text-onpe",
      icon: Activity,
    },
    {
      label: "Margen ONPE actual",
      value: formatPp(prediction.onpe.marginPp, 3),
      detail: `${prediction.onpe.marginLeader} lidera el escrutinio contabilizado`,
      tone: "text-keiko",
      icon: RefreshCw,
    },
    {
      label: "Requisito para empate",
      value: maybePct(tieRequirement?.requiredPendingSanchezPct),
      detail: "Porcentaje Sánchez en actas no contabilizadas",
      tone: "text-sanchez",
      icon: AlertTriangle,
    },
    {
      label: "Exterior auditado",
      value:
        prediction.exterior.pendingPct == null
          ? "ONPE n/d"
          : `${prediction.exterior.pendingPct.toFixed(0)}% pendiente`,
      detail:
        prediction.exterior.actasTotal == null
          ? `${formatVotes(prediction.exterior.validVoteEstimate)} votos válidos hipotéticos`
          : `${formatVotes(prediction.exterior.actasTotal)} actas · ${formatVotes(prediction.exterior.validVoteEstimate)} votos válidos est.`,
      tone: "text-encuesta",
      icon: Globe2,
    },
    {
      label: "ETA mecánica a 100%",
      value: prediction.eta.etaIso ? formatDateTime(prediction.eta.etaIso) : "No estimable",
      detail:
        prediction.eta.ppPerHour != null
          ? `${prediction.eta.ppPerHour.toFixed(2)} pp/h entre últimos cortes`
          : prediction.eta.note,
      tone: "text-alerta",
      icon: Clock3,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  {item.label}
                </p>
                <Icon className={cn("h-4 w-4", item.tone)} aria-hidden="true" />
              </div>
              <p className={cn("mt-3 font-mono text-2xl font-semibold tabular-nums", item.tone)}>
                {item.value}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{item.detail}</p>
            </CardContent>
          </Card>
        );
      })}
      <div aria-live="polite" className="sr-only">
        {isFetching ? "Actualizando predicción" : "Predicción actualizada"}
      </div>
    </section>
  );
}

function TrendSignalsPanel({ rows }: { rows: TrendSignalRow[] }) {
  return (
    <Card className="border-onpe/25">
      <CardHeader>
        <CardTitle>Qué mirar primero</CardTitle>
        <CardDescription>
          Cuatro señales para leer la predicción sin perderse en todos los gráficos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-card-border bg-accent/35 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {row.label}
              </p>
              <p className={cn("mt-2 font-mono text-2xl font-semibold tabular-nums", toneClass(row.tone))}>
                {formatSignalValue(row)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-foreground/85">{row.detail}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{row.note}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OnpeVsQuickCounts({ prediction }: { prediction: PredictionResponse }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>ONPE actual</CardTitle>
          <CardDescription>Oficial parcial, sin margen de error muestral</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-keiko/25 bg-keiko-muted p-4">
              <p className="text-xs text-muted">Keiko</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-keiko tabular-nums">
                {formatPct(prediction.onpe.keikoPct, 3)}
              </p>
              <p className="mt-1 text-xs text-muted">{maybeVotes(prediction.onpe.votesKeiko)}</p>
            </div>
            <div className="rounded-lg border border-sanchez/25 bg-sanchez-muted p-4">
              <p className="text-xs text-muted">Sánchez</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-sanchez tabular-nums">
                {formatPct(prediction.onpe.sanchezPct, 3)}
              </p>
              <p className="mt-1 text-xs text-muted">{maybeVotes(prediction.onpe.votesSanchez)}</p>
            </div>
          </div>
          <div className="rounded-lg border border-card-border bg-accent/35 p-4 text-sm">
            <p className="font-medium text-foreground">Estado de actas</p>
            <p className="mt-2 text-muted">
              No contabilizadas:{" "}
              <span className="font-mono text-foreground">
                {prediction.onpe.actasNoContabilizadas == null
                  ? "No disponible"
                  : formatVotes(prediction.onpe.actasNoContabilizadas)}
              </span>
            </p>
            <p className="text-muted">
              JEE:{" "}
              <span className="font-mono text-foreground">
                {maybeVotes(prediction.onpe.actasEnviadasJee)}
              </span>{" "}
              ({maybePct(prediction.onpe.actasEnviadasJeePct, 3)})
            </p>
            <p className="text-muted">
              Pendientes:{" "}
              <span className="font-mono text-foreground">
                {maybeVotes(prediction.onpe.actasPendientesJee)}
              </span>{" "}
              ({maybePct(prediction.onpe.actasPendientesJeePct, 3)})
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Conteos rápidos y margen de error</CardTitle>
          <CardDescription>
            Ambos conteos rápidos son muestras de actas; no reemplazan ONPE/JNE.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {prediction.quickCounts.map((row) => (
              <div key={row.id} className="rounded-lg border border-card-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{row.pollster}</p>
                    <p className="text-xs text-muted">{row.instrument}</p>
                  </div>
                  <Badge variant="encuestas">
                    {row.marginOfError == null ? "MOE no publicado" : `±${row.marginOfError} pp`}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted">Keiko</p>
                    <p className="font-mono text-xl font-semibold text-keiko">
                      {formatPct(row.keikoPct, 2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Sánchez</p>
                    <p className="font-mono text-xl font-semibold text-sanchez">
                      {formatPct(row.sanchezPct, 2)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {row.marginOfErrorNote ?? "Margen de error no publicado en fuente localizada."}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ProjectionPanel({ prediction }: { prediction: PredictionResponse }) {
  const projection = prediction.projection;
  const leaderLabel =
    projection.leader === "Sanchez"
      ? "Sánchez"
      : projection.leader === "Empate"
        ? "Empate técnico"
        : "Keiko";
  const leaderTone =
    projection.leader === "Sanchez"
      ? "text-sanchez"
      : projection.leader === "Keiko"
        ? "text-keiko"
        : "text-muted";
  const histogramMax = Math.max(1, ...projection.histogram.map((entry) => entry.pct));

  return (
    <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-onpe/30">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Frecuencia simulada del cierre</CardTitle>
              <CardDescription>
                {projection.modelName} · {projection.modelVersion} ·{" "}
                {formatVotes(projection.simulations)} simulaciones
              </CardDescription>
            </div>
            <Sigma className="h-5 w-5 text-onpe" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-card-border bg-accent/35 p-4">
              <p className="text-xs text-muted">Mediana del modelo</p>
              <p className={cn("mt-1 font-mono text-2xl font-semibold tabular-nums", leaderTone)}>
                {leaderLabel}
              </p>
              <p className="mt-2 text-xs text-muted">
                Keiko {formatPct(projection.keikoMedianPct, 3)} / Sánchez{" "}
                {formatPct(projection.sanchezMedianPct, 3)}
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-accent/35 p-4">
              <p className="text-xs text-muted">Riesgo de no retener liderazgo claro</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-alerta tabular-nums">
                {formatProbability(projection.currentLeaderNonHoldRisk)}
              </p>
              <p className="mt-2 text-xs text-muted">
                Reversión estricta {formatProbability(projection.currentLeaderReversalRisk)} ·
                empate práctico {formatProbability(projection.probabilityPracticalTie)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-card-border bg-card p-4 text-sm leading-relaxed">
            <p className="font-medium text-foreground">Intervalos de incertidumbre</p>
            <p className="mt-2 text-muted">
              Sánchez IC 80%:{" "}
              <span className="font-mono text-foreground">
                {formatPct(projection.sanchezCi80[0], 3)} a{" "}
                {formatPct(projection.sanchezCi80[1], 3)}
              </span>
            </p>
            <p className="text-muted">
              Sánchez IC 95%:{" "}
              <span className="font-mono text-foreground">
                {formatPct(projection.sanchezCi95[0], 3)} a{" "}
                {formatPct(projection.sanchezCi95[1], 3)}
              </span>
            </p>
            <p className="mt-2 text-muted">{projection.noCallReason}</p>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            {projection.methodNote} Seed reproducible:{" "}
            <span className="font-mono text-foreground">{projection.seed}</span>.
          </p>
          <p className="text-xs leading-relaxed text-muted">
            {projection.probabilityNote}
          </p>
          <p className="text-xs leading-relaxed text-muted">
            Peso usado:{" "}
            <span className="font-mono text-foreground">
              {formatPct(projection.countedWeightPct, 3)}
            </span>
            . {projection.weightingNote}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribución del margen simulado</CardTitle>
          <CardDescription>
            Margen firmado: valores positivos favorecen a Keiko; negativos favorecen a Sánchez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[720px]">
              <div className="flex h-72 items-end gap-2 border-b border-l border-card-border px-3 pt-3">
                {projection.histogram.map((entry) => {
                  const favorsKeiko = entry.bucket.startsWith("Keiko");
                  return (
                    <div key={entry.bucket} className="flex h-full flex-1 flex-col justify-end gap-2">
                      <div className="text-center font-mono text-xs text-muted">
                        {formatPct(entry.pct, 1)}
                      </div>
                      <div
                        className={cn(
                          "min-h-1 rounded-t-md transition-opacity hover:opacity-80",
                          favorsKeiko ? "bg-keiko" : "bg-sanchez",
                        )}
                        style={{ height: `${Math.max(2, (entry.pct / histogramMax) * 220)}px` }}
                        role="img"
                        aria-label={`${entry.bucket}: ${formatPct(entry.pct, 2)} de simulaciones`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 grid grid-cols-8 gap-2 px-3 text-center text-[11px] leading-tight text-muted">
                {projection.histogram.map((entry) => (
                  <span key={entry.bucket}>{entry.bucket}</span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ErrorBudgetPanel({ rows }: { rows: ErrorBudgetRow[] }) {
  const columns: ResponsiveColumn<ErrorBudgetRow>[] = [
    {
      key: "component",
      header: "Componente",
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.label}</p>
          <p className="text-xs text-muted">{row.note}</p>
        </div>
      ),
    },
    {
      key: "pp80",
      header: "Aporte 80%",
      className: "text-right",
      render: (row) => (
        <span className="font-mono tabular-nums text-foreground">
          ±{row.pp80.toFixed(2)} pp
        </span>
      ),
    },
    {
      key: "pp95",
      header: "Aporte 95%",
      className: "text-right",
      render: (row) => (
        <span className="font-mono tabular-nums text-alerta">
          ±{row.pp95.toFixed(2)} pp
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Presupuesto de error real</CardTitle>
            <CardDescription>
              Separado por fuente de incertidumbre; no es un único MOE simple.
            </CardDescription>
          </div>
          <ShieldCheck className="h-5 w-5 text-alerta" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveTable
          data={rows}
          columns={columns}
          keyExtractor={(row) => row.id}
          caption="Presupuesto de error de la predicción"
        />
      </CardContent>
    </Card>
  );
}

function CriticalDriversPanel({ rows }: { rows: CriticalDriverRow[] }) {
  const columns: ResponsiveColumn<CriticalDriverRow>[] = [
    {
      key: "driver",
      header: "Driver",
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.label}</p>
          <p className="text-xs text-muted">{row.source}</p>
        </div>
      ),
    },
    {
      key: "actas",
      header: "Actas/votos",
      className: "text-right",
      render: (row) => (
        <span className="font-mono text-xs tabular-nums text-muted">
          {row.pendingActas == null ? "Actas n/d" : `${formatVotes(row.pendingActas)} actas`}
          <br />
          {row.estimatedVotes == null ? "Votos n/d" : `${formatVotes(row.estimatedVotes)} votos est.`}
        </span>
      ),
    },
    {
      key: "lean",
      header: "Perfil Sánchez",
      className: "text-right",
      render: (row) => (
        <span className="font-mono tabular-nums text-sanchez">
          {formatPct(row.sanchezPct, 2)}
        </span>
      ),
    },
    {
      key: "impact",
      header: "Impacto",
      className: "text-right",
      render: (row) => (
        <span
          className={cn(
            "font-mono tabular-nums",
            row.impactPp == null
              ? "text-muted"
              : row.impactPp >= 0
                ? "text-sanchez"
                : "text-keiko",
          )}
        >
          {row.impactPp == null ? "n/d" : formatPp(row.impactPp, 2)}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drivers críticos del cierre</CardTitle>
        <CardDescription>
          Qué bloques pueden mover el resultado si el margen sigue estrecho.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveTable
          data={rows}
          columns={columns}
          keyExtractor={(row) => row.id}
          caption="Drivers críticos de cierre electoral"
        />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-card-border bg-card p-3">
              <p className="text-sm font-medium text-foreground">{row.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{row.note}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RequirementTable({ rows }: { rows: RequirementRow[] }) {
  const columns: ResponsiveColumn<RequirementRow>[] = [
    {
      key: "target",
      header: "Objetivo",
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.label}</p>
          <p className="text-xs text-muted">{row.source}</p>
        </div>
      ),
    },
    {
      key: "targetPct",
      header: "Meta Sánchez",
      className: "text-right",
      render: (row) => (
        <span className="font-mono tabular-nums text-sanchez">
          {formatPct(row.targetSanchezPct, 2)}
        </span>
      ),
    },
    {
      key: "required",
      header: "Requiere en lo pendiente",
      className: "text-right",
      render: (row) => (
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {maybePct(row.requiredPendingSanchezPct, 2)}
        </span>
      ),
    },
    {
      key: "moe",
      header: "MOE",
      className: "text-right",
      render: (row) => (
        <span className="font-mono tabular-nums text-muted">
          {row.marginOfError == null ? "—" : `±${row.marginOfError} pp`}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aritmética de reversión</CardTitle>
        <CardDescription>
          Cuánto debe obtener Sánchez en el bloque no contabilizado para cada cierre.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveTable
          data={rows}
          columns={columns}
          keyExtractor={(row) => row.id}
          caption="Requisitos del bloque no contabilizado"
        />
      </CardContent>
    </Card>
  );
}

function RequirementChart({ rows }: { rows: RequirementRow[] }) {
  const data = rows.map((row) => ({
    label: row.label.replace("Alcanzar ", ""),
    required: row.requiredPendingSanchezPct,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requisito del bloque no contabilizado</CardTitle>
        <CardDescription>
          Línea 50% = bloque pendiente dividido en partes iguales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((entry) => {
            const value = entry.required ?? 0;
            const width = clampPct((value - 45) / 20);
            return (
              <div key={entry.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-foreground">{entry.label}</span>
                  <span className="font-mono text-sanchez">{maybePct(entry.required, 2)}</span>
                </div>
                <div className="relative h-7 rounded-md border border-card-border bg-accent/45">
                  <div className="absolute bottom-0 left-1/4 top-0 border-l border-dashed border-card-border" />
                  <div
                    className={cn(
                      "h-full rounded-md transition-opacity hover:opacity-80",
                      value >= 58 ? "bg-sanchez" : "bg-encuesta",
                    )}
                    style={{ width: `${width}%` }}
                    role="img"
                    aria-label={`${entry.label}: ${maybePct(entry.required, 2)}`}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted">
            Escala visual: 45% a 65% del bloque pendiente; la línea punteada marca 50%.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ScenarioChart({ scenarios }: { scenarios: ScenarioRow[] }) {
  const data = scenarios.map((scenario) => ({
    label: scenario.label
      .replace("Pendiente ", "Pend. ")
      .replace("Umbral exacto de ", "")
      .replace("Stress ", ""),
    sanchez: scenario.finalSanchezPct,
    keiko: scenario.finalKeikoPct,
    tone: scenario.tone,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escenarios de cierre</CardTitle>
        <CardDescription>
          Resultado nacional simulado variando solo el perfil del bloque no contabilizado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((entry) => (
            <div key={entry.label} className="grid gap-2 md:grid-cols-[12rem_1fr] md:items-center">
              <div>
                <p className="text-sm font-medium text-foreground">{entry.label}</p>
                <p className="font-mono text-xs text-muted">
                  K {formatPct(entry.keiko, 2)} / S {formatPct(entry.sanchez, 2)}
                </p>
              </div>
              <div
                className="relative h-8 overflow-hidden rounded-md border border-card-border bg-accent/45"
                role="img"
                aria-label={`${entry.label}: Keiko ${formatPct(entry.keiko, 2)} y Sánchez ${formatPct(entry.sanchez, 2)}`}
              >
                <div className="absolute bottom-0 left-1/2 top-0 z-10 border-l border-dashed border-card-border" />
                <div className="flex h-full">
                  <div className="h-full bg-keiko" style={{ width: `${entry.keiko}%` }} />
                  <div className="h-full bg-sanchez" style={{ width: `${entry.sanchez}%` }} />
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-keiko" aria-hidden="true" />
              Keiko
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-sanchez" aria-hidden="true" />
              Sánchez
            </span>
            <span>Línea punteada: 50%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScenarioTable({ rows }: { rows: ScenarioRow[] }) {
  const columns: ResponsiveColumn<ScenarioRow>[] = [
    {
      key: "scenario",
      header: "Escenario",
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.label}</p>
          <p className="text-xs text-muted">{row.note}</p>
        </div>
      ),
    },
    {
      key: "pending",
      header: "Sánchez pendiente",
      className: "text-right",
      render: (row) => (
        <span className="font-mono tabular-nums">{formatPct(row.pendingSanchezPct, 2)}</span>
      ),
    },
    {
      key: "final",
      header: "Cierre proyectado",
      className: "text-right",
      render: (row) => (
        <span className={cn("font-mono tabular-nums", toneClass(row.tone))}>
          K {formatPct(row.finalKeikoPct, 2)} / S {formatPct(row.finalSanchezPct, 2)}
        </span>
      ),
    },
    {
      key: "leader",
      header: "Lectura",
      className: "text-right",
      render: (row) => (
        <span className={cn("font-medium", toneClass(row.tone))}>
          {row.leader === "Sanchez" ? "Sánchez" : row.leader} {formatPp(row.marginPp, 2)}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tabla de sensibilidad</CardTitle>
        <CardDescription>
          Los extremos son pruebas de estrés, no predicciones puntuales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveTable
          data={rows}
          columns={columns}
          keyExtractor={(row) => row.id}
          caption="Escenarios de cierre de segunda vuelta"
        />
      </CardContent>
    </Card>
  );
}

function ExteriorAndCaveats({ prediction }: { prediction: PredictionResponse }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Voto exterior y zonas críticas</CardTitle>
          <CardDescription>
            Separado porque tiene ritmo de procesamiento y composición propia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Electores", formatVotes(prediction.exterior.eligibleVoters)],
              ["Mesas", formatVotes(prediction.exterior.mesas)],
              ["Locales", formatVotes(prediction.exterior.locals)],
              ["Ciudades", formatVotes(prediction.exterior.cities)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-card-border bg-accent/35 p-3">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-card-border bg-card p-4 text-sm leading-relaxed">
            <p className="font-medium text-foreground">Lectura actual</p>
            <p className="mt-2 text-muted">{prediction.exterior.note}</p>
            <p className="mt-2 text-xs text-muted">
              Estado ONPE exterior desagregado:{" "}
              <span className="font-mono text-foreground">
                {prediction.exterior.officialResultsStatus}
              </span>
              {prediction.exterior.actasTotal == null
                ? " · actas exteriores oficiales no verificadas por endpoint"
                : ` · ${formatVotes(prediction.exterior.actasTotal)} actas`}
              .
            </p>
            <p className="mt-2 text-muted">
              Conteo rápido Datum exterior: Keiko{" "}
                <span className="font-mono text-keiko">
                  {formatPct(prediction.exterior.datumKeikoPct, 2)}
                </span>{" "}
                / Sánchez{" "}
              <span className="font-mono text-sanchez">
                {formatPct(prediction.exterior.datumSanchezPct, 2)}
              </span>
              .
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-card-border bg-accent/35 p-3">
              <p className="text-xs text-muted">Votos válidos ext. hipotéticos</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                {formatVotes(prediction.exterior.validVoteEstimate)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatPct(prediction.exterior.turnoutAssumptionPct, 1)} participación ·{" "}
                {formatPct(prediction.exterior.validVoteAssumptionPct, 1)} válidos asumidos
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-accent/35 p-3">
              <p className="text-xs text-muted">Peso en pendiente est.</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-keiko">
                {maybePct(prediction.exterior.shareOfPendingValidEstimatePct, 2)}
              </p>
              <p className="mt-1 text-xs text-muted">No se usa el padrón completo como voto.</p>
            </div>
            <div className="rounded-lg border border-card-border bg-accent/35 p-3">
              <p className="text-xs text-muted">Mix pendiente ajustado</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-sanchez">
                {maybePct(prediction.exterior.adjustedPendingSanchezPct, 2)}
              </p>
              <p className="mt-1 text-xs text-muted">Doméstico tardío + exterior Datum.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-alerta/35">
        <CardHeader>
          <CardTitle>Controles de prudencia</CardTitle>
          <CardDescription>Reglas para no sobre-vender la predicción.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm leading-relaxed text-muted">
            {prediction.caveats.map((item) => (
              <li key={item} className="rounded-lg border border-card-border bg-card p-3">
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function SourceLinks({ prediction }: { prediction: PredictionResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuentes auditadas</CardTitle>
        <CardDescription>
          Enlaces usados por la página para datos oficiales, conteos rápidos y exterior.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {prediction.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-card-border bg-accent/35 px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {source.label}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FollowCta() {
  return (
    <section className="rounded-2xl border border-onpe/30 bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <Badge variant="onpe" className="uppercase tracking-widest">
            CIM
          </Badge>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
            Para mejores decisiones, sigue las actualizaciones del análisis.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Publicaré lecturas, cambios de modelo y señales relevantes conforme
            avance ONPE/JNE. La página evita proclamar ganador antes de que la
            evidencia estadística sea suficientemente robusta.
          </p>
        </div>
        <a
          href="https://x.com/CMMB1204"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-card-border bg-accent px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-onpe-muted hover:text-onpe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Seguir @CMMB1204
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

export function PredictionClient({ initialPrediction }: { initialPrediction: PredictionResponse }) {
  const { data, isFetching, isError } = useQuery({
    queryKey: ["prediccion", "snapshot"],
    queryFn: fetchPrediction,
    initialData: initialPrediction,
    refetchOnMount: "always",
    refetchInterval: ONPE_POLL_INTERVAL_MS,
    staleTime: ONPE_POLL_INTERVAL_MS,
  });

  const scenariosForTable = useMemo(() => data.scenarios, [data.scenarios]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <StatusPanel prediction={data} isFetching={isFetching} />

      {isError && (
        <Card className="border-alerta/35 bg-alerta-muted">
          <CardContent className="pt-5 text-sm text-foreground">
            No se pudo refrescar `/api/prediccion`; se conserva el último snapshot local.
          </CardContent>
        </Card>
      )}

      <KpiGrid prediction={data} isFetching={isFetching} />
      <TrendSignalsPanel rows={data.trendSignals} />
      <ProjectionPanel prediction={data} />
      <OnpeVsQuickCounts prediction={data} />

      <section className="grid gap-4 xl:grid-cols-2">
        <RequirementTable rows={data.requirements} />
        <RequirementChart rows={data.requirements} />
      </section>

      <ScenarioChart scenarios={data.scenarios} />
      <ScenarioTable rows={scenariosForTable} />
      <section className="grid gap-4 xl:grid-cols-2">
        <ErrorBudgetPanel rows={data.errorBudget} />
        <CriticalDriversPanel rows={data.criticalDrivers} />
      </section>
      <ExteriorAndCaveats prediction={data} />
      <SourceLinks prediction={data} />
      <FollowCta />
    </div>
  );
}
