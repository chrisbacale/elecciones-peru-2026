import flash2026 from "@/data/2026/flash-electoral.json";
import territorialSnapshot from "@/data/2026/onpe-territorial-snapshot.json";
import electionsData from "@/data/historical/segunda-vuelta.json";
import type {
  ElectionRecord,
  OnpeExteriorResumen,
  OnpeResumen,
  OnpeTerritorial,
  OnpeStatus,
} from "./types";

export const ONPE_BASES = [
  "https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend",
] as const;

/** idEleccion vivo para Segunda Elección Presidencial 2026. */
export const ONPE_ELECTION_IDS = [10, 11, 12] as const;

const KEIKO_NAMES = ["FUJIMORI", "KEIKO"];
const SANCHEZ_NAMES = ["SANCHEZ", "SÁNCHEZ", "ROBERTO"];

const DEPARTMENTS: Record<string, string> = {
  "010000": "Amazonas",
  "020000": "Áncash",
  "030000": "Apurímac",
  "040000": "Arequipa",
  "050000": "Ayacucho",
  "060000": "Cajamarca",
  "240000": "Callao",
  "070000": "Cusco",
  "080000": "Huancavelica",
  "090000": "Huánuco",
  "100000": "Ica",
  "110000": "Junín",
  "120000": "La Libertad",
  "130000": "Lambayeque",
  "140000": "Lima",
  "150000": "Loreto",
  "160000": "Madre de Dios",
  "170000": "Moquegua",
  "180000": "Pasco",
  "190000": "Piura",
  "200000": "Puno",
  "210000": "San Martín",
  "220000": "Tacna",
  "230000": "Tumbes",
  "250000": "Ucayali",
};

const EXTERIOR_AMBITO_GEOGRAFICO_ID = 2;

let lastResolvedElectionId: number | null = null;
let lastResolvedBase: string | null = null;

export function getResolvedElectionId(): number | null {
  return lastResolvedElectionId;
}

export function getResolvedBase(): string | null {
  return lastResolvedBase;
}

function matchesCandidate(name: string, patterns: string[]): boolean {
  const upper = name.toUpperCase();
  return patterns.some((p) => upper.includes(p));
}

function isHtmlResponse(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return (
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<!") ||
    trimmed.includes("<html")
  );
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "es-PE,es;q=0.9,en;q=0.8",
        Origin: "https://resultadosegundavuelta.onpe.gob.pe",
        Referer: "https://resultadosegundavuelta.onpe.gob.pe/main/actas",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();

    if (!res.ok || !text) return null;
    if (contentType.includes("text/html") || isHtmlResponse(text)) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return null;
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { success?: boolean }).success === false
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function buildUrl(
  base: string,
  path: string,
  params: Record<string, string | number>
): string {
  const search = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  );
  return `${base}${path}?${search.toString()}`;
}

type VoteRow = {
  nombreCandidato?: string;
  votos?: number;
  totalVotosValidos?: number;
  porcentajeVotos?: number;
  porcentajeVotosValidos?: number;
};

type ActasData = {
  porcentajeActasContabilizadas?: number;
  actasContabilizadas?: number;
  totalActasContabilizadas?: number;
  contabilizadas?: number;
  totalActas?: number;
  totalVotosValidos?: number;
  totalVotosBlancos?: number;
  totalVotosNulos?: number;
  fechaActualizacion?: number;
  actasEnviadasJee?: number;
  enviadasJee?: number;
  actasPendientesJee?: number;
  pendientesJee?: number;
};

/** Snapshot documentado en data/2026/flash-electoral.json (fuente ONPE parcial). */
export function getKnownOnpeSnapshot(): OnpeResumen {
  const onpeSource = flash2026.sources.find((s) => s.id === "onpe-parcial");
  const election2026 = (electionsData as ElectionRecord[]).find(
    (e) => e.year === 2026
  );
  const onpePartial = election2026?.instruments.onpePartial;

  const data = onpeSource?.data;
  const timestamp =
    onpePartial?.timestamp ?? "2026-06-10T00:15:19-05:00";

  const keikoPct = data?.a ?? onpePartial?.a ?? 49.912;
  const sanchezPct = data?.b ?? onpePartial?.b ?? 50.088;

  return {
    status: "snapshot",
    timestamp,
    advancePct: data?.advancePct ?? onpePartial?.advancePct ?? 96.879,
    actasProcesadas:
      data?.actasProcesadas ?? onpePartial?.actasProcesadas ?? 89870,
    actasTotal: data?.actasTotal ?? onpePartial?.actasTotal ?? 92766,
    actasEnviadasJee: data?.actasJee ?? null,
    actasPendientesJee: data?.actasPendientes ?? null,
    actasEnviadasJeePct: data?.actasJeePct ?? null,
    actasPendientesJeePct: data?.actasPendientesPct ?? null,
    candidates: {
      keiko: {
        votes: data?.votesA ?? onpePartial?.votesA ?? null,
        pct: keikoPct,
      },
      sanchez: {
        votes: data?.votesB ?? onpePartial?.votesB ?? null,
        pct: sanchezPct,
      },
    },
    validVotes:
      data?.votesA != null && data?.votesB != null
        ? data.votesA + data.votesB
        : onpePartial?.votesA != null && onpePartial?.votesB != null
          ? onpePartial.votesA + onpePartial.votesB
          : null,
    blankVotes: null,
    nullVotes: null,
    marginPp: data?.marginPp ?? onpePartial?.marginPp ?? 0.173,
    marginLeader: keikoPct >= sanchezPct ? "Keiko Fujimori" : "Roberto Sánchez",
    source: "data/2026/flash-electoral.json",
    message:
      "API ONPE intermitente — mostrando último snapshot conocido",
  };
}

export function getKnownOnpeExteriorSnapshot(): OnpeExteriorResumen {
  const exterior = flash2026.exterior?.officialOnpeExteriorResults;
  const keikoPct = exterior?.a ?? null;
  const sanchezPct = exterior?.b ?? null;
  const status =
    exterior?.status === "live" ||
    exterior?.status === "snapshot" ||
    exterior?.status === "not_verified"
      ? exterior.status
      : "not_verified";
  return {
    status,
    timestamp: getKnownOnpeSnapshot().timestamp,
    advancePct: exterior?.advancePct ?? null,
    actasContabilizadas: exterior?.actasContabilizadas ?? null,
    actasTotal: exterior?.actasTotal ?? null,
    actasPendientes: exterior?.actasPendientes ?? null,
    candidates: {
      keiko: { votes: exterior?.votesA ?? null, pct: keikoPct },
      sanchez: { votes: exterior?.votesB ?? null, pct: sanchezPct },
    },
    validVotes: exterior?.validVotes ?? null,
    marginPp:
      exterior?.marginPp ??
      (keikoPct != null && sanchezPct != null ? Math.abs(keikoPct - sanchezPct) : null),
    marginLeader:
      exterior?.marginLeader === "b"
        ? "Roberto Sánchez"
        : exterior?.marginLeader === "a"
          ? "Keiko Fujimori"
          : null,
    source: exterior?.sourceUrl ?? null,
    message:
      exterior?.status === "not_verified"
        ? "Sin snapshot oficial exterior verificado"
        : "API ONPE exterior intermitente — mostrando snapshot exterior agregado",
  };
}

export function getKnownOnpeTerritorialSnapshot(): OnpeTerritorial {
  return {
    status: "snapshot",
    timestamp: territorialSnapshot.timestamp,
    departments: [...territorialSnapshot.departments].sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    message:
      "ONPE territorial intermitente — mostrando snapshot departamental auditado",
  };
}

async function tryFetchNational(): Promise<{
  votes: VoteRow[];
  actas: ActasData | null;
  source: string;
  electionId: number;
} | null> {
  const electionIds = lastResolvedElectionId
    ? [lastResolvedElectionId, ...ONPE_ELECTION_IDS.filter((id) => id !== lastResolvedElectionId)]
    : [...ONPE_ELECTION_IDS];

  for (const base of ONPE_BASES) {
    for (const electionId of electionIds) {
      const actasUrl = buildUrl(base, "/resumen-general/totales", {
        idEleccion: electionId,
        tipoFiltro: "eleccion",
      });

      const votesUrl = buildUrl(
        base,
        "/eleccion-presidencial/participantes-ubicacion-geografica-nombre",
        {
          tipoFiltro: "eleccion",
          idEleccion: electionId,
        }
      );

      const [actasJson, votesJson] = await Promise.all([
        fetchJson(actasUrl),
        fetchJson(votesUrl),
      ]);

      if (!votesJson) continue;

      const votesData = (votesJson as { data?: VoteRow[] }).data ?? [];
      const actasData = (actasJson as { data?: ActasData })?.data ?? null;

      const hasKeiko = votesData.some((v) =>
        matchesCandidate(v.nombreCandidato ?? "", KEIKO_NAMES)
      );
      const hasSanchez = votesData.some((v) =>
        matchesCandidate(v.nombreCandidato ?? "", SANCHEZ_NAMES)
      );

      if (hasKeiko && hasSanchez) {
        lastResolvedElectionId = electionId;
        lastResolvedBase = base;
        return { votes: votesData, actas: actasData, source: base, electionId };
      }
    }
  }

  return null;
}

async function tryFetchExterior(): Promise<{
  votes: VoteRow[];
  actas: ActasData | null;
  source: string;
  electionId: number;
} | null> {
  const electionIds = lastResolvedElectionId
    ? [lastResolvedElectionId, ...ONPE_ELECTION_IDS.filter((id) => id !== lastResolvedElectionId)]
    : [...ONPE_ELECTION_IDS];

  for (const base of ONPE_BASES) {
    for (const electionId of electionIds) {
      const actasUrl = buildUrl(base, "/resumen-general/totales", {
        idEleccion: electionId,
        tipoFiltro: "ambito_geografico",
        idAmbitoGeografico: EXTERIOR_AMBITO_GEOGRAFICO_ID,
      });

      const votesUrl = buildUrl(
        base,
        "/eleccion-presidencial/participantes-ubicacion-geografica-nombre",
        {
          tipoFiltro: "ambito_geografico",
          idEleccion: electionId,
          idAmbitoGeografico: EXTERIOR_AMBITO_GEOGRAFICO_ID,
        },
      );

      const [actasJson, votesJson] = await Promise.all([
        fetchJson(actasUrl),
        fetchJson(votesUrl),
      ]);

      if (!votesJson) continue;

      const votesData = (votesJson as { data?: VoteRow[] }).data ?? [];
      const actasData = (actasJson as { data?: ActasData })?.data ?? null;
      const hasKeiko = votesData.some((v) =>
        matchesCandidate(v.nombreCandidato ?? "", KEIKO_NAMES),
      );
      const hasSanchez = votesData.some((v) =>
        matchesCandidate(v.nombreCandidato ?? "", SANCHEZ_NAMES),
      );

      if (hasKeiko && hasSanchez) {
        lastResolvedElectionId = electionId;
        lastResolvedBase = base;
        return { votes: votesData, actas: actasData, source: base, electionId };
      }
    }
  }

  return null;
}

function extractCandidateVotes(
  votes: VoteRow[],
  patterns: string[]
): { votes: number; pct: number } {
  const row = votes.find((v) =>
    matchesCandidate(v.nombreCandidato ?? "", patterns)
  );
  return {
    votes: row?.totalVotosValidos ?? row?.votos ?? 0,
    pct: row?.porcentajeVotosValidos ?? row?.porcentajeVotos ?? 0,
  };
}

function getActasAdvance(actas: ActasData | null | undefined): number {
  const pct = actas?.porcentajeActasContabilizadas ?? actas?.actasContabilizadas;
  if (pct != null && pct <= 100) return pct;
  const counted = getActasContabilizadas(actas);
  const total = actas?.totalActas ?? null;
  if (counted != null && total != null && total > 0) {
    return Math.round((counted / total) * 1000) / 10;
  }
  return 0;
}

function getActasContabilizadas(actas: ActasData | null | undefined): number | null {
  return actas?.contabilizadas ?? actas?.totalActasContabilizadas ?? null;
}

function getActasTimestamp(actas: ActasData | null | undefined): string {
  return actas?.fechaActualizacion
    ? new Date(actas.fechaActualizacion).toISOString()
    : new Date().toISOString();
}

function estimatePendingVotesByActa(
  validVotes: number,
  actasContabilizadas: number | null,
  actasPendientes: number | null,
): {
  validVotesPerActa: number | null;
  estimatedPendingValidVotes: number | null;
} {
  if (
    actasContabilizadas == null ||
    actasPendientes == null ||
    actasContabilizadas <= 0 ||
    actasPendientes <= 0 ||
    validVotes <= 0
  ) {
    return {
      validVotesPerActa: null,
      estimatedPendingValidVotes: actasPendientes === 0 ? 0 : null,
    };
  }

  const validVotesPerActa = validVotes / actasContabilizadas;
  return {
    validVotesPerActa: Math.round(validVotesPerActa * 10) / 10,
    estimatedPendingValidVotes: Math.round(validVotesPerActa * actasPendientes),
  };
}

export async function fetchOnpeResumen(
  snapshot: Partial<OnpeResumen> = getKnownOnpeSnapshot()
): Promise<OnpeResumen> {
  const result = await tryFetchNational();

  if (!result) {
    return {
      ...getKnownOnpeSnapshot(),
      ...snapshot,
      status: "snapshot" as OnpeStatus,
      source: snapshot.source ?? "data/2026/flash-electoral.json",
      message:
        snapshot.message ??
        "API ONPE intermitente — mostrando último snapshot conocido",
    };
  }

  const keiko = extractCandidateVotes(result.votes, KEIKO_NAMES);
  const sanchez = extractCandidateVotes(result.votes, SANCHEZ_NAMES);
  const validVotes = keiko.votes + sanchez.votes;
  const keikoPct =
    keiko.pct || (validVotes > 0 ? (keiko.votes / validVotes) * 100 : 0);
  const sanchezPct =
    sanchez.pct || (validVotes > 0 ? (sanchez.votes / validVotes) * 100 : 0);
  const marginPp = Math.abs(keikoPct - sanchezPct);

  return {
    status: "live",
    timestamp: getActasTimestamp(result.actas),
    advancePct: getActasAdvance(result.actas),
    actasProcesadas: getActasContabilizadas(result.actas),
    actasTotal: result.actas?.totalActas ?? null,
    actasEnviadasJee: result.actas?.enviadasJee ?? null,
    actasPendientesJee: result.actas?.pendientesJee ?? null,
    actasEnviadasJeePct: result.actas?.actasEnviadasJee ?? null,
    actasPendientesJeePct: result.actas?.actasPendientesJee ?? null,
    candidates: {
      keiko: { votes: keiko.votes, pct: Math.round(keikoPct * 1000) / 1000 },
      sanchez: {
        votes: sanchez.votes,
        pct: Math.round(sanchezPct * 1000) / 1000,
      },
    },
    validVotes: result.actas?.totalVotosValidos ?? validVotes,
    blankVotes: result.actas?.totalVotosBlancos ?? null,
    nullVotes: result.actas?.totalVotosNulos ?? null,
    marginPp: Math.round(marginPp * 1000) / 1000,
    marginLeader: keikoPct >= sanchezPct ? "Keiko Fujimori" : "Roberto Sánchez",
    source: result.source,
  };
}

export async function fetchOnpeExterior(
  snapshot: Partial<OnpeExteriorResumen> = getKnownOnpeExteriorSnapshot(),
): Promise<OnpeExteriorResumen> {
  const result = await tryFetchExterior();

  if (!result) {
    return {
      ...getKnownOnpeExteriorSnapshot(),
      ...snapshot,
      status: snapshot.status ?? getKnownOnpeExteriorSnapshot().status,
      source: snapshot.source ?? getKnownOnpeExteriorSnapshot().source,
      message:
        snapshot.message ??
        "API ONPE exterior intermitente — mostrando snapshot exterior agregado",
    };
  }

  const keiko = extractCandidateVotes(result.votes, KEIKO_NAMES);
  const sanchez = extractCandidateVotes(result.votes, SANCHEZ_NAMES);
  const validVotes = keiko.votes + sanchez.votes;
  const keikoPct =
    keiko.pct || (validVotes > 0 ? (keiko.votes / validVotes) * 100 : 0);
  const sanchezPct =
    sanchez.pct || (validVotes > 0 ? (sanchez.votes / validVotes) * 100 : 0);
  const marginPp = Math.abs(keikoPct - sanchezPct);
  const actasContabilizadas = getActasContabilizadas(result.actas);
  const actasTotal = result.actas?.totalActas ?? null;

  return {
    status: "live",
    timestamp: getActasTimestamp(result.actas),
    advancePct: getActasAdvance(result.actas),
    actasContabilizadas,
    actasTotal,
    actasPendientes:
      actasTotal != null && actasContabilizadas != null
        ? Math.max(0, actasTotal - actasContabilizadas)
        : null,
    candidates: {
      keiko: {
        votes: keiko.votes,
        pct: Math.round(keikoPct * 1000) / 1000,
      },
      sanchez: {
        votes: sanchez.votes,
        pct: Math.round(sanchezPct * 1000) / 1000,
      },
    },
    validVotes: result.actas?.totalVotosValidos ?? validVotes,
    marginPp: Math.round(marginPp * 1000) / 1000,
    marginLeader: keikoPct >= sanchezPct ? "Keiko Fujimori" : "Roberto Sánchez",
    source: result.source,
  };
}

export async function fetchOnpeTerritorial(): Promise<OnpeTerritorial> {
  const departments: OnpeTerritorial["departments"] = [];
  let anyLive = false;

  const bases = lastResolvedBase ? [lastResolvedBase, ...ONPE_BASES.filter((b) => b !== lastResolvedBase)] : [...ONPE_BASES];
  const electionIds = lastResolvedElectionId
    ? [lastResolvedElectionId, ...ONPE_ELECTION_IDS.filter((id) => id !== lastResolvedElectionId)]
    : [...ONPE_ELECTION_IDS];

  for (const base of bases) {
    for (const [code, name] of Object.entries(DEPARTMENTS)) {
      for (const electionId of electionIds) {
        const votesUrl = buildUrl(
          base,
          "/eleccion-presidencial/participantes-ubicacion-geografica-nombre",
          {
            tipoFiltro: "ubigeo_nivel_01",
            idAmbitoGeografico: 1,
            ubigeoNivel1: code,
            idEleccion: electionId,
          }
        );

        const actasUrl = buildUrl(base, "/resumen-general/totales", {
          idAmbitoGeografico: 1,
          idEleccion: electionId,
          tipoFiltro: "ubigeo_nivel_01",
          idUbigeoDepartamento: code,
        });

        const [votesJson, actasJson] = await Promise.all([
          fetchJson(votesUrl),
          fetchJson(actasUrl),
        ]);

        if (!votesJson) continue;

        const votesData = (votesJson as { data?: VoteRow[] }).data ?? [];
        const hasKeiko = votesData.some((v) =>
          matchesCandidate(v.nombreCandidato ?? "", KEIKO_NAMES)
        );
        const hasSanchez = votesData.some((v) =>
          matchesCandidate(v.nombreCandidato ?? "", SANCHEZ_NAMES)
        );
        if (!hasKeiko || !hasSanchez) continue;

        anyLive = true;
        lastResolvedElectionId = electionId;
        lastResolvedBase = base;

        const keiko = extractCandidateVotes(votesData, KEIKO_NAMES);
        const sanchez = extractCandidateVotes(votesData, SANCHEZ_NAMES);
        const total = keiko.votes + sanchez.votes;
        const actasData = (actasJson as { data?: ActasData })?.data ?? null;
        const actasContabilizadas = getActasContabilizadas(actasData);
        const actasTotal = actasData?.totalActas ?? null;
        const actasPendientes =
          actasTotal != null && actasContabilizadas != null
            ? Math.max(0, actasTotal - actasContabilizadas)
            : null;
        const keikoPct =
          keiko.pct || (total > 0 ? (keiko.votes / total) * 100 : 0);
        const sanchezPct =
          sanchez.pct || (total > 0 ? (sanchez.votes / total) * 100 : 0);
        const { validVotesPerActa, estimatedPendingValidVotes } =
          estimatePendingVotesByActa(total, actasContabilizadas, actasPendientes);
        const projectedPendingKeikoVotes =
          estimatedPendingValidVotes == null
            ? null
            : Math.round(estimatedPendingValidVotes * (keikoPct / 100));
        const projectedPendingSanchezVotes =
          estimatedPendingValidVotes == null
            ? null
            : Math.round(estimatedPendingValidVotes * (sanchezPct / 100));

        const existing = departments.find((d) => d.code === code);
        if (!existing) {
          departments.push({
            code,
            name,
            keikoPct: Math.round(keikoPct * 10) / 10,
            sanchezPct: Math.round(sanchezPct * 10) / 10,
            leader: keikoPct >= sanchezPct ? "Keiko" : "Sánchez",
            votesKeiko: keiko.votes,
            votesSanchez: sanchez.votes,
            validVotes: total,
            advancePct: getActasAdvance(actasData),
            actasContabilizadas,
            actasTotal,
            actasPendientes,
            pendingPct:
              actasTotal != null && actasTotal > 0 && actasPendientes != null
                ? Math.round((actasPendientes / actasTotal) * 1000) / 10
                : null,
            validVotesPerActa,
            estimatedPendingValidVotes,
            projectedPendingKeikoVotes,
            projectedPendingSanchezVotes,
            projectedPendingNetKeikoVotes:
              projectedPendingKeikoVotes == null ||
              projectedPendingSanchezVotes == null
                ? null
                : projectedPendingKeikoVotes - projectedPendingSanchezVotes,
            projectionMethod:
              "votos válidos por acta contabilizada * actas pendientes * porcentaje local observado",
          });
        }
        break;
      }
    }
    if (departments.length > 0) break;
  }

  if (departments.length === 0) {
    return getKnownOnpeTerritorialSnapshot();
  }

  return {
    status: anyLive ? "live" : "snapshot",
    timestamp: new Date().toISOString(),
    departments: departments.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export type OnpeApiMeta = {
  electionIdsTried: readonly number[];
  resolvedElectionId: number | null;
  resolvedBase: string | null;
  basesTried: readonly string[];
  snapshotSource: string;
};

export function getOnpeApiMeta(): OnpeApiMeta {
  return {
    electionIdsTried: ONPE_ELECTION_IDS,
    resolvedElectionId: lastResolvedElectionId,
    resolvedBase: lastResolvedBase,
    basesTried: ONPE_BASES,
    snapshotSource: "data/2026/flash-electoral.json",
  };
}
