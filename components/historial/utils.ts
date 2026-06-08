import type { CandidatePair, ElectionRecord } from "@/lib/types";
import { calcMargin, calcSignedMargin } from "@/lib/stats";

export type InstrumentProvider = "ipsos" | "datum";

export type StageKey = "simulacro" | "boca" | "cr" | "onpe";

export type StageSnapshot = {
  stage: StageKey;
  label: string;
  pair: CandidatePair | null;
  marginPp: number | null;
  signedMarginPp: number | null;
  leader: string | null;
  pending?: boolean;
};

export type YearRow = {
  year: number;
  election: ElectionRecord;
  candidates: string;
  winner: string | null;
  stages: StageSnapshot[];
  deltas: {
    simToBoca: number | null;
    bocaToCr: number | null;
    crToOnpe: number | null;
  };
  highlight?: "2011-boca-error" | "2021-leader-flip";
  note?: string;
};

export function getProviderPair(
  election: ElectionRecord,
  stage: "boca" | "cr",
  provider: InstrumentProvider
): CandidatePair | undefined {
  const bucket =
    stage === "boca"
      ? election.instruments.bocaUrna
      : election.instruments.conteoRapido;
  if (provider === "datum") return bucket.datum;
  return bucket.ipsos;
}

export function getSimulacroPair(
  election: ElectionRecord,
  provider: InstrumentProvider
): CandidatePair | undefined {
  const bucket = election.instruments.simulacroPorEncuestadora;
  if (provider === "datum") return bucket?.datum;
  return bucket?.ipsos ?? election.instruments.simulacro;
}

export function pairToSnapshot(
  stage: StageKey,
  label: string,
  pair: CandidatePair | null | undefined,
  options?: { pending?: boolean }
): StageSnapshot {
  if (!pair) {
    return {
      stage,
      label,
      pair: null,
      marginPp: null,
      signedMarginPp: null,
      leader: null,
      pending: options?.pending,
    };
  }

  const marginPp =
    pair.marginPp ?? calcMargin(pair.a, pair.b).marginPp;
  const leader =
    pair.marginLeader ?? calcMargin(pair.a, pair.b).leader;
  const signedMarginPp = calcSignedMargin(pair.a, pair.b);

  return {
    stage,
    label,
    pair,
    marginPp,
    signedMarginPp,
    leader,
    pending: options?.pending,
  };
}

export function buildYearRow(
  election: ElectionRecord,
  provider: InstrumentProvider
): YearRow {
  const sim = getSimulacroPair(election, provider);
  const boca = getProviderPair(election, "boca", provider);
  const cr = getProviderPair(election, "cr", provider);
  const onpe = election.instruments.onpe100 ?? election.instruments.onpePartial ?? null;
  const onpeLabel = election.instruments.onpe100 ? "ONPE 100%" : "ONPE parcial";

  const stages: StageSnapshot[] = [
    pairToSnapshot("simulacro", "Simulacro", sim ?? null),
    pairToSnapshot("boca", "Boca de urna", boca ?? null),
    pairToSnapshot("cr", "Conteo rápido", cr ?? null),
    pairToSnapshot(
      "onpe",
      onpeLabel,
      onpe,
      { pending: onpe === null }
    ),
  ];

  const signedMargins = stages.map((s) => s.signedMarginPp);

  const deltas = {
    simToBoca:
      signedMargins[0] !== null && signedMargins[1] !== null
        ? round2(signedMargins[1] - signedMargins[0])
        : null,
    bocaToCr:
      signedMargins[1] !== null && signedMargins[2] !== null
        ? round2(signedMargins[2] - signedMargins[1])
        : null,
    crToOnpe:
      signedMargins[2] !== null && signedMargins[3] !== null
        ? round2(signedMargins[3] - signedMargins[2])
        : null,
  };

  let highlight: YearRow["highlight"];
  let note: string | undefined;

  if (election.year === 2011) {
    highlight = "2011-boca-error";
    note =
      election.metadata.notes.find((n) => n.includes("1.2 pp")) ??
      "Boca +1.2 pp Humala vs ONPE";
  }

  if (election.year === 2021) {
    highlight = "2021-leader-flip";
    note =
      election.metadata.notes[0] ??
      "Boca favoreció a Keiko; ganó Castillo";
  }

  if (election.year === 2016 && provider === "ipsos") {
    note =
      "Simulacro Ipsos oficial: Keiko +6.2; boca Ipsos revirtió a PPK +0.8. El delta firmado conserva ese giro.";
  }

  return {
    year: election.year,
    election,
    candidates: `${election.candidates.a} vs ${election.candidates.b}`,
    winner: election.candidates.winner ?? null,
    stages,
    deltas,
    highlight,
    note,
  };
}

export function buildChartData(
  elections: ElectionRecord[],
  provider: InstrumentProvider
) {
  return elections.map((election) => {
    const row = buildYearRow(election, provider);
    const [sim, boca, cr, onpe] = row.stages;

    return {
      year: election.year,
      simulacro: sim.signedMarginPp,
      boca: boca.signedMarginPp,
      cr: cr.signedMarginPp,
      onpe: onpe.pending ? null : onpe.signedMarginPp,
    };
  });
}

export function providerAvailable(
  elections: ElectionRecord[],
  provider: InstrumentProvider
): boolean {
  if (provider === "ipsos") return true;
  return elections.some(
    (e) =>
      e.instruments.bocaUrna.datum !== undefined ||
      e.instruments.conteoRapido.datum !== undefined
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatLeaderLabel(
  leader: string | null,
  pair: CandidatePair | null,
  election: ElectionRecord
): string {
  if (!leader || !pair) return "—";
  const name = leader === "a" ? pair.labelA : pair.labelB;
  return name ?? (leader === "a" ? election.candidates.a : election.candidates.b);
}
