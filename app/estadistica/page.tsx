import { CandidateDiffTable } from "@/components/stats/CandidateDiffTable";
import { CurrentRaceSnapshot } from "@/components/stats/CurrentRaceSnapshot";
import { ErrorByYearChart } from "@/components/stats/ErrorByYearChart";
import { MetricCards } from "@/components/stats/MetricCards";
import { Positioning2026 } from "@/components/stats/Positioning2026";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { elections, getErrorMetrics } from "@/lib/data";

export const metadata = {
  title: "Estadística histórica | Radar Electoral Perú",
  description:
    "Error histórico de boca de urna y conteo rápido Ipsos vs ONPE 100% en segundas vueltas 2001–2021.",
};

export default function EstadisticaPage() {
  const metrics = getErrorMetrics();
  const completedCount = elections.filter(
    (e) => e.instruments.onpe100 !== null
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Auditoría estadística</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Error Ipsos vs ONPE 100% en {completedCount} elecciones completadas
          (2001–2021), más lectura actual 2026 con Ipsos, Datum y ONPE parcial.
          Valores en puntos porcentuales.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            title: "Boca de urna",
            body: "Encuesta de salida. Sirve para tendencia temprana; si el margen entra en MOE o la fuente declara empate técnico, no proclama.",
            tone: "border-stage-boca/35 bg-stage-boca/10",
          },
          {
            title: "Conteo rápido",
            body: "Muestra probabilística de actas. Más preciso históricamente que la boca, pero sigue siendo estimación estadística.",
            tone: "border-stage-cr/35 bg-stage-cr/10",
          },
          {
            title: "ONPE parcial",
            body: "Oficial pero incompleto. No tiene MOE muestral y puede sesgarse por orden territorial de llegada de actas.",
            tone: "border-stage-onpe/35 bg-stage-onpe/10",
          },
        ].map((item) => (
          <Card key={item.title} className={item.tone}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/80">
                {item.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <CurrentRaceSnapshot />

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
          Resumen de error — Boca vs Conteo rápido
        </h2>
        <MetricCards metrics={metrics} />
      </section>

      <ErrorByYearChart metrics={metrics} />

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Diferencias candidato vs ONPE 100%
        </h2>
        <CandidateDiffTable elections={elections} />
      </section>

      <Positioning2026 />
    </div>
  );
}
