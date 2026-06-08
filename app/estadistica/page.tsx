import { CandidateDiffTable } from "@/components/stats/CandidateDiffTable";
import { CurrentRaceSnapshot } from "@/components/stats/CurrentRaceSnapshot";
import { ErrorByYearChart } from "@/components/stats/ErrorByYearChart";
import { JeeMonteCarloSection } from "@/components/stats/JeeMonteCarloSection";
import { MetricCards } from "@/components/stats/MetricCards";
import { Positioning2026 } from "@/components/stats/Positioning2026";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import jeeResolutionModel from "@/data/2026/jee-resolution-model.json";
import { elections, getErrorMetrics } from "@/lib/data";
import type { JeeResolutionModel } from "@/lib/types";

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

      <Card className="border-onpe/30 bg-onpe-muted">
        <CardHeader>
          <CardTitle>Cómo leer Perú/JEE snapshot vs predicción live</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="max-w-4xl text-sm leading-relaxed text-foreground/85">
            Esta página mezcla historia estadística con un snapshot auditado de
            JEE/ciudad-distrito. La ruta de predicción separa la aritmética
            operativa en cinco bloques: ONPE del corte, Perú pendiente, JEE,
            solo Perú + JEE y exterior agregado. Así no se confunde una
            simulación secundaria con el cierre matemático por componentes.
          </p>
          <a
            href="/prediccion#lectura-componentes"
            className="inline-flex rounded-lg border border-onpe/35 bg-card px-3 py-2 text-sm font-semibold text-onpe transition-colors hover:bg-onpe hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver lectura principal por componentes
          </a>
        </CardContent>
      </Card>

      <JeeMonteCarloSection model={jeeResolutionModel as JeeResolutionModel} />

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
