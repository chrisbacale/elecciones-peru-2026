import electionsData from "@/data/historical/segunda-vuelta.json";
import errorMetricsData from "@/data/stats/error-metrics.json";
import flash2026 from "@/data/2026/flash-electoral.json";
import type { ElectionRecord, ErrorMetrics, FlashElectoral2026 } from "./types";
import { aggregateErrorMetrics } from "./stats";

export const elections = electionsData as ElectionRecord[];
export const flashElectoral = flash2026 as FlashElectoral2026;
export const errorMetrics = errorMetricsData as ErrorMetrics;

export function getElection(year: number): ElectionRecord | undefined {
  return elections.find((e) => e.year === year);
}

export function getCompletedElections(): ElectionRecord[] {
  return elections.filter((e) => e.instruments.onpe100 !== null);
}

export function getErrorMetrics(): ErrorMetrics {
  return aggregateErrorMetrics(getCompletedElections());
}

export function getValidatedErrorMetrics(): ErrorMetrics {
  return errorMetrics;
}
