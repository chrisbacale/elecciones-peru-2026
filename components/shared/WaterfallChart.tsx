"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";

type MovementStage = {
  stage: string;
  marginPp: number;
  leader: string;
};

const LEADER_COLORS: Record<string, string> = {
  Keiko: "var(--keiko)",
  Sánchez: "var(--sanchez)",
};

export function WaterfallChart({ data }: { data: MovementStage[] }) {
  const chartData = data.map((item, index) => {
    const prev = index > 0 ? data[index - 1].marginPp : 0;
    const delta = item.marginPp - prev;
    return {
      ...item,
      delta: Math.round(delta * 100) / 100,
      signedMargin: item.leader === "Sánchez" ? -item.marginPp : item.marginPp,
    };
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minHeight={288}
        initialDimension={{ width: 720, height: 288 }}
      >
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="stage"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--chart-axis)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.abs(v)} pp`}
          />
          <ReferenceLine y={0} stroke="var(--chart-axis)" />
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            content={
              <ChartTooltip
                nameFormatter={() => "Margen"}
                valueFormatter={(value, entry) => {
                  const row = entry.payload as MovementStage & { marginPp?: number };
                  const n = row.marginPp ?? Math.abs(Number(value ?? 0));
                  return `${n.toFixed(2)} pp (${row.leader})`;
                }}
              />
            }
          />
          <Bar dataKey="signedMargin" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.stage}
                fill={LEADER_COLORS[entry.leader] ?? "var(--muted)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-xs text-slate-500">
        Evolución del margen: simulacro → boca → CR → ONPE parcial
      </p>
    </div>
  );
}
