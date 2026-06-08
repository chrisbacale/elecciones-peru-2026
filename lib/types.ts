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

export type OnpeExteriorResumen = {
  status: OnpeStatus | "not_verified";
  timestamp: string;
  advancePct: number | null;
  actasContabilizadas: number | null;
  actasTotal: number | null;
  actasPendientes: number | null;
  candidates: {
    keiko: { votes: number | null; pct: number | null };
    sanchez: { votes: number | null; pct: number | null };
  };
  validVotes: number | null;
  marginPp: number | null;
  marginLeader: string | null;
  source: string | null;
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
    votesKeiko?: number | null;
    votesSanchez?: number | null;
    validVotes?: number | null;
    advancePct: number;
    actasContabilizadas?: number | null;
    actasTotal?: number | null;
    actasPendientes?: number | null;
    pendingPct?: number | null;
    validVotesPerActa?: number | null;
    estimatedPendingValidVotes?: number | null;
    projectedPendingKeikoVotes?: number | null;
    projectedPendingSanchezVotes?: number | null;
    projectedPendingNetKeikoVotes?: number | null;
    projectionMethod?: string;
  }>;
  message?: string;
};

export type CityForecastScenario = {
  final_keiko: number;
  final_roberto: number;
  margin_keiko_minus_roberto: number;
  keiko_pct: number;
  roberto_pct: number;
};

export type CityForecastAggregate = {
  scope_label: string;
  pending_actas: number;
  jee_actas: number;
  foreign_actas: number;
  estimated_valid_votes: number;
  keiko_votes: number;
  roberto_votes: number;
  margin_keiko_minus_roberto: number;
};

export type CityForecastPlaceRow = CityForecastAggregate & {
  department_or_continent: string;
  province_or_country?: string;
};

export type CityForecastDistrictRow = CityForecastPlaceRow & {
  scope: number;
  district_or_city: string;
  dep_ubigeo: string;
  prov_ubigeo: string;
  dist_ubigeo: string;
  total_actas: number;
  contabilizadas: number;
  unresolved_actas: number;
  valid_counted: number;
  valid_per_acta_used: number;
  current_keiko_votes_in_city: number;
  current_roberto_votes_in_city: number;
  current_candidate_sum_in_city: number;
  observed_roberto_share: number | null;
  city_roberto_share_used: number;
  city_keiko_share_used: number;
  share_source: string;
  city_weighted_keiko_votes: number;
  city_weighted_roberto_votes: number;
  city_weighted_margin_keiko_minus_roberto: number;
};

export type OnpeCityForecast = {
  status: OnpeStatus;
  source: string;
  cutPeru: string;
  cutUtc: string;
  unresolvedLeafCount: number;
  officialCurrent: {
    keiko: number;
    roberto: number;
    margin_keiko_minus_roberto: number;
  };
  scenarios: {
    city_weighted_current: CityForecastScenario;
    foreign_keiko_plus30_net_city_weighted_domestic: CityForecastScenario;
    foreign_50_50_city_weighted_domestic: CityForecastScenario;
  };
  aggregates: {
    peru: CityForecastAggregate;
    exteriorTotalOnly: CityForecastAggregate;
  };
  topDepartmentsPeru: CityForecastPlaceRow[];
  topProvincesPeru: CityForecastPlaceRow[];
  topDistrictsPeru: CityForecastDistrictRow[];
  method: string[];
  privacyNote: string;
  message?: string;
};

export type JeeResolutionComponent = {
  keiko: number;
  roberto: number;
  valid: number;
  actas: number;
  margin_keiko_minus_roberto: number;
};

export type JeeResolutionHistoricalRow = {
  year: number;
  totalActas: number;
  observedActas: number;
  annulledActas: number;
  onpeOperationalAnnulledActas?: number;
  sourceId: string;
  countedObservedActas: number;
  observedPctOfTotal: number;
  annulledPctOfTotal: number;
  annulledPctOfObserved: number;
  countedPctOfObserved: number;
};

export type JeeResolutionSummaryStats = {
  mean: number;
  median: number;
  p10: number;
  p90: number;
  p025: number;
  p975: number;
  modeledMarginOfError90: number;
  modeledMarginOfError95: number;
  probabilityKeikoLeads: number;
  probabilitySanchezLeads: number;
  probabilityWithin20000Votes: number;
};

export type JeeMonteCarlo = {
  iterations: number;
  seed: number;
  scenarioKey: string;
  finalMarginKeikoMinusSanchez: JeeResolutionSummaryStats;
  peruOnlyMarginKeikoMinusSanchez: JeeResolutionSummaryStats;
  jeeAdmissionRate: JeeResolutionSummaryStats;
  histogram: Array<{
    from: number;
    to: number;
    midpoint: number;
    count: number;
    pct: number;
    label: string;
  }>;
  uncertaintyModel: Record<string, string | number>;
};

export type JeeSensitivityRow = {
  jeeAdmissionRate: number;
  finalKeikoVotes: number;
  finalSanchezVotes: number;
  marginKeikoMinusSanchez: number;
  keikoPct: number;
  sanchezPct: number;
  jeeValidVotesCounted: number;
  jeeVotesNotCountedOrInvalidated: number;
};

export type JeeScenario = {
  label: string;
  description: string;
  sensitivityByJeeAdmissionRate: JeeSensitivityRow[];
  monteCarlo: JeeMonteCarlo;
};

export type JeeDepartmentRow = {
  department: string;
  currentLeader: string;
  currentKeikoVotes: number | null;
  currentSanchezVotes: number | null;
  currentGapKeikoMinusSanchez: number | null;
  actas: {
    total: number;
    counted: number;
    pendingOperational: number;
    sentToJee: number;
    unresolvedTotal: number;
    unresolvedPct: number;
  };
  estimates: {
    pendingOnlyValidVotes: number;
    pendingOnlyKeikoVotes: number;
    pendingOnlySanchezVotes: number;
    pendingOnlyGapKeikoMinusSanchez: number;
    jeeValidVotesAtRisk: number;
    expectedJeeCountedValidVotes: number;
    expectedJeeNotCountedValidVotes: number;
    expectedJeeCountedGapKeikoMinusSanchez: number;
    expectedJeeAnnulledActas: number;
    expectedJeeCountedActas: number;
  };
  projection: {
    keikoVotes: number | null;
    sanchezVotes: number | null;
    gapKeikoMinusSanchez: number | null;
    leader: string;
  };
};

export type JeeResolutionModel = {
  status: "snapshot" | "live";
  source: Record<string, string>;
  generatedAt: string;
  cutPeru: string;
  cutUtc: string;
  officialCurrent: {
    keikoVotes: number;
    sanchezVotes: number;
    marginKeikoMinusSanchez: number;
  };
  reconciliation: {
    rootTotals: Record<string, number | null>;
    rootMinusLeafTotals: Record<string, number>;
    note: string;
  };
  currentTerritorialSource: {
    status: string;
    timestamp: string;
    source: string;
  };
  historicalJeeResolution: {
    rows: JeeResolutionHistoricalRow[];
    pooled: {
      totalActas: number;
      observedActas: number;
      annulledActas: number;
      countedObservedActas: number;
      observedRate: number;
      annulledRateOfTotal: number;
      annulledRateOfObserved: number;
      countedRateOfObserved: number;
      betaPrior: Record<string, number>;
    };
  };
  currentUnresolved: {
    peru: {
      total_actas: number;
      contabilizadas: number;
      enviadas_jee_observadas: number;
      pendientes: number;
      unresolved_total: number;
      valid_votes_counted?: number;
      emitted_votes_counted?: number;
      pct_unresolved: number;
      pct_jee: number;
      pct_pending: number;
    };
    foreignAggregate: {
      total_actas: number;
      contabilizadas: number;
      enviadas_jee_observadas?: number;
      pendientes: number;
      unresolved_total: number;
      valid_votes_counted?: number;
      emitted_votes_counted?: number;
      pct_unresolved: number;
      pct_jee?: number;
      pct_pending?: number;
    };
    rootTotals: Record<string, number | null>;
    totals: Record<string, number>;
  };
  components: {
    pendingPeru: JeeResolutionComponent;
    foreignPendingAggregate: JeeResolutionComponent;
    jeeAtRisk: JeeResolutionComponent;
    expectedJeeResolution: {
      admissionRate: number;
      annulmentRate: number;
      expectedCountedActas: number;
      expectedAnnulledActas: number;
      expectedCountedValidVotes: number;
      expectedNotCountedValidVotes: number;
      expectedCountedKeikoVotes: number;
      expectedCountedSanchezVotes: number;
      expectedCountedMarginKeikoMinusSanchez: number;
    };
  };
  scenarios: {
    cityWeighted: JeeScenario;
    foreignKeikoPlus30: JeeScenario;
    foreign5050: JeeScenario;
  };
  departmentRows: JeeDepartmentRow[];
  sources: Array<{
    id: string;
    label: string;
    url: string;
    kind: string;
    note: string;
  }>;
  methodologyNotes: string[];
  privacyNote: string;
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
      a?: number | null;
      b?: number | null;
      validVotes?: number | null;
      advancePct?: number | null;
      actasPendientes?: number | null;
      marginPp?: number | null;
      marginLeader?: string | null;
      source: string;
      sourceUrl?: string | null;
      note: string;
    };
    assumptions: {
      turnoutPct: number;
      turnoutPctRange?: number[];
      validVotePct: number;
      validVotePctRange?: number[];
      note: string;
    };
  };
  movement: Array<{ stage: string; marginPp: number; leader: string }>;
};
