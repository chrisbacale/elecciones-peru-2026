"use client";

import { useQuery } from "@tanstack/react-query";
import type { OnpeApiMeta } from "@/lib/onpe-client";
import type { OnpeResumen } from "@/lib/types";
import { ONPE_POLL_INTERVAL_MS } from "@/components/providers/query-provider";

export type OnpeResumenResponse = OnpeResumen & { meta: OnpeApiMeta };

async function fetchOnpeResumen(): Promise<OnpeResumenResponse> {
  const res = await fetch("/api/onpe/resumen", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`ONPE resumen: HTTP ${res.status}`);
  }
  return res.json() as Promise<OnpeResumenResponse>;
}

export function useOnpeResumen() {
  return useQuery({
    queryKey: ["onpe", "resumen"],
    queryFn: fetchOnpeResumen,
    refetchInterval: ONPE_POLL_INTERVAL_MS,
    staleTime: ONPE_POLL_INTERVAL_MS,
  });
}
