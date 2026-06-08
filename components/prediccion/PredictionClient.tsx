"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, Clock3, Globe2, RefreshCw } from "lucide-react";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
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
import type { PredictionSnapshot, RequirementRow, ScenarioRow } from "@/lib/prediction";
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

function toneClass(tone: ScenarioRow["tone"]) {
  if (tone === "keiko") return "text-keiko";
  if (tone === "sanchez") return "text-sanchez";
  return "text-muted";
}

function StatusPanel({ prediction }: { prediction: PredictionResponse }) {
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
      label: "Exterior ONPE",
      value: `${prediction.exterior.pendingPct.toFixed(0)}% pendiente`,
      detail: `${formatVotes(prediction.exterior.actasTotal)} actas exteriores`,
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
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
        <div className="h-72 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minHeight={288}
            initialDimension={{ width: 720, height: 288 }}
          >
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <ReferenceLine y={50} stroke="var(--chart-axis)" strokeDasharray="4 4" />
              <XAxis dataKey="label" stroke="var(--chart-axis)" fontSize={12} />
              <YAxis
                domain={[45, 62]}
                stroke="var(--chart-axis)"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                content={
                  <ChartTooltip
                    nameFormatter={() => "Sánchez pendiente"}
                    valueFormatter={(value) =>
                      typeof value === "number" ? formatPct(value, 2) : "—"
                    }
                  />
                }
              />
              <Bar dataKey="required" radius={[6, 6, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={
                      entry.required != null && entry.required >= 58
                        ? "var(--sanchez)"
                        : "var(--encuesta)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
        <div className="h-80 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minHeight={320}
            initialDimension={{ width: 920, height: 320 }}
          >
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 64 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <ReferenceLine y={50} stroke="var(--chart-axis)" strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                stroke="var(--chart-axis)"
                fontSize={11}
                angle={-20}
                textAnchor="end"
                height={72}
              />
              <YAxis
                domain={[46, 54]}
                stroke="var(--chart-axis)"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                content={
                  <ChartTooltip
                    nameFormatter={(name) => (name === "keiko" ? "Keiko" : "Sánchez")}
                    valueFormatter={(value) =>
                      typeof value === "number" ? formatPct(value, 3) : "—"
                    }
                  />
                }
              />
              <Bar dataKey="keiko" name="keiko" fill="var(--keiko)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sanchez" name="sanchez" fill="var(--sanchez)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
              rel="noreferrer"
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

export function PredictionClient({ initialPrediction }: { initialPrediction: PredictionResponse }) {
  const { data, isFetching, isError } = useQuery({
    queryKey: ["prediccion", "snapshot"],
    queryFn: fetchPrediction,
    initialData: initialPrediction,
    refetchInterval: ONPE_POLL_INTERVAL_MS,
    staleTime: ONPE_POLL_INTERVAL_MS,
  });

  const scenariosForTable = useMemo(() => data.scenarios, [data.scenarios]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <StatusPanel prediction={data} />

      {isError && (
        <Card className="border-alerta/35 bg-alerta-muted">
          <CardContent className="pt-5 text-sm text-foreground">
            No se pudo refrescar `/api/prediccion`; se conserva el último snapshot local.
          </CardContent>
        </Card>
      )}

      <KpiGrid prediction={data} isFetching={isFetching} />
      <OnpeVsQuickCounts prediction={data} />

      <section className="grid gap-4 xl:grid-cols-2">
        <RequirementTable rows={data.requirements} />
        <RequirementChart rows={data.requirements} />
      </section>

      <ScenarioChart scenarios={data.scenarios} />
      <ScenarioTable rows={scenariosForTable} />
      <ExteriorAndCaveats prediction={data} />
      <SourceLinks prediction={data} />
    </div>
  );
}
