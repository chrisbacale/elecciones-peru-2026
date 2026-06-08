import { flashElectoral } from "./data";
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
  requirements: RequirementRow[];
  scenarios: ScenarioRow[];
  eta: {
    ppPerHour: number | null;
    etaIso: string | null;
    note: string;
  };
  exterior: {
    eligibleVoters: number;
    mesas: number;
    locals: number;
    cities: number;
    actasTotal: number;
    actasContabilizadas: number;
    pendingPct: number;
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
];

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
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
      note: "No hay suficientes cortes para estimar velocidad de cómputo.",
    };
  }

  const sorted = [...cuts].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const previous = sorted.at(-2)!;
  const latest = sorted.at(-1)!;
  const elapsedHours =
    (new Date(latest.timestamp).getTime() -
      new Date(previous.timestamp).getTime()) /
    3_600_000;
  const ppAdvanced = latest.advancePct - previous.advancePct;

  if (elapsedHours <= 0 || ppAdvanced <= 0) {
    return {
      ppPerHour: null,
      etaIso: null,
      note: "La velocidad no es estimable porque el último corte no avanzó de forma monotónica.",
    };
  }

  const ppPerHour = ppAdvanced / elapsedHours;
  const hoursRemaining = (100 - latest.advancePct) / ppPerHour;
  const etaIso = new Date(
    new Date(latest.timestamp).getTime() + hoursRemaining * 3_600_000,
  ).toISOString();

  return {
    ppPerHour: round(ppPerHour, 2),
    etaIso,
    note:
      "ETA mecánica a 100% si se mantiene la velocidad entre los dos últimos cortes. No estima proclamación JNE ni resolución de actas observadas.",
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
  const datumExterior =
    flashElectoral.territorial.datum?.extranjero?.b ?? 37.33;
  const ipsosRegiones =
    flashElectoral.territorial.ipsos.regiones_cr?.b ?? 57.4;
  const ipsosRural = flashElectoral.territorial.ipsos.rural?.b ?? 67.8;

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
      "rural-stress",
      "Stress rural Ipsos",
      ipsosRural,
      onpe,
      "Stress de reversión: si todo el bloque no contabilizado se comportara como rural Ipsos, favorece a Sánchez. No es distribución real.",
    ),
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

function getStatus(scenarios: ScenarioRow[]): {
  status: ProjectionStatus;
  label: string;
  headline: string;
} {
  const hasKeiko = scenarios.some((scenario) => scenario.leader === "Keiko");
  const hasSanchez = scenarios.some((scenario) => scenario.leader === "Sanchez");

  if (hasKeiko && hasSanchez) {
    return {
      status: "alta_incertidumbre",
      label: "Alta incertidumbre",
      headline: "No proyectar ganador: lo no contabilizado todavía puede cambiar el liderazgo.",
    };
  }

  return {
    status: "ventaja_preliminar",
    label: "Ventaja preliminar",
    headline:
      "Un solo bloque de escenarios conserva el liderazgo, pero la proclamación oficial corresponde a ONPE/JNE.",
  };
}

export function buildPredictionSnapshot(onpeInput?: OnpeResumen): PredictionSnapshot {
  const onpe = onpeInput ?? getFallbackOnpe();
  const requirements = buildRequirementRows(onpe);
  const scenarios = buildScenarios(onpe, requirements);
  const status = getStatus(scenarios);
  const latestCut = { advancePct: onpe.advancePct, timestamp: onpe.timestamp };
  const eta = estimateCompletionEta([...HISTORICAL_CUTS, latestCut]);
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
    requirements,
    scenarios,
    eta,
    exterior: {
      eligibleVoters: 1_194_172,
      mesas: 2_506,
      locals: 219,
      cities: 206,
      actasTotal: 2_543,
      actasContabilizadas: 0,
      pendingPct: 100,
      datumSanchezPct: flashElectoral.territorial.datum?.extranjero?.b ?? 37.33,
      datumKeikoPct: flashElectoral.territorial.datum?.extranjero?.a ?? 62.67,
      note:
        "ONPE reporta 0/2,543 actas exteriores contabilizadas en el corte nacional verificado. El dato de preferencia exterior proviene del conteo rápido Datum, no de ONPE final.",
    },
    caveats: [
      "ONPE parcial es oficial, pero no es una muestra aleatoria: el orden de llegada de actas puede sesgar el porcentaje nacional.",
      "Los conteos rápidos Ipsos/Datum son estimaciones con margen de error; ambos se reportan como empate técnico.",
      "La app separa cómputo ONPE a 100% de proclamación JNE; las actas enviadas al JEE pueden cambiar después de la contabilización operativa.",
      "Sin distribución completa de actas pendientes por distrito/ciudad, no se publica una probabilidad de liderazgo como si fuera definitiva.",
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
        label: "ONPE/gob.pe — padrón y voto exterior",
        url: "https://www.gob.pe/institucion/onpe/noticias/1402698-onpe-mas-de-27-millones-de-peruanos-estan-llamados-a-participar-en-la-segunda-eleccion-presidencial",
      },
    ],
  };
}

export function getSourceMarginOfError(source: CandidatePair): string {
  if (source.marginOfError == null) return "No publicado";
  return `±${round(source.marginOfError, 2)} pp`;
}
