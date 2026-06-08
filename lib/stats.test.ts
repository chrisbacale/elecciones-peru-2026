import { describe, it, expect } from "vitest";
import {
  calcCandidateError,
  calcMarginError,
  aggregateErrorMetrics,
  calcPendingVoteRequirement,
  isWithinHistoricalError,
} from "./stats";
import { getCompletedElections, getValidatedErrorMetrics } from "./data";

const TARGET = {
  bocaCandidate: { mean: 0.5, median: 0.3, max: 1.2 },
  bocaMargin: { mean: 1.0, median: 0.6, max: 2.4 },
  crCandidate: { mean: 0.2, median: 0.1, max: 0.5 },
  crMargin: { mean: 0.4, median: 0.2, max: 1.0 },
};

function within(actual: number, expected: number, tol = 0.01) {
  return Math.abs(actual - expected) <= tol;
}

describe("calcCandidateError", () => {
  it("calcula error absoluto", () => {
    expect(calcCandidateError(50.7, 50.126)).toBeCloseTo(0.574, 2);
  });
});

describe("calcMarginError", () => {
  it("calcula error de margen", () => {
    // Boca: |1.4 - 0.252| = 1.148 pp
    expect(calcMarginError(50.7, 49.3, 50.126, 49.874)).toBeCloseTo(1.148, 2);
  });

  it("usa margen firmado cuando cambia el líder", () => {
    // Boca 2021: Keiko +0.6 frente a ONPE Castillo +0.252.
    expect(calcMarginError(49.7, 50.3, 50.126, 49.874)).toBeCloseTo(0.852, 2);
  });
});

describe("aggregateErrorMetrics", () => {
  const metrics = aggregateErrorMetrics(getCompletedElections());

  it("coincide con auditoría boca candidato", () => {
    expect(within(metrics.bocaUrna.candidateError.mean, TARGET.bocaCandidate.mean)).toBe(true);
    expect(within(metrics.bocaUrna.candidateError.median, TARGET.bocaCandidate.median)).toBe(true);
    expect(within(metrics.bocaUrna.candidateError.max, TARGET.bocaCandidate.max)).toBe(true);
  });

  it("coincide con auditoría boca margen", () => {
    expect(within(metrics.bocaUrna.marginError.mean, TARGET.bocaMargin.mean)).toBe(true);
    expect(within(metrics.bocaUrna.marginError.median, TARGET.bocaMargin.median)).toBe(true);
    expect(within(metrics.bocaUrna.marginError.max, TARGET.bocaMargin.max)).toBe(true);
  });

  it("coincide con auditoría CR candidato", () => {
    expect(within(metrics.conteoRapido.candidateError.mean, TARGET.crCandidate.mean)).toBe(true);
    expect(within(metrics.conteoRapido.candidateError.median, TARGET.crCandidate.median)).toBe(true);
    expect(within(metrics.conteoRapido.candidateError.max, TARGET.crCandidate.max)).toBe(true);
  });

  it("coincide con auditoría CR margen", () => {
    expect(within(metrics.conteoRapido.marginError.mean, TARGET.crMargin.mean)).toBe(true);
    expect(within(metrics.conteoRapido.marginError.median, TARGET.crMargin.median)).toBe(true);
    expect(within(metrics.conteoRapido.marginError.max, TARGET.crMargin.max)).toBe(true);
  });

  it("coincide con error-metrics.json precalculado", () => {
    const computed = aggregateErrorMetrics(getCompletedElections());
    const validated = getValidatedErrorMetrics();

    for (const key of ["mean", "median", "max"] as const) {
      expect(within(computed.bocaUrna.candidateError[key], validated.bocaUrna.candidateError[key])).toBe(true);
      expect(within(computed.bocaUrna.marginError[key], validated.bocaUrna.marginError[key])).toBe(true);
      expect(within(computed.conteoRapido.candidateError[key], validated.conteoRapido.candidateError[key])).toBe(true);
      expect(within(computed.conteoRapido.marginError[key], validated.conteoRapido.marginError[key])).toBe(true);
    }
  });
});

describe("calcPendingVoteRequirement", () => {
  it("calcula % requerido en bloque pendiente", () => {
    const result = calcPendingVoteRequirement(76.966, 47.844, 50.3);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(50);
    expect(result!).toBeLessThan(65);
  });

  it("no inventa bloque pendiente cuando el avance ya está cerrado", () => {
    expect(calcPendingVoteRequirement(100, 50.3, 50.3)).toBeNull();
  });
});

describe("isWithinHistoricalError", () => {
  const metrics = aggregateErrorMetrics(getCompletedElections());

  it("detecta margen dentro de rango CR", () => {
    expect(isWithinHistoricalError(0.6, "cr", metrics)).toBe(true);
  });

  it("detecta margen fuera de rango CR", () => {
    expect(isWithinHistoricalError(1.5, "cr", metrics)).toBe(false);
  });
});
