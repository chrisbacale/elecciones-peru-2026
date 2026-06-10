"use client";

import { LimaFirstNote } from "@/components/territorial/LimaFirstNote";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOnpeResumen } from "@/hooks/useOnpeResumen";
import { flashElectoral } from "@/lib/data";
import { formatPct, formatRelativeTime } from "@/lib/format";
import { calcPendingVoteRequirement } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const TARGET_SANCHEZ = 50.3;

const TERRITORIAL_PROFILE = [
  { id: "sierra", label: "Sierra (Ipsos)", pct: 70.2 },
  { id: "sur", label: "Sur (Ipsos)", pct: 75.0 },
  { id: "rural", label: "Rural (Ipsos)", pct: 69.0 },
  { id: "exterior", label: "Exterior (ONPE observado)", pct: 37.7 },
] as const;

function compareToProfile(required: number, profile: number) {
  const diff = required - profile;
  if (Math.abs(diff) <= 2) return { label: "Alineado", tone: "text-muted" };
  if (required > profile)
    return { label: `+${diff.toFixed(1)} pp vs perfil`, tone: "text-keiko" };
  return { label: `${diff.toFixed(1)} pp vs perfil`, tone: "text-onpe" };
}

export function ConsistencyCalculator() {
  const { data, isLoading, isError, dataUpdatedAt } = useOnpeResumen();

  const advancePct = data?.advancePct ?? 0;
  const sanchezPct = data?.candidates.sanchez.pct ?? 0;
  const required = calcPendingVoteRequirement(
    advancePct,
    sanchezPct,
    TARGET_SANCHEZ
  );

  const ipsosCr = flashElectoral.sources.find((s) => s.id === "ipsos-cr");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>Calculadora en vivo</CardTitle>
            <CardDescription>
              Voto pendiente necesario para igualar el CR Ipsos
            </CardDescription>
          </div>
          {data && (
            <div className="shrink-0 whitespace-nowrap">
              <StatusBadge status={data.status} />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando datos ONPE…
            </div>
          )}

          {isError && (
            <p className="text-sm text-keiko">
              No se pudo obtener el resumen ONPE. Reintentando cada 90 s.
            </p>
          )}

          {data && (
            <>
              <p className="text-xs text-muted">
                Actualizado {formatRelativeTime(data.timestamp)}
                {dataUpdatedAt > 0 && " · poll cada 90 s"}
              </p>

              <div className="mt-4 rounded-lg border border-poll/25 bg-poll/5 p-5">
                <p className="text-base leading-relaxed sm:text-lg">
                  Con ONPE al{" "}
                  <strong className="font-mono text-poll tabular-nums">
                    {formatPct(advancePct, 1)}
                  </strong>{" "}
                  de avance y Sánchez al{" "}
                  <strong className="font-mono text-sanchez tabular-nums">
                    {formatPct(sanchezPct, 2)}
                  </strong>
                  , el bloque pendiente necesita{" "}
                  {required !== null ? (
                    <strong className="font-mono text-onpe tabular-nums">
                      {formatPct(required, 2)}
                    </strong>
                  ) : (
                    <strong className="text-keiko">un escenario inviable</strong>
                  )}{" "}
                  para alcanzar el {formatPct(TARGET_SANCHEZ, 1)} del CR Ipsos.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Aproximación: usa el avance de actas como proxy del avance de
                  votos válidos y asume que las actas pendientes pesan igual que
                  las contabilizadas. No reemplaza un cálculo acta por acta.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-xs text-muted">Avance actas</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                    {formatPct(advancePct, 1)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {data.actasProcesadas != null && data.actasTotal != null
                      ? `${data.actasProcesadas.toLocaleString("es-PE")} / ${data.actasTotal.toLocaleString("es-PE")} actas`
                      : "Actas absolutas no disponibles en snapshot"}
                  </p>
                </div>
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-xs text-muted">Sánchez (ONPE)</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-sanchez tabular-nums">
                    {formatPct(sanchezPct, 2)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Keiko {formatPct(data.candidates.keiko.pct, 2)}
                  </p>
                </div>
                <div className="rounded-lg border border-card-border bg-card p-4">
                  <p className="text-xs text-muted">Meta CR Ipsos</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-poll tabular-nums">
                    {formatPct(TARGET_SANCHEZ, 1)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Margen +{(ipsosCr?.data.marginPp ?? 0.6).toFixed(1)} pp Sánchez
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {required !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Comparación con perfil territorial Ipsos</CardTitle>
            <CardDescription>
              ¿El {formatPct(required, 2)} requerido en actas pendientes es
              coherente con el voto de Sánchez en los bloques que faltan?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TERRITORIAL_PROFILE.map((zone) => {
                const cmp = compareToProfile(required, zone.pct);
                return (
                  <div
                    key={zone.id}
                    className="rounded-lg border border-card-border bg-card p-4"
                  >
                    <p className="text-sm font-medium">{zone.label}</p>
                    <p className="mt-2 font-mono text-xl tabular-nums">
                      {formatPct(zone.pct, 1)}
                    </p>
                    <p className={cn("mt-2 text-xs font-medium", cmp.tone)}>
                      Requerido {formatPct(required, 1)} · {cmp.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Composición real del bloque pendiente al corte actual: ~9 de cada 10
              actas pendientes operativas son del exterior, donde Sánchez obtiene
              ~37.7% (ONPE observado al ~52% de avance exterior), no de la
              sierra/sur rural. Las actas JEE domésticas se concentran en
              Lima/Callao. Por eso el requerido alto frente a sierra/sur/rural no
              implica viabilidad: esos territorios ya están casi contabilizados.
            </p>
          </CardContent>
        </Card>
      )}

      <LimaFirstNote />
    </div>
  );
}
