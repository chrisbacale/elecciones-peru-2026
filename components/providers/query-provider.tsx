"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/** Intervalo de polling para datos ONPE en vivo (90 segundos). */
export const ONPE_POLL_INTERVAL_MS = 90_000;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: ONPE_POLL_INTERVAL_MS,
            refetchInterval: ONPE_POLL_INTERVAL_MS,
            refetchOnWindowFocus: true,
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
