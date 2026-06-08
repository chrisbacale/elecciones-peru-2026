"use client";

import { useQuery } from "@tanstack/react-query";
import { ONPE_POLL_INTERVAL_MS } from "@/components/providers/query-provider";
import type { JeeResolutionModel } from "@/lib/types";

async function fetchOnpeJeeModel(): Promise<JeeResolutionModel> {
  const res = await fetch("/api/onpe/jee-model", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`ONPE JEE: HTTP ${res.status}`);
  }
  return res.json() as Promise<JeeResolutionModel>;
}

export function useOnpeJeeModel() {
  return useQuery({
    queryKey: ["onpe", "jee-model"],
    queryFn: fetchOnpeJeeModel,
    refetchInterval: ONPE_POLL_INTERVAL_MS,
    staleTime: ONPE_POLL_INTERVAL_MS,
  });
}
