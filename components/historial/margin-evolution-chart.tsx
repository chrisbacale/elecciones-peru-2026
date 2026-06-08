"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import type { InstrumentProvider } from "./utils";
import { buildChartData } from "./utils";
import type { ElectionRecord } from "@/lib/types";

type MarginEvolutionChartProps = {
  elections: ElectionRecord[];
  provider: InstrumentProvider;
};

const STAGE_COLORS = {
  simulacro: "var(--stage-simulacro)",
  boca: "var(--stage-boca)",
  cr: "var(--stage-cr)",
  onpe: "var(--stage-onpe)",
} as const;

const STAGE_LABELS = {
  simulacro: "Simulacro",
  boca: "Boca de urna",
  cr: "Conteo rápido",
  onpe: "ONPE 100%",
} as const;

export function MarginEvolutionChart({
  elections,
  provider,
}: MarginEvolutionChartProps) {
  const data = buildChartData(elections, provider);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="h-[360px] min-w-[960px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={320}
          initialDimension={{ width: 960, height: 360 }}
        >
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--chart-grid)"
          />
          <XAxis
            dataKey="year"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickFormatter={(v) => `${Number(v) > 0 ? "+" : ""}${v} pp`}
            width={56}
          />
          <Tooltip
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ zIndex: 60, outline: "none" }}
            content={
              <ChartTooltip
                nameFormatter={(name) =>
                  STAGE_LABELS[name as keyof typeof STAGE_LABELS] ?? String(name)
                }
                valueFormatter={(value) =>
                  `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(2)} pp`
                }
                note="Margen firmado: positivo favorece al candidato A de ese año; negativo favorece al candidato B."
              />
            }
          />
          <Legend
            formatter={(value) =>
              STAGE_LABELS[value as keyof typeof STAGE_LABELS] ?? value
            }
          />
          <Line
            type="monotone"
            dataKey="simulacro"
            stroke={STAGE_COLORS.simulacro}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            name="simulacro"
          />
          <Line
            type="monotone"
            dataKey="boca"
            stroke={STAGE_COLORS.boca}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            name="boca"
          />
          <Line
            type="monotone"
            dataKey="cr"
            stroke={STAGE_COLORS.cr}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            name="cr"
          />
          <Line
            type="monotone"
            dataKey="onpe"
            stroke={STAGE_COLORS.onpe}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            name="onpe"
          />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
