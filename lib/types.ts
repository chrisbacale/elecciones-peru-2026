export type CandidatePair = {
  a: number;
  b: number;
  labelA: string;
  labelB: string;
  marginPp?: number;
  marginLeader?: string;
  votesA?: number;
  votesB?: number;
  sampleSize?: number;
  marginOfError?: number;
  marginOfErrorNote?: string;
  methodologyNote?: string;
  confidence?: number;
  source?: string;
  sourceUrl?: string;
  sourceQuality?: "primary" | "secondary" | "official" | "snapshot";
  sampleSizeValid?: number;
  sampleSizeNote?: string;
  sampleSizeVerified?: boolean;
  rawEmittedA?: number;
  rawEmittedB?: number;
  blank?: number;
  nullPct?: number;
  fieldwork?: string;
  validVoteDerived?: boolean;
  timestamp?: string;
  advancePct?: number;
  actasProcesadas?: number;
  actasTotal?: number;
  actasJee?: number;
  actasPendientes?: number;
  actasJeePct?: number;
  actasPendientesPct?: number;
  actasNote?: string;
  derivedActas?: boolean;
};

export type InstrumentResult = {
  ipsos?: CandidatePair;
  datum?: CandidatePair;
};

export type ElectionRecord = {
  year: number;
  date: string;
  candidates: {
    a: string;
    b: string;
    partyA: string;
    partyB: string;
    winner?: string;
  };
  instruments: {
    simulacro?: CandidatePair & { source: string };
    simulacroPorEncuestadora?: InstrumentResult;
    bocaUrna: InstrumentResult;
    conteoRapido: InstrumentResult;
    onpe100: (CandidatePair & {
      votesA: number;
      votesB: number;
      marginPp: number;
      exact?: boolean;
      /** ONPE al 1 decimal según tabla Ipsos Comparativo CR+ONPE (baseline de error) */
      ipsosBaseline?: { a: number; b: number };
    }) | null;
    onpePartial?: CandidatePair & {
      advancePct: number;
      timestamp: string;
    };
  };
  participation?: { rate: number; blank: number; null: number; source?: string };
  territorial?: Record<string, { a: number; b: number; leader: string }>;
  metadata: { sources: string[]; notes: string[] };
};

export type ErrorMetrics = {
  bocaUrna: {
    candidateError: { mean: number; median: number; max: number };
    marginError: { mean: number; median: number; max: number };
    byYear: Array<{
      year: number;
      candidateErrorA: number;
      candidateErrorB: number;
      marginError: number;
    }>;
  };
  conteoRapido: {
    candidateError: { mean: number; median: number; max: number };
    marginError: { mean: number; median: number; max: number };
    byYear: Array<{
      year: number;
      candidateErrorA: number;
      candidateErrorB: number;
      marginError: number;
    }>;
  };
};

export type OnpeStatus = "live" | "intermittent" | "snapshot";

export type OnpeResumen = {
  status: OnpeStatus;
  timestamp: string;
  advancePct: number;
  actasProcesadas: number | null;
  actasTotal: number | null;
  actasEnviadasJee?: number | null;
  actasPendientesJee?: number | null;
  actasEnviadasJeePct?: number | null;
  actasPendientesJeePct?: number | null;
  candidates: {
    keiko: { votes: number | null; pct: number };
    sanchez: { votes: number | null; pct: number };
  };
  validVotes: number | null;
  blankVotes: number | null;
  nullVotes: number | null;
  marginPp: number;
  marginLeader: string;
  source: string;
  message?: string;
};

export type OnpeTerritorial = {
  status: OnpeStatus;
  timestamp: string;
  departments: Array<{
    code: string;
    name: string;
    keikoPct: number;
    sanchezPct: number;
    leader: string;
    advancePct: number;
  }>;
  message?: string;
};

export type FlashElectoral2026 = {
  candidates: { a: string; b: string; partyA: string; partyB: string };
  sources: Array<{
    id: string;
    name: string;
    type: "oficial" | "encuesta" | "muestra";
    instrument: string;
    data: CandidatePair;
    url?: string;
    publishedAt?: string;
    notes?: string;
  }>;
  simulacros: Array<{
    pollster: string;
    date: string;
    dateEnd?: string;
    data: CandidatePair;
    marginOfError?: number;
    url?: string;
  }>;
  participation: {
    rate: number;
    blank: number;
    null: number;
    marginOfError?: number;
    source?: string;
    url?: string;
  };
  territorial: {
    ipsos: Record<string, { a: number; b: number; leader: string }>;
    datum?: Record<string, { a: number; b: number; leader: string }>;
  };
  exterior?: {
    officialRosterElectionDay: {
      eligibleVoters: number;
      mesas: number;
      locals: number;
      cities: number;
      source: string;
      sourceUrl: string;
      sourceQuality: "official" | "primary" | "secondary";
    };
    officialRosterPreDeployment?: {
      eligibleVoters: number;
      mesas: number;
      locals: number;
      cities: number;
      source: string;
      sourceUrl: string;
      sourceQuality: "official" | "primary" | "secondary";
    };
    datumExitPoll?: CandidatePair & {
      instrument: string;
      authority: boolean;
      source: string;
      sourceUrl: string;
      sourceQuality: "primary" | "secondary";
    };
    datumQuickCount: CandidatePair & {
      instrument: string;
      authority: boolean;
      source: string;
      sourceUrl: string;
      sourceQuality: "primary" | "secondary";
    };
    officialOnpeExteriorResults: {
      status: "not_verified" | "live" | "snapshot";
      actasTotal: number | null;
      actasContabilizadas: number | null;
      votesA: number | null;
      votesB: number | null;
      source: string;
      note: string;
    };
    assumptions: {
      turnoutPct: number;
      validVotePct: number;
      note: string;
    };
  };
  movement: Array<{ stage: string; marginPp: number; leader: string }>;
};
