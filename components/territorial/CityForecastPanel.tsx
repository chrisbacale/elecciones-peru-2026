"use client";

import { MapPinned } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveTable, type ResponsiveColumn } from "@/components/ui/responsive-table";
import { useOnpeCityForecast } from "@/hooks/useOnpeCityForecast";
import { formatDateTime, formatPct, formatVotes } from "@/lib/format";
import type {
  CityForecastDistrictRow,
  CityForecastPlaceRow,
  CityForecastScenario,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function gapClass(gap: number | null | undefined) {
  if (gap == null || gap === 0) return "text-muted";
  return gap > 0 ? "text-keiko" : "text-sanchez";
}

function leaderGap(gap: number) {
  if (gap === 0) return "Empate";
  return `${gap > 0 ? "Keiko" : "Sánchez"} +${formatVotes(Math.abs(gap))}`;
}

function pctFromRatio(value: number) {
  return formatPct(value * 100, 2);
}

function ScenarioCard({
  label,
  scenario,
}: {
  label: string;
  scenario: CityForecastScenario;
}) {
  return (
    <div className="rounded-lg border border-card-border bg-accent/35 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={cn("mt-2 font-mono text-xl font-semibold tabular-nums", gapClass(scenario.margin_keiko_minus_roberto))}>
        {leaderGap(scenario.margin_keiko_minus_roberto)}
      </p>
      <p className="mt-2 text-xs text-muted">
        Keiko {pctFromRatio(scenario.keiko_pct)} · Sánchez{" "}
        {pctFromRatio(scenario.roberto_pct)}
      </p>
    </div>
  );
}

const provinceColumns: ResponsiveColumn<CityForecastPlaceRow>[] = [
  {
    key: "place",
    header: "Provincia",
    render: (row) => (
      <div>
        <p className="font-medium">{row.province_or_country}</p>
        <p className="text-xs text-muted">{row.department_or_continent}</p>
      </div>
    ),
  },
  {
    key: "actas",
    header: "Actas",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">
        pend. {formatVotes(row.pending_actas)} · JEE {formatVotes(row.jee_actas)}
      </span>
    ),
  },
  {
    key: "votes",
    header: "Votos est.",
    render: (row) => (
      <span className="font-mono tabular-nums">
        {formatVotes(row.estimated_valid_votes)}
      </span>
    ),
  },
  {
    key: "gap",
    header: "Impacto",
    render: (row) => (
      <span className={cn("font-mono font-semibold tabular-nums", gapClass(row.margin_keiko_minus_roberto))}>
        {leaderGap(row.margin_keiko_minus_roberto)}
      </span>
    ),
  },
];

const districtColumns: ResponsiveColumn<CityForecastDistrictRow>[] = [
  {
    key: "district",
    header: "Distrito",
    render: (row) => (
      <div>
        <p className="font-medium">{row.district_or_city}</p>
        <p className="text-xs text-muted">
          {row.province_or_country}, {row.department_or_continent}
        </p>
      </div>
    ),
  },
  {
    key: "actas",
    header: "Faltan",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">
        pend. {formatVotes(row.pending_actas)} · JEE {formatVotes(row.jee_actas)}
      </span>
    ),
  },
  {
    key: "share",
    header: "Share usado",
    render: (row) => (
      <span className="font-mono text-xs tabular-nums">
        Sánchez {pctFromRatio(row.city_roberto_share_used)}
      </span>
    ),
  },
  {
    key: "gap",
    header: "Impacto",
    render: (row) => (
      <span className={cn("font-mono font-semibold tabular-nums", gapClass(row.city_weighted_margin_keiko_minus_roberto))}>
        {leaderGap(row.city_weighted_margin_keiko_minus_roberto)}
      </span>
    ),
  },
];

export function CityForecastPanel() {
  const { data, isLoading, isFetching, isError } = useOnpeCityForecast();

  return (
    <Card className="border-onpe/30">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-onpe" aria-hidden="true" />
              Ciudades y distritos críticos
            </CardTitle>
            <CardDescription>
              Forecast por distrito para Perú interior; exterior solo agregado.
            </CardDescription>
          </div>
          <Badge variant={data?.status === "live" ? "live" : "snapshot"}>
            {isFetching ? "Actualizando" : data?.status ?? "snapshot"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading && !data ? (
          <p className="py-8 text-center text-sm text-muted">
            Cargando forecast por ciudad…
          </p>
        ) : isError || !data ? (
          <p className="py-8 text-center text-sm text-muted">
            No se pudo cargar el forecast por ciudad/distrito.
          </p>
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-card-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Corte auditado
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {formatDateTime(data.cutPeru)}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {formatVotes(data.unresolvedLeafCount)} unidades con actas no
                  resueltas.
                </p>
              </div>
              <div className="rounded-lg border border-card-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Perú interior
                </p>
                <p className={cn("mt-2 font-mono text-xl font-semibold tabular-nums", gapClass(data.aggregates.peru.margin_keiko_minus_roberto))}>
                  {leaderGap(data.aggregates.peru.margin_keiko_minus_roberto)}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {formatVotes(data.aggregates.peru.pending_actas)} pendientes ·{" "}
                  {formatVotes(data.aggregates.peru.jee_actas)} JEE.
                </p>
              </div>
              <div className="rounded-lg border border-card-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Exterior agregado
                </p>
                <p className={cn("mt-2 font-mono text-xl font-semibold tabular-nums", gapClass(data.aggregates.exteriorTotalOnly.margin_keiko_minus_roberto))}>
                  {leaderGap(data.aggregates.exteriorTotalOnly.margin_keiko_minus_roberto)}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Total exterior, sin países ni ciudades.
                </p>
              </div>
              <div className="rounded-lg border border-card-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Base oficial actual
                </p>
                <p className={cn("mt-2 font-mono text-xl font-semibold tabular-nums", gapClass(data.officialCurrent.margin_keiko_minus_roberto))}>
                  {leaderGap(data.officialCurrent.margin_keiko_minus_roberto)}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Antes de sumar pendientes/JEE/exterior.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <ScenarioCard
                label="Ciudad ponderada"
                scenario={data.scenarios.city_weighted_current}
              />
              <ScenarioCard
                label="Exterior Keiko +30 pp"
                scenario={data.scenarios.foreign_keiko_plus30_net_city_weighted_domestic}
              />
              <ScenarioCard
                label="Exterior 50/50"
                scenario={data.scenarios.foreign_50_50_city_weighted_domestic}
              />
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Provincias peruanas con mayor impacto
                </h3>
                <p className="text-xs text-muted">
                  Ordenadas por impacto absoluto estimado en votos netos.
                </p>
              </div>
              <ResponsiveTable
                data={data.topProvincesPeru.slice(0, 12)}
                keyExtractor={(row) =>
                  `${row.department_or_continent}-${row.province_or_country}`
                }
                columns={provinceColumns}
              />
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Distritos peruanos críticos
                </h3>
                <p className="text-xs text-muted">
                  Incluye actas pendientes y actas en JEE; no incluye detalle de
                  países del exterior.
                </p>
              </div>
              <ResponsiveTable
                data={data.topDistrictsPeru.slice(0, 16)}
                keyExtractor={(row) => row.dist_ubigeo}
                columns={districtColumns}
              />
            </div>

            <p className="text-xs leading-relaxed text-muted">
              Método: cada distrito con actas no resueltas se estima por separado.
              Si tiene votos actuales suficientes, usa el share observado; con
              pocos votos mezcla ese share con el modelo previo; sin votos usa el
              modelo distrital anterior. {data.privacyNote}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
