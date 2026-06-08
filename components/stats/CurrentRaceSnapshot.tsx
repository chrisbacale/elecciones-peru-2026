"use client";

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
import { AlertTriangle, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { flashElectoral } from "@/lib/data";
import { formatPct, formatPp } from "@/lib/format";
import { getSourceReading } from "@/lib/reading";
import type { FlashElectoral2026 } from "@/lib/types";

type Source = FlashElectoral2026["sources"][number];

const SOURCE_IDS = ["ipsos-boca", "datum-boca", "ipsos-cr", "datum-cr", "onpe-parcial"] as const;

function getLeader(source: Source) {
  return source.data.marginLeader === "b" ? source.data.labelB : source.data.labelA;
}

function getMoe(source: Source) {
  if (source.type === "oficial") return "Sin MOE muestral";
  if (source.id === "ipsos-cr" && source.data.marginOfError !== undefined) {
    return `±${source.data.marginOfError.toFixed(1)} pp nac.`;
  }
  if (source.data.marginOfError !== undefined) return `±${source.data.marginOfError.toFixed(1)} pp`;
  return source.data.marginOfErrorNote ? "No publicado" : "—";
}

function getSampleLabel(source: Source) {
  if (source.data.sampleSize) {
    const base = source.data.sampleSize.toLocaleString("es-PE");
    return source.data.sampleSizeVerified === false ? `${base} (no verif.)` : base;
  }
  if (source.data.advancePct) return `${formatPct(source.data.advancePct, 1)} actas`;
  return "—";
}

function getReadingIcon(tone: string) {
  if (tone === "warning") return AlertTriangle;
  if (tone === "success") return CheckCircle2;
  if (tone === "info") return Info;
  return ShieldCheck;
}

export function CurrentRaceSnapshot() {
  const sources = SOURCE_IDS.map((id) =>
    flashElectoral.sources.find((source) => source.id === id)
  ).filter(Boolean) as Source[];

  const chartData = sources.map((source) => {
    const margin = source.data.marginPp ?? Math.abs(source.data.a - source.data.b);
    const signedMargin = source.data.marginLeader === "b" ? -margin : margin;
    return {
      id: source.id,
      label: `${source.name} ${source.instrument.replace("Conteo rápido 100%", "CR").replace("Boca de urna", "Boca").replace("Escrutinio parcial", "ONPE")}`,
      margin,
      signedMargin,
      leader: getLeader(source),
      moe: getMoe(source),
      instrument: source.instrument,
    };
  });

  return (
    <Card className="border-poll/25 bg-gradient-to-br from-card to-background">
      <CardHeader>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Estado actual 2026: encuestas, conteos y ONPE</CardTitle>
            <CardDescription className="mt-2 max-w-3xl">
              Snapshot auditado entre boca de urna, conteo rápido y avance
              oficial. Las barras positivas son ventaja de Keiko; las negativas,
              ventaja de Sánchez. ONPE parcial no tiene margen de error muestral
              y se actualiza en vivo solo en las rutas ONPE/predicción.
            </CardDescription>
          </div>
          <p className="rounded-lg border border-alerta/25 bg-alerta-muted px-3 py-2 text-xs font-medium text-foreground">
            Regla: dentro del MOE o con actas parciales, no proclamar ganador.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <div className="h-72 min-w-[860px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minHeight={288}
              initialDimension={{ width: 860, height: 288 }}
            >
              <BarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 42 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <ReferenceLine y={0} stroke="var(--chart-axis)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                angle={-18}
                textAnchor="end"
                height={62}
                interval={0}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickFormatter={(value) => `${value > 0 ? "+" : ""}${value} pp`}
                width={58}
              />
              <Tooltip
                allowEscapeViewBox={{ x: true, y: true }}
                cursor={{ fill: "var(--accent)" }}
                wrapperStyle={{ zIndex: 60, outline: "none" }}
                content={
                  <ChartTooltip
                    labelFormatter={(label) => label}
                    nameFormatter={() => "Margen"}
                    valueFormatter={(value, entry) => {
                      const row = entry.payload as { leader?: string; margin?: number; moe?: string };
                      const n = Number(row.margin ?? value ?? 0);
                      return `${row.leader ?? "—"} ${formatPp(n)}`;
                    }}
                    note="La lectura combina margen observado, MOE publicado y tipo de fuente."
                  />
                }
              />
              <Bar dataKey="signedMargin" name="Margen" radius={[5, 5, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.signedMargin >= 0 ? "var(--keiko)" : "var(--sanchez)"}
                  />
                ))}
              </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {sources.map((source) => {
            const reading = getSourceReading({
              type: source.type,
              instrument: source.instrument,
              data: source.data,
              notes: source.notes,
              marginOfError: source.data.marginOfError,
              isPartial: source.id === "onpe-parcial",
            });
            const Icon = getReadingIcon(reading.tone);

            return (
              <article
                key={source.id}
                className="rounded-xl border border-card-border bg-card/75 p-4 shadow-sm shadow-black/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {source.instrument}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-foreground">
                      {source.name}
                    </h3>
                  </div>
                  <Icon className="h-4 w-4 text-alerta" aria-hidden="true" />
                </div>
                <p className="mt-3 font-mono text-lg font-bold tabular-nums">
                  {getLeader(source)} {formatPp(source.data.marginPp ?? Math.abs(source.data.a - source.data.b))}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted">MOE</dt>
                    <dd className="font-semibold">{getMoe(source)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Muestra</dt>
                    <dd className="font-semibold">{getSampleLabel(source)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs font-semibold text-alerta">
                  {reading.headline}
                </p>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
