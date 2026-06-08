"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import type { ElectionRecord } from "@/lib/types";

export function MarginChart({ elections }: { elections: ElectionRecord[] }) {
  const completed = elections
    .filter((e) => e.instruments.onpe100)
    .sort((a, b) => a.year - b.year);

  const data = completed.map((e) => ({
    year: e.year,
    boca: e.instruments.bocaUrna.ipsos?.marginPp ?? null,
    cr: e.instruments.conteoRapido.ipsos?.marginPp ?? null,
    onpe: e.instruments.onpe100?.marginPp ?? null,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución del margen por instrumento</CardTitle>
      </CardHeader>
      <div className="h-72 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={288}
          initialDimension={{ width: 720, height: 288 }}
        >
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis dataKey="year" tick={{ fill: "var(--muted)" }} />
            <YAxis tick={{ fill: "var(--muted)" }} unit=" pp" />
            <Tooltip
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 60, outline: "none" }}
              content={
                <ChartTooltip
                  nameFormatter={(name) =>
                    name === "boca" ? "Boca" : name === "cr" ? "Conteo rápido" : "ONPE 100%"
                  }
                  valueFormatter={(value) =>
                    typeof value === "number" ? `${value.toFixed(2)} pp` : "—"
                  }
                />
              }
            />
            <Legend />
            <Line type="monotone" dataKey="boca" name="Boca" stroke="var(--stage-boca)" strokeWidth={2} dot />
            <Line type="monotone" dataKey="cr" name="Conteo rápido" stroke="var(--stage-cr)" strokeWidth={2} dot />
            <Line type="monotone" dataKey="onpe" name="ONPE 100%" stroke="var(--stage-onpe)" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
