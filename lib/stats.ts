import type { ElectionRecord, ErrorMetrics } from "./types";

type OnpeFinal = NonNullable<ElectionRecord["instruments"]["onpe100"]>;

export function getOnpeComparisonBaseline(onpe: OnpeFinal): { a: number; b: number } {
  return onpe.ipsosBaseline ?? { a: onpe.a, b: onpe.b };
}

export function calcCandidateError(estimate: number, onpe: number): number {
  return Math.abs(estimate - onpe);
}

export function calcMargin(
  pctA: number,
  pctB: number
): { marginPp: number; leader: string } {
  const marginPp = Math.abs(pctA - pctB);
  return { marginPp, leader: pctA >= pctB ? "a" : "b" };
}

export function calcSignedMargin(pctA: number, pctB: number): number {
  return pctA - pctB;
}

export function calcMarginError(
  estA: number,
  estB: number,
  onpeA: number,
  onpeB: number
): number {
  const estMargin = calcSignedMargin(estA, estB);
  const onpeMargin = calcSignedMargin(onpeA, onpeB);
  return Math.abs(estMargin - onpeMargin);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function aggregateErrorMetrics(
  elections: ElectionRecord[]
): ErrorMetrics {
  const completed = elections.filter((e) => e.instruments.onpe100 !== null);

  const bocaCandidateErrors: number[] = [];
  const bocaMarginErrors: number[] = [];
  const bocaByYear: ErrorMetrics["bocaUrna"]["byYear"] = [];

  const crCandidateErrors: number[] = [];
  const crMarginErrors: number[] = [];
  const crByYear: ErrorMetrics["conteoRapido"]["byYear"] = [];

  for (const election of completed) {
    const onpe = election.instruments.onpe100!;
    const baseline = getOnpeComparisonBaseline(onpe);
    const boca = election.instruments.bocaUrna.ipsos;
    const cr = election.instruments.conteoRapido.ipsos;

    if (boca) {
      const errA = calcCandidateError(boca.a, baseline.a);
      const errB = calcCandidateError(boca.b, baseline.b);
      const marginErr = calcMarginError(boca.a, boca.b, baseline.a, baseline.b);
      bocaCandidateErrors.push(errA, errB);
      bocaMarginErrors.push(marginErr);
      bocaByYear.push({
        year: election.year,
        candidateErrorA: errA,
        candidateErrorB: errB,
        marginError: marginErr,
      });
    }

    if (cr) {
      const errA = calcCandidateError(cr.a, baseline.a);
      const errB = calcCandidateError(cr.b, baseline.b);
      const marginErr = calcMarginError(cr.a, cr.b, baseline.a, baseline.b);
      crCandidateErrors.push(errA, errB);
      crMarginErrors.push(marginErr);
      crByYear.push({
        year: election.year,
        candidateErrorA: errA,
        candidateErrorB: errB,
        marginError: marginErr,
      });
    }
  }

  const summarize = (values: number[]) => ({
    mean: Math.round(mean(values) * 100) / 100,
    median: Math.round(median(values) * 100) / 100,
    max: Math.round(Math.max(...values, 0) * 100) / 100,
  });

  return {
    bocaUrna: {
      candidateError: summarize(bocaCandidateErrors),
      marginError: summarize(bocaMarginErrors),
      byYear: bocaByYear,
    },
    conteoRapido: {
      candidateError: summarize(crCandidateErrors),
      marginError: summarize(crMarginErrors),
      byYear: crByYear,
    },
  };
}

export function calcPendingVoteRequirement(
  currentAdvance: number,
  currentPctB: number,
  targetPctB: number
): number | null {
  if (currentAdvance <= 0 || currentAdvance >= 100) return null;

  const counted = currentAdvance / 100;
  const pending = 1 - counted;
  const required =
    (targetPctB - counted * currentPctB) / pending;

  if (required < 0 || required > 100) return null;
  return Math.round(required * 100) / 100;
}

export function isWithinHistoricalError(
  marginPp: number,
  instrument: "boca" | "cr",
  metrics: ErrorMetrics
): boolean {
  const maxError =
    instrument === "boca"
      ? metrics.bocaUrna.marginError.max
      : metrics.conteoRapido.marginError.max;
  return marginPp <= maxError;
}

export function calcSimpleAverage(
  values: Array<{ a: number; b: number }>
): { a: number; b: number; marginPp: number; leader: string } {
  const n = values.length;
  const a = values.reduce((s, v) => s + v.a, 0) / n;
  const b = values.reduce((s, v) => s + v.b, 0) / n;
  const { marginPp, leader } = calcMargin(a, b);
  return {
    a: Math.round(a * 100) / 100,
    b: Math.round(b * 100) / 100,
    marginPp: Math.round(marginPp * 100) / 100,
    leader,
  };
}
