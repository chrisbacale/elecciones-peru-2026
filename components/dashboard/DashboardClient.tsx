"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { flashElectoral, getErrorMetrics } from "@/lib/data";
import { calcSimpleAverage } from "@/lib/stats";
import { formatDateTime, formatPct } from "@/lib/format";
import { getCrAverageReading, getSourceReading } from "@/lib/reading";
import { useOnpeResumen } from "@/hooks/useOnpeResumen";
import { AdvanceRing } from "@/components/shared/AdvanceRing";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MarginGauge } from "@/components/shared/MarginGauge";
import { WaterfallChart } from "@/components/dashboard/WaterfallChart";
import { SourceCard } from "@/components/dashboard/SourceCard";
import {
  ComparisonTable,
  buildComparisonRows,
} from "@/components/dashboard/ComparisonTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ErrorMetrics } from "@/lib/types";

const SOURCE_IDS = [
  "onpe-parcial",
  "ipsos-boca",
  "datum-boca",
  "ipsos-cr",
  "datum-cr",
] as const;

const SOURCE_ACCENTS: Record<string, string> = {
  "onpe-parcial": "#059669",
  "ipsos-boca": "#3B82F6",
  "datum-boca": "#3B82F6",
  "ipsos-cr": "#A78BFA",
  "datum-cr": "#A78BFA",
};

function useErrorMetrics() {
  return useQuery<ErrorMetrics>({
    queryKey: ["error-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/stats/historical");
      if (!res.ok) return getErrorMetrics();
      return res.json();
    },
    staleTime: Infinity,
    initialData: getErrorMetrics(),
  });
}

export function DashboardClient() {
  const { data: onpe, isFetching } = useOnpeResumen();
  const { data: metrics } = useErrorMetrics();
  const onpeSnapshot = flashElectoral.sources.find((s) => s.id === "onpe-parcial");

  const advancePct = onpe?.advancePct ?? onpeSnapshot?.data.advancePct ?? 96.918;
  const onpeMargin = onpe?.marginPp ?? onpeSnapshot?.data.marginPp ?? 0.173;
  const timestamp = onpe?.timestamp ?? onpeSnapshot?.publishedAt ?? "2026-06-10T01:18:00-05:00";
  const onpeStatus = onpe?.status ?? "snapshot";
  const liveFlashElectoral = useMemo(() => {
    if (!onpe) return flashElectoral;

    const leader = onpe.marginLeader.toLowerCase().includes("sánchez")
      ? "Sánchez"
      : "Keiko";
    const stage = `ONPE ${onpe.advancePct.toFixed(3)}%`;
    const livePoint = {
      stage,
      marginPp: onpe.marginPp,
      leader,
    };
    const movement = [...flashElectoral.movement];
    const existingIndex = movement.findIndex((item) => item.stage === stage);

    if (existingIndex >= 0) {
      movement[existingIndex] = livePoint;
    } else {
      movement.push(livePoint);
    }

    return { ...flashElectoral, movement };
  }, [onpe]);
  const liveSources = useMemo(
    () =>
      flashElectoral.sources.map((source) => {
        if (source.id !== "onpe-parcial" || !onpe) return source;
        const marginLeader = onpe.marginLeader.toLowerCase().includes("sánchez") ? "b" : "a";
        return {
          ...source,
          publishedAt: onpe.timestamp,
          data: {
            ...source.data,
            a: onpe.candidates.keiko.pct,
            b: onpe.candidates.sanchez.pct,
            marginPp: onpe.marginPp,
            marginLeader,
            votesA: onpe.candidates.keiko.votes ?? source.data.votesA,
            votesB: onpe.candidates.sanchez.votes ?? source.data.votesB,
            advancePct: onpe.advancePct,
            actasProcesadas: onpe.actasProcesadas ?? source.data.actasProcesadas,
            actasTotal: onpe.actasTotal ?? source.data.actasTotal,
            actasPendientes: onpe.actasPendientesJee ?? source.data.actasPendientes,
            actasJee: onpe.actasEnviadasJee ?? source.data.actasJee,
            actasPendientesPct:
              onpe.actasPendientesJeePct ?? source.data.actasPendientesPct,
            actasJeePct: onpe.actasEnviadasJeePct ?? source.data.actasJeePct,
          },
          notes:
            onpe.status === "live"
              ? "Corte ONPE vivo desde /api/onpe/resumen; sin margen de error estadístico porque es escrutinio oficial parcial."
              : source.notes,
        };
      }),
    [onpe]
  );

  const readings = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getSourceReading>>();
    for (const source of liveSources) {
      if (!SOURCE_IDS.includes(source.id as (typeof SOURCE_IDS)[number])) continue;
      const historicalMax =
        source.type === "encuesta"
          ? metrics.bocaUrna.marginError.max
          : source.type === "muestra"
            ? metrics.conteoRapido.marginError.max
            : undefined;
      map.set(
        source.id,
        getSourceReading({
          type: source.type,
          instrument: source.instrument,
          data: source.data,
          notes: source.notes,
          marginOfError: source.data.marginOfError,
          historicalMaxError: historicalMax,
          isPartial: source.id === "onpe-parcial",
        })
      );
    }
    return map;
  }, [liveSources, metrics]);

  const comparisonRows = useMemo(
    () => buildComparisonRows(liveSources, readings),
    [liveSources, readings]
  );

  const crAverage = useMemo(() => {
    const ipsosCr = flashElectoral.sources.find((s) => s.id === "ipsos-cr")!.data;
    const datumCr = flashElectoral.sources.find((s) => s.id === "datum-cr")!.data;
    return calcSimpleAverage([
      { a: ipsosCr.a, b: ipsosCr.b },
      { a: datumCr.a, b: datumCr.b },
    ]);
  }, []);

  const crReading = getCrAverageReading(
    crAverage,
    flashElectoral.candidates.a.split(" ")[0],
    flashElectoral.candidates.b.split(" ").at(-1) ?? flashElectoral.candidates.b,
    metrics.conteoRapido.marginError.max
  );

  const displaySources = SOURCE_IDS.map((id) =>
    liveSources.find((s) => s.id === id)!
  );

  const ariaMessage = onpe
    ? `ONPE actualizado: ${advancePct.toFixed(1)}% de actas. Keiko ${onpe.candidates.keiko.pct.toFixed(2)}%, Sánchez ${onpe.candidates.sanchez.pct.toFixed(2)}%.`
    : "";

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* aria-live para lectores de pantalla */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {ariaMessage}
      </div>

      {/* Hero */}
      <section className="rounded-2xl border border-card-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="text-[10px] uppercase tracking-widest">
                Última hora 2026
              </Badge>
              <StatusBadge status={onpeStatus} />
              {isFetching && (
                <span className="text-xs text-muted">Actualizando...</span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Segunda vuelta presidencial
            </h1>
            <p className="text-sm text-muted">
              {flashElectoral.candidates.a}{" "}
              <span className="text-muted-foreground">vs</span>{" "}
              {flashElectoral.candidates.b}
            </p>
            <p className="text-xs text-muted">
              Última actualización:{" "}
              <time dateTime={timestamp}>{formatDateTime(timestamp)}</time>
            </p>
            {onpe?.message && (
              <p className="text-xs text-alerta">{onpe.message}</p>
            )}
          </div>
          <AdvanceRing advancePct={advancePct} />
        </div>
      </section>

      <Card role="status" className="border-alerta/35 bg-alerta-muted">
        <CardContent className="space-y-2 pt-5 text-sm leading-relaxed">
          <p className="font-semibold text-alerta">
            Lectura obligatoria: no proclamar ganador con estas fuentes.
          </p>
          <p className="text-foreground/85">
            La boca de urna es encuesta de salida, el conteo rápido es muestra
            probabilística de actas y ONPE parcial es oficial pero incompleta.
            El corte ONPE actual replica actas contabilizadas, no resultado
            legal al 100%; el JNE proclama cuando se resuelven las actas.
          </p>
        </CardContent>
      </Card>

      {/* Tarjetas por fuente */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Fuentes en tiempo real
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {displaySources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              reading={readings.get(source.id)!}
              accent={SOURCE_ACCENTS[source.id]}
            />
          ))}
        </div>
      </section>

      {/* Promedio CR + Gauge */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Promedio simple CR (Ipsos + Datum)</CardTitle>
            <CardDescription>
              Conteo rápido 100% — promedio aritmético de ambas firmas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-accent/45 p-4 text-center">
                <p className="text-xs text-muted">Keiko</p>
                <p className="text-3xl font-bold tabular-nums text-keiko">
                  {crAverage.a.toFixed(2)}%
                </p>
              </div>
              <div className="rounded-lg bg-accent/45 p-4 text-center">
                <p className="text-xs text-muted">Sánchez</p>
                <p className="text-3xl font-bold tabular-nums text-sanchez">
                  {crAverage.b.toFixed(2)}%
                </p>
              </div>
            </div>
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                crReading.tone === "warning"
                  ? "border-alerta/35 bg-alerta-muted text-foreground"
                  : "border-card-border bg-accent/45 text-foreground"
              }`}
            >
              <p className="font-medium">{crReading.headline}</p>
              <p className="mt-1 text-xs text-muted">{crReading.detail}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gauge de margen vs error histórico</CardTitle>
            <CardDescription>
              Bandas basadas en error máximo histórico de boca y CR (2001–2021)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarginGauge
              marginPp={onpeMargin}
              leader={
                onpe?.marginLeader ??
                (onpeSnapshot?.data.marginLeader === "b"
                  ? "Roberto Sánchez"
                  : "Keiko Fujimori")
              }
              bands={[
                {
                  label: "CR histórico",
                  max: metrics.conteoRapido.marginError.max,
                  color: "#A78BFA",
                },
                {
                  label: "Boca histórico",
                  max: metrics.bocaUrna.marginError.max,
                  color: "#3B82F6",
                },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      {/* Tabla comparador */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Comparador de 5 fuentes
        </h2>
        <ComparisonTable rows={comparisonRows} />
      </section>

      {/* Waterfall + Participación */}
      <section className="grid gap-4 lg:grid-cols-2">
        <WaterfallChart flash={liveFlashElectoral} />

        <Card>
          <CardHeader>
            <CardTitle>Participación Ipsos 2026</CardTitle>
            <CardDescription>
              Boca de urna — margen de error ±
              {flashElectoral.participation.marginOfError?.toFixed(1) ?? "1.8"} pp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-accent/45 p-4 text-center">
                <p className="text-xs text-muted">Participación</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatPct(flashElectoral.participation.rate, 1)}
                </p>
              </div>
              <div className="rounded-lg bg-accent/45 p-4 text-center">
                <p className="text-xs text-muted">Blanco</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatPct(flashElectoral.participation.blank, 1)}
                </p>
              </div>
              <div className="rounded-lg bg-accent/45 p-4 text-center">
                <p className="text-xs text-muted">Nulo</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatPct(flashElectoral.participation.null, 1)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted">
              Fuente: Ipsos boca de urna 2026. Los votos blancos y nulos no
              entran al cómputo de candidatos válidos.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Lectura global */}
      <section>
        <Card className="border-alerta/35 bg-alerta-muted">
          <CardHeader>
            <CardTitle className="text-foreground">
              Lectura automática del escenario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-foreground/85">
            <p>
              <strong className="text-foreground">Boca y CR:</strong> Todas las
              encuestas y conteos rápidos muestran{" "}
              <strong className="text-alerta">empate técnico</strong> — no
              proclamar ganador con base en estas fuentes.
            </p>
            <p>
              <strong className="text-foreground">ONPE parcial ({advancePct.toFixed(1)}%):</strong>{" "}
              {onpe?.marginLeader ?? "La ventaja parcial"}{" "}
              marca {Math.abs(onpeMargin).toFixed(3)} pp en el escrutinio contabilizado,
              pero el cómputo sigue incompleto y no equivale a proclamación.
              El avance restante puede cambiar la lectura operativa.
            </p>
            <p>
              <strong className="text-foreground">Promedio CR:</strong> Sánchez{" "}
              {crAverage.b.toFixed(2)}% / Keiko {crAverage.a.toFixed(2)}% —{" "}
              {crReading.declareWinner ? "ventaja clara" : "empate técnico, sin proclamar ganador"}.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
