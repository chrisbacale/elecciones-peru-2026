import { describe, expect, it } from "vitest";
import {
  buildPredictionSnapshot,
  estimateCompletionEta,
  projectFinalFromPendingShare,
  requiredPendingShare,
} from "./prediction";
import type { OnpeResumen } from "./types";

describe("requiredPendingShare", () => {
  it("calcula el bloque no contabilizado requerido para empate", () => {
    expect(requiredPendingShare(85.484, 48.919, 50)).toBeCloseTo(56.37, 2);
  });

  it("calcula el bloque requerido para alcanzar el ancla Ipsos", () => {
    expect(requiredPendingShare(85.484, 48.919, 50.3)).toBeCloseTo(58.43, 2);
  });
});

describe("projectFinalFromPendingShare", () => {
  it("reproduce un cierre nacional objetivo desde el bloque pendiente", () => {
    const projected = projectFinalFromPendingShare(85.484, 48.919, 58.432640121);
    expect(projected.sanchezPct).toBeCloseTo(50.3, 2);
    expect(projected.leader).toBe("Sanchez");
  });
});

describe("estimateCompletionEta", () => {
  it("estima velocidad monotónica entre dos cortes", () => {
    const eta = estimateCompletionEta([
      { advancePct: 81.865, timestamp: "2026-06-08T01:16:00-05:00" },
      { advancePct: 85.484, timestamp: "2026-06-08T02:02:01-05:00" },
    ]);

    expect(eta.ppPerHour).toBeGreaterThan(4);
    expect(eta.etaIso).not.toBeNull();
  });
});

describe("buildPredictionSnapshot", () => {
  it("marca alta incertidumbre cuando escenarios cruzan liderazgo", () => {
    const snapshot = buildPredictionSnapshot();
    expect(snapshot.status).toBe("alta_incertidumbre");
    expect(snapshot.requirements).toHaveLength(3);
    expect(snapshot.scenarios.some((row) => row.leader === "Keiko")).toBe(true);
    expect(snapshot.scenarios.some((row) => row.leader === "Sanchez")).toBe(true);
  });

  it("incluye simulación determinística con intervalos y frecuencias", () => {
    const snapshot = buildPredictionSnapshot();

    expect(snapshot.projection.modelVersion).toBe("prediction-v2.5");
    expect(snapshot.projection.simulations).toBe(20000);
    expect(snapshot.projection.countedWeightPct).toBeCloseTo(93.727, 2);
    expect(snapshot.projection.weightingNote).toContain("proxy");
    expect(snapshot.projection.probabilityNote).toContain("No debe leerse como certeza legal");
    expect(snapshot.projection.sanchezCi80[0]).toBeLessThan(
      snapshot.projection.sanchezCi80[1],
    );
    expect(snapshot.projection.signedMarginCi95Pp[0]).toBeLessThan(
      snapshot.projection.signedMarginCi95Pp[1],
    );
    expect(
      snapshot.projection.probabilityKeikoLead +
        snapshot.projection.probabilitySanchezLead +
        snapshot.projection.probabilityPracticalTie,
    ).toBeCloseTo(100, 0);
    expect(snapshot.projection.frequencyKeikoLead).toBe(
      snapshot.projection.probabilityKeikoLead,
    );
    expect(snapshot.projection.modelParameters.regimeWeights.exteriorAdjusted).toBeGreaterThan(0);
    expect(snapshot.projection.histogram).toHaveLength(8);
  });

  it("publica drivers críticos y presupuesto de error", () => {
    const snapshot = buildPredictionSnapshot();

    expect(snapshot.errorBudget.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.criticalDrivers.map((driver) => driver.id)).toContain("foreign");
    expect(snapshot.trendSignals.map((signal) => signal.id)).toEqual([
      "official-gap",
      "late-delta",
      "tie-threshold",
      "foreign-adjustment",
      "modeled-margin",
    ]);
    expect(snapshot.exterior.officialResultsStatus).toBe("snapshot");
    expect(snapshot.exterior.actasTotal).toBe(2543);
    expect(snapshot.exterior.actasContabilizadas).toBe(12);
    expect(snapshot.exterior.actasPendientes).toBe(2531);
    expect(snapshot.exterior.pendingPct).toBeCloseTo(99.53, 2);
    expect(snapshot.exterior.officialKeikoPct).toBe(56.919);
    expect(snapshot.exterior.officialSanchezPct).toBe(43.081);
    expect(snapshot.exterior.officialVotesKeiko).toBe(1164);
    expect(snapshot.exterior.officialVotesSanchez).toBe(881);
    expect(snapshot.exterior.validVoteEstimate).toBeGreaterThan(350000);
    expect(snapshot.exterior.turnoutAssumptionRangePct).toEqual([25, 45]);
    expect(snapshot.exterior.validVoteAssumptionRangePct).toEqual([90, 97]);
    expect(snapshot.exterior.validVoteEstimateRange[0]).toBeLessThan(
      snapshot.exterior.validVoteEstimate,
    );
    expect(snapshot.exterior.validVoteEstimateRange[1]).toBeGreaterThan(
      snapshot.exterior.validVoteEstimate,
    );
    expect(snapshot.exterior.shareOfPendingValidEstimateRangePct).not.toBeNull();
    expect(snapshot.exterior.adjustedPendingSanchezRangePct).not.toBeNull();
    expect(snapshot.exterior.adjustedPendingSanchezPct).not.toBeNull();
    expect(snapshot.criticalDrivers.find((driver) => driver.id === "foreign")?.source).toBe(
      "ONPE exterior agregado + sensibilidad Datum CR exterior",
    );
    expect(snapshot.criticalDrivers.find((driver) => driver.id === "jee")?.impactPp).toBeNull();
  });

  it("mantiene la semilla estable si solo cambia el timestamp", () => {
    const base = buildPredictionSnapshot();
    const onpe: OnpeResumen = {
      status: "live",
      timestamp: "2026-06-08T11:56:00.321-05:00",
      advancePct: 93.727,
      actasProcesadas: 86947,
      actasTotal: 92766,
      actasEnviadasJee: 1515,
      actasPendientesJee: 4304,
      actasEnviadasJeePct: 1.633,
      actasPendientesJeePct: 4.64,
      candidates: {
        keiko: { votes: 8779917, pct: 50.016 },
        sanchez: { votes: 8774253, pct: 49.984 },
      },
      validVotes: 17554170,
      blankVotes: null,
      nullVotes: null,
      marginPp: 0.03,
      marginLeader: "Keiko Fujimori",
      source: "test",
    };
    const shifted = buildPredictionSnapshot({
      ...onpe,
      timestamp: "2026-06-08T10:00:00.000-05:00",
    });

    expect(buildPredictionSnapshot(onpe).projection.seed).toBe(base.projection.seed);
    expect(shifted.projection.seed).toBe(base.projection.seed);
  });
});
