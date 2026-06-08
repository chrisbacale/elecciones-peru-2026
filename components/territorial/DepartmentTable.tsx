"use client";

import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPct, formatVotes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OnpeTerritorial } from "@/lib/types";

type DepartmentTableProps = {
  territorial?: OnpeTerritorial;
  isLoading?: boolean;
};

export function DepartmentTable({ territorial, isLoading }: DepartmentTableProps) {
  const departments = territorial?.departments ?? [];
  const hasData = departments.length > 0;

  const keikoWins = departments.filter(
    (d) => d.leader === "Keiko" || d.leader.includes("Keiko")
  ).length;
  const sanchezWins = departments.length - keikoWins;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <CardTitle>Resultados por departamento</CardTitle>
          <p className="text-xs text-muted">
            Escrutinio parcial ONPE — porcentaje sobre votos válidos
          </p>
        </div>
        {hasData && (
          <p className="text-sm text-muted">
            <span className="text-keiko">{keikoWins} Keiko</span>
            {" · "}
            <span className="text-sanchez">{sanchezWins} Sánchez</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading && !hasData ? (
          <p className="py-8 text-center text-sm text-muted">Consultando ONPE…</p>
        ) : !hasData ? (
          <p className="py-8 text-center text-sm text-muted">
            Sin datos departamentales ONPE. El mapa y la tabla se actualizarán
            cuando la API responda.
          </p>
        ) : (
          <ResponsiveTable
            data={departments}
            keyExtractor={(d) => d.code}
            columns={[
              {
                key: "name",
                header: "Departamento",
                render: (d) => <span className="font-medium">{d.name}</span>,
              },
              {
                key: "keiko",
                header: "Keiko",
                render: (d) => {
                  const keikoLeads =
                    d.leader === "Keiko" || d.leader.includes("Keiko");
                  return (
                    <span
                      className={cn(
                        "font-mono tabular-nums",
                        keikoLeads ? "text-keiko" : "text-muted"
                      )}
                    >
                      {formatPct(d.keikoPct, 1)}
                    </span>
                  );
                },
              },
              {
                key: "sanchez",
                header: "Sánchez",
                render: (d) => {
                  const keikoLeads =
                    d.leader === "Keiko" || d.leader.includes("Keiko");
                  return (
                    <span
                      className={cn(
                        "font-mono tabular-nums",
                        !keikoLeads ? "text-sanchez" : "text-muted"
                      )}
                    >
                      {formatPct(d.sanchezPct, 1)}
                    </span>
                  );
                },
              },
              {
                key: "advance",
                header: "Avance",
                render: (d) => (
                  <span className="font-mono tabular-nums text-muted">
                    {d.advancePct > 0 ? formatPct(d.advancePct, 1) : "—"}
                  </span>
                ),
              },
              {
                key: "pending",
                header: "Faltan",
                render: (d) => (
                  <span className="font-mono tabular-nums text-alerta">
                    {d.actasPendientes == null ? "—" : formatVotes(d.actasPendientes)}
                  </span>
                ),
              },
              {
                key: "leader",
                header: "Líder",
                render: (d) => {
                  const keikoLeads =
                    d.leader === "Keiko" || d.leader.includes("Keiko");
                  return (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        keikoLeads
                          ? "bg-keiko/15 text-keiko"
                          : "bg-sanchez/15 text-sanchez"
                      )}
                    >
                      {d.leader}
                    </span>
                  );
                },
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}
