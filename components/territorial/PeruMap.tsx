"use client";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPct } from "@/lib/format";
import {
  CANDIDATE_COLORS,
  DEPARTMENTS,
} from "@/lib/territorial/constants";
import type { OnpeTerritorial } from "@/lib/types";
import { useMemo, useState } from "react";

type PeruMapProps = {
  territorial?: OnpeTerritorial;
  isLoading?: boolean;
};

type DeptResult = {
  keikoPct: number;
  sanchezPct: number;
  leader: string;
  advancePct: number;
};

function leaderFill(leader?: string, hasData = false): string {
  if (!hasData) return CANDIDATE_COLORS.neutral;
  if (leader === "Keiko" || leader?.includes("Keiko")) {
    return CANDIDATE_COLORS.keiko;
  }
  if (leader === "Sánchez" || leader?.includes("Sánchez")) {
    return CANDIDATE_COLORS.sanchez;
  }
  return CANDIDATE_COLORS.neutralMuted;
}

export function PeruMap({ territorial, isLoading }: PeruMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const byCode = useMemo(() => {
    const map = new Map<string, DeptResult>();
    for (const dept of territorial?.departments ?? []) {
      map.set(dept.code, {
        keikoPct: dept.keikoPct,
        sanchezPct: dept.sanchezPct,
        leader: dept.leader,
        advancePct: dept.advancePct,
      });
    }
    return map;
  }, [territorial?.departments]);

  const hasLiveData =
    territorial?.status === "live" && (territorial.departments?.length ?? 0) > 0;

  const hoveredDept = hovered ? DEPARTMENTS.find((d) => d.slug === hovered) : null;
  const hoveredData = hoveredDept ? byCode.get(hoveredDept.code) : null;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 pb-3">
        <CardTitle>Mapa departamental ONPE</CardTitle>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="inline-block h-3 w-3 rounded-sm bg-keiko" />
            Keiko
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="inline-block h-3 w-3 rounded-sm bg-sanchez" />
            Sánchez
          </span>
          {territorial?.status && <StatusBadge status={territorial.status} />}
        </div>
      </CardHeader>

      <CardContent className="relative pt-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-slate-950/60 text-sm text-muted">
            Cargando mapa territorial…
          </div>
        )}

        <svg
          viewBox="0 0 130 190"
          className="mx-auto h-auto w-full max-w-md"
          role="img"
          aria-label="Mapa electoral del Perú por departamento"
        >
          <rect width="130" height="190" fill="#020617" rx="4" />
          {DEPARTMENTS.map((dept) => {
            const data = byCode.get(dept.code);
            const isHovered = hovered === dept.slug;

            return (
              <path
                key={dept.slug}
                d={dept.path}
                fill={leaderFill(data?.leader, Boolean(data))}
                stroke={isHovered ? "#f1f5f9" : "#1e293b"}
                strokeWidth={isHovered ? 1.5 : 0.75}
                opacity={data ? (isHovered ? 1 : 0.92) : 0.35}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHovered(dept.slug)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(dept.slug)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                aria-label={`${dept.name}${
                  data
                    ? `: Keiko ${formatPct(data.keikoPct, 1)}, Sánchez ${formatPct(data.sanchezPct, 1)}`
                    : ""
                }`}
              />
            );
          })}
        </svg>

        {hoveredDept && (
          <div className="mt-3 rounded-lg border border-card-border bg-card/80 px-3 py-2 text-sm">
            <p className="font-medium">{hoveredDept.name}</p>
            {hoveredData ? (
              <p className="mt-0.5 text-muted">
                <span className="text-keiko">
                  Keiko {formatPct(hoveredData.keikoPct, 1)}
                </span>
                {" · "}
                <span className="text-sanchez">
                  Sánchez {formatPct(hoveredData.sanchezPct, 1)}
                </span>
                {hoveredData.advancePct > 0 && (
                  <span className="ml-2 text-muted/70">
                    ({formatPct(hoveredData.advancePct, 1)} actas)
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-0.5 text-muted">Sin escrutinio ONPE disponible</p>
            )}
          </div>
        )}

        {!hasLiveData && (
          <p className="mt-3 text-xs text-muted">
            {territorial?.message ??
              "Sin datos ONPE en vivo — departamentos en gris hasta que la API responda."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
