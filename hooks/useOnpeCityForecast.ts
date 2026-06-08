"use client";

import { useQuery } from "@tanstack/react-query";
import { ONPE_POLL_INTERVAL_MS } from "@/components/providers/query-provider";
import type { OnpeCityForecast } from "@/lib/types";

async function fetchOnpeCityForecast(): Promise<OnpeCityForecast> {
  const res = await fetch("/api/onpe/city-forecast", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`ONPE ciudad/distrito: HTTP ${res.status}`);
  }
  return res.json() as Promise<OnpeCityForecast>;
}

export function useOnpeCityForecast() {
  return useQuery({
    queryKey: ["onpe", "city-forecast"],
    queryFn: fetchOnpeCityForecast,
    refetchInterval: ONPE_POLL_INTERVAL_MS,
    staleTime: ONPE_POLL_INTERVAL_MS,
  });
}
