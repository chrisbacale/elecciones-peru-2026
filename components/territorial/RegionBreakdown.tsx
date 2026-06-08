import { CandidateBar } from "@/components/shared/CandidateBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { REGION_BREAKDOWN_ORDER } from "@/lib/territorial/constants";

type RegionSplit = {
  a: number;
  b: number;
  leader: string;
};

type RegionBreakdownProps = {
  ipsos: Record<string, RegionSplit>;
};

export function RegionBreakdown({ ipsos }: RegionBreakdownProps) {
  const regions = REGION_BREAKDOWN_ORDER.filter(({ key }) => ipsos[key]).map(
    ({ key, label }) => ({
      key,
      label,
      ...ipsos[key],
    })
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desglose territorial Ipsos 2026</CardTitle>
        <p className="text-xs text-muted">
          Conteo rápido y boca de urna — splits geográficos y socioeconómicos
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveTable
          data={regions}
          keyExtractor={(r) => r.key}
          columns={[
            {
              key: "label",
              header: "Zona",
              render: (r) => <span className="font-medium">{r.label}</span>,
            },
            {
              key: "keiko",
              header: "Keiko %",
              render: (r) => (
                <span className="font-mono text-keiko">{r.a.toFixed(1)}%</span>
              ),
            },
            {
              key: "sanchez",
              header: "Sánchez %",
              render: (r) => (
                <span className="font-mono text-sanchez">{r.b.toFixed(1)}%</span>
              ),
            },
            {
              key: "leader",
              header: "Líder",
              render: (r) => (
                <span
                  className={
                    r.leader === "Keiko" ? "text-keiko" : "text-sanchez"
                  }
                >
                  {r.leader}
                </span>
              ),
            },
            {
              key: "bar",
              header: "Distribución",
              mobileLabel: "Barra",
              render: (r) => (
                <CandidateBar
                  pctA={r.a}
                  pctB={r.b}
                  showLabels={false}
                  className="min-w-[120px]"
                />
              ),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}
