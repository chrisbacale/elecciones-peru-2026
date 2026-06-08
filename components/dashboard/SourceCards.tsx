import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CandidateBar } from "@/components/shared/CandidateBar";
import { MarginGauge } from "@/components/shared/MarginGauge";
import type { FlashElectoral2026 } from "@/lib/types";
import { calcSimpleAverage } from "@/lib/stats";

const typeVariant = {
  oficial: "oficial" as const,
  encuesta: "encuesta" as const,
  muestra: "muestra" as const,
};

export function SourceCards({ flash }: { flash: FlashElectoral2026 }) {
  const crSources = flash.sources.filter((s) => s.instrument.includes("Conteo rápido"));
  const crAvg =
    crSources.length > 0
      ? calcSimpleAverage(crSources.map((s) => ({ a: s.data.a, b: s.data.b })))
      : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {flash.sources.map((source) => (
          <Card key={source.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{source.name}</CardTitle>
                <Badge variant={typeVariant[source.type]}>{source.type}</Badge>
              </div>
              <CardDescription>{source.instrument}</CardDescription>
            </CardHeader>
            <CandidateBar pctA={source.data.a} pctB={source.data.b} />
            <p className="mt-3 text-sm font-mono">
              Margen:{" "}
              <span className="text-foreground">
                {(source.data.marginLeader === "a" ? "Keiko" : "Sánchez")}{" "}
                +{source.data.marginPp?.toFixed(2)} pp
              </span>
            </p>
            {source.notes && (
              <p className="mt-2 text-xs text-muted">{source.notes}</p>
            )}
          </Card>
        ))}
      </div>

      {crAvg && (
        <Card className="border-poll/30">
          <CardHeader>
            <CardTitle>Promedio simple CR (Ipsos + Datum)</CardTitle>
            <CardDescription>No es meta-análisis formal</CardDescription>
          </CardHeader>
          <CandidateBar pctA={crAvg.a} pctB={crAvg.b} />
          <div className="mt-4">
            <MarginGauge
              marginPp={crAvg.marginPp}
              leader={crAvg.leader === "b" ? "Sánchez" : "Keiko"}
              bands={[
                { label: "Error histórico medio", max: 0.4, color: "#3b82f6" },
                { label: "Error histórico máximo", max: 1.0, color: "#eab308" },
              ]}
            />
          </div>
          <p className="mt-3 text-sm text-alert">
            ⚖️ Margen CR dentro del error histórico máximo (1.0 pp); no permite proclamar ganador
          </p>
        </Card>
      )}
    </div>
  );
}
