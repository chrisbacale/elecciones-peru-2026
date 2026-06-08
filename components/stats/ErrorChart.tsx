"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import type { ErrorMetrics } from "@/lib/types";

export function ErrorChart({ metrics }: { metrics: ErrorMetrics }) {
  const data = metrics.bocaUrna.byYear.map((boca, i) => ({
    year: boca.year,
    bocaMargin: boca.marginError,
    crMargin: metrics.conteoRapido.byYear[i]?.marginError ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error de margen por elección (pp)</CardTitle>
      </CardHeader>
      <div className="h-72 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={288}
          initialDimension={{ width: 720, height: 288 }}
        >
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis dataKey="year" tick={{ fill: "var(--muted)" }} />
            <YAxis tick={{ fill: "var(--muted)" }} unit=" pp" />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              content={
                <ChartTooltip
                  nameFormatter={(name) =>
                    name === "bocaMargin" ? "Boca de urna" : "Conteo rápido"
                  }
                  valueFormatter={(value) =>
                    typeof value === "number" ? `${value.toFixed(2)} pp` : "—"
                  }
                />
              }
            />
            <Legend />
            <Bar dataKey="bocaMargin" name="Boca" fill="var(--stage-boca)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="crMargin" name="Conteo rápido" fill="var(--stage-cr)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
