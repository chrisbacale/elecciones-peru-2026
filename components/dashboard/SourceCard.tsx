import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SourceTypeBadge } from "@/components/shared/StatusBadge";
import { CandidateBar } from "@/components/shared/CandidateBar";
import { formatPct, formatPp } from "@/lib/format";
import type { FlashElectoral2026 } from "@/lib/types";
import type { SourceReading } from "@/lib/reading";

type Source = FlashElectoral2026["sources"][number];

export function SourceCard({
  source,
  reading,
  accent,
}: {
  source: Source;
  reading: SourceReading;
  accent?: string;
}) {
  const { data } = source;
  const leader = data.marginLeader === "b" ? data.labelB : data.labelA;

  return (
    <Card
      className="flex flex-col"
      style={accent ? { borderColor: `${accent}40` } : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{source.name}</CardTitle>
            <CardDescription>{source.instrument}</CardDescription>
          </div>
          <SourceTypeBadge type={source.type} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <CandidateBar
          labelA={data.labelA}
          labelB={data.labelB}
          pctA={data.a}
          pctB={data.b}
        />
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted">Margen</p>
            <p className="font-semibold tabular-nums text-foreground">
              {formatPp(data.marginPp ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-muted">Líder</p>
            <p className="font-semibold text-foreground">{leader}</p>
          </div>
          {data.sampleSize && (
            <div>
              <p className="text-muted">Muestra</p>
              <p className="font-semibold tabular-nums text-foreground">
                {data.sampleSize.toLocaleString("es-PE")}
                {data.sampleSizeVerified === false ? " (no verif.)" : ""}
              </p>
            </div>
          )}
          {data.marginOfError && (
            <div>
              <p className="text-muted">Error</p>
              <p className="font-semibold tabular-nums text-foreground">
                ±{data.marginOfError.toFixed(1)} pp
              </p>
            </div>
          )}
          {"advancePct" in data && typeof data.advancePct === "number" && (
            <div className="col-span-2">
              <p className="text-muted">Avance actas</p>
              <p className="font-semibold tabular-nums text-onpe">
                {formatPct(data.advancePct, 1)}
              </p>
            </div>
          )}
        </div>
        <div
          className={`mt-auto rounded-lg border px-3 py-2 text-xs ${
            reading.tone === "warning"
              ? "border-alerta/35 bg-alerta-muted text-foreground"
              : reading.tone === "success"
                ? "border-onpe/35 bg-onpe-muted text-foreground"
                : "border-card-border bg-accent/40 text-foreground"
          }`}
        >
          <p className="font-medium">{reading.headline}</p>
          <p className="mt-0.5 text-muted">{reading.detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
