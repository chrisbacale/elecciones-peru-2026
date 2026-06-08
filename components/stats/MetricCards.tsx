import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPct } from "@/lib/format";
import type { ErrorMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";

type MetricSet = { mean: number; median: number; max: number };

function MetricCard({
  title,
  subtitle,
  metrics,
  accent,
}: {
  title: string;
  subtitle: string;
  metrics: MetricSet;
  accent: "amber" | "sky";
}) {
  const accentClass =
    accent === "amber"
      ? "border-keiko/30 bg-keiko/5"
      : "border-poll/30 bg-poll/5";

  return (
    <Card className={cn("border", accentClass)}>
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {subtitle}
        </p>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-3">
          <div>
            <dt className="text-xs text-muted">Promedio</dt>
            <dd className="mt-0.5 font-mono text-xl font-semibold tabular-nums">
              {formatPct(metrics.mean, 2)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Mediana</dt>
            <dd className="mt-0.5 font-mono text-xl font-semibold tabular-nums">
              {formatPct(metrics.median, 2)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Máximo</dt>
            <dd className="mt-0.5 font-mono text-xl font-semibold tabular-nums">
              {formatPct(metrics.max, 2)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export function MetricCards({ metrics }: { metrics: ErrorMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MetricCard
        title="Error candidato"
        subtitle="Boca de urna Ipsos"
        metrics={metrics.bocaUrna.candidateError}
        accent="amber"
      />
      <MetricCard
        title="Error candidato"
        subtitle="Conteo rápido Ipsos"
        metrics={metrics.conteoRapido.candidateError}
        accent="sky"
      />
      <MetricCard
        title="Error de margen"
        subtitle="Boca de urna Ipsos"
        metrics={metrics.bocaUrna.marginError}
        accent="amber"
      />
      <MetricCard
        title="Error de margen"
        subtitle="Conteo rápido Ipsos"
        metrics={metrics.conteoRapido.marginError}
        accent="sky"
      />
    </div>
  );
}
