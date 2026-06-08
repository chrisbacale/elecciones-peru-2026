"use client";

import { useOnpeTerritorial } from "@/hooks/useOnpeTerritorial";
import { formatRelativeTime } from "@/lib/format";
import type { FlashElectoral2026 } from "@/lib/types";
import { DepartmentTable } from "./DepartmentTable";
import { LimaFirstNote } from "./LimaFirstNote";
import { PeruMap } from "./PeruMap";
import { RegionBreakdown } from "./RegionBreakdown";

type TerritorialViewProps = {
  ipsos: FlashElectoral2026["territorial"]["ipsos"];
};

export function TerritorialView({ ipsos }: TerritorialViewProps) {
  const { data, isLoading, isFetching } = useOnpeTerritorial();

  return (
    <div className="space-y-8">
      <LimaFirstNote />

      <div className="grid gap-8 lg:grid-cols-2">
        <PeruMap territorial={data} isLoading={isLoading} />
        <RegionBreakdown ipsos={ipsos} />
      </div>

      <DepartmentTable territorial={data} isLoading={isLoading} />

      {(data?.timestamp || isFetching) && (
        <p className="text-center text-xs text-muted">
          {data?.timestamp && (
            <>
              Última actualización ONPE: {formatRelativeTime(data.timestamp)}
              {data.status === "live" ? " · en vivo" : " · snapshot"}
            </>
          )}
          {isFetching && !isLoading && " · actualizando…"}
        </p>
      )}
    </div>
  );
}
