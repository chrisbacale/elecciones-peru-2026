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
import { CityForecastPanel } from "@/components/territorial/CityForecastPanel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveTable, type ResponsiveColumn } from "@/components/ui/responsive-table";
import cityForecastSnapshot from "@/data/2026/city-level-forecast.json";
import { formatDateTime, formatPct, formatPp, formatVotes } from "@/lib/format";
import { useOnpeCityForecast } from "@/hooks/useOnpeCityForecast";
import { useOnpeJeeModel } from "@/hooks/useOnpeJeeModel";
import { useOnpeTerritorial } from "@/hooks/useOnpeTerritorial";
import type {
  CriticalDriverRow,
  ErrorBudgetRow,
  PredictionSnapshot,
  RequirementRow,
  ScenarioRow,
  TrendSignalRow,
} from "@/lib/prediction";
import type { JeeResolutionModel, OnpeCityForecast, OnpeTerritorial } from "@/lib/types";
import { cn } from "@/lib/utils";

const CITY_FORECAST_SNAPSHOT = cityForecastSnapshot as unknown as OnpeCityForecast;

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

function maybePctRange(value: [number, number] | null | undefined, decimals = 2) {
  return value == null
    ? "No disponible"
    : `${formatPct(value[0], decimals)} a ${formatPct(value[1], decimals)}`;
}

function formatVotesRange(value: [number, number]) {
  return `${formatVotes(value[0])} a ${formatVotes(value[1])}`;
}

function formatSignedVotes(value: number | null | undefined) {
  if (value == null) return "No disponible";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatVotes(Math.abs(value))}`;
}

type TerritorialRow = OnpeTerritorial["departments"][number];

type InteriorProjection = {
  rowsUsed: number;
  currentKeikoVotes: number;
  currentSanchezVotes: number;
  countedActas: number;
  totalActas: number;
  pendingActas: number;
  estimatedPendingValidVotes: number;
  projectedPendingKeikoVotes: number;
  projectedPendingSanchezVotes: number;
  projectedKeikoVotes: number;
  projectedSanchezVotes: number;
  projectedNetKeikoVotes: number;
};

function sumKnown(rows: TerritorialRow[], selector: (row: TerritorialRow) => number | null | undefined) {
  return rows.reduce((sum, row) => sum + (selector(row) ?? 0), 0);
}

function buildInteriorProjection(rows: TerritorialRow[] | undefined): InteriorProjection | null {
  const usable = (rows ?? []).filter(
    (row) =>
      row.votesKeiko != null &&
      row.votesSanchez != null &&
      row.actasContabilizadas != null &&
      row.actasPendientes != null,
  );
  if (usable.length === 0) return null;

  const currentKeikoVotes = sumKnown(usable, (row) => row.votesKeiko);
  const currentSanchezVotes = sumKnown(usable, (row) => row.votesSanchez);
  const estimatedPendingValidVotes = sumKnown(
    usable,
    (row) => row.estimatedPendingValidVotes,
  );
  const projectedPendingKeikoVotes = sumKnown(
    usable,
    (row) => row.projectedPendingKeikoVotes,
  );
  const projectedPendingSanchezVotes = sumKnown(
    usable,
    (row) => row.projectedPendingSanchezVotes,
  );

  return {
    rowsUsed: usable.length,
    currentKeikoVotes,
    currentSanchezVotes,
    countedActas: sumKnown(usable, (row) => row.actasContabilizadas),
    totalActas: sumKnown(usable, (row) => row.actasTotal),
    pendingActas: sumKnown(usable, (row) => row.actasPendientes),
    estimatedPendingValidVotes,
    projectedPendingKeikoVotes,
    projectedPendingSanchezVotes,
    projectedKeikoVotes: currentKeikoVotes + projectedPendingKeikoVotes,
    projectedSanchezVotes: currentSanchezVotes + projectedPendingSanchezVotes,
    projectedNetKeikoVotes:
      currentKeikoVotes +
      projectedPendingKeikoVotes -
      currentSanchezVotes -
      projectedPendingSanchezVotes,
  };
}

function formatLeaderGapFromVotes(keikoVotes: number, sanchezVotes: number) {
  const gap = keikoVotes - sanchezVotes;
  const leader = gap > 0 ? "Keiko" : gap < 0 ? "Sánchez" : "Empate";
  return leader === "Empate" ? "Empate" : `${leader} +${formatVotes(Math.abs(gap))}`;
}

function formatLeaderGapFromSignedGap(gap: number | null | undefined) {
  if (gap == null) return "No disponible";
  const leader = gap > 0 ? "Keiko" : gap < 0 ? "Sánchez" : "Empate";
  return leader === "Empate" ? "Empate" : `${leader} +${formatVotes(Math.abs(gap))}`;
}

function formatActasProgress(
  counted: number | null | undefined,
  total: number | null | undefined,
) {
  if (counted == null || total == null) return "Actas n/d";
  return `${formatVotes(counted)} / ${formatVotes(total)} actas`;
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
              Lectura principal: separar Perú interior, actas JEE/observadas y
              exterior agregado. La simulación Monte Carlo por componentes
              cuantifica la incertidumbre de esa misma aritmética; no proclama
              ganador.
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
  const onpeLeaderTone = candidateToneClass(prediction.onpe.marginLeader);
  const onpeLeaderShort = shortCandidateName(prediction.onpe.marginLeader);

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
      value: `${onpeLeaderShort} ${formatPp(prediction.onpe.marginPp, 3)}`,
      detail: `${prediction.onpe.marginLeader} lidera el escrutinio contabilizado`,
      tone: onpeLeaderTone,
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
          : `${prediction.exterior.pendingPct.toFixed(1)}% pendiente`,
      detail:
        prediction.exterior.actasTotal == null
          ? `${formatVotes(prediction.exterior.validVoteEstimate)} votos válidos hipotéticos`
          : `${formatActasProgress(
              prediction.exterior.actasContabilizadas,
              prediction.exterior.actasTotal,
            )} · ${maybeVotes(prediction.exterior.actasPendientes)} pendientes`,
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
          Cinco señales para leer la predicción sin perderse en todos los gráficos.
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

function PendingTerritoryPanel({
  prediction,
  territorial,
  isFetching,
  isLoading,
}: {
  prediction: PredictionResponse;
  territorial?: OnpeTerritorial;
  isFetching: boolean;
  isLoading: boolean;
}) {
  const departments = useMemo(() => {
    return [...(territorial?.departments ?? [])]
      .filter(
        (dept) =>
          dept.actasPendientes != null ||
          dept.pendingPct != null ||
          dept.advancePct > 0,
      )
      .sort((a, b) => {
        const pendingA = a.actasPendientes ?? -1;
        const pendingB = b.actasPendientes ?? -1;
        if (pendingA !== pendingB) return pendingB - pendingA;
        return (b.pendingPct ?? 0) - (a.pendingPct ?? 0);
      })
      .slice(0, 8);
  }, [territorial?.departments]);

  const columns: ResponsiveColumn<OnpeTerritorial["departments"][number]>[] = [
    {
      key: "territory",
      header: "Territorio",
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted">Departamento ONPE</p>
        </div>
      ),
    },
    {
      key: "pending",
      header: "Actas faltantes",
      className: "text-right",
      render: (row) => (
        <span className="font-mono tabular-nums text-alerta">
          {row.actasPendientes == null ? "n/d" : formatVotes(row.actasPendientes)}
        </span>
      ),
    },
    {
      key: "progress",
      header: "Avance",
      className: "text-right",
      render: (row) => (
        <span className="font-mono tabular-nums text-muted">
          {row.advancePct > 0 ? formatPct(row.advancePct, 1) : "n/d"}
        </span>
      ),
    },
    {
      key: "leader",
      header: "Líder",
      className: "text-right",
      render: (row) => (
        <span className={cn("font-medium", toneClass(row.leader === "Keiko" ? "keiko" : "sanchez"))}>
          {row.leader}
        </span>
      ),
    },
    {
      key: "impact",
      header: "Impacto pend.",
      className: "text-right",
      render: (row) => (
        <span
          className={cn(
            "font-mono font-semibold tabular-nums",
            gapToneClass(row.projectedPendingNetKeikoVotes),
          )}
        >
          {formatSignedVotes(row.projectedPendingNetKeikoVotes)}
        </span>
      ),
    },
  ];

  return (
    <Card className="border-onpe/25">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Actas pendientes por territorio</CardTitle>
            <CardDescription>
              ONPE vivo por departamento, exterior agregado y actas observadas/JEE.
            </CardDescription>
          </div>
          <Badge variant={territorial?.status === "live" ? "live" : "snapshot"}>
            {isFetching ? "Actualizando" : territorial?.status ?? "snapshot"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-card-border bg-accent/35 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Nacional no contabilizadas
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-alerta tabular-nums">
              {prediction.onpe.actasNoContabilizadas == null
                ? "n/d"
                : formatVotes(prediction.onpe.actasNoContabilizadas)}
            </p>
            <p className="mt-2 text-xs text-muted">
              {formatActasProgress(
                prediction.onpe.actasContabilizadas,
                prediction.onpe.actasTotal,
              )}
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-accent/35 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Actas en JEE / observadas
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-alerta tabular-nums">
              {maybeVotes(prediction.onpe.actasEnviadasJee)}
            </p>
            <p className="mt-2 text-xs text-muted">
              No son pendientes ordinarias; quedan fuera del cómputo hasta resolución.
              Pendientes operativas: {maybeVotes(prediction.onpe.actasPendientesJee)} (
              {maybePct(prediction.onpe.actasPendientesJeePct, 3)}).
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-accent/35 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Exterior agregado
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-keiko tabular-nums">
              {maybeVotes(prediction.exterior.actasPendientes)}
            </p>
            <p className="mt-2 text-xs text-muted">
              {formatActasProgress(
                prediction.exterior.actasContabilizadas,
                prediction.exterior.actasTotal,
              )}{" "}
              · sin países
            </p>
          </div>
        </div>

        {isLoading && departments.length === 0 ? (
          <p className="py-5 text-center text-sm text-muted">
            Consultando desglose territorial ONPE…
          </p>
        ) : departments.length === 0 ? (
          <p className="rounded-lg border border-card-border bg-card p-4 text-sm text-muted">
            ONPE no devolvió todavía actas absolutas por distrito/ciudad en un endpoint
            reproducible desde esta app. Se mantiene el agregado nacional, JEE y exterior
            auditado para evitar publicar una tabla territorial inventada.
          </p>
        ) : (
          <ResponsiveTable
            data={departments}
            columns={columns}
            keyExtractor={(row) => row.code}
            caption="Departamentos con más actas pendientes ONPE"
          />
        )}
        <p className="text-xs leading-relaxed text-muted">
          Granularidad auditada: departamento para Perú y agregado único para exterior.
          Cuando ONPE exponga distrito/ciudad con el mismo contrato verificable, esta
          sección puede bajar a ese nivel sin cambiar el modelo.
        </p>
      </CardContent>
    </Card>
  );
}

function gapToneClass(gap: number | null | undefined) {
  if (gap == null || gap === 0) return "text-muted";
  return gap > 0 ? "text-keiko" : "text-sanchez";
}

function candidateToneClass(candidate: string | null | undefined) {
  const normalized = (candidate ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized.includes("keiko") || normalized.includes("fujimori")) return "text-keiko";
  if (
    normalized.includes("sanchez") ||
    normalized.includes("palomino") ||
    normalized.includes("roberto")
  ) {
    return "text-sanchez";
  }
  return "text-muted";
}

function shortCandidateName(candidate: string | null | undefined) {
  const tone = candidateToneClass(candidate);
  if (tone === "text-keiko") return "Keiko";
  if (tone === "text-sanchez") return "Sánchez";
  return candidate ?? "Sin líder";
}

function HowTo100Panel({
  prediction,
  territorial,
  jeeModel,
  isJeeFetching,
  isLoading,
}: {
  prediction: PredictionResponse;
  territorial?: OnpeTerritorial;
  jeeModel?: JeeResolutionModel;
  isJeeFetching: boolean;
  isLoading: boolean;
}) {
  const interiorProjection = useMemo(
    () => buildInteriorProjection(territorial?.departments),
    [territorial?.departments],
  );
  const topPending = useMemo(() => {
    return [...(territorial?.departments ?? [])]
      .filter((row) => row.actasPendientes != null && row.actasPendientes > 0)
      .sort((a, b) => (b.actasPendientes ?? 0) - (a.actasPendientes ?? 0))
      .slice(0, 6);
  }, [territorial?.departments]);
  const cityForecastQuery = useOnpeCityForecast();
  const cityForecast = cityForecastQuery.data ?? CITY_FORECAST_SNAPSHOT;
  const districtPreview = useMemo(
    () => cityForecast.topDistrictsPeru.slice(0, 3),
    [cityForecast.topDistrictsPeru],
  );

  const currentInteriorGap =
    interiorProjection == null
      ? null
      : interiorProjection.currentKeikoVotes - interiorProjection.currentSanchezVotes;
  const pendingInteriorGap =
    interiorProjection == null
      ? null
      : interiorProjection.projectedPendingKeikoVotes -
        interiorProjection.projectedPendingSanchezVotes;
  const datumCombinedGap =
    interiorProjection == null
      ? null
      : interiorProjection.projectedNetKeikoVotes +
        prediction.exterior.datumProjectedGapVotes;
  const exitPollCombinedGap =
    interiorProjection == null
      ? null
      : interiorProjection.projectedNetKeikoVotes +
        prediction.exterior.exitPollProjectedGapVotes;
  const thirtyPpExteriorGap = Math.round(prediction.exterior.validVoteEstimate * 0.3);
  const thirtyPpCombinedGap =
    interiorProjection == null
      ? null
      : interiorProjection.projectedNetKeikoVotes + thirtyPpExteriorGap;

  const unavailable = isLoading ? "Consultando..." : "No disponible";
  const resultRows = [
    {
      label: "Solo Perú interior",
      value:
        interiorProjection == null
          ? unavailable
          : formatLeaderGapFromVotes(
              interiorProjection.projectedKeikoVotes,
              interiorProjection.projectedSanchezVotes,
            ),
      detail:
        interiorProjection == null
          ? isLoading
            ? "Consultando desglose territorial ONPE."
            : "ONPE territorial no disponible en esta sesión."
          : `${formatSignedVotes(currentInteriorGap)} actual + ${formatSignedVotes(
              pendingInteriorGap,
            )} pendiente depto-aprox.`,
      gap: interiorProjection?.projectedNetKeikoVotes ?? null,
    },
    {
      label: "Perú + exterior Datum CR",
      value:
        datumCombinedGap == null
          ? unavailable
          : `${datumCombinedGap >= 0 ? "Keiko" : "Sánchez"} +${formatVotes(
              Math.abs(datumCombinedGap),
            )}`,
      detail: `Exterior CR est.: ${formatSignedVotes(
        prediction.exterior.datumProjectedGapVotes,
      )} netos Keiko.`,
      gap: datumCombinedGap,
    },
    {
      label: "Perú + boca exterior",
      value:
        exitPollCombinedGap == null
          ? unavailable
          : `${exitPollCombinedGap >= 0 ? "Keiko" : "Sánchez"} +${formatVotes(
              Math.abs(exitPollCombinedGap),
            )}`,
      detail: `Boca exterior est.: ${formatSignedVotes(
        prediction.exterior.exitPollProjectedGapVotes,
      )} netos Keiko.`,
      gap: exitPollCombinedGap,
    },
    {
      label: "Perú + exterior 30 pp",
      value:
        thirtyPpCombinedGap == null
          ? unavailable
          : `${thirtyPpCombinedGap >= 0 ? "Keiko" : "Sánchez"} +${formatVotes(
              Math.abs(thirtyPpCombinedGap),
            )}`,
      detail: `Referencia matemática: ${formatSignedVotes(thirtyPpExteriorGap)} netos Keiko.`,
      gap: thirtyPpCombinedGap,
    },
  ];
  const cleanRead =
    interiorProjection == null
      ? null
      : {
          peruOnly: interiorProjection.projectedNetKeikoVotes,
          exterior30: thirtyPpExteriorGap,
          peruPlusExterior30: thirtyPpCombinedGap,
          datum: datumCombinedGap,
          exitPoll: exitPollCombinedGap,
        };
  const componentRead = prediction.componentRead;
  const jeeStatus = jeeModel?.status ?? componentRead.status;
  const jeeCut = jeeModel?.cutPeru ?? componentRead.cutPeru;

  return (
    <Card id="lectura-componentes" className="border-onpe/30">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Lectura principal por componentes hacia 100%</CardTitle>
            <CardDescription>
              Separación matemática entre Perú interior, JEE/observadas y exterior agregado.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="warning">Aritmética auditada</Badge>
            <Badge variant={jeeStatus === "live" ? "live" : "snapshot"}>
              JEE {isJeeFetching ? "actualizando" : jeeStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-card-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Puente auditado: ONPE + Perú pendiente + JEE + exterior
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Corte JEE/ciudad-distrito: {formatDateTime(jeeCut)}.
                Esta cuenta es snapshot reproducible; la tabla departamental live
                de abajo puede tener un corte posterior.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 lg:grid-cols-5">
            {[
              {
                label: "1. ONPE actual del corte",
                value: componentRead.officialGapKeikoMinusSanchez,
                detail: `Brecha oficial nacional; incluye ${formatSignedVotes(componentRead.exteriorCountedGapKeikoMinusSanchez)} del exterior ya contabilizado.`,
              },
              {
                label: "2. Perú pendiente",
                value: componentRead.pendingPeruGapKeikoMinusSanchez,
                detail: `${formatVotes(componentRead.pendingPeruActas)} actas operativas.`,
              },
              {
                label: "3. JEE esperado",
                value: componentRead.expectedJeeGapKeikoMinusSanchez,
                detail: `${formatVotes(componentRead.jeeActasAtRisk)} actas en riesgo legal (incluye JEE exterior).`,
              },
              {
                label: "4. Exterior restante (observado)",
                value: componentRead.exteriorRemainingObservedGapKeikoMinusSanchez,
                detail: `${formatVotes(componentRead.exteriorRemainingValidEstimate)} votos válidos restantes al patrón oficial exterior.`,
              },
              {
                label: "5. Cierre esperado",
                value: componentRead.totalWithObservedGapKeikoMinusSanchez,
                detail: "Suma 1+2+3+4 sin doble conteo del exterior.",
              },
            ].map((row) => (
              <div key={row.label} className="rounded-lg border border-card-border bg-accent/35 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                  {row.label}
                </p>
                <p className={cn("mt-2 font-mono text-lg font-semibold tabular-nums", gapToneClass(row.value))}>
                  {formatLeaderGapFromSignedGap(row.value)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{row.detail}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-foreground/85">
            Lectura directa: solo con votos peruanos (sin nada de exterior) el
            cierre quedaría alrededor de{" "}
            {formatLeaderGapFromSignedGap(componentRead.peruOnlyExpectedGapKeikoMinusSanchez)}.
            Con el exterior restante al patrón observado, el cierre esperado es{" "}
            {formatLeaderGapFromSignedGap(componentRead.totalWithObservedGapKeikoMinusSanchez)};
            con Datum CR exterior, {formatLeaderGapFromSignedGap(componentRead.totalWithDatumGapKeikoMinusSanchez)};
            y en el stress de +30 pp netos para Keiko en lo restante,{" "}
            {formatLeaderGapFromSignedGap(componentRead.totalWithThirtyPpGapKeikoMinusSanchez)}.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {componentRead.note} El exterior restante usado aquí es agregado,
            sin países, con {formatVotes(componentRead.foreignValidVotesUsed)}{" "}
            votos válidos estimados por contabilizar.
          </p>
          {districtPreview.length > 0 && (
            <div className="mt-4 rounded-lg border border-card-border bg-background/60 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Distritos que más mueven el cierre
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Top 3 del ranking ciudad/distrito; combina actas pendientes
                    y JEE con el patrón local auditado.
                  </p>
                </div>
                <a
                  href="#distritos-criticos"
                  className="text-xs font-semibold text-onpe underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Ver tabla completa
                </a>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {districtPreview.map((row) => (
                  <div key={row.dist_ubigeo} className="rounded-md border border-card-border bg-card p-3">
                    <p className="text-sm font-medium text-foreground">
                      {row.district_or_city}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {row.province_or_country}, {row.department_or_continent}
                    </p>
                    <p className="mt-2 font-mono text-sm font-semibold tabular-nums">
                      pend. {formatVotes(row.pending_actas)} · JEE {formatVotes(row.jee_actas)}
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-mono text-sm font-semibold tabular-nums",
                        gapToneClass(row.city_weighted_margin_keiko_minus_roberto),
                      )}
                    >
                      {formatLeaderGapFromSignedGap(row.city_weighted_margin_keiko_minus_roberto)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {cleanRead && (
          <div className="rounded-xl border border-onpe/30 bg-onpe-muted p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Solo Perú proyectado
                </p>
                <p className={cn("mt-2 font-mono text-2xl font-semibold tabular-nums", gapToneClass(cleanRead.peruOnly))}>
                  {cleanRead.peruOnly >= 0 ? "Keiko" : "Sánchez"} +{formatVotes(Math.abs(cleanRead.peruOnly))}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Perú interior con actas operativas pendientes; JEE no forzado.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Exterior +30 pp
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold text-keiko tabular-nums">
                  {formatSignedVotes(cleanRead.exterior30)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Hipótesis: Keiko 65% / Sánchez 35% del voto exterior válido estimado.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Perú + exterior +30 pp
                </p>
                <p className={cn("mt-2 font-mono text-2xl font-semibold tabular-nums", gapToneClass(cleanRead.peruPlusExterior30))}>
                  {cleanRead.peruPlusExterior30 == null
                    ? "No disponible"
                    : `${cleanRead.peruPlusExterior30 >= 0 ? "Keiko" : "Sánchez"} +${formatVotes(Math.abs(cleanRead.peruPlusExterior30))}`}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Esta es la cuenta que explica la reversión matemática por exterior.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/85">
              No hay contradicción matemática: sin exterior, la lectura puede seguir
              favoreciendo a Sánchez; con exterior +30 pp para Keiko, ese bloque puede
              revertir el cierre. JEE queda separado porque no es voto ya contabilizado.
            </p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-card-border bg-accent/35 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              1. Perú interior pendiente
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-onpe tabular-nums">
              {interiorProjection == null
                ? isLoading
                  ? "..."
                  : "n/d"
                : formatVotes(interiorProjection.pendingActas)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Fallback actual: departamento. Fórmula: válidos por acta contabilizada
              * actas faltantes * porcentaje local observado.
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-alerta-muted p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              2. JEE / observadas
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-alerta tabular-nums">
              {maybeVotes(prediction.onpe.actasEnviadasJee)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              ONPE las separa como bloque legal-operativo. Sin microdatos distrito
              por distrito, no se asignan a candidato como voto ya resuelto.
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-accent/35 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              3. Exterior agregado
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-keiko tabular-nums">
              {formatSignedVotes(prediction.exterior.datumProjectedGapVotes)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Proyección Datum CR sobre el exterior completo si el volumen
              válido total se acerca a {formatVotes(prediction.exterior.validVoteEstimate)} votos
              (de los cuales ya hay {formatVotes(prediction.exterior.officialValidVotes ?? 0)} contabilizados).
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">Fórmula visible</p>
          <p className="mt-2 font-mono text-xs leading-relaxed text-muted sm:text-sm">
            gap actual + Perú interior pendiente + JEE/observadas no asignadas +
            exterior agregado = cierre proyectado
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            La tabla inferior muestra el cierre si el JEE no se fuerza a ningún
            candidato. El bloque JEE se conserva como riesgo separado porque no es
            muestra aleatoria ni voto ya contabilizado.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          {resultRows.map((row) => (
            <div key={row.label} className="rounded-lg border border-card-border bg-accent/35 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {row.label}
              </p>
              <p className={cn("mt-2 font-mono text-xl font-semibold tabular-nums", gapToneClass(row.gap))}>
                {row.value}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{row.detail}</p>
            </div>
          ))}
        </div>

        {topPending.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {topPending.map((row) => (
              <div key={row.code} className="rounded-lg border border-card-border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{row.name}</p>
                  <span className={cn("font-mono text-xs", gapToneClass(row.projectedPendingNetKeikoVotes))}>
                    {formatSignedVotes(row.projectedPendingNetKeikoVotes)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {maybeVotes(row.actasPendientes ?? null)} actas faltantes ·{" "}
                  {row.validVotesPerActa == null
                    ? "votos/acta n/d"
                    : `${row.validVotesPerActa.toFixed(1)} válidos/acta`}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted">
          Granularidad actual: departamento. Cuando el proxy ONPE de provincias/distritos
          responda estable en producción, el mismo método baja a ciudad/distrito sin
          mezclarlo con el exterior ni con el bloque JEE.
        </p>
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
    <section className="grid min-w-0 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-onpe/30">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Simulación Monte Carlo por componentes</CardTitle>
              <CardDescription>
                No es la lectura principal. {projection.modelName} ·{" "}
                {projection.modelVersion} · {formatVotes(projection.simulations)} simulaciones
              </CardDescription>
            </div>
            <Sigma className="h-5 w-5 text-onpe" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-card-border bg-accent/35 p-4">
              <p className="text-xs text-muted">Mediana del modelo secundario</p>
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

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Distribución del margen del modelo secundario</CardTitle>
          <CardDescription>
            Margen firmado: valores positivos favorecen a Keiko; negativos favorecen a Sánchez.
            Contrasta con la lectura principal por componentes antes de sacar conclusiones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-full overflow-x-auto pb-2">
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
            <CardTitle>Presupuesto de incertidumbre del modelo</CardTitle>
            <CardDescription>
              Separado por fuente de incertidumbre; no es un único margen de error muestral.
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
              Estado ONPE exterior agregado:{" "}
              <span className="font-mono text-foreground">
                {prediction.exterior.officialResultsStatus}
              </span>
              {prediction.exterior.actasTotal == null
                ? " · actas exteriores oficiales no verificadas por endpoint"
                : ` · ${formatActasProgress(
                    prediction.exterior.actasContabilizadas,
                    prediction.exterior.actasTotal,
                  )} · ${maybeVotes(prediction.exterior.actasPendientes)} pendientes`}
              .
            </p>
            {prediction.exterior.officialKeikoPct != null &&
              prediction.exterior.officialSanchezPct != null && (
                <p className="mt-2 text-muted">
                  ONPE exterior parcial: Keiko{" "}
                  <span className="font-mono text-keiko">
                    {formatPct(prediction.exterior.officialKeikoPct, 3)}
                  </span>{" "}
                  ({maybeVotes(prediction.exterior.officialVotesKeiko)}) / Sánchez{" "}
                  <span className="font-mono text-sanchez">
                    {formatPct(prediction.exterior.officialSanchezPct, 3)}
                  </span>{" "}
                  ({maybeVotes(prediction.exterior.officialVotesSanchez)}).
                </p>
              )}
            {prediction.exterior.officialAdvancePct != null && (
              <p className="mt-2 text-xs text-muted">
                Avance oficial exterior:{" "}
                <span className="font-mono text-foreground">
                  {formatPct(prediction.exterior.officialAdvancePct, 3)}
                </span>
                {prediction.exterior.officialValidVotes == null
                  ? ""
                  : ` · ${formatVotes(prediction.exterior.officialValidVotes)} votos válidos contabilizados`}
                . No se muestran países.
              </p>
            )}
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg border border-card-border bg-accent/35 p-3">
              <p className="text-xs text-muted">Votos válidos ext. hipotéticos</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                {formatVotes(prediction.exterior.validVoteEstimate)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatPct(prediction.exterior.turnoutAssumptionPct, 1)} participación ·{" "}
                {formatPct(prediction.exterior.validVoteAssumptionPct, 1)} válidos asumidos
              </p>
              <p className="mt-1 text-xs text-muted">
                Rango: {formatVotesRange(prediction.exterior.validVoteEstimateRange)}
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-accent/35 p-3">
              <p className="text-xs text-muted">Peso en pendiente est.</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-keiko">
                {maybePct(prediction.exterior.shareOfPendingValidEstimatePct, 2)}
              </p>
              <p className="mt-1 text-xs text-muted">No se usa el padrón completo como voto.</p>
              <p className="mt-1 text-xs text-muted">
                Rango: {maybePctRange(prediction.exterior.shareOfPendingValidEstimateRangePct, 2)}
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-accent/35 p-3">
              <p className="text-xs text-muted">Mix pendiente ajustado</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-sanchez">
                {maybePct(prediction.exterior.adjustedPendingSanchezPct, 2)}
              </p>
              <p className="mt-1 text-xs text-muted">Doméstico tardío + exterior Datum.</p>
              <p className="mt-1 text-xs text-muted">
                Rango: {maybePctRange(prediction.exterior.adjustedPendingSanchezRangePct, 2)}
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-accent/35 p-3">
              <p className="text-xs text-muted">Gap exterior ONPE observado</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-keiko">
                {formatSignedVotes(prediction.exterior.officialObservedGapVotes)}
              </p>
              <p className="mt-1 text-xs text-muted">
                Positivo favorece a Keiko; solo actas exteriores ya contabilizadas.
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-accent/35 p-3">
              <p className="text-xs text-muted">Gap exterior Datum est.</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-keiko">
                {formatSignedVotes(prediction.exterior.datumProjectedGapVotes)}
              </p>
              <p className="mt-1 text-xs text-muted">
                Rango: {formatSignedVotes(prediction.exterior.datumProjectedGapRangeVotes[0])} a{" "}
                {formatSignedVotes(prediction.exterior.datumProjectedGapRangeVotes[1])}
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-accent/35 p-3">
              <p className="text-xs text-muted">Nacional para compensar exterior</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-sanchez">
                {maybePct(prediction.exterior.domesticSanchezPctToOffsetDatumExterior, 2)}
              </p>
              <p className="mt-1 text-xs text-muted">
                Rango: {maybePctRange(prediction.exterior.domesticSanchezPctToOffsetDatumExteriorRange, 2)}
              </p>
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
            avance ONPE/JNE. La página nunca proclama ganador legal: solo muestra
            escenarios y riesgos hasta el cierre oficial.
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
  const territorialQuery = useOnpeTerritorial();
  const jeeModelQuery = useOnpeJeeModel();

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
      <HowTo100Panel
        prediction={data}
        territorial={territorialQuery.data}
        jeeModel={jeeModelQuery.data}
        isJeeFetching={jeeModelQuery.isFetching}
        isLoading={territorialQuery.isLoading}
      />
      <TrendSignalsPanel rows={data.trendSignals} />
      <PendingTerritoryPanel
        prediction={data}
        territorial={territorialQuery.data}
        isFetching={territorialQuery.isFetching}
        isLoading={territorialQuery.isLoading}
      />
      <CityForecastPanel />
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
