import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SourceTypeBadge } from "@/components/shared/StatusBadge";
import { formatPct, formatPp } from "@/lib/format";
import type { SourceReading } from "@/lib/reading";
import type { FlashElectoral2026 } from "@/lib/types";

type Row = {
  id: string;
  name: string;
  type: "oficial" | "encuesta" | "muestra";
  instrument: string;
  pctA: number;
  pctB: number;
  labelA: string;
  labelB: string;
  marginPp: number;
  leader: string;
  reading: SourceReading;
};

export function ComparisonTable({ rows }: { rows: Row[] }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-xl border border-card-border">
      <Table className="min-w-[760px]">
        <TableCaption className="sr-only">
          Comparación de ONPE parcial, boca de urna y conteos rápidos 2026.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Fuente</TableHead>
            <TableHead scope="col">Tipo</TableHead>
            <TableHead scope="col" className="text-right">{rows[0]?.labelA ?? "A"}</TableHead>
            <TableHead scope="col" className="text-right">{rows[0]?.labelB ?? "B"}</TableHead>
            <TableHead scope="col" className="text-right">Margen</TableHead>
            <TableHead scope="col">Líder</TableHead>
            <TableHead scope="col">Lectura</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="text-xs text-muted">{row.instrument}</p>
                </div>
              </TableCell>
              <TableCell>
                <SourceTypeBadge type={row.type} />
              </TableCell>
              <TableCell className="text-right tabular-nums text-keiko">
                {formatPct(row.pctA)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sanchez">
                {formatPct(row.pctB)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPp(row.marginPp)}
              </TableCell>
              <TableCell>{row.leader}</TableCell>
              <TableCell>
                <Badge
                  variant={row.reading.tone === "warning" ? "warning" : "default"}
                  className="max-w-[220px] whitespace-normal text-left leading-snug"
                >
                  {row.reading.headline}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export type { Row as ComparisonRow };

export function buildComparisonRows(
  sources: FlashElectoral2026["sources"],
  readings: Map<string, SourceReading>
): Row[] {
  const ids = ["onpe-parcial", "ipsos-boca", "datum-boca", "ipsos-cr", "datum-cr"];
  return ids
    .map((id) => sources.find((s) => s.id === id))
    .filter((s): s is FlashElectoral2026["sources"][number] => !!s)
    .map((source) => {
      const { data } = source;
      const reading = readings.get(source.id)!;
      return {
        id: source.id,
        name: source.name,
        type: source.type,
        instrument: source.instrument,
        pctA: data.a,
        pctB: data.b,
        labelA: data.labelA,
        labelB: data.labelB,
        marginPp: data.marginPp ?? Math.abs(data.a - data.b),
        leader: data.marginLeader === "b" ? data.labelB : data.labelA,
        reading,
      };
    });
}
