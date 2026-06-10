import { flashElectoral, getValidatedErrorMetrics } from "./data";
import jeeResolutionModelData from "@/data/2026/jee-resolution-model.json";
import { calcPendingVoteRequirement } from "./stats";
import type {
  CandidatePair,
  JeeResolutionModel,
  OnpeExteriorResumen,
  OnpeResumen,
} from "./types";

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
  frequencyKeikoLead: number;
  frequencySanchezLead: number;
  frequencyPracticalTie: number;
  epsilonPp: number;
  currentLeaderReversalRisk: number;
  currentLeaderNonHoldRisk: number;
  noCallReason: string;
  methodNote: string;
  probabilityNote: string;
  modelParameters: {
    componentInputs: {
      officialGapKeikoMinusSanchezVotes: number;
      countedValidVotes: number;
      domesticPendingActas: number;
      domesticJeeActas: number;
      exteriorPendingActas: number;
      exteriorJeeActas: number;
      exteriorObservedKeikoSharePct: number;
      exteriorValidVotesPerActa: number;
      domesticPendingKeikoSharePct: number;
      jeeModelCutPeru: string;
    };
    priors: {
      jeeAnnulmentAlpha: number;
      jeeAnnulmentBeta: number;
      jeeAnnulmentMean: number;
      systematicLeanBiasSdPp: number;
      domesticPendingShareConcentration: number;
      exteriorShareConcentration: number;
      votesPerActaSdPct: number;
    };
    note: string;
  };
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
  modelVersion: string;
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
  componentRead: {
    source: string;
    cutPeru: string;
    cutUtc: string;
    status: "snapshot" | "live";
    officialGapKeikoMinusSanchez: number;
    pendingPeruGapKeikoMinusSanchez: number;
    expectedJeeGapKeikoMinusSanchez: number;
    peruOnlyExpectedGapKeikoMinusSanchez: number;
    exteriorDatumGapKeikoMinusSanchez: number;
    exteriorExitPollGapKeikoMinusSanchez: number;
    exteriorThirtyPpGapKeikoMinusSanchez: number;
    peruPlusDatumGapKeikoMinusSanchez: number;
    peruPlusExitPollGapKeikoMinusSanchez: number;
    peruPlusExteriorThirtyPpGapKeikoMinusSanchez: number;
    pendingPeruActas: number;
    jeeActasAtRisk: number;
    foreignAggregateActas: number;
    foreignValidVotesUsed: number;
    note: string;
  };
  exterior: {
    eligibleVoters: number;
    mesas: number;
    locals: number;
    cities: number;
    officialResultsStatus: "not_verified" | "live" | "snapshot";
    officialAdvancePct: number | null;
    actasTotal: number | null;
    actasContabilizadas: number | null;
    actasPendientes: number | null;
    pendingPct: number | null;
    officialVotesKeiko: number | null;
    officialVotesSanchez: number | null;
    officialKeikoPct: number | null;
    officialSanchezPct: number | null;
    officialValidVotes: number | null;
    officialMarginPp: number | null;
    officialMarginLeader: string | null;
    officialSource: string | null;
    officialObservedGapVotes: number | null;
    datumProjectedGapVotes: number;
    datumProjectedGapRangeVotes: [number, number];
    datumProjectedKeikoVotes: number;
    datumProjectedSanchezVotes: number;
    exitPollProjectedGapVotes: number;
    exitPollProjectedGapRangeVotes: [number, number];
    exitPollProjectedKeikoVotes: number;
    exitPollProjectedSanchezVotes: number;
    domesticSanchezPctToOffsetDatumExterior: number | null;
    domesticSanchezPctToOffsetDatumExteriorRange: [number, number] | null;
    turnoutAssumptionPct: number;
    turnoutAssumptionRangePct: [number, number];
    validVoteAssumptionPct: number;
    validVoteAssumptionRangePct: [number, number];
    validVoteEstimate: number;
    validVoteEstimateRange: [number, number];
    shareOfPendingValidEstimatePct: number | null;
    shareOfPendingValidEstimateRangePct: [number, number] | null;
    adjustedPendingSanchezPct: number | null;
    adjustedPendingSanchezRangePct: [number, number] | null;
    datumSanchezPct: number;
    datumKeikoPct: number;
    note: string;
  };
  caveats: string[];
  sources: Array<{ label: string; url: string }>;
};

const jeeResolutionModel = jeeResolutionModelData as JeeResolutionModel;

type CompletionCut = {
  advancePct: number;
  timestamp: string;
};

const HISTORICAL_CUTS: CompletionCut[] = [
  { advancePct: 76.966, timestamp: "2026-06-08T00:31:00-05:00" },
  { advancePct: 81.865, timestamp: "2026-06-08T01:16:00-05:00" },
  { advancePct: 85.484, timestamp: "2026-06-08T02:02:01-05:00" },
  { advancePct: 90.488, timestamp: "2026-06-08T04:16:00-05:00" },
  { advancePct: 93.87, timestamp: "2026-06-08T12:52:00-05:00" },
  { advancePct: 96.879, timestamp: "2026-06-10T00:15:19-05:00" },
];

const SIMULATION_COUNT = 20_000;
const MODEL_VERSION = "prediction-v3.0";
const PRACTICAL_TIE_EPSILON_PP = 0.1;
const FALLBACK_EXTERIOR_ROSTER = {
  eligibleVoters: 1_194_172,
  mesas: 2_506,
  locals: 219,
  cities: 206,
};
const FALLBACK_EXTERIOR_TURNOUT_ASSUMPTION_PCT = 34;
const FALLBACK_EXTERIOR_VALID_VOTE_ASSUMPTION_PCT = 94;
const FALLBACK_EXTERIOR_TURNOUT_RANGE_PCT: [number, number] = [25, 45];
const FALLBACK_EXTERIOR_VALID_VOTE_RANGE_PCT: [number, number] = [90, 97];

type ExteriorOfficialResults = {
  status: PredictionSnapshot["exterior"]["officialResultsStatus"];
  timestamp: string | null;
  advancePct: number | null;
  actasTotal: number | null;
  actasContabilizadas: number | null;
  actasPendientes: number | null;
  votesA: number | null;
  votesB: number | null;
  a: number | null;
  b: number | null;
  validVotes: number | null;
  marginPp: number | null;
  marginLeader: string | null;
  source: string | null;
  sourceUrl: string | null;
  note: string;
};

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
    timestamp: source.publishedAt ?? "2026-06-10T00:15:19-05:00",
    advancePct: data.advancePct ?? 96.879,
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
      "Sensibilidad base que separa exterior: ONPE exterior agregado se muestra aparte, y aquí se mantiene Datum como preferencia hipotética hasta que el avance oficial exterior sea material.",
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

function getStaticExteriorOfficialResults(): ExteriorOfficialResults | null {
  const raw = flashElectoral.exterior?.officialOnpeExteriorResults;
  if (!raw) return null;

  return {
    status: raw.status,
    timestamp: null,
    advancePct: raw.advancePct ?? null,
    actasTotal: raw.actasTotal ?? null,
    actasContabilizadas: raw.actasContabilizadas ?? null,
    actasPendientes:
      raw.actasPendientes ??
      (raw.actasTotal != null && raw.actasContabilizadas != null
        ? Math.max(0, raw.actasTotal - raw.actasContabilizadas)
        : null),
    votesA: raw.votesA ?? null,
    votesB: raw.votesB ?? null,
    a: raw.a ?? null,
    b: raw.b ?? null,
    validVotes: raw.validVotes ?? null,
    marginPp: raw.marginPp ?? null,
    marginLeader:
      raw.marginLeader === "a"
        ? "Keiko Fujimori"
        : raw.marginLeader === "b"
          ? "Roberto Sánchez"
          : raw.marginLeader ?? null,
    source: raw.source ?? null,
    sourceUrl: raw.sourceUrl ?? null,
    note: raw.note,
  };
}

function getExteriorOfficialResults(
  exteriorInput?: OnpeExteriorResumen,
): ExteriorOfficialResults | null {
  const fallback = getStaticExteriorOfficialResults();
  if (!exteriorInput) return fallback;
  const status =
    exteriorInput.status === "live" ||
    exteriorInput.status === "snapshot" ||
    exteriorInput.status === "not_verified"
      ? exteriorInput.status
      : "snapshot";

  const keikoPct = exteriorInput.candidates.keiko.pct ?? fallback?.a ?? null;
  const sanchezPct = exteriorInput.candidates.sanchez.pct ?? fallback?.b ?? null;
  const actasPendientes =
    exteriorInput.actasPendientes ??
    (exteriorInput.actasTotal != null && exteriorInput.actasContabilizadas != null
      ? Math.max(0, exteriorInput.actasTotal - exteriorInput.actasContabilizadas)
      : fallback?.actasPendientes ?? null);

  return {
    status,
    timestamp: exteriorInput.timestamp,
    advancePct: exteriorInput.advancePct ?? fallback?.advancePct ?? null,
    actasTotal: exteriorInput.actasTotal ?? fallback?.actasTotal ?? null,
    actasContabilizadas:
      exteriorInput.actasContabilizadas ?? fallback?.actasContabilizadas ?? null,
    actasPendientes,
    votesA: exteriorInput.candidates.keiko.votes ?? fallback?.votesA ?? null,
    votesB: exteriorInput.candidates.sanchez.votes ?? fallback?.votesB ?? null,
    a: keikoPct,
    b: sanchezPct,
    validVotes: exteriorInput.validVotes ?? fallback?.validVotes ?? null,
    marginPp: exteriorInput.marginPp ?? fallback?.marginPp ?? null,
    marginLeader: exteriorInput.marginLeader ?? fallback?.marginLeader ?? null,
    source: fallback?.source ?? "ONPE exterior agregado",
    sourceUrl: exteriorInput.source ?? fallback?.sourceUrl ?? null,
    note:
      exteriorInput.message ??
      fallback?.note ??
      "Resultado oficial exterior agregado no disponible.",
  };
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

function normalizeRange(range: [number, number]): [number, number] {
  return range[0] <= range[1] ? range : [range[1], range[0]];
}

function normalizeNumericRange(
  range: number[] | undefined,
  fallback: [number, number],
): [number, number] {
  if (!range || range.length < 2) return fallback;
  const first = Number(range[0]);
  const second = Number(range[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return fallback;
  return normalizeRange([first, second]);
}

function getExteriorTurnoutAssumptionRangePct(): [number, number] {
  return normalizeNumericRange(
    flashElectoral.exterior?.assumptions.turnoutPctRange,
    FALLBACK_EXTERIOR_TURNOUT_RANGE_PCT,
  );
}

function getExteriorValidVoteAssumptionRangePct(): [number, number] {
  return normalizeNumericRange(
    flashElectoral.exterior?.assumptions.validVotePctRange,
    FALLBACK_EXTERIOR_VALID_VOTE_RANGE_PCT,
  );
}

function estimateExteriorValidVotesWith(turnoutPct: number, validVotePct: number): number {
  const roster = getExteriorRoster();
  return Math.round(
    roster.eligibleVoters *
      (turnoutPct / 100) *
      (validVotePct / 100),
  );
}

function estimateExteriorValidVotes(): number {
  return estimateExteriorValidVotesWith(
    getExteriorTurnoutAssumptionPct(),
    getExteriorValidVoteAssumptionPct(),
  );
}

function estimateExteriorValidVoteRange(): [number, number] {
  const turnoutRange = getExteriorTurnoutAssumptionRangePct();
  const validVoteRange = getExteriorValidVoteAssumptionRangePct();
  return [
    estimateExteriorValidVotesWith(turnoutRange[0], validVoteRange[0]),
    estimateExteriorValidVotesWith(turnoutRange[1], validVoteRange[1]),
  ];
}

function estimateExteriorCandidateVotesWith(validVotes: number, pct: number): number {
  return Math.round(validVotes * (pct / 100));
}

function estimateExteriorGapVotesWith(
  validVotes: number,
  keikoPct: number,
  sanchezPct: number,
): number {
  return Math.round(validVotes * ((keikoPct - sanchezPct) / 100));
}

function estimateExteriorDatumGapVotesWith(validVotes: number): number {
  return estimateExteriorGapVotesWith(
    validVotes,
    getExteriorDatumKeikoPct(),
    getExteriorDatumSanchezPct(),
  );
}

function estimateExteriorDatumGapVotes(): number {
  return estimateExteriorDatumGapVotesWith(estimateExteriorValidVotes());
}

function estimateExteriorDatumGapRangeVotes(): [number, number] {
  const [lowVotes, highVotes] = estimateExteriorValidVoteRange();
  return normalizeRange([
    estimateExteriorDatumGapVotesWith(lowVotes),
    estimateExteriorDatumGapVotesWith(highVotes),
  ]);
}

function estimateExteriorExitPollGapVotesWith(validVotes: number): number {
  return estimateExteriorGapVotesWith(
    validVotes,
    getExteriorExitPollKeikoPct(),
    getExteriorExitPollSanchezPct(),
  );
}

function estimateExteriorExitPollGapVotes(): number {
  return estimateExteriorExitPollGapVotesWith(estimateExteriorValidVotes());
}

function estimateExteriorExitPollGapRangeVotes(): [number, number] {
  const [lowVotes, highVotes] = estimateExteriorValidVoteRange();
  return normalizeRange([
    estimateExteriorExitPollGapVotesWith(lowVotes),
    estimateExteriorExitPollGapVotesWith(highVotes),
  ]);
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

function getExteriorExitPollSanchezPct(): number {
  return (
    flashElectoral.exterior?.datumExitPoll?.b ??
    getExteriorDatumSanchezPct()
  );
}

function getExteriorExitPollKeikoPct(): number {
  return (
    flashElectoral.exterior?.datumExitPoll?.a ??
    (100 - getExteriorExitPollSanchezPct())
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

function estimateExteriorShareRangeOfPending(onpe: OnpeResumen): [number, number] | null {
  const pendingValidVotes = estimatePendingValidVotes(onpe);
  if (pendingValidVotes == null || pendingValidVotes <= 0) return null;
  const [lowVotes, highVotes] = estimateExteriorValidVoteRange();
  return [
    clamp(lowVotes / pendingValidVotes, 0, 0.6),
    clamp(highVotes / pendingValidVotes, 0, 0.6),
  ];
}

function estimateDomesticSanchezPctToOffsetExteriorGap(
  onpe: OnpeResumen,
  exteriorVoteEstimate: number,
): number | null {
  const pendingValidVotes = estimatePendingValidVotes(onpe);
  if (pendingValidVotes == null || pendingValidVotes <= 0) return null;
  const exteriorVotes = Math.min(exteriorVoteEstimate, pendingValidVotes);
  const domesticVotes = Math.max(0, pendingValidVotes - exteriorVotes);
  if (domesticVotes <= 0) return null;
  const exteriorGapVotes = estimateExteriorDatumGapVotesWith(exteriorVotes);
  return round(((1 + exteriorGapVotes / domesticVotes) / 2) * 100, 3);
}

function estimateDomesticSanchezPctToOffsetExteriorGapRange(
  onpe: OnpeResumen,
): [number, number] | null {
  const [lowVotes, highVotes] = estimateExteriorValidVoteRange();
  const low = estimateDomesticSanchezPctToOffsetExteriorGap(onpe, lowVotes);
  const high = estimateDomesticSanchezPctToOffsetExteriorGap(onpe, highVotes);
  if (low == null || high == null) return null;
  return normalizeRange([low, high]);
}

function buildExteriorAdjustedPendingSanchezPct(onpe: OnpeResumen): number | null {
  const pendingValidVotes = estimatePendingValidVotes(onpe);
  if (pendingValidVotes == null || pendingValidVotes <= 0) return null;
  return buildExteriorAdjustedPendingSanchezPctWith(onpe, estimateExteriorValidVotes());
}

function buildExteriorAdjustedPendingSanchezPctWith(
  onpe: OnpeResumen,
  exteriorVoteEstimate: number,
): number | null {
  const pendingValidVotes = estimatePendingValidVotes(onpe);
  if (pendingValidVotes == null || pendingValidVotes <= 0) return null;
  const exteriorVotes = Math.min(exteriorVoteEstimate, pendingValidVotes);
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

function buildExteriorAdjustedPendingSanchezRangePct(
  onpe: OnpeResumen,
): [number, number] | null {
  const [lowVotes, highVotes] = estimateExteriorValidVoteRange();
  const lowMix = buildExteriorAdjustedPendingSanchezPctWith(onpe, lowVotes);
  const highMix = buildExteriorAdjustedPendingSanchezPctWith(onpe, highVotes);
  if (lowMix == null || highMix == null) return null;
  return normalizeRange([lowMix, highMix]);
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

function gammaSample(rand: () => number, shape: number): number {
  if (shape < 1) {
    const u = Math.max(rand(), Number.EPSILON);
    return gammaSample(rand, shape + 1) * u ** (1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x = 0;
    let v = 0;
    do {
      x = normal(rand, 0, 1);
      v = 1 + c * x;
    } while (v <= 0);
    v = v ** 3;
    const u = rand();
    if (u < 1 - 0.0331 * x ** 4) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function betaSample(rand: () => number, alpha: number, betaParam: number): number {
  const x = gammaSample(rand, alpha);
  const y = gammaSample(rand, betaParam);
  return x / (x + y);
}

function betaAroundShare(rand: () => number, share: number, concentration: number): number {
  const safe = clamp(share, 0.005, 0.995);
  return betaSample(rand, 1 + safe * concentration, 1 + (1 - safe) * concentration);
}

function binomialSample(rand: () => number, trials: number, probability: number): number {
  const n = Math.max(0, Math.round(trials));
  const p = clamp(probability, 0, 1);
  if (n === 0 || p === 0) return 0;
  if (p === 1) return n;
  if (n > 30) {
    const mean = n * p;
    const sd = Math.sqrt(n * p * (1 - p));
    return clamp(Math.round(normal(rand, mean, sd)), 0, n);
  }
  let count = 0;
  for (let i = 0; i < n; i += 1) {
    if (rand() < p) count += 1;
  }
  return count;
}

const SYSTEMATIC_LEAN_BIAS_SD_SHARE = 0.02;
const DOMESTIC_PENDING_SHARE_CONCENTRATION = 900;
const EXTERIOR_SHARE_CONCENTRATION = 360;
const VOTES_PER_ACTA_SD_PCT = 12;

type ComponentInputs = {
  officialGapVotes: number;
  countedValidVotes: number;
  domesticPendingActas: number;
  domesticJeeActas: number;
  exteriorPendingActas: number;
  exteriorJeeActas: number;
  exteriorKeikoShare: number;
  exteriorValidVotesPerActa: number;
  domesticPendingKeikoShare: number;
  domesticPendingValidVotesPerActa: number;
  jeeDepartmentRows: Array<{
    actas: number;
    validVotes: number;
    keikoShare: number;
  }>;
  jeeActasScale: number;
};

function buildComponentInputs(
  onpe: OnpeResumen,
  exteriorOfficial: ExteriorOfficialResults | null,
): ComponentInputs {
  const countedValidVotes =
    (onpe.candidates.keiko.votes ?? 0) + (onpe.candidates.sanchez.votes ?? 0);
  const officialGapVotes =
    (onpe.candidates.keiko.votes ?? 0) - (onpe.candidates.sanchez.votes ?? 0);

  const foreignModel = jeeResolutionModel.currentUnresolved.foreignAggregate;
  const exteriorJeeActas = foreignModel?.enviadas_jee_observadas ?? 0;
  const exteriorUnresolved =
    exteriorOfficial?.actasTotal != null && exteriorOfficial.actasContabilizadas != null
      ? Math.max(0, exteriorOfficial.actasTotal - exteriorOfficial.actasContabilizadas)
      : (foreignModel?.pendientes ?? 0) + exteriorJeeActas;
  const exteriorPendingActas = Math.max(0, exteriorUnresolved - exteriorJeeActas);

  const nationalPending = onpe.actasPendientesJee ?? null;
  const nationalJee = onpe.actasEnviadasJee ?? null;
  const peruModel = jeeResolutionModel.currentUnresolved.peru;
  const domesticPendingActas =
    nationalPending != null
      ? Math.max(0, nationalPending - exteriorPendingActas)
      : peruModel.pendientes;
  const domesticJeeActas =
    nationalJee != null
      ? Math.max(0, nationalJee - exteriorJeeActas)
      : peruModel.enviadas_jee_observadas;

  const exteriorValid = exteriorOfficial?.validVotes ?? null;
  const exteriorCounted = exteriorOfficial?.actasContabilizadas ?? null;
  const exteriorValidVotesPerActa =
    exteriorValid != null && exteriorCounted != null && exteriorCounted > 0
      ? exteriorValid / exteriorCounted
      : 123;
  const exteriorKeikoShare =
    exteriorOfficial?.a != null && exteriorOfficial.b != null
      ? exteriorOfficial.a / (exteriorOfficial.a + exteriorOfficial.b)
      : getExteriorDatumKeikoPct() / 100;

  const pendingPeruComponent = jeeResolutionModel.components.pendingPeru;
  const domesticPendingKeikoShare =
    pendingPeruComponent.valid > 0
      ? pendingPeruComponent.keiko / pendingPeruComponent.valid
      : 0.45;
  const domesticPendingValidVotesPerActa =
    pendingPeruComponent.actas > 0
      ? pendingPeruComponent.valid / pendingPeruComponent.actas
      : 150;

  const jeeDepartmentRows = jeeResolutionModel.departmentRows
    .map((row) => ({
      actas: row.actas.sentToJee ?? 0,
      validVotes: row.estimates.jeeValidVotesAtRisk ?? 0,
      keikoShare:
        (row.estimates.jeeValidVotesAtRisk ?? 0) > 0
          ? (row.estimates.jeeKeikoVotesAtRisk ?? 0) /
            (row.estimates.jeeValidVotesAtRisk ?? 1)
          : 0.5,
    }))
    .filter((row) => row.actas > 0 && row.validVotes > 0);
  const modelDomesticJeeActas = jeeDepartmentRows.reduce(
    (sum, row) => sum + row.actas,
    0,
  );
  const jeeActasScale =
    modelDomesticJeeActas > 0 ? domesticJeeActas / modelDomesticJeeActas : 1;

  return {
    officialGapVotes,
    countedValidVotes,
    domesticPendingActas,
    domesticJeeActas,
    exteriorPendingActas,
    exteriorJeeActas,
    exteriorKeikoShare,
    exteriorValidVotesPerActa,
    domesticPendingKeikoShare,
    domesticPendingValidVotesPerActa,
    jeeDepartmentRows,
    jeeActasScale,
  };
}

function buildProjection(
  onpe: OnpeResumen,
  exteriorOfficial: ExteriorOfficialResults | null,
): ProjectionSummary {
  const inputs = buildComponentInputs(onpe, exteriorOfficial);
  const prior =
    jeeResolutionModel.historicalJeeResolution.pooled.regime2026Prior ??
    jeeResolutionModel.historicalJeeResolution.pooled.hierarchicalBetaPrior;
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
      inputs.exteriorPendingActas,
    ].join("|"),
  );
  const rand = seededRandom(seed);
  const sanchezShares: number[] = [];
  const signedMargins: number[] = [];
  const vpaSdFactor = VOTES_PER_ACTA_SD_PCT / 100;

  for (let i = 0; i < SIMULATION_COUNT; i += 1) {
    // Sesgo sistemático compartido: los shares de los bloques sin resolver son
    // estimaciones territoriales, no contenido real de actas; su error está
    // correlacionado entre componentes.
    const leanBias = normal(rand, 0, SYSTEMATIC_LEAN_BIAS_SD_SHARE);
    const annulRate = betaSample(rand, prior.annulledAlpha, prior.annulledBeta);
    const admissionRate = 1 - annulRate;

    // Pendiente doméstico (operativo, sin riesgo legal).
    const domesticPendingValid =
      inputs.domesticPendingActas *
      Math.max(
        20,
        normal(
          rand,
          inputs.domesticPendingValidVotesPerActa,
          inputs.domesticPendingValidVotesPerActa * vpaSdFactor,
        ),
      );
    const domesticPendingShare = betaAroundShare(
      rand,
      inputs.domesticPendingKeikoShare + leanBias,
      DOMESTIC_PENDING_SHARE_CONCENTRATION,
    );
    const domesticPendingMargin = domesticPendingValid * (2 * domesticPendingShare - 1);
    const domesticPendingSanchezVotes = domesticPendingValid * (1 - domesticPendingShare);

    // Actas JEE domésticas: binomial por departamento con prior jerárquico de anulación.
    let jeeMargin = 0;
    let jeeValidCounted = 0;
    let jeeSanchezVotes = 0;
    for (const row of inputs.jeeDepartmentRows) {
      const scaledActas = Math.max(0, Math.round(row.actas * inputs.jeeActasScale));
      if (scaledActas === 0) continue;
      const countedActas = binomialSample(rand, scaledActas, admissionRate);
      if (countedActas === 0) continue;
      const countedRatio = countedActas / scaledActas;
      const validAtRisk = row.validVotes * inputs.jeeActasScale;
      const concentration = clamp(validAtRisk / 120, 45, 520);
      const share = betaAroundShare(rand, row.keikoShare + leanBias, concentration);
      const validCounted = validAtRisk * countedRatio;
      jeeMargin += validCounted * (2 * share - 1);
      jeeValidCounted += validCounted;
      jeeSanchezVotes += validCounted * (1 - share);
    }

    // Exterior: pendientes + JEE exterior, anclado al share oficial observado
    // (62.5/37.5 sobre la mitad de actas exteriores ya contabilizadas).
    const exteriorVpa = Math.max(
      20,
      normal(
        rand,
        inputs.exteriorValidVotesPerActa,
        inputs.exteriorValidVotesPerActa * vpaSdFactor,
      ),
    );
    const exteriorCountableActas =
      inputs.exteriorPendingActas + inputs.exteriorJeeActas * admissionRate;
    const exteriorValid = exteriorCountableActas * exteriorVpa;
    const exteriorShare = betaAroundShare(
      rand,
      inputs.exteriorKeikoShare + leanBias,
      EXTERIOR_SHARE_CONCENTRATION,
    );
    const exteriorMargin = exteriorValid * (2 * exteriorShare - 1);
    const exteriorSanchezVotes = exteriorValid * (1 - exteriorShare);

    const finalMarginVotes =
      inputs.officialGapVotes + domesticPendingMargin + jeeMargin + exteriorMargin;
    const finalValidVotes =
      inputs.countedValidVotes +
      domesticPendingValid +
      jeeValidCounted +
      exteriorValid;
    const finalSanchezVotes =
      (onpe.candidates.sanchez.votes ?? 0) +
      domesticPendingSanchezVotes +
      jeeSanchezVotes +
      exteriorSanchezVotes;
    const sanchezPct =
      finalValidVotes > 0 ? (finalSanchezVotes / finalValidVotes) * 100 : 50;
    const signedMarginPp =
      finalValidVotes > 0 ? (finalMarginVotes / finalValidVotes) * 100 : 0;

    sanchezShares.push(round(sanchezPct, 4));
    signedMargins.push(round(signedMarginPp, 4));
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
    modelName: "Modelo por componentes: ONPE contabilizado + pendiente Perú + JEE + exterior",
    seed,
    simulations: SIMULATION_COUNT,
    countedWeightPct: round(onpe.advancePct, 3),
    weightingNote:
      "El modelo trabaja en espacio de votos: parte de la brecha oficial contabilizada y simula los tres bloques sin resolver (pendiente doméstico, actas JEE con riesgo legal de anulación, exterior). El denominador final de votos válidos es resultado de la simulación, no un supuesto.",
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
    frequencyKeikoLead: round(probabilityKeiko * 100, 2),
    frequencySanchezLead: round(probabilitySanchez * 100, 2),
    frequencyPracticalTie: round(probabilityPracticalTie * 100, 2),
    epsilonPp: PRACTICAL_TIE_EPSILON_PP,
    currentLeaderReversalRisk: round(currentLeaderReversalRisk * 100, 2),
    currentLeaderNonHoldRisk: round(currentLeaderNonHoldRisk * 100, 2),
    noCallReason,
    methodNote:
      "Monte Carlo por componentes en espacio de votos: brecha oficial fija + pendiente doméstico (share Beta), actas JEE por departamento (binomial con prior Beta de anulación del régimen 2026 — la Res. 0180-2025-JNE favorece recuento sobre anulación; media 5%, CI80 0.6-11.4%) y exterior anclado al resultado oficial exterior observado, con sesgo sistemático compartido N(0, 2pp) entre componentes. Sustituye al modelo de regímenes: a 96.9% de avance los conteos rápidos ya no aportan señal sobre lo no resuelto.",
    probabilityNote:
      "La frecuencia se calcula dentro de esta familia de supuestos auditables (publicados en modelParameters). No debe leerse como certeza legal, proclamación ni sustituto de las resoluciones JEE/JNE.",
    modelParameters: {
      componentInputs: {
        officialGapKeikoMinusSanchezVotes: inputs.officialGapVotes,
        countedValidVotes: inputs.countedValidVotes,
        domesticPendingActas: inputs.domesticPendingActas,
        domesticJeeActas: inputs.domesticJeeActas,
        exteriorPendingActas: inputs.exteriorPendingActas,
        exteriorJeeActas: inputs.exteriorJeeActas,
        exteriorObservedKeikoSharePct: round(inputs.exteriorKeikoShare * 100, 3),
        exteriorValidVotesPerActa: round(inputs.exteriorValidVotesPerActa, 1),
        domesticPendingKeikoSharePct: round(inputs.domesticPendingKeikoShare * 100, 3),
        jeeModelCutPeru: jeeResolutionModel.cutPeru,
      },
      priors: {
        jeeAnnulmentAlpha: round(prior.annulledAlpha, 2),
        jeeAnnulmentBeta: round(prior.annulledBeta, 2),
        jeeAnnulmentMean: round(prior.mean, 4),
        systematicLeanBiasSdPp: round(SYSTEMATIC_LEAN_BIAS_SD_SHARE * 100, 1),
        domesticPendingShareConcentration: DOMESTIC_PENDING_SHARE_CONCENTRATION,
        exteriorShareConcentration: EXTERIOR_SHARE_CONCENTRATION,
        votesPerActaSdPct: VOTES_PER_ACTA_SD_PCT,
      },
      note:
        "Insumos y priors publicados para auditoría: la composición de los bloques sin resolver viene del snapshot JEE/ciudad-distrito (cutPeru indicado) reescalado a los conteos de actas del corte ONPE vivo. El prior de anulación usa el régimen 2026 (Res. 0180-2025-JNE: recuento sobre anulación); el prior jerárquico 2011/2016/2021 queda publicado como sensibilidad conservadora en el modelo JEE.",
    },
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
      note: "Calibrado con error histórico Ipsos vs ONPE 100%, MOE primario Ipsos y MOE Datum localizado con calidad documental desigual.",
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

function buildCriticalDrivers(
  onpe: OnpeResumen,
  exteriorOfficialResults: ExteriorOfficialResults | null,
): CriticalDriverRow[] {
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
      note: "En esta sensibilidad, si el pendiente doméstico se parece al interior/regiones, favorece a Sánchez. El volumen exterior se mantiene separado para no mezclar padrón con voto observado.",
    },
    {
      id: "foreign",
      label: "Exterior pendiente",
      source: "ONPE exterior agregado + sensibilidad Datum CR exterior",
      pendingActas:
        exteriorOfficialResults?.actasPendientes ??
        exteriorOfficialResults?.actasTotal ??
        null,
      estimatedVotes: estimateExteriorValidVotes(),
      sanchezPct: exteriorMean,
      impactPp: estimateMarginShiftFromPending(onpe, exteriorMean),
      note: `La app muestra solo el agregado exterior ONPE, sin países. El ${exteriorPreferenceLabel} ubica el exterior más favorable a Keiko; el modelo lo pondera como ${exteriorShare == null ? "peso no estimable" : `${round(exteriorShare * 100, 1)}%`} del voto válido pendiente estimado, no como padrón completo.`,
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
      note: "La preferencia exterior oficial agregada se muestra aparte. Esta señal conserva Datum como sensibilidad porque ONPE exterior todavía está en avance inicial.",
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

function buildComponentRead(): PredictionSnapshot["componentRead"] {
  const officialGap =
    jeeResolutionModel.officialCurrent.marginKeikoMinusSanchez;
  const pendingPeruGap =
    jeeResolutionModel.components.pendingPeru.margin_keiko_minus_roberto;
  const expectedJeeGap =
    jeeResolutionModel.components.expectedJeeResolution
      .expectedCountedMarginKeikoMinusSanchez;
  const peruOnlyExpectedGap = officialGap + pendingPeruGap + expectedJeeGap;
  const exteriorDatumGap = estimateExteriorDatumGapVotes();
  const exteriorExitPollGap = estimateExteriorExitPollGapVotes();
  const exteriorThirtyPpGap = Math.round(
    estimateExteriorValidVotes() * 0.3,
  );

  return {
    source: "data/2026/jee-resolution-model.json",
    cutPeru: jeeResolutionModel.cutPeru,
    cutUtc: jeeResolutionModel.cutUtc,
    status: jeeResolutionModel.status,
    officialGapKeikoMinusSanchez: round(officialGap, 1) ?? officialGap,
    pendingPeruGapKeikoMinusSanchez: round(pendingPeruGap, 1) ?? pendingPeruGap,
    expectedJeeGapKeikoMinusSanchez: round(expectedJeeGap, 1) ?? expectedJeeGap,
    peruOnlyExpectedGapKeikoMinusSanchez:
      round(peruOnlyExpectedGap, 1) ?? peruOnlyExpectedGap,
    exteriorDatumGapKeikoMinusSanchez: exteriorDatumGap,
    exteriorExitPollGapKeikoMinusSanchez: exteriorExitPollGap,
    exteriorThirtyPpGapKeikoMinusSanchez: exteriorThirtyPpGap,
    peruPlusDatumGapKeikoMinusSanchez: round(
      peruOnlyExpectedGap + exteriorDatumGap,
      1,
    ) ?? (peruOnlyExpectedGap + exteriorDatumGap),
    peruPlusExitPollGapKeikoMinusSanchez: round(
      peruOnlyExpectedGap + exteriorExitPollGap,
      1,
    ) ?? (peruOnlyExpectedGap + exteriorExitPollGap),
    peruPlusExteriorThirtyPpGapKeikoMinusSanchez: round(
      peruOnlyExpectedGap + exteriorThirtyPpGap,
      1,
    ) ?? (peruOnlyExpectedGap + exteriorThirtyPpGap),
    pendingPeruActas: jeeResolutionModel.components.pendingPeru.actas,
    jeeActasAtRisk: jeeResolutionModel.components.jeeAtRisk.actas,
    foreignAggregateActas:
      jeeResolutionModel.components.foreignPendingAggregate.actas,
    foreignValidVotesUsed: estimateExteriorValidVotes(),
    note:
      "Lectura principal auditada: snapshot JEE/ciudad-distrito para Peru y sensibilidad exterior agregada. Se mantiene separada del modelo secundario live por regimenes.",
  };
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

export function buildPredictionSnapshot(
  onpeInput?: OnpeResumen,
  exteriorInput?: OnpeExteriorResumen,
): PredictionSnapshot {
  const onpe = onpeInput ?? getFallbackOnpe();
  const requirements = buildRequirementRows(onpe);
  const scenarios = buildScenarios(onpe, requirements);
  const exteriorOfficialResults = getExteriorOfficialResults(exteriorInput);
  const projection = buildProjection(onpe, exteriorOfficialResults);
  const trendSignals = buildTrendSignals(onpe, requirements, projection);
  const status = getProjectionStatus(projection);
  const latestCut = { advancePct: onpe.advancePct, timestamp: onpe.timestamp };
  const eta = estimateCompletionEta([...HISTORICAL_CUTS, latestCut]);
  const exteriorShare = estimateExteriorShareOfPending(onpe);
  const exteriorShareRange = estimateExteriorShareRangeOfPending(onpe);
  const exteriorAdjustedPending = buildExteriorAdjustedPendingSanchezPct(onpe);
  const exteriorAdjustedPendingRange = buildExteriorAdjustedPendingSanchezRangePct(onpe);
  const exteriorRoster = getExteriorRoster();
  const exteriorValidVoteRange = estimateExteriorValidVoteRange();
  const exteriorValidVoteEstimate = estimateExteriorValidVotes();
  const exteriorDatumGapRangeVotes = estimateExteriorDatumGapRangeVotes();
  const exteriorExitPollGapRangeVotes = estimateExteriorExitPollGapRangeVotes();
  const domesticOffsetRange =
    estimateDomesticSanchezPctToOffsetExteriorGapRange(onpe);
  const actasNoContabilizadas =
    onpe.actasTotal != null && onpe.actasProcesadas != null
      ? onpe.actasTotal - onpe.actasProcesadas
      : null;

  return {
    modelVersion: MODEL_VERSION,
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
    criticalDrivers: buildCriticalDrivers(onpe, exteriorOfficialResults),
    trendSignals,
    requirements,
    scenarios,
    eta,
    componentRead: buildComponentRead(),
    exterior: {
      eligibleVoters: exteriorRoster.eligibleVoters,
      mesas: exteriorRoster.mesas,
      locals: exteriorRoster.locals,
      cities: exteriorRoster.cities,
      officialResultsStatus: exteriorOfficialResults?.status ?? "not_verified",
      officialAdvancePct: exteriorOfficialResults?.advancePct ?? null,
      actasTotal: exteriorOfficialResults?.actasTotal ?? null,
      actasContabilizadas: exteriorOfficialResults?.actasContabilizadas ?? null,
      actasPendientes: exteriorOfficialResults?.actasPendientes ?? null,
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
      officialVotesKeiko: exteriorOfficialResults?.votesA ?? null,
      officialVotesSanchez: exteriorOfficialResults?.votesB ?? null,
      officialKeikoPct: exteriorOfficialResults?.a ?? null,
      officialSanchezPct: exteriorOfficialResults?.b ?? null,
      officialValidVotes: exteriorOfficialResults?.validVotes ?? null,
      officialMarginPp: exteriorOfficialResults?.marginPp ?? null,
      officialMarginLeader: exteriorOfficialResults?.marginLeader ?? null,
      officialSource: exteriorOfficialResults?.sourceUrl ?? exteriorOfficialResults?.source ?? null,
      officialObservedGapVotes:
        exteriorOfficialResults?.votesA != null &&
        exteriorOfficialResults.votesB != null
          ? exteriorOfficialResults.votesA - exteriorOfficialResults.votesB
          : null,
      datumProjectedGapVotes: estimateExteriorDatumGapVotes(),
      datumProjectedGapRangeVotes: exteriorDatumGapRangeVotes,
      datumProjectedKeikoVotes: estimateExteriorCandidateVotesWith(
        exteriorValidVoteEstimate,
        getExteriorDatumKeikoPct(),
      ),
      datumProjectedSanchezVotes: estimateExteriorCandidateVotesWith(
        exteriorValidVoteEstimate,
        getExteriorDatumSanchezPct(),
      ),
      exitPollProjectedGapVotes: estimateExteriorExitPollGapVotes(),
      exitPollProjectedGapRangeVotes: exteriorExitPollGapRangeVotes,
      exitPollProjectedKeikoVotes: estimateExteriorCandidateVotesWith(
        exteriorValidVoteEstimate,
        getExteriorExitPollKeikoPct(),
      ),
      exitPollProjectedSanchezVotes: estimateExteriorCandidateVotesWith(
        exteriorValidVoteEstimate,
        getExteriorExitPollSanchezPct(),
      ),
      domesticSanchezPctToOffsetDatumExterior:
        estimateDomesticSanchezPctToOffsetExteriorGap(
          onpe,
          exteriorValidVoteEstimate,
        ),
      domesticSanchezPctToOffsetDatumExteriorRange: domesticOffsetRange,
      turnoutAssumptionPct: getExteriorTurnoutAssumptionPct(),
      turnoutAssumptionRangePct: getExteriorTurnoutAssumptionRangePct(),
      validVoteAssumptionPct: getExteriorValidVoteAssumptionPct(),
      validVoteAssumptionRangePct: getExteriorValidVoteAssumptionRangePct(),
      validVoteEstimate: exteriorValidVoteEstimate,
      validVoteEstimateRange: exteriorValidVoteRange,
      shareOfPendingValidEstimatePct:
        exteriorShare == null ? null : round(exteriorShare * 100, 2),
      shareOfPendingValidEstimateRangePct:
        exteriorShareRange == null
          ? null
          : [round(exteriorShareRange[0] * 100, 2), round(exteriorShareRange[1] * 100, 2)],
      adjustedPendingSanchezPct: exteriorAdjustedPending,
      adjustedPendingSanchezRangePct: exteriorAdjustedPendingRange,
      datumSanchezPct: getExteriorDatumSanchezPct(),
      datumKeikoPct: getExteriorDatumKeikoPct(),
      note:
        "La app publica solo el agregado exterior ONPE y no muestra países. El dato de preferencia Datum exterior queda como sensibilidad; el volumen de votos válidos exteriores sigue siendo una hipótesis con rango hasta que el exterior avance materialmente.",
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
        label: "ONPE — exterior agregado",
        url:
          exteriorOfficialResults?.sourceUrl ??
          flashElectoral.exterior?.officialOnpeExteriorResults.sourceUrl ??
          "",
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
