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

    expect(snapshot.projection.modelVersion).toBe("prediction-v3.0");
    expect(snapshot.projection.simulations).toBe(20000);
    expect(snapshot.projection.countedWeightPct).toBeCloseTo(96.879, 2);
    expect(snapshot.projection.weightingNote).toContain("espacio de votos");
    expect(snapshot.projection.probabilityNote).toContain("supuestos auditables");
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
    const params = snapshot.projection.modelParameters;
    expect(params.componentInputs.officialGapKeikoMinusSanchezVotes).toBeLessThan(0);
    expect(params.componentInputs.domesticJeeActas).toBeGreaterThan(1000);
    expect(params.componentInputs.exteriorPendingActas).toBeGreaterThan(1000);
    expect(params.componentInputs.exteriorObservedKeikoSharePct).toBeGreaterThan(55);
    expect(params.priors.jeeAnnulmentMean).toBeGreaterThan(0.01);
    expect(params.priors.jeeAnnulmentMean).toBeLessThan(0.25);
    expect(params.priors.systematicLeanBiasSdPp).toBe(2);
    expect(snapshot.projection.histogram).toHaveLength(8);
    expect(snapshot.componentRead.source).toBe("data/2026/jee-resolution-model.json");
    expect(snapshot.componentRead.officialGapKeikoMinusSanchez).toBeLessThan(0);
    expect(snapshot.componentRead.pendingPeruGapKeikoMinusSanchez).toBeLessThan(0);
    expect(snapshot.componentRead.expectedJeeGapKeikoMinusSanchez).toBeGreaterThan(0);
    expect(snapshot.componentRead.peruOnlyExpectedGapKeikoMinusSanchez).toBeCloseTo(
      snapshot.componentRead.officialGapKeikoMinusSanchez +
        snapshot.componentRead.pendingPeruGapKeikoMinusSanchez +
        snapshot.componentRead.expectedJeeGapKeikoMinusSanchez,
      0,
    );
    expect(
      snapshot.componentRead.peruPlusExteriorThirtyPpGapKeikoMinusSanchez,
    ).toBeGreaterThan(0);
    expect(snapshot.componentRead.foreignValidVotesUsed).toBe(
      snapshot.exterior.validVoteEstimate,
    );
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
    expect(snapshot.exterior.actasContabilizadas).toBe(1275);
    expect(snapshot.exterior.actasPendientes).toBe(1268);
    expect(snapshot.exterior.pendingPct).toBeCloseTo(49.86, 2);
    expect(snapshot.exterior.officialKeikoPct).toBe(62.526);
    expect(snapshot.exterior.officialSanchezPct).toBe(37.474);
    expect(snapshot.exterior.officialVotesKeiko).toBe(97865);
    expect(snapshot.exterior.officialVotesSanchez).toBe(58653);
    expect(snapshot.exterior.officialObservedGapVotes).toBe(39212);
    expect(snapshot.exterior.datumProjectedGapVotes).toBeGreaterThan(60000);
    expect(snapshot.exterior.datumProjectedKeikoVotes).toBeGreaterThan(
      snapshot.exterior.datumProjectedSanchezVotes,
    );
    expect(snapshot.exterior.datumProjectedGapRangeVotes[0]).toBeLessThan(
      snapshot.exterior.datumProjectedGapVotes,
    );
    expect(snapshot.exterior.datumProjectedGapRangeVotes[1]).toBeGreaterThan(
      snapshot.exterior.datumProjectedGapVotes,
    );
    expect(snapshot.exterior.exitPollProjectedGapVotes).toBeGreaterThan(
      snapshot.exterior.datumProjectedGapVotes,
    );
    expect(snapshot.exterior.exitPollProjectedGapRangeVotes[0]).toBeLessThan(
      snapshot.exterior.exitPollProjectedGapVotes,
    );
    expect(snapshot.exterior.exitPollProjectedKeikoVotes).toBeGreaterThan(
      snapshot.exterior.exitPollProjectedSanchezVotes,
    );
    expect(snapshot.exterior.domesticSanchezPctToOffsetDatumExterior).not.toBeNull();
    expect(snapshot.exterior.domesticSanchezPctToOffsetDatumExterior).toBeGreaterThan(50);
    expect(snapshot.exterior.domesticSanchezPctToOffsetDatumExteriorRange).not.toBeNull();
    expect(snapshot.exterior.validVoteEstimate).toBeGreaterThan(250000);
    expect(snapshot.exterior.turnoutAssumptionRangePct).toEqual([22, 38]);
    expect(snapshot.exterior.validVoteAssumptionRangePct).toEqual([91, 96]);
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
      timestamp: "2026-06-10T00:15:19-05:00",
      advancePct: 96.879,
      actasProcesadas: 89870,
      actasTotal: 92766,
      actasEnviadasJee: 1563,
      actasPendientesJee: 1333,
      actasEnviadasJeePct: 1.685,
      actasPendientesJeePct: 1.437,
      candidates: {
        keiko: { votes: 8944246, pct: 49.912 },
        sanchez: { votes: 8975637, pct: 50.088 },
      },
      validVotes: 17919883,
      blankVotes: null,
      nullVotes: null,
      marginPp: 0.175,
      marginLeader: "Roberto Sánchez",
      source: "test",
    };
    const shifted = buildPredictionSnapshot({
      ...onpe,
      timestamp: "2026-06-10T01:00:00.000-05:00",
    });

    expect(buildPredictionSnapshot(onpe).projection.seed).toBe(base.projection.seed);
    expect(shifted.projection.seed).toBe(base.projection.seed);
  });
});
