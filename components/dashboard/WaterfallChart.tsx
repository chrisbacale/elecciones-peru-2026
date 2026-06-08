"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import type { FlashElectoral2026 } from "@/lib/types";
import { formatPp } from "@/lib/format";

export function WaterfallChart({ flash }: { flash: FlashElectoral2026 }) {
  const data = flash.movement.map((m) => ({
    stage: m.stage.replace("Simulacro Ipsos", "Sim. Ipsos").replace("Boca Ipsos", "Boca").replace("CR Ipsos", "CR").replace("ONPE parcial", "ONPE"),
    margin:
      m.leader === "Keiko" || m.leader === "a"
        ? m.marginPp
        : -m.marginPp,
    leader: m.leader,
  }));
  const summary = data
    .map((item) => `${item.stage}: ${item.leader} ${formatPp(Math.abs(item.margin))}`)
    .join(" → ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giro del margen 2026</CardTitle>
        <CardDescription>
          {summary}
        </CardDescription>
      </CardHeader>
      <div className="overflow-x-auto pb-2">
        <div className="h-64 min-w-[720px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minHeight={256}
            initialDimension={{ width: 720, height: 256 }}
          >
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
            <ReferenceLine y={0} stroke="var(--chart-axis)" />
            <XAxis
              dataKey="stage"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickFormatter={(v) => `${v > 0 ? "+" : ""}${v} pp`}
            />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              content={
                <ChartTooltip
                  nameFormatter={() => "Margen"}
                  valueFormatter={(value) => {
                    const n = Number(value ?? 0);
                    return `${n > 0 ? "+" : ""}${n.toFixed(2)} pp`;
                  }}
                />
              }
            />
            <Bar dataKey="margin" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.margin > 0 ? "var(--keiko)" : "var(--sanchez)"}
                />
              ))}
            </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
