"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import type { ErrorMetrics } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ErrorByYearChart({ metrics }: { metrics: ErrorMetrics }) {
  const years = new Set([
    ...metrics.bocaUrna.byYear.map((y) => y.year),
    ...metrics.conteoRapido.byYear.map((y) => y.year),
  ]);

  const data = [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const boca = metrics.bocaUrna.byYear.find((y) => y.year === year);
      const cr = metrics.conteoRapido.byYear.find((y) => y.year === year);
      const bocaAvg = boca
        ? (boca.candidateErrorA + boca.candidateErrorB) / 2
        : null;
      const crAvg = cr ? (cr.candidateErrorA + cr.candidateErrorB) / 2 : null;

      return {
        year: String(year),
        boca: bocaAvg !== null ? Math.round(bocaAvg * 100) / 100 : null,
        cr: crAvg !== null ? Math.round(crAvg * 100) / 100 : null,
      };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error por elección</CardTitle>
        <CardDescription>
          Promedio de error por candidato (pp) vs ONPE 100%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="h-72 min-w-[720px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minHeight={288}
              initialDimension={{ width: 720, height: 288 }}
            >
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="year" stroke="var(--chart-axis)" fontSize={12} />
              <YAxis
                stroke="var(--chart-axis)"
                fontSize={12}
                tickFormatter={(v) => `${v} pp`}
              />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                content={
                  <ChartTooltip
                    nameFormatter={(name) =>
                      name === "boca" ? "Boca Ipsos" : "CR Ipsos"
                    }
                    valueFormatter={(value) =>
                      typeof value === "number" ? `${value.toFixed(2)} pp` : "—"
                    }
                  />
                }
              />
              <Legend
                formatter={(value) =>
                  value === "boca" ? "Boca de urna" : "Conteo rápido"
                }
              />
              <Bar dataKey="boca" name="boca" fill="var(--stage-boca)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cr" name="cr" fill="var(--stage-cr)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
