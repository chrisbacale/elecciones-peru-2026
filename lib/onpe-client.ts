import flash2026 from "@/data/2026/flash-electoral.json";
import electionsData from "@/data/historical/segunda-vuelta.json";
import type { ElectionRecord, OnpeResumen, OnpeTerritorial, OnpeStatus } from "./types";

export const ONPE_BASES = [
  "https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend",
  "https://resultadoelectoral.onpe.gob.pe/presentacion-backend",
] as const;

/** idEleccion probados para segunda vuelta presidencial 2026 (11 es el más probable). */
export const ONPE_ELECTION_IDS = [11, 10, 12] as const;

const KEIKO_NAMES = ["FUJIMORI", "KEIKO"];
const SANCHEZ_NAMES = ["SANCHEZ", "SÁNCHEZ", "ROBERTO"];

const DEPARTMENTS: Record<string, string> = {
  "010000": "Amazonas",
  "020000": "Áncash",
  "030000": "Apurímac",
  "040000": "Arequipa",
  "050000": "Ayacucho",
  "060000": "Cajamarca",
  "070000": "Callao",
  "080000": "Cusco",
  "090000": "Huancavelica",
  "100000": "Huánuco",
  "110000": "Ica",
  "120000": "Junín",
  "130000": "La Libertad",
  "140000": "Lambayeque",
  "150000": "Lima",
  "160000": "Loreto",
  "170000": "Madre de Dios",
  "180000": "Moquegua",
  "190000": "Pasco",
  "200000": "Piura",
  "210000": "Puno",
  "220000": "San Martín",
  "230000": "Tacna",
  "240000": "Tumbes",
  "250000": "Ucayali",
};

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
        "User-Agent": "RadarElectoralPeru/1.0",
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
  porcentajeVotos?: number;
};

type ActasData = {
  porcentajeActasContabilizadas?: number;
  totalActasContabilizadas?: number;
  totalActas?: number;
  totalVotosValidos?: number;
  totalVotosBlancos?: number;
  totalVotosNulos?: number;
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
    onpePartial?.timestamp ?? "2026-06-07T23:00:00-05:00";

  return {
    status: "snapshot",
    timestamp,
    advancePct: data?.advancePct ?? onpePartial?.advancePct ?? 76.966,
    actasProcesadas: 71398,
    actasTotal: 92766,
    candidates: {
      keiko: {
        votes: data?.votesA ?? onpePartial?.votesA ?? null,
        pct: data?.a ?? onpePartial?.a ?? 52.156,
      },
      sanchez: {
        votes: data?.votesB ?? onpePartial?.votesB ?? null,
        pct: data?.b ?? onpePartial?.b ?? 47.844,
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
    marginPp: data?.marginPp ?? onpePartial?.marginPp ?? 4.312,
    marginLeader: "Keiko Fujimori",
    source: "data/2026/flash-electoral.json",
    message:
      "API ONPE intermitente — mostrando último snapshot conocido (ONPE parcial 76.966%)",
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
        idAmbitoGeografico: 1,
        idEleccion: electionId,
        tipoFiltro: "ubigeo_nivel_00",
      });

      const votesUrl = buildUrl(
        base,
        "/eleccion-presidencial/participantes-ubicacion-geografica-nombre",
        {
          tipoFiltro: "ubigeo_nivel_00",
          idAmbitoGeografico: 1,
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

function extractCandidateVotes(
  votes: VoteRow[],
  patterns: string[]
): { votes: number; pct: number } {
  const row = votes.find((v) =>
    matchesCandidate(v.nombreCandidato ?? "", patterns)
  );
  return {
    votes: row?.votos ?? 0,
    pct: row?.porcentajeVotos ?? 0,
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
    timestamp: new Date().toISOString(),
    advancePct: result.actas?.porcentajeActasContabilizadas ?? 0,
    actasProcesadas: result.actas?.totalActasContabilizadas ?? null,
    actasTotal: result.actas?.totalActas ?? null,
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
    marginPp: Math.round(marginPp * 100) / 100,
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
        const keikoPct =
          keiko.pct || (total > 0 ? (keiko.votes / total) * 100 : 0);
        const sanchezPct =
          sanchez.pct || (total > 0 ? (sanchez.votes / total) * 100 : 0);

        const existing = departments.find((d) => d.code === code);
        if (!existing) {
          departments.push({
            code,
            name,
            keikoPct: Math.round(keikoPct * 10) / 10,
            sanchezPct: Math.round(sanchezPct * 10) / 10,
            leader: keikoPct >= sanchezPct ? "Keiko" : "Sánchez",
            advancePct:
              (actasJson as { data?: ActasData })?.data
                ?.porcentajeActasContabilizadas ?? 0,
          });
        }
        break;
      }
    }
    if (departments.length > 0) break;
  }

  return {
    status: anyLive && departments.length > 0 ? "live" : "snapshot",
    timestamp: new Date().toISOString(),
    departments: departments.sort((a, b) => a.name.localeCompare(b.name)),
    message:
      departments.length === 0
        ? "Sin datos territoriales en vivo — usar overlay Ipsos"
        : undefined,
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
