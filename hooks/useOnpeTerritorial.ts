"use client";

import { useQuery } from "@tanstack/react-query";
import type { OnpeApiMeta } from "@/lib/onpe-client";
import type { OnpeTerritorial } from "@/lib/types";
import { ONPE_POLL_INTERVAL_MS } from "@/components/providers/query-provider";

export type OnpeTerritorialResponse = OnpeTerritorial & { meta: OnpeApiMeta };

async function fetchOnpeTerritorial(): Promise<OnpeTerritorialResponse> {
  const res = await fetch("/api/onpe/territorial", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`ONPE territorial: HTTP ${res.status}`);
  }
  return res.json() as Promise<OnpeTerritorialResponse>;
}

export function useOnpeTerritorial() {
  return useQuery({
    queryKey: ["onpe", "territorial"],
    queryFn: fetchOnpeTerritorial,
    refetchInterval: ONPE_POLL_INTERVAL_MS,
    staleTime: ONPE_POLL_INTERVAL_MS,
  });
}
