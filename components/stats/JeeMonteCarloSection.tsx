"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BarChart3, Gavel, Scale, ShieldCheck } from "lucide-react";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveTable, type ResponsiveColumn } from "@/components/ui/responsive-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, formatPct, formatVotes } from "@/lib/format";
import type {
  JeeDepartmentRow,
  JeeResolutionHistoricalRow,
  JeeResolutionModel,
  JeeSensitivityRow,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function gapClass(gap: number | null | undefined) {
  if (gap == null || gap === 0) return "text-muted";
  return gap > 0 ? "text-keiko" : "text-sanchez";
}

function toneFromGap(gap: number | null | undefined): "keiko" | "sanchez" | undefined {
  if (gap == null || gap === 0) return undefined;
  return gap > 0 ? "keiko" : "sanchez";
}

function leaderGap(gap: number | null | undefined) {
  if (gap == null) return "Sin datos";
  if (Math.abs(gap) < 0.5) return "Empate";
  return `${gap > 0 ? "Keiko" : "Sánchez"} +${formatVotes(Math.abs(gap))}`;
}

function ratioPct(value: number, decimals = 1) {
  return formatPct(value * 100, decimals);
}

function ppFromRatio(value: number, decimals = 2) {
  return `${formatPct(value * 100, decimals)}`;
}

function Tile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "keiko" | "sanchez" | "onpe" | "alerta";
}) {
  const toneClass =
    tone === "keiko"
      ? "text-keiko"
      : tone === "sanchez"
        ? "text-sanchez"
        : tone === "alerta"
          ? "text-alerta"
          : tone === "onpe"
            ? "text-onpe"
            : "text-foreground";

  return (
    <div className="rounded-lg border border-card-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={cn("mt-2 font-mono text-xl font-semibold tabular-nums", toneClass)}>
        {value}
      </p>
      {detail && <p className="mt-2 text-xs leading-relaxed text-muted">{detail}</p>}
    </div>
  );
}

const departmentColumns: ResponsiveColumn<JeeDepartmentRow>[] = [
  {
    key: "department",
    header: "Departamento",
    render: (row) => (
      <div>
        <p className="font-semibold">{row.department}</p>
        <p className="text-xs text-muted">
          Snapshot reconciliado: {row.currentLeader === "Keiko" ? "Keiko" : "Sánchez"}
        </p>
      </div>
    ),
  },
  {
    key: "current",
    header: "Margen snapshot",
    render: (row) => (
      <span className={cn("font-mono font-semibold tabular-nums", gapClass(row.currentGapKeikoMinusSanchez))}>
        {leaderGap(row.currentGapKeikoMinusSanchez)}
      </span>
    ),
  },
  {
    key: "actas",
    header: "Actas no cerradas",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">
        pend. {formatVotes(row.actas.pendingOperational)} · JEE{" "}
        {formatVotes(row.actas.sentToJee)}
      </span>
    ),
  },
  {
    key: "pending",
    header: "Pendiente Perú",
    render: (row) => (
      <div className="font-mono text-xs tabular-nums">
        <p>{formatVotes(row.estimates.pendingOnlyValidVotes)} votos</p>
        <p className={gapClass(row.estimates.pendingOnlyGapKeikoMinusSanchez)}>
          {leaderGap(row.estimates.pendingOnlyGapKeikoMinusSanchez)}
        </p>
      </div>
    ),
  },
  {
    key: "jee",
    header: "JEE esperado",
    render: (row) => (
      <div className="font-mono text-xs tabular-nums">
        <p>cuenta {formatVotes(row.estimates.expectedJeeCountedActas)} actas</p>
        <p>no cuenta {formatVotes(row.estimates.expectedJeeAnnulledActas)}</p>
      </div>
    ),
  },
  {
    key: "projection",
    header: "Proyección modelada",
    render: (row) => (
      <span className={cn("font-mono font-semibold tabular-nums", gapClass(row.projection.gapKeikoMinusSanchez))}>
        {leaderGap(row.projection.gapKeikoMinusSanchez)}
      </span>
    ),
  },
];

const sensitivityColumns: ResponsiveColumn<JeeSensitivityRow>[] = [
  {
    key: "rate",
    header: "JEE que cuenta",
    render: (row) => (
      <span className="font-mono tabular-nums">{ratioPct(row.jeeAdmissionRate, 0)}</span>
    ),
  },
  {
    key: "margin",
    header: "Margen final",
    render: (row) => (
      <span className={cn("font-mono font-semibold tabular-nums", gapClass(row.marginKeikoMinusSanchez))}>
        {leaderGap(row.marginKeikoMinusSanchez)}
      </span>
    ),
  },
  {
    key: "votes",
    header: "Votos finales",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">
        K {formatVotes(row.finalKeikoVotes)} · S {formatVotes(row.finalSanchezVotes)}
      </span>
    ),
  },
  {
    key: "not-counted",
    header: "JEE no contado",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">
        {formatVotes(row.jeeVotesNotCountedOrInvalidated)} votos
      </span>
    ),
  },
];

const historicalColumns: ResponsiveColumn<JeeResolutionHistoricalRow>[] = [
  {
    key: "year",
    header: "Año",
    render: (row) => <span className="font-mono tabular-nums">{row.year}</span>,
  },
  {
    key: "observed",
    header: "Observadas/JEE",
    render: (row) => (
      <span className="font-mono tabular-nums">{formatVotes(row.observedActas)}</span>
    ),
  },
  {
    key: "annulled",
    header: "Anuladas",
    render: (row) => (
      <span className="font-mono tabular-nums">{formatVotes(row.annulledActas)}</span>
    ),
  },
  {
    key: "rate",
    header: "Anuladas / observadas",
    render: (row) => (
      <span className="font-mono tabular-nums">
        {ratioPct(row.annulledPctOfObserved, 2)}
      </span>
    ),
  },
  {
    key: "counted",
    header: "Terminan contando",
    render: (row) => (
      <span className="font-mono tabular-nums">
        {ratioPct(row.countedPctOfObserved, 2)}
      </span>
    ),
  },
];

function SummaryTab({ model }: { model: JeeResolutionModel }) {
  const expected = model.components.expectedJeeResolution;
  const scenario = model.scenarios.cityWeighted;
  const mc = scenario.monteCarlo.finalMarginKeikoMinusSanchez;
  const peruMc = scenario.monteCarlo.peruOnlyMarginKeikoMinusSanchez;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Tile
          label="ONPE corte auditado"
          value={leaderGap(model.officialCurrent.marginKeikoMinusSanchez)}
          detail={`${formatVotes(model.officialCurrent.keikoVotes)} Keiko · ${formatVotes(model.officialCurrent.sanchezVotes)} Sánchez`}
          tone={toneFromGap(model.officialCurrent.marginKeikoMinusSanchez)}
        />
        <Tile
          label="Pendiente Perú"
          value={leaderGap(model.components.pendingPeru.margin_keiko_minus_roberto)}
          detail={`${formatVotes(model.components.pendingPeru.actas)} actas · ${formatVotes(model.components.pendingPeru.valid)} votos est.`}
          tone={toneFromGap(model.components.pendingPeru.margin_keiko_minus_roberto)}
        />
        <Tile
          label="Actas JEE en riesgo"
          value={leaderGap(model.components.jeeAtRisk.margin_keiko_minus_roberto)}
          detail={`${formatVotes(model.components.jeeAtRisk.actas)} actas · ${formatVotes(model.components.jeeAtRisk.valid)} votos est.`}
          tone={toneFromGap(model.components.jeeAtRisk.margin_keiko_minus_roberto)}
        />
        <Tile
          label="Exterior agregado"
          value={leaderGap(model.components.foreignPendingAggregate.margin_keiko_minus_roberto)}
          detail={`${formatVotes(model.components.foreignPendingAggregate.actas)} actas, sin países ni ciudades`}
          tone={toneFromGap(model.components.foreignPendingAggregate.margin_keiko_minus_roberto)}
        />
        <Tile
          label="JEE que contaría"
          value={ratioPct(expected.admissionRate, 1)}
          detail={`${formatVotes(expected.expectedAnnulledActas)} actas anuladas esperadas`}
          tone="alerta"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-card-border bg-accent/35 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Monte Carlo exterior base agregado
          </p>
          <p className={cn("mt-2 font-mono text-xl font-semibold tabular-nums", gapClass(mc.median))}>
            {leaderGap(mc.median)}
          </p>
          <p className="mt-2 text-xs text-muted">
            Intervalo central 90%: {leaderGap(mc.p05)} a {leaderGap(mc.p95)}.
          </p>
        </div>
        <div className="rounded-lg border border-card-border bg-accent/35 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Solo Perú, sin exterior
          </p>
          <p className={cn("mt-2 font-mono text-xl font-semibold tabular-nums", gapClass(peruMc.median))}>
            {leaderGap(peruMc.median)}
          </p>
          <p className="mt-2 text-xs text-muted">
            Prob. modelada Sánchez: {ratioPct(peruMc.probabilitySanchezLeads, 1)}.
          </p>
        </div>
        <div className="rounded-lg border border-card-border bg-accent/35 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Incertidumbre modelada 90%
          </p>
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-onpe">
            ±{formatVotes(mc.centralInterval90HalfWidth)}
          </p>
          <p className="mt-2 text-xs text-muted">
            Semiancho p05-p95; intervalo 95%: ±{formatVotes(mc.centralInterval95HalfWidth)}.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Sensibilidad transparente del JEE
          </h3>
          <p className="text-xs text-muted">
            Lee cada fila como “si este porcentaje de actas JEE termina
            contabilizándose”, no como probabilidad de ganar.
          </p>
        </div>
        <ResponsiveTable
          data={scenario.sensitivityByJeeAdmissionRate}
          keyExtractor={(row) => String(row.jeeAdmissionRate)}
          columns={sensitivityColumns}
          caption="Sensibilidad JEE por tasa de actas que terminan contabilizadas"
        />
      </div>
    </div>
  );
}

function DepartmentsTab({ model }: { model: JeeResolutionModel }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Departamentos ordenados por impacto pendiente/JEE
        </h3>
        <p className="text-xs text-muted">
          La proyección suma snapshot territorial reconciliado a Perú, actas
          pendientes operativas y JEE esperadas como contabilizadas según el
          prior del régimen 2026 (Res. 0180-2025-JNE: recuento sobre anulación).
        </p>
      </div>
      <ResponsiveTable
        data={model.departmentRows}
        keyExtractor={(row) => row.department}
        columns={departmentColumns}
        caption="Proyección departamental de actas pendientes y JEE"
      />
    </div>
  );
}

function MonteCarloTab({ model }: { model: JeeResolutionModel }) {
  const scenarios = [
    model.scenarios.cityWeighted,
    model.scenarios.foreignKeikoPlus30,
    model.scenarios.foreign5050,
  ];
  const chartRows = model.scenarios.cityWeighted.monteCarlo.histogram.map((row) => ({
    ...row,
    pctDisplay: row.pct * 100,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-3">
        {scenarios.map((scenario) => {
          const stats = scenario.monteCarlo.finalMarginKeikoMinusSanchez;
          return (
            <div key={scenario.label} className="rounded-lg border border-card-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {scenario.label}
              </p>
              <p className={cn("mt-2 font-mono text-xl font-semibold tabular-nums", gapClass(stats.median))}>
                {leaderGap(stats.median)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Keiko lidera en {ratioPct(stats.probabilityKeikoLeads, 1)} de
                simulaciones; ±{formatVotes(stats.centralInterval90HalfWidth)} votos
                como intervalo central 90%.
              </p>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="h-80 min-w-[980px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minHeight={320}
            initialDimension={{ width: 980, height: 320 }}
          >
            <BarChart data={chartRows} margin={{ top: 12, right: 18, left: 0, bottom: 54 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted)", fontSize: 10 }}
                angle={-32}
                textAnchor="end"
                interval={3}
                height={62}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
                width={56}
              />
              <Tooltip
                allowEscapeViewBox={{ x: true, y: true }}
                cursor={{ fill: "var(--accent)" }}
                wrapperStyle={{ zIndex: 60, outline: "none" }}
                content={
                  <ChartTooltip
                    labelFormatter={(label) => `Margen ${label}`}
                    nameFormatter={() => "Simulaciones"}
                    valueFormatter={(value) => `${Number(value).toFixed(2)}%`}
                    note="Distribución del escenario ciudad/distrito ponderado con exterior agregado."
                  />
                }
              />
              <Bar dataKey="pctDisplay" name="Simulaciones" radius={[4, 4, 0, 0]}>
                {chartRows.map((row) => (
                  <Cell
                    key={row.label}
                    fill={row.midpoint >= 0 ? "var(--keiko)" : "var(--sanchez)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MethodTab({ model }: { model: JeeResolutionModel }) {
  const pooled = model.historicalJeeResolution.pooled;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Histórico observado"
          value={formatVotes(pooled.observedActas)}
          detail={`${formatVotes(pooled.totalActas)} actas totales en 2011/2016/2021`}
        />
        <Tile
          label="Anuladas históricas"
          value={formatVotes(pooled.annulledActas)}
          detail={`${ratioPct(pooled.annulledRateOfObserved, 2)} de observadas`}
          tone="alerta"
        />
        <Tile
          label="Conteo histórico"
          value={ratioPct(pooled.countedRateOfObserved, 2)}
          detail="Observadas que entraron al cómputo en 2011/2016/2021; sensibilidad conservadora."
        />
        <Tile
          label="Prior 2026 (recuento)"
          value={ratioPct(1 - pooled.regime2026Prior.mean, 2)}
          detail="Res. 0180-2025-JNE prioriza recuento sobre anulación; prior usado por el Monte Carlo."
          tone="onpe"
        />
      </div>

      <ResponsiveTable
        data={model.historicalJeeResolution.rows}
        keyExtractor={(row) => String(row.year)}
        columns={historicalColumns}
        caption="Histórico de actas observadas y anuladas en segundas vueltas"
      />

      <div className="rounded-lg border border-alerta/30 bg-alerta-muted p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-alerta" aria-hidden="true" />
          <div className="space-y-2 text-sm leading-relaxed text-foreground/85">
            {model.methodologyNotes.map((note) => (
              <p key={note}>{note}</p>
            ))}
            <p>
              Reconciliación técnica: {model.reconciliation.note} Diferencia
              raíz-hojas: {formatVotes(model.reconciliation.rootMinusLeafTotals.contabilizadas)} actas contabilizadas y{" "}
              {formatVotes(model.reconciliation.rootMinusLeafTotals.totalVotosValidos)} votos válidos.
            </p>
            {model.currentTerritorialSource.reconciliation && (
              <p>
                Tabla departamental: {model.currentTerritorialSource.reconciliation.note} Total Perú reconciliado:{" "}
                {formatVotes(model.currentTerritorialSource.reconciliation.outputCandidateSum)} votos válidos.
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Fuentes usadas</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {model.sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-card-border bg-card p-4 transition-colors hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-sm font-semibold text-foreground">{source.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{source.note}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JeeMonteCarloSection({ model }: { model: JeeResolutionModel }) {
  const root = model.currentUnresolved.rootTotals;

  return (
    <Card className="border-onpe/30 bg-gradient-to-br from-card to-background">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-onpe">
              Actas pendientes · JEE · Monte Carlo
            </p>
            <CardTitle className="mt-1 flex items-center gap-2 text-xl">
              <Scale className="h-5 w-5 text-onpe" aria-hidden="true" />
              Modelo por componentes hacia 100%
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl">
              Corte ONPE {formatDateTime(model.cutPeru)}. Se separa voto
              pendiente Perú, voto extranjero agregado y actas enviadas al JEE.
              No proclama ganador: estima escenarios con incertidumbre legal y
              territorial.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={model.status === "live" ? "live" : "snapshot"}>
              {model.status}
            </Badge>
            <Badge variant="warning">
              <span className="inline-flex items-center gap-1">
                <Gavel className="h-3.5 w-3.5" aria-hidden="true" />
                JEE en riesgo
              </span>
            </Badge>
            <Badge variant="live">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Exterior agregado
              </span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <Tile
            label="Avance ONPE nacional"
            value={`${formatPct(Number(root.actasContabilizadas), 3)}`}
            detail={`${formatVotes(Number(root.contabilizadas))} de ${formatVotes(Number(root.totalActas))} contabilizadas`}
            tone="onpe"
          />
          <Tile
            label="Enviadas al JEE"
            value={formatVotes(Number(root.enviadasJee))}
            detail={`${ppFromRatio(model.currentUnresolved.peru.pct_jee, 2)} de actas Perú`}
            tone="alerta"
          />
          <Tile
            label="Actas pendientes nacionales"
            value={formatVotes(Number(root.pendientesJee))}
            detail="Incluye Perú operativo y exterior agregado pendiente."
          />
          <Tile
            label="Monte Carlo"
            value={formatVotes(model.scenarios.cityWeighted.monteCarlo.iterations)}
            detail={`Semilla ${model.scenarios.cityWeighted.monteCarlo.seed}, reproducible.`}
          />
        </div>

        <Tabs defaultValue="resumen">
          <TabsList className="w-full max-w-full overflow-x-auto scrollbar-none">
            <TabsTrigger value="resumen" className="shrink-0">
              Resumen
            </TabsTrigger>
            <TabsTrigger value="departamentos" className="shrink-0">
              Departamentos
            </TabsTrigger>
            <TabsTrigger value="montecarlo" className="shrink-0">
              <span className="inline-flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                Monte Carlo
              </span>
            </TabsTrigger>
            <TabsTrigger value="metodo" className="shrink-0">
              Método
            </TabsTrigger>
          </TabsList>
          <TabsContent value="resumen">
            <SummaryTab model={model} />
          </TabsContent>
          <TabsContent value="departamentos">
            <DepartmentsTab model={model} />
          </TabsContent>
          <TabsContent value="montecarlo">
            <MonteCarloTab model={model} />
          </TabsContent>
          <TabsContent value="metodo">
            <MethodTab model={model} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
