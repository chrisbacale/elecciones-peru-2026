import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { flashElectoral, getErrorMetrics } from "@/lib/data";
import { formatPct, formatPp } from "@/lib/format";
import { isWithinHistoricalError } from "@/lib/stats";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export function Positioning2026() {
  const metrics = getErrorMetrics();
  const crSource = flashElectoral.sources.find((s) => s.id === "ipsos-cr");
  const cr = crSource?.data;

  if (!cr) return null;

  const marginPp = cr.marginPp ?? Math.abs(cr.a - cr.b);
  const withinHistory = isWithinHistoricalError(marginPp, "cr", metrics);
  const crErrors = metrics.conteoRapido.candidateError;
  const moe = cr.marginOfError;

  return (
    <Card className="border-poll/20 bg-gradient-to-br from-card to-background">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-poll">
              Posicionamiento 2026
            </p>
            <CardTitle className="mt-1 text-xl">
              CR Ipsos: Sánchez {formatPct(cr.b, 1)}
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm">
              Margen {formatPp(marginPp)} a favor de Sánchez según conteo rápido
              Ipsos/Transparencia (1.037 actas, muestra aleatoria).
            </CardDescription>
          </div>
          <Badge variant={withinHistory ? "live" : "warning"}>
            {withinHistory ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Dentro de calibración CR
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Fuera de calibración CR
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-card-border bg-card p-4">
            <p className="text-xs text-muted">Margen CR 2026</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-poll tabular-nums">
              {formatPp(marginPp)}
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-card p-4">
            <p className="text-xs text-muted">Error margen CR — prom. hist.</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {formatPct(metrics.conteoRapido.marginError.mean, 2)}
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-card p-4">
            <p className="text-xs text-muted">Error margen CR — mediana</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {formatPct(metrics.conteoRapido.marginError.median, 2)}
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-card p-4">
            <p className="text-xs text-muted">Error margen CR — máximo</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {formatPct(metrics.conteoRapido.marginError.max, 2)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          El margen de {formatPp(marginPp)} del CR Ipsos{" "}
          {withinHistory
            ? "cae dentro de la calibración histórica ex post del conteo rápido"
            : "supera el máximo histórico observado en conteo rápido"}
          . Esa calibración no es MOE muestral. MOE publicado para este CR:
          {moe !== undefined ? ` ±${moe.toFixed(1)} pp` : " no publicado como valor único"}.
          Error candidato histórico CR: promedio {formatPct(crErrors.mean, 2)},
          mediana {formatPct(crErrors.median, 2)}, máximo {formatPct(crErrors.max, 2)}.
        </p>
      </CardContent>
    </Card>
  );
}
