"use client";

import { useMemo, useState } from "react";
import type { ElectionRecord } from "@/lib/types";
import { ComparisonTable } from "./comparison-table";
import { HistoricalResultMatrix } from "./historical-result-matrix";
import { InstrumentFilter } from "./instrument-filter";
import { MarginEvolutionChart } from "./margin-evolution-chart";
import {
  MarginOfErrorAudit,
  MethodologyBrief,
  ResearchSummary,
  SourceAuditPanel,
} from "./research-brief";
import {
  buildYearRow,
  providerAvailable,
  type InstrumentProvider,
} from "./utils";

type HistorialViewProps = {
  elections: ElectionRecord[];
};

export function HistorialView({ elections }: HistorialViewProps) {
  const showDatum = providerAvailable(elections, "datum");
  const [provider, setProvider] = useState<InstrumentProvider>("ipsos");

  const rows = useMemo(
    () =>
      [...elections]
        .sort((a, b) => a.year - b.year)
        .map((e) => buildYearRow(e, provider)),
    [elections, provider]
  );

  return (
    <div className="space-y-10">
      <ResearchSummary />

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Selector de encuestadora
            </h2>
            <p className="mt-1 text-sm text-muted">
              Ipsos tiene una serie homogénea 2001–2021; Datum entra donde hay
              evidencia pública verificable y se rotula cuando no es comparable.
            </p>
          </div>
          <InstrumentFilter
            value={provider}
            onChange={setProvider}
            showDatum={showDatum}
          />
        </div>
        <HistoricalResultMatrix elections={elections} provider={provider} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Deltas técnicos
          </h2>
          <p className="mt-1 text-sm text-muted">
            Margen visible absoluto y delta firmado entre etapas para auditar
            sobreestimación, reversión de líder y distancia contra ONPE.
          </p>
        </div>
        <ComparisonTable rows={rows} />
      </section>

      <MarginOfErrorAudit elections={elections} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Evolución del margen
          </h2>
          <p className="mt-1 text-sm text-muted">
            Margen firmado por etapa electoral a lo largo de los años.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card/80 p-4 shadow-sm shadow-black/20">
          <MarginEvolutionChart elections={elections} provider={provider} />
        </div>
      </section>

      <MethodologyBrief />
      <SourceAuditPanel />
    </div>
  );
}
