import { flashElectoral, getValidatedErrorMetrics } from "./data";
import { calcPendingVoteRequirement } from "./stats";
import type { CandidatePair, OnpeResumen } from "./types";

export type ProjectionStatus =
  | "alta_incertidumbre"
  | "ventaja_preliminar"
  | "ventaja_fuerte"
  | "muy_dificil_revertir";

export type RequirementRow = {
  id: string;
  label: string;
  targetSanchezPct: number;
  requiredPendingSanchezPct: number | null;
  source: string;
  marginOfError?: number;
  note: string;
};

export type ScenarioRow = {
  id: string;
  label: string;
  pendingSanchezPct: number;
  finalKeikoPct: number;
  finalSanchezPct: number;
  marginPp: number;
  leader: "Keiko" | "Sanchez" | "Empate";
  tone: "keiko" | "sanchez" | "neutral";
  note: string;
};

export type ProjectionSummary = {
  modelVersion: string;
  modelName: string;
  seed: number;
  simulations: number;
  countedWeightPct: number;
  weightingNote: string;
  leader: "Keiko" | "Sanchez" | "Empate";
  keikoMedianPct: number;
  sanchezMedianPct: number;
  sanchezCi80: [number, number];
  sanchezCi95: [number, number];
  signedMarginMedianPp: number;
  signedMarginCi80Pp: [number, number];
  signedMarginCi95Pp: [number, number];
  probabilityKeikoLead: number;
  probabilitySanchezLead: number;
  probabilityPracticalTie: number;
  epsilonPp: number;
  currentLeaderReversalRisk: number;
  currentLeaderNonHoldRisk: number;
  noCallReason: string;
  methodNote: string;
  probabilityNote: string;
  histogram: Array<{ bucket: string; count: number; pct: number }>;
};

export type ErrorBudgetRow = {
  id: string;
  label: string;
  pp80: number;
  pp95: number;
  note: string;
};

export type CriticalDriverRow = {
  id: string;
  label: string;
  source: string;
  pendingActas?: number | null;
  estimatedVotes?: number | null;
  sanchezPct: number;
  impactPp: number | null;
  note: string;
};

export type TrendSignalRow = {
  id: string;
  label: string;
  value: number;
  unit: "pct" | "pp" | "votes" | "actas";
  tone: ScenarioRow["tone"];
  detail: string;
  note: string;
};

export type PredictionSnapshot = {
  asOf: string;
  status: ProjectionStatus;
  statusLabel: string;
  headline: string;
  onpe: {
    status: OnpeResumen["status"] | "snapshot";
    advancePct: number;
    keikoPct: number;
    sanchezPct: number;
    marginPp: number;
    marginLeader: string;
    votesKeiko: number | null;
    votesSanchez: number | null;
    actasContabilizadas: number | null;
    actasTotal: number | null;
    actasNoContabilizadas: number | null;
    actasEnviadasJee: number | null;
    actasPendientesJee: number | null;
    actasEnviadasJeePct: number | null;
    actasPendientesJeePct: number | null;
    source: string;
  };
  quickCounts: Array<{
    id: string;
    pollster: string;
    instrument: string;
    keikoPct: number;
    sanchezPct: number;
    marginPp: number;
    leader: "Keiko" | "Sanchez";
    marginOfError?: number;
    marginOfErrorNote?: string;
    sourceUrl?: string;
  }>;
  projection: ProjectionSummary;
  errorBudget: ErrorBudgetRow[];
  criticalDrivers: CriticalDriverRow[];
  trendSignals: TrendSignalRow[];
  requirements: RequirementRow[];
  scenarios: ScenarioRow[];
  eta: {
    ppPerHour: number | null;
    etaIso: string | null;
    targets: Array<{
      targetPct: number;
      etaIso: string | null;
      hoursRemaining: number | null;
    }>;
    note: string;
  };
  exterior: {
    eligibleVoters: number;
    mesas: number;
    locals: number;
    cities: number;
    officialResultsStatus: "not_verified" | "live" | "snapshot";
    actasTotal: number | null;
    actasContabilizadas: number | null;
    pendingPct: number | null;
    turnoutAssumptionPct: number;
    validVoteAssumptionPct: number;
    validVoteEstimate: number;
    shareOfPendingValidEstimatePct: number | null;
    adjustedPendingSanchezPct: number | null;
    datumSanchezPct: number;
    datumKeikoPct: number;
    note: string;
  };
  caveats: string[];
  sources: Array<{ label: string; url: string }>;
};

type CompletionCut = {
  advancePct: number;
  timestamp: string;
};

const HISTORICAL_CUTS: CompletionCut[] = [
  { advancePct: 76.966, timestamp: "2026-06-08T00:31:00-05:00" },
  { advancePct: 81.865, timestamp: "2026-06-08T01:16:00-05:00" },
  { advancePct: 85.484, timestamp: "2026-06-08T02:02:01-05:00" },
  { advancePct: 90.488, timestamp: "2026-06-08T04:16:00-05:00" },
];

const SIMULATION_COUNT = 20_000;
const MODEL_VERSION = "prediction-v2.4";
const PRACTICAL_TIE_EPSILON_PP = 0.1;
const FALLBACK_EXTERIOR_ROSTER = {
  eligibleVoters: 1_194_172,
  mesas: 2_506,
  locals: 219,
  cities: 206,
};
const FALLBACK_EXTERIOR_TURNOUT_ASSUMPTION_PCT = 34;
const FALLBACK_EXTERIOR_VALID_VOTE_ASSUMPTION_PCT = 94;

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rand: () => number, mean: number, sigma: number): number {
  const u1 = Math.max(rand(), Number.EPSILON);
  const u2 = Math.max(rand(), Number.EPSILON);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + sigma * z;
}

function buildHistogram(values: number[]) {
  const buckets = [
    { label: "Keiko >3 pp", min: 3, max: Infinity },
    { label: "Keiko 2-3", min: 2, max: 3 },
    { label: "Keiko 1-2", min: 1, max: 2 },
    { label: "Keiko 0-1", min: 0, max: 1 },
    { label: "Sánchez 0-1", min: -1, max: 0 },
    { label: "Sánchez 1-2", min: -2, max: -1 },
    { label: "Sánchez 2-3", min: -3, max: -2 },
    { label: "Sánchez >3 pp", min: -Infinity, max: -3 },
  ];

  return buckets.map((bucket) => {
    const count = values.filter((value) => value >= bucket.min && value < bucket.max).length;
    return {
      bucket: bucket.label,
      count,
      pct: round((count / values.length) * 100, 2),
    };
  });
}

function getSource(id: string) {
  const source = flashElectoral.sources.find((item) => item.id === id);
  if (!source) throw new Error(`Fuente no encontrada: ${id}`);
  return source;
}

function getFallbackOnpe(): OnpeResumen {
  const source = getSource("onpe-parcial");
  const data = source.data;
  return {
    status: "snapshot",
    timestamp: source.publishedAt ?? "2026-06-08T02:06:01-05:00",
    advancePct: data.advancePct ?? 85.484,
    actasProcesadas: data.actasProcesadas ?? null,
    actasTotal: data.actasTotal ?? null,
    actasEnviadasJee: data.actasJee ?? null,
    actasPendientesJee: data.actasPendientes ?? null,
    actasEnviadasJeePct: data.actasJeePct ?? null,
    actasPendientesJeePct: data.actasPendientesPct ?? null,
    candidates: {
      keiko: { votes: data.votesA ?? null, pct: data.a },
      sanchez: { votes: data.votesB ?? null, pct: data.b },
    },
    validVotes:
      data.votesA != null && data.votesB != null
        ? data.votesA + data.votesB
        : null,
    blankVotes: null,
    nullVotes: null,
    marginPp: data.marginPp ?? Math.abs(data.a - data.b),
    marginLeader: data.a >= data.b ? "Keiko Fujimori" : "Roberto Sánchez",
    source: source.url ?? "data/2026/flash-electoral.json",
    message: source.notes,
  };
}

export function requiredPendingShare(
  advancePct: number,
  currentSanchezPct: number,
  targetSanchezPct: number,
): number | null {
  return calcPendingVoteRequirement(
    advancePct,
    currentSanchezPct,
    targetSanchezPct,
  );
}

export function projectFinalFromPendingShare(
  advancePct: number,
  currentSanchezPct: number,
  pendingSanchezPct: number,
): { keikoPct: number; sanchezPct: number; marginPp: number; leader: ScenarioRow["leader"] } {
  const countedWeight = advancePct / 100;
  const pendingWeight = 1 - countedWeight;
  const sanchezPct =
    countedWeight * currentSanchezPct + pendingWeight * pendingSanchezPct;
  const keikoPct = 100 - sanchezPct;
  const signedMargin = keikoPct - sanchezPct;

  return {
    keikoPct: round(keikoPct, 3),
    sanchezPct: round(sanchezPct, 3),
    marginPp: round(Math.abs(signedMargin), 3),
    leader:
      Math.abs(signedMargin) < 0.005
        ? "Empate"
        : signedMargin > 0
          ? "Keiko"
          : "Sanchez",
  };
}

export function estimateCompletionEta(cuts: CompletionCut[]): PredictionSnapshot["eta"] {
  if (cuts.length < 2) {
    return {
      ppPerHour: null,
      etaIso: null,
      targets: [],
      note: "No hay suficientes cortes para estimar velocidad de cómputo.",
    };
  }

  const sorted = [...cuts].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const latest = sorted.at(-1)!;
  const slopes: number[] = [];

  for (let i = 0; i < sorted.length - 1; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const elapsedHours =
        (new Date(sorted[j].timestamp).getTime() -
          new Date(sorted[i].timestamp).getTime()) /
        3_600_000;
      const ppAdvanced = sorted[j].advancePct - sorted[i].advancePct;
      if (elapsedHours > 0 && ppAdvanced > 0) {
        slopes.push(ppAdvanced / elapsedHours);
      }
    }
  }

  if (slopes.length === 0) {
    return {
      ppPerHour: null,
      etaIso: null,
      targets: [],
      note: "La velocidad no es estimable porque el último corte no avanzó de forma monotónica.",
    };
  }

  const ppPerHour = percentile(slopes, 0.5);
  const buildTarget = (targetPct: number) => {
    if (latest.advancePct >= targetPct) {
      return { targetPct, etaIso: latest.timestamp, hoursRemaining: 0 };
    }
    const hoursRemaining = (targetPct - latest.advancePct) / ppPerHour;
    return {
      targetPct,
      hoursRemaining: round(hoursRemaining, 2),
      etaIso: new Date(
        new Date(latest.timestamp).getTime() + hoursRemaining * 3_600_000,
      ).toISOString(),
    };
  };
  const targets = [90, 95, 99, 100].map(buildTarget);
  const eta100 = targets.find((target) => target.targetPct === 100);

  return {
    ppPerHour: round(ppPerHour, 2),
    etaIso: eta100?.etaIso ?? null,
    targets,
    note:
      "ETA mecánica con mediana de pendientes monotónicas entre cortes conocidos. No estima proclamación JNE ni resolución de actas observadas.",
  };
}

function buildRequirementRows(onpe: OnpeResumen): RequirementRow[] {
  const ipsos = getSource("ipsos-cr");
  const datum = getSource("datum-cr");

  const rows = [
    {
      id: "tie",
      label: "Empate nacional",
      targetSanchezPct: 50,
      source: "Aritmética ONPE",
      note: "Umbral mínimo para que Sánchez alcance 50.000% de votos válidos.",
    },
    {
      id: "datum-cr",
      label: "Alcanzar Datum CR",
      targetSanchezPct: datum.data.b,
      source: "Datum",
      marginOfError: datum.data.marginOfError,
      note: "Replica el 50.14% reportado por el conteo rápido Datum.",
    },
    {
      id: "ipsos-cr",
      label: "Alcanzar Ipsos CR",
      targetSanchezPct: ipsos.data.b,
      source: "Ipsos/Transparencia",
      marginOfError: ipsos.data.marginOfError,
      note: "Replica el 50.3% reportado por el conteo rápido Ipsos/Transparencia.",
    },
  ];

  return rows.map((row) => ({
    ...row,
    requiredPendingSanchezPct: requiredPendingShare(
      onpe.advancePct,
      onpe.candidates.sanchez.pct,
      row.targetSanchezPct,
    ),
  }));
}

function buildScenario(
  id: string,
  label: string,
  pendingSanchezPct: number,
  onpe: OnpeResumen,
  note: string,
): ScenarioRow {
  const projected = projectFinalFromPendingShare(
    onpe.advancePct,
    onpe.candidates.sanchez.pct,
    pendingSanchezPct,
  );

  return {
    id,
    label,
    pendingSanchezPct: round(pendingSanchezPct, 3),
    finalKeikoPct: projected.keikoPct,
    finalSanchezPct: projected.sanchezPct,
    marginPp: projected.marginPp,
    leader: projected.leader,
    tone:
      projected.leader === "Keiko"
        ? "keiko"
        : projected.leader === "Sanchez"
          ? "sanchez"
          : "neutral",
    note,
  };
}

function buildScenarios(onpe: OnpeResumen, requirements: RequirementRow[]) {
  const tieRequirement =
    requirements.find((row) => row.id === "tie")?.requiredPendingSanchezPct ??
    50;
  const datumRequirement =
    requirements.find((row) => row.id === "datum-cr")
      ?.requiredPendingSanchezPct ?? 50.14;
  const ipsosRequirement =
    requirements.find((row) => row.id === "ipsos-cr")
      ?.requiredPendingSanchezPct ?? 50.3;
  const datumExterior = getExteriorDatumSanchezPct();
  const ipsosRegiones =
    flashElectoral.territorial.ipsos.regiones_cr?.b ?? 57.4;
  const ipsosRural = flashElectoral.territorial.ipsos.rural?.b ?? 67.8;
  const lateDelta = getLateOnpeDeltaSanchezPct(onpe);
  const exteriorAdjusted = buildExteriorAdjustedPendingSanchezPct(onpe);

  return [
    buildScenario(
      "onpe-status-quo",
      "Pendiente igual al ONPE contabilizado",
      onpe.candidates.sanchez.pct,
      onpe,
      "Supone que el bloque no contabilizado vota igual que lo ya contabilizado. Es mecánico, no territorial.",
    ),
    buildScenario(
      "tie-threshold",
      "Umbral exacto de empate",
      tieRequirement,
      onpe,
      "Muestra el porcentaje mínimo que necesita Sánchez en lo no contabilizado para empatar.",
    ),
    buildScenario(
      "exterior-adjusted",
      "Mix pendiente con exterior Datum",
      exteriorAdjusted ?? ipsosRegiones,
      onpe,
      "Sensibilidad base que separa exterior: no usa resultado ONPE exterior oficial porque la app aún no tiene desglose verificado; el peso se estima con participación explícita y preferencia Datum exterior.",
    ),
    buildScenario(
      "datum-anchor",
      "Ancla Datum CR",
      datumRequirement,
      onpe,
      "Fuerza el cierre nacional hacia el 50.14% de Datum; queda dentro de su margen de error.",
    ),
    buildScenario(
      "ipsos-anchor",
      "Ancla Ipsos CR",
      ipsosRequirement,
      onpe,
      "Fuerza el cierre nacional hacia el 50.3% de Ipsos/Transparencia; sigue siendo empate técnico.",
    ),
    buildScenario(
      "ipsos-regions-pending",
      "Pendiente como regiones Ipsos",
      ipsosRegiones,
      onpe,
      "Sensibilidad si lo no contabilizado se parece al voto regional Ipsos, no a Lima.",
    ),
    buildScenario(
      "foreign-pending",
      "Stress exterior Datum",
      datumExterior,
      onpe,
      "Stress conservador: si todo el bloque no contabilizado se comportara como exterior Datum, favorece a Keiko. No es distribución real.",
    ),
    buildScenario(
      "late-onpe-delta",
      "Delta ONPE tardío",
      lateDelta ?? ipsosRegiones,
      onpe,
      "Usa el voto agregado entre el corte ONPE con votos absolutos previo y el corte vivo actual. Señal fuerte, pero no garantiza que lo restante siga igual.",
    ),
    buildScenario(
      "rural-stress",
      "Stress rural Ipsos",
      ipsosRural,
      onpe,
      "Stress de reversión: si todo el bloque no contabilizado se comportara como rural Ipsos, favorece a Sánchez. No es distribución real.",
    ),
  ];
}

function estimatePendingValidVotes(onpe: OnpeResumen): number | null {
  const observedValid =
    onpe.candidates.keiko.votes != null && onpe.candidates.sanchez.votes != null
      ? onpe.candidates.keiko.votes + onpe.candidates.sanchez.votes
      : onpe.validVotes;
  if (observedValid == null || onpe.advancePct <= 0) return null;
  const estimatedFinalValid = observedValid / (onpe.advancePct / 100);
  return Math.max(0, Math.round(estimatedFinalValid - observedValid));
}

function getExteriorRoster() {
  return flashElectoral.exterior?.officialRosterElectionDay ?? FALLBACK_EXTERIOR_ROSTER;
}

function getExteriorOfficialResults() {
  return flashElectoral.exterior?.officialOnpeExteriorResults ?? null;
}

function getExteriorTurnoutAssumptionPct(): number {
  return (
    flashElectoral.exterior?.assumptions.turnoutPct ??
    FALLBACK_EXTERIOR_TURNOUT_ASSUMPTION_PCT
  );
}

function getExteriorValidVoteAssumptionPct(): number {
  return (
    flashElectoral.exterior?.assumptions.validVotePct ??
    FALLBACK_EXTERIOR_VALID_VOTE_ASSUMPTION_PCT
  );
}

function estimateExteriorValidVotes(): number {
  const roster = getExteriorRoster();
  return Math.round(
    roster.eligibleVoters *
      (getExteriorTurnoutAssumptionPct() / 100) *
      (getExteriorValidVoteAssumptionPct() / 100),
  );
}

function getExteriorDatumSanchezPct(): number {
  return (
    flashElectoral.exterior?.datumQuickCount.b ??
    flashElectoral.territorial.datum?.extranjero?.b ??
    37.33
  );
}

function getExteriorDatumKeikoPct(): number {
  return (
    flashElectoral.exterior?.datumQuickCount.a ??
    flashElectoral.territorial.datum?.extranjero?.a ??
    62.67
  );
}

function getExteriorPreferenceLabel(): string {
  return flashElectoral.exterior?.datumQuickCount.instrument ?? "Conteo rápido exterior Datum";
}

function estimateExteriorShareOfPending(onpe: OnpeResumen): number | null {
  const pendingValidVotes = estimatePendingValidVotes(onpe);
  if (pendingValidVotes == null || pendingValidVotes <= 0) return null;
  return clamp(estimateExteriorValidVotes() / pendingValidVotes, 0, 0.6);
}

function buildExteriorAdjustedPendingSanchezPct(onpe: OnpeResumen): number | null {
  const pendingValidVotes = estimatePendingValidVotes(onpe);
  if (pendingValidVotes == null || pendingValidVotes <= 0) return null;
  const exteriorVotes = Math.min(estimateExteriorValidVotes(), pendingValidVotes);
  const domesticVotes = Math.max(0, pendingValidVotes - exteriorVotes);
  const totalVotes = domesticVotes + exteriorVotes;
  if (totalVotes <= 0) return null;

  return round(
    (domesticVotes * getLateDomesticMean() +
      exteriorVotes * getExteriorDatumSanchezPct()) /
      totalVotes,
    3,
  );
}

function getLateDomesticMean(): number {
  const regional = flashElectoral.territorial.ipsos.regiones_cr?.b ?? 57.4;
  const selva = flashElectoral.territorial.ipsos.selva?.b ?? 56.2;
  const sierra = flashElectoral.territorial.ipsos.sierra?.b ?? 68.7;
  return 0.58 * regional + 0.22 * selva + 0.2 * sierra;
}

type LateOnpeDelta = {
  previousAdvancePct: number | null;
  currentAdvancePct: number;
  advanceDeltaPct: number | null;
  votesKeiko: number;
  votesSanchez: number;
  totalVotes: number;
  sanchezPct: number;
  sanchezPctShift: number | null;
};

function getLateOnpeDelta(onpe: OnpeResumen): LateOnpeDelta | null {
  const previous = getSource("onpe-parcial-prev").data;
  const previousA = previous.votesA;
  const previousB = previous.votesB;
  const currentA = onpe.candidates.keiko.votes;
  const currentB = onpe.candidates.sanchez.votes;
  if (
    previousA == null ||
    previousB == null ||
    currentA == null ||
    currentB == null ||
    currentA <= previousA ||
    currentB <= previousB
  ) {
    return null;
  }

  const deltaA = currentA - previousA;
  const deltaB = currentB - previousB;
  const totalDelta = deltaA + deltaB;
  if (totalDelta <= 0) return null;
  return {
    previousAdvancePct: previous.advancePct ?? null,
    currentAdvancePct: onpe.advancePct,
    advanceDeltaPct:
      previous.advancePct == null ? null : round(onpe.advancePct - previous.advancePct, 3),
    votesKeiko: deltaA,
    votesSanchez: deltaB,
    totalVotes: totalDelta,
    sanchezPct: round((deltaB / totalDelta) * 100, 3),
    sanchezPctShift:
      previous.b == null ? null : round(onpe.candidates.sanchez.pct - previous.b, 3),
  };
}

function getLateOnpeDeltaSanchezPct(onpe: OnpeResumen): number | null {
  return getLateOnpeDelta(onpe)?.sanchezPct ?? null;
}

function estimateMarginShiftFromPending(onpe: OnpeResumen, pendingSanchezPct: number): number {
  const pendingWeight = 1 - onpe.advancePct / 100;
  const finalSanchezShift = pendingWeight * (pendingSanchezPct - onpe.candidates.sanchez.pct);
  return round(finalSanchezShift * 2, 2);
}

function formatExteriorShare(value: number | null): string {
  return value == null ? "peso no estimable" : `${round(value * 100, 1)}%`;
}

function buildProjection(onpe: OnpeResumen): ProjectionSummary {
  const metrics = getValidatedErrorMetrics();
  const ipsos = quickCountRow("ipsos-cr");
  const datum = quickCountRow("datum-cr");
  const exteriorVoteWeight = estimateExteriorShareOfPending(onpe) ?? 0.16;
  const exteriorMean = getExteriorDatumSanchezPct();
  const domesticMean = getLateDomesticMean();
  const lateDelta = getLateOnpeDelta(onpe);
  const lateDeltaMean = lateDelta?.sanchezPct ?? domesticMean;
  const exteriorAdjustedMean =
    buildExteriorAdjustedPendingSanchezPct(onpe) ??
    (exteriorVoteWeight * exteriorMean + (1 - exteriorVoteWeight) * domesticMean);
  const historicalSigma = Math.max(0.25, metrics.conteoRapido.candidateError.mean);
  const ipsosSigma = Math.sqrt(((ipsos.marginOfError ?? 1.9) / 1.96) ** 2 + historicalSigma ** 2);
  const datumSigma = Math.sqrt(((datum.marginOfError ?? 1.0) / 1.96) ** 2 + historicalSigma ** 2);
  const ipsosWeight = 1 / ipsosSigma ** 2;
  const datumWeight = 1 / datumSigma ** 2;
  const seed = hashSeed(
    [
      MODEL_VERSION,
      onpe.advancePct,
      onpe.actasProcesadas,
      onpe.actasTotal,
      onpe.actasEnviadasJee,
      onpe.actasPendientesJee,
      onpe.candidates.keiko.votes,
      onpe.candidates.sanchez.votes,
    ].join("|"),
  );
  const rand = seededRandom(seed);
  const sanchezShares: number[] = [];
  const signedMargins: number[] = [];

  for (let i = 0; i < SIMULATION_COUNT; i += 1) {
    const ipsosDraw = clamp(normal(rand, ipsos.sanchezPct, ipsosSigma), 45, 55);
    const datumDraw = clamp(normal(rand, datum.sanchezPct, datumSigma), 45, 55);
    const quickFinal =
      (ipsosDraw * ipsosWeight + datumDraw * datumWeight) /
      (ipsosWeight + datumWeight);
    const quickPendingTarget =
      requiredPendingShare(onpe.advancePct, onpe.candidates.sanchez.pct, quickFinal) ??
      quickFinal;
    const exteriorAdjustedDraw = normal(rand, exteriorAdjustedMean, 4.3);
    const domesticDraw = normal(rand, domesticMean, 5.1);
    const lateDeltaDraw = normal(rand, lateDeltaMean, 3.4);
    const statusQuoDraw = normal(rand, onpe.candidates.sanchez.pct, 1.4);
    const regimeRoll = rand();
    const regimeDraw =
      regimeRoll < 0.3
        ? quickPendingTarget
        : regimeRoll < 0.55
          ? lateDeltaDraw
          : regimeRoll < 0.78
            ? exteriorAdjustedDraw
            : regimeRoll < 0.9
              ? domesticDraw
              : statusQuoDraw;
    const pendingSanchezPct = clamp(
      0.82 * regimeDraw +
        0.1 * quickPendingTarget +
        0.05 * exteriorAdjustedDraw +
        0.03 * statusQuoDraw +
        normal(rand, 0, 0.9),
      30,
      75,
    );
    const projected = projectFinalFromPendingShare(
      onpe.advancePct,
      onpe.candidates.sanchez.pct,
      pendingSanchezPct,
    );
    sanchezShares.push(projected.sanchezPct);
    signedMargins.push(round(projected.keikoPct - projected.sanchezPct, 3));
  }

  const sanchezMedian = percentile(sanchezShares, 0.5);
  const signedMarginMedian = percentile(signedMargins, 0.5);
  const sanchezCi80: [number, number] = [
    round(percentile(sanchezShares, 0.1), 3),
    round(percentile(sanchezShares, 0.9), 3),
  ];
  const sanchezCi95: [number, number] = [
    round(percentile(sanchezShares, 0.025), 3),
    round(percentile(sanchezShares, 0.975), 3),
  ];
  const signedMarginCi80: [number, number] = [
    round(percentile(signedMargins, 0.1), 3),
    round(percentile(signedMargins, 0.9), 3),
  ];
  const signedMarginCi95: [number, number] = [
    round(percentile(signedMargins, 0.025), 3),
    round(percentile(signedMargins, 0.975), 3),
  ];
  const sanchezLeads = signedMargins.filter((value) => value < -PRACTICAL_TIE_EPSILON_PP).length;
  const keikoLeads = signedMargins.filter((value) => value > PRACTICAL_TIE_EPSILON_PP).length;
  const practicalTies = SIMULATION_COUNT - sanchezLeads - keikoLeads;
  const alpha = 0.5;
  const probabilityDenominator = SIMULATION_COUNT + 3 * alpha;
  const probabilitySanchez = (sanchezLeads + alpha) / probabilityDenominator;
  const probabilityKeiko = (keikoLeads + alpha) / probabilityDenominator;
  const probabilityPracticalTie = (practicalTies + alpha) / probabilityDenominator;
  const currentLeaderIsKeiko = onpe.candidates.keiko.pct >= onpe.candidates.sanchez.pct;
  const currentLeaderReversalRisk = currentLeaderIsKeiko ? probabilitySanchez : probabilityKeiko;
  const currentLeaderNonHoldRisk =
    currentLeaderReversalRisk + probabilityPracticalTie * 0.5;
  const leaderProbabilityPct = Math.max(probabilityKeiko, probabilitySanchez) * 100;
  const ci95CrossesZero = signedMarginCi95[0] <= 0 && signedMarginCi95[1] >= 0;
  const noCallReason = ci95CrossesZero
    ? "El intervalo 95% del margen cruza 0: todavía hay masa estadística a ambos lados del empate."
    : leaderProbabilityPct < 90
      ? "La frecuencia simulada de liderazgo no alcanza el umbral prudente de 90%."
      : "La proyección muestra ventaja, pero no equivale a proclamación oficial ONPE/JNE.";

  return {
    modelVersion: MODEL_VERSION,
    modelName: "Monte Carlo determinístico por regímenes ONPE + CR",
    seed,
    simulations: SIMULATION_COUNT,
    countedWeightPct: round(onpe.advancePct, 3),
    weightingNote:
      "El peso observado usa actas contabilizadas como proxy del peso de votos válidos porque ONPE publica avance de actas, no un denominador final de votos válidos. Es una fuente explícita de riesgo del modelo.",
    leader:
      Math.abs(signedMarginMedian) < 0.005
        ? "Empate"
        : signedMarginMedian > 0
          ? "Keiko"
          : "Sanchez",
    keikoMedianPct: round(100 - sanchezMedian, 3),
    sanchezMedianPct: round(sanchezMedian, 3),
    sanchezCi80,
    sanchezCi95,
    signedMarginMedianPp: round(signedMarginMedian, 3),
    signedMarginCi80Pp: signedMarginCi80,
    signedMarginCi95Pp: signedMarginCi95,
    probabilityKeikoLead: round(probabilityKeiko * 100, 2),
    probabilitySanchezLead: round(probabilitySanchez * 100, 2),
    probabilityPracticalTie: round(probabilityPracticalTie * 100, 2),
    epsilonPp: PRACTICAL_TIE_EPSILON_PP,
    currentLeaderReversalRisk: round(currentLeaderReversalRisk * 100, 2),
    currentLeaderNonHoldRisk: round(currentLeaderNonHoldRisk * 100, 2),
    noCallReason,
    methodNote:
      "Simulación determinística por regímenes alternativos: ancla de conteos rápidos, delta ONPE tardío, mix pendiente con exterior, composición doméstica y status quo. Las frecuencias son de liderazgo simulado, no proclamación oficial ni posterior calibrado.",
    probabilityNote:
      "La frecuencia se calcula dentro de esta familia de escenarios auditables. No debe leerse como certeza legal ni como modelo bayesiano calibrado con microdatos de todas las actas pendientes.",
    histogram: buildHistogram(signedMargins),
  };
}

function buildErrorBudget(): ErrorBudgetRow[] {
  const metrics = getValidatedErrorMetrics();
  return [
    {
      id: "quick-count",
      label: "Conteos rápidos",
      pp80: round(metrics.conteoRapido.marginError.mean, 2),
      pp95: round(metrics.conteoRapido.marginError.max, 2),
      note: "Calibrado con error histórico Ipsos vs ONPE 100% y MOE reportado por Ipsos/Datum.",
    },
    {
      id: "territorial",
      label: "Composición territorial pendiente",
      pp80: 1.1,
      pp95: 2.2,
      note: "La incertidumbre sube si las actas pendientes se concentran en sierra/sur/rural o exterior.",
    },
    {
      id: "arrival-order",
      label: "Orden de llegada de actas",
      pp80: 0.7,
      pp95: 1.4,
      note: "ONPE parcial no llega aleatoriamente; el avance puede sobre-representar zonas urbanas o logísticamente rápidas.",
    },
    {
      id: "foreign-vote",
      label: "Voto exterior",
      pp80: 0.35,
      pp95: 0.75,
      note: "El exterior puede ser relevante por margen estrecho, pero su participación esperada es menor que el padrón total.",
    },
    {
      id: "jee",
      label: "Actas enviadas al JEE",
      pp80: 0.25,
      pp95: 0.65,
      note: "No todo lo enviado al JEE cambia resultado; se reporta como riesgo legal-operativo, no como voto ya asignado.",
    },
  ];
}

function buildCriticalDrivers(onpe: OnpeResumen): CriticalDriverRow[] {
  const actasNoContabilizadas =
    onpe.actasTotal != null && onpe.actasProcesadas != null
      ? onpe.actasTotal - onpe.actasProcesadas
      : null;
  const pendingValidVotes = estimatePendingValidVotes(onpe);
  const exteriorMean = getExteriorDatumSanchezPct();
  const domesticMean = getLateDomesticMean();
  const lateDelta = getLateOnpeDelta(onpe);
  const exteriorShare = estimateExteriorShareOfPending(onpe);
  const exteriorPreferenceLabel = getExteriorPreferenceLabel();

  return [
    {
      id: "late-delta",
      label: "Delta ONPE reciente",
      source: "ONPE actual vs corte con votos absolutos previo",
      pendingActas: actasNoContabilizadas,
      estimatedVotes: pendingValidVotes,
      sanchezPct: lateDelta?.sanchezPct ?? domesticMean,
      impactPp: estimateMarginShiftFromPending(onpe, lateDelta?.sanchezPct ?? domesticMean),
      note: "Si el patrón de las actas recién incorporadas continúa, el bloque pendiente favorece más a Sánchez que el ONPE acumulado.",
    },
    {
      id: "domestic-late",
      label: "Bloque nacional tardío",
      source: "Ipsos territorial + ONPE pendientes",
      pendingActas: actasNoContabilizadas,
      estimatedVotes:
        pendingValidVotes != null ? Math.max(0, pendingValidVotes - estimateExteriorValidVotes()) : null,
      sanchezPct: round(domesticMean, 2),
      impactPp: estimateMarginShiftFromPending(onpe, domesticMean),
      note: "En esta sensibilidad, si el pendiente doméstico se parece al interior/regiones, favorece a Sánchez. No resta actas exteriores porque falta desglose ONPE exterior verificado.",
    },
    {
      id: "foreign",
      label: "Exterior pendiente",
      source: "Padrón ONPE + sensibilidad Datum CR exterior",
      pendingActas: getExteriorOfficialResults()?.actasTotal ?? null,
      estimatedVotes: estimateExteriorValidVotes(),
      sanchezPct: exteriorMean,
      impactPp: estimateMarginShiftFromPending(onpe, exteriorMean),
      note: `Sin desglose ONPE exterior verificado en la app. El ${exteriorPreferenceLabel} ubica el exterior más favorable a Keiko; el modelo lo pondera como ${exteriorShare == null ? "peso no estimable" : `${round(exteriorShare * 100, 1)}%`} del voto válido pendiente estimado, no como padrón completo.`,
    },
    {
      id: "jee",
      label: "Actas en JEE",
      source: "ONPE resumen-general/totales",
      pendingActas: onpe.actasEnviadasJee ?? null,
      estimatedVotes: null,
      sanchezPct: onpe.candidates.sanchez.pct,
      impactPp: null,
      note: "Bloque legal-operativo con capacidad de mover un margen estrecho después del conteo operativo. Sin microdatos de actas JEE, la app no publica impacto puntual.",
    },
  ];
}

function buildTrendSignals(
  onpe: OnpeResumen,
  requirements: RequirementRow[],
  projection: ProjectionSummary,
): TrendSignalRow[] {
  const voteGap =
    onpe.candidates.keiko.votes != null && onpe.candidates.sanchez.votes != null
      ? onpe.candidates.keiko.votes - onpe.candidates.sanchez.votes
      : 0;
  const lateDelta = getLateOnpeDelta(onpe);
  const tieRequirement =
    requirements.find((row) => row.id === "tie")?.requiredPendingSanchezPct ?? 50;
  const exteriorAdjusted = buildExteriorAdjustedPendingSanchezPct(onpe);
  const exteriorShare = estimateExteriorShareOfPending(onpe);
  const currentLeaderTone: ScenarioRow["tone"] =
    voteGap > 0 ? "keiko" : voteGap < 0 ? "sanchez" : "neutral";

  return [
    {
      id: "official-gap",
      label: "Brecha oficial ONPE",
      value: Math.abs(voteGap),
      unit: "votes",
      tone: currentLeaderTone,
      detail:
        voteGap >= 0
          ? "Keiko lidera el voto válido contabilizado."
          : "Sánchez lidera el voto válido contabilizado.",
      note: "Brecha observada, no proyección final.",
    },
    {
      id: "late-delta",
      label: "Delta ONPE reciente",
      value: lateDelta?.sanchezPct ?? onpe.candidates.sanchez.pct,
      unit: "pct",
      tone:
        (lateDelta?.sanchezPct ?? onpe.candidates.sanchez.pct) >= tieRequirement
          ? "sanchez"
          : "neutral",
      detail:
        lateDelta == null
          ? "No hay votos absolutos suficientes para medir el delta reciente."
          : `${lateDelta.totalVotes.toLocaleString("es-PE")} votos válidos añadidos desde ${lateDelta.previousAdvancePct ?? "corte previo"}%.`,
      note:
        lateDelta?.sanchezPctShift == null
          ? "Señal de llegada tardía no disponible."
          : `Sánchez subió ${lateDelta.sanchezPctShift.toFixed(3)} pp en el acumulado ONPE desde el corte previo.`,
    },
    {
      id: "tie-threshold",
      label: "Umbral que decide el empate",
      value: tieRequirement,
      unit: "pct",
      tone: lateDelta != null && lateDelta.sanchezPct >= tieRequirement ? "sanchez" : "keiko",
      detail: "Sánchez debe superar este porcentaje en lo no contabilizado.",
      note: "Keiko retiene mayoría nacional si el bloque pendiente queda por debajo de este umbral.",
    },
    {
      id: "foreign-adjustment",
      label: "Ajuste exterior explícito",
      value: exteriorAdjusted ?? getExteriorDatumSanchezPct(),
      unit: "pct",
      tone:
        exteriorAdjusted == null
          ? "neutral"
          : exteriorAdjusted >= tieRequirement
            ? "sanchez"
            : "keiko",
      detail: `Mix de pendiente doméstico + exterior Datum (${formatExteriorShare(exteriorShare)} del pendiente estimado).`,
      note: "No usa votos exteriores oficiales porque la app aún no tiene desglose ONPE exterior verificado; es sensibilidad con Datum CR exterior.",
    },
    {
      id: "modeled-margin",
      label: "Margen mediano modelado",
      value: projection.signedMarginMedianPp,
      unit: "pp",
      tone:
        projection.signedMarginMedianPp > 0
          ? "keiko"
          : projection.signedMarginMedianPp < 0
            ? "sanchez"
            : "neutral",
      detail: "Convención: positivo favorece a Keiko; negativo favorece a Sánchez.",
      note: "Debe leerse junto con IC80/IC95 y no como resultado proclamado.",
    },
  ];
}

function quickCountRow(id: "ipsos-cr" | "datum-cr") {
  const source = getSource(id);
  const data = source.data;
  return {
    id,
    pollster: source.name,
    instrument: source.instrument,
    keikoPct: data.a,
    sanchezPct: data.b,
    marginPp: data.marginPp ?? Math.abs(data.a - data.b),
    leader: data.a >= data.b ? ("Keiko" as const) : ("Sanchez" as const),
    marginOfError: data.marginOfError,
    marginOfErrorNote: data.marginOfErrorNote,
    sourceUrl: source.url ?? data.sourceUrl,
  };
}

function getProjectionStatus(projection: ProjectionSummary): {
  status: ProjectionStatus;
  label: string;
  headline: string;
} {
  const ci95CrossesZero =
    projection.signedMarginCi95Pp[0] <= 0 && projection.signedMarginCi95Pp[1] >= 0;
  const leaderProbability = Math.max(
    projection.probabilityKeikoLead,
    projection.probabilitySanchezLead,
  );

  if (ci95CrossesZero || leaderProbability < 90) {
    return {
      status: "alta_incertidumbre",
      label: "Alta incertidumbre",
      headline:
        "No proyectar ganador: el intervalo 95% todavía cruza el empate y la reversión sigue siendo estadísticamente plausible.",
    };
  }

  if (leaderProbability < 97.5) {
    return {
      status: "ventaja_preliminar",
      label: "Ventaja preliminar",
      headline:
        "El modelo encuentra una ventaja probable, pero el resultado aún puede revertirse con actas pendientes o JEE.",
    };
  }

  if (leaderProbability < 99.5) {
    return {
      status: "ventaja_fuerte",
      label: "Ventaja fuerte",
      headline:
        "La proyección muestra una ventaja estadísticamente fuerte, sujeta a actualización con nuevas actas.",
    };
  }

  return {
    status: "muy_dificil_revertir",
    label: "Muy difícil de revertir",
    headline:
      "La reversión aparece estadísticamente muy improbable, aunque la proclamación oficial corresponde únicamente a ONPE/JNE.",
  };
}

export function buildPredictionSnapshot(onpeInput?: OnpeResumen): PredictionSnapshot {
  const onpe = onpeInput ?? getFallbackOnpe();
  const requirements = buildRequirementRows(onpe);
  const scenarios = buildScenarios(onpe, requirements);
  const projection = buildProjection(onpe);
  const trendSignals = buildTrendSignals(onpe, requirements, projection);
  const status = getProjectionStatus(projection);
  const latestCut = { advancePct: onpe.advancePct, timestamp: onpe.timestamp };
  const eta = estimateCompletionEta([...HISTORICAL_CUTS, latestCut]);
  const exteriorShare = estimateExteriorShareOfPending(onpe);
  const exteriorAdjustedPending = buildExteriorAdjustedPendingSanchezPct(onpe);
  const exteriorRoster = getExteriorRoster();
  const exteriorOfficialResults = getExteriorOfficialResults();
  const actasNoContabilizadas =
    onpe.actasTotal != null && onpe.actasProcesadas != null
      ? onpe.actasTotal - onpe.actasProcesadas
      : null;

  return {
    asOf: onpe.timestamp,
    status: status.status,
    statusLabel: status.label,
    headline: status.headline,
    onpe: {
      status: onpe.status,
      advancePct: onpe.advancePct,
      keikoPct: onpe.candidates.keiko.pct,
      sanchezPct: onpe.candidates.sanchez.pct,
      marginPp: onpe.marginPp,
      marginLeader: onpe.marginLeader,
      votesKeiko: onpe.candidates.keiko.votes,
      votesSanchez: onpe.candidates.sanchez.votes,
      actasContabilizadas: onpe.actasProcesadas,
      actasTotal: onpe.actasTotal,
      actasNoContabilizadas,
      actasEnviadasJee: onpe.actasEnviadasJee ?? null,
      actasPendientesJee: onpe.actasPendientesJee ?? null,
      actasEnviadasJeePct: onpe.actasEnviadasJeePct ?? null,
      actasPendientesJeePct: onpe.actasPendientesJeePct ?? null,
      source: onpe.source,
    },
    quickCounts: [quickCountRow("ipsos-cr"), quickCountRow("datum-cr")],
    projection,
    errorBudget: buildErrorBudget(),
    criticalDrivers: buildCriticalDrivers(onpe),
    trendSignals,
    requirements,
    scenarios,
    eta,
    exterior: {
      eligibleVoters: exteriorRoster.eligibleVoters,
      mesas: exteriorRoster.mesas,
      locals: exteriorRoster.locals,
      cities: exteriorRoster.cities,
      officialResultsStatus: exteriorOfficialResults?.status ?? "not_verified",
      actasTotal: exteriorOfficialResults?.actasTotal ?? null,
      actasContabilizadas: exteriorOfficialResults?.actasContabilizadas ?? null,
      pendingPct:
        exteriorOfficialResults?.actasTotal != null &&
        exteriorOfficialResults.actasTotal > 0 &&
        exteriorOfficialResults.actasContabilizadas != null
          ? round(
              ((exteriorOfficialResults.actasTotal -
                exteriorOfficialResults.actasContabilizadas) /
                exteriorOfficialResults.actasTotal) *
                100,
              2,
            )
          : null,
      turnoutAssumptionPct: getExteriorTurnoutAssumptionPct(),
      validVoteAssumptionPct: getExteriorValidVoteAssumptionPct(),
      validVoteEstimate: estimateExteriorValidVotes(),
      shareOfPendingValidEstimatePct:
        exteriorShare == null ? null : round(exteriorShare * 100, 2),
      adjustedPendingSanchezPct: exteriorAdjustedPending,
      datumSanchezPct: getExteriorDatumSanchezPct(),
      datumKeikoPct: getExteriorDatumKeikoPct(),
      note:
        "Sin desglose ONPE exterior verificado en la app. El dato de preferencia exterior proviene del conteo rápido Datum, no de ONPE final; el volumen de votos válidos exteriores es una hipótesis explícita de participación para sensibilidad estadística.",
    },
    caveats: [
      "ONPE parcial es oficial, pero no es una muestra aleatoria: el orden de llegada de actas puede sesgar el porcentaje nacional.",
      "Los conteos rápidos Ipsos/Datum son estimaciones con margen de error; ambos se reportan como empate técnico.",
      "La app separa cómputo ONPE a 100% de proclamación JNE; las actas enviadas al JEE pueden cambiar después de la contabilización operativa.",
      "Sin distribución completa de actas pendientes por distrito/ciudad, no se publica una frecuencia de liderazgo simulado como si fuera definitiva.",
    ],
    sources: [
      {
        label: "ONPE resultados oficiales",
        url: "https://resultadosegundavuelta.onpe.gob.pe/main/resumen",
      },
      {
        label: "RPP — Ipsos/Transparencia CR",
        url: getSource("ipsos-cr").url ?? "",
      },
      {
        label: "El Comercio — Datum CR y regiones",
        url: getSource("datum-cr").url ?? "",
      },
      {
        label: "ONPE/Andina — padrón y logística exterior",
        url:
          flashElectoral.exterior?.officialRosterElectionDay.sourceUrl ??
          "https://www.gob.pe/institucion/onpe/noticias/1402698-onpe-mas-de-27-millones-de-peruanos-estan-llamados-a-participar-en-la-segunda-eleccion-presidencial",
      },
      {
        label: "Datum — sensibilidad exterior CR",
        url: flashElectoral.exterior?.datumQuickCount.sourceUrl ?? "",
      },
    ],
  };
}

export function getSourceMarginOfError(source: CandidatePair): string {
  if (source.marginOfError == null) return "No publicado";
  return `±${round(source.marginOfError, 2)} pp`;
}
