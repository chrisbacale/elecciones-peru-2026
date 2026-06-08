import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ANALYSIS_DIR = "C:/Users/USER/onpe-rla-analysis";
const PUBLIC_DATA_DIR = path.join(ROOT, "data", "2026");
const CITY_SOURCE = path.join(
  ANALYSIS_DIR,
  "output",
  "sep2026_city_level_forecast.json",
);
const JEE_AUDIT_SOURCE = path.join(
  ANALYSIS_DIR,
  "output",
  "sep2026_pending_jee_audit.json",
);
const JEE_SENSITIVITY_SOURCE = path.join(
  ANALYSIS_DIR,
  "output",
  "sep2026_jee_sensitivity.json",
);
const TERRITORIAL_FALLBACK = path.join(
  PUBLIC_DATA_DIR,
  "onpe-territorial-snapshot.json",
);
const TERRITORIAL_LIVE_URL =
  process.env.TERRITORIAL_LIVE_URL ??
  "https://elecciones-peru-2026-liart.vercel.app/api/onpe/territorial";
const PUBLIC_SOURCE_LABELS = {
  cityForecast: "onpe-rla-analysis/output/sep2026_city_level_forecast.json",
  jeeAudit: "onpe-rla-analysis/output/sep2026_pending_jee_audit.json",
  jeeSensitivity: "onpe-rla-analysis/output/sep2026_jee_sensitivity.json",
};

const HISTORICAL_JEE_ROWS = [
  {
    year: 2011,
    totalActas: 107449,
    observedActas: 4575,
    annulledActas: 607,
    sourceId: "jne-dnef-perfil-2021",
  },
  {
    year: 2016,
    totalActas: 77307,
    observedActas: 1637,
    annulledActas: 300,
    sourceId: "jne-dnef-perfil-2021",
  },
  {
    year: 2021,
    totalActas: 86488,
    observedActas: 1619,
    annulledActas: 222,
    onpeOperationalAnnulledActas: 214,
    sourceId: "jne-dnef-perfil-2021",
  },
];

const SOURCES = [
  {
    id: "onpe-current-2026",
    label: "ONPE resultados oficiales 2026",
    url: "https://resultadosegundavuelta.onpe.gob.pe/main/resumen",
    kind: "official-live",
    note: "Fuente de actas contabilizadas, pendientes y enviadas al JEE en el corte auditado.",
  },
  {
    id: "jne-dnef-perfil-2021",
    label: "JNE/DNEF Perfil Electoral EG 2021 - segunda vuelta",
    url: "https://dne.jne.gob.pe/DnefDocumentos/documentos/investigacion/perfil-electoral/Perfil%20Electoral%2013%20-%20EG2021_An%C3%A1lisis%20de%20resultados_Segunda%20vuelta.pdf",
    kind: "official-historical",
    note: "Tablas historicas de actas observadas y anuladas para segundas vueltas 2011, 2016 y 2021 con resultados ONPE al 100%.",
  },
  {
    id: "onpe-poe-2021",
    label: "ONPE Informe de Evaluacion POE EG/SEP 2021",
    url: "https://www.onpe.gob.pe/modTransparencia/downloads/2022/EVA-POE-EG-SEP-2021.pdf",
    kind: "official-reconciliation",
    note: "Reconciliacion 2021: ONPE reporta 214 actas anuladas y 6 mesas no instaladas al cierre operativo.",
  },
  {
    id: "onpe-actas-observadas-2016",
    label: "ONPE: actas observadas remitidas a JEE",
    url: "https://www.gob.pe/institucion/onpe/noticias/537566-oficinas-descentralizadas-de-la-onpe-en-todo-el-pais-envian-actas-observadas-a-los-jurados-electorales-especiales",
    kind: "official-methodology",
    note: "Describe que las actas observadas pasan al JEE por error material, ilegibilidad, votos impugnados, falta de firmas u otras observaciones.",
  },
  {
    id: "onpe-reglamento-actas",
    label: "ONPE reglamento para tratamiento de actas electorales",
    url: "https://www.gob.pe/institucion/onpe/noticias/538890-onpe-aprueba-reglamento-para-el-tratamiento-de-las-actas-electorales",
    kind: "official-methodology",
    note: "Define acta observada como acta que no puede ser contabilizada en el centro de computo por errores o informacion incompleta/ilegible.",
  },
];

const METHOD_NOTES = [
  "El resultado oficial actual se mantiene fijo y se separa de tres componentes aun no cerrados: pendientes Peru, exterior agregado y actas JEE.",
  "Las actas JEE se tratan como votos legalmente en riesgo: no son votos garantizados ni anulados de antemano.",
  "El prior historico usa segundas vueltas 2011, 2016 y 2021: anuladas / observadas = probabilidad base de que un acta observada no termine contando.",
  "Por departamento, los votos dentro de actas JEE se estiman por patron territorial/distrital; no son los votos reales de esas actas observadas.",
  "El exterior se mantiene solo como agregado total; este dataset publico no expone paises ni ciudades del voto extranjero.",
  "La simulacion Monte Carlo mide incertidumbre estadistica del modelo; no es proclamacion oficial ni reemplaza resoluciones JEE/JNE.",
];

function round(value, decimals = 1) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

function cleanNumber(value) {
  if (!Number.isFinite(value)) return null;
  if (Math.abs(value) < 0.000001) return 0;
  if (Math.abs(value) >= 100) return round(value, 1);
  return round(value, 6);
}

function cleanForPublic(value) {
  if (Array.isArray(value)) return value.map(cleanForPublic);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, cleanForPublic(child)]),
    );
  }
  return typeof value === "number" ? cleanNumber(value) : value;
}

function ratioPct(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .trim();
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function loadTerritorial() {
  try {
    const res = await fetch(TERRITORIAL_LIVE_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.departments) && data.departments.length >= 20) {
        return {
          ...data,
          source: TERRITORIAL_LIVE_URL,
          status: data.status ?? "live",
        };
      }
    }
  } catch {
    // Fall through to the committed fallback.
  }

  const fallback = await readJson(TERRITORIAL_FALLBACK);
  return {
    ...fallback,
    source: "data/2026/onpe-territorial-snapshot.json",
    status: "snapshot",
  };
}

function compactCityForecast(raw) {
  const peruScope = raw.by_scope_city_weighted.find(
    (row) => row.scope_label === "PERU",
  );
  const exteriorScope = raw.by_scope_city_weighted.find(
    (row) => row.scope_label === "EXTRANJERO",
  );

  return {
    status: "snapshot",
    source: PUBLIC_SOURCE_LABELS.cityForecast,
    cutPeru: raw.cut_peru,
    cutUtc: raw.cut_utc,
    unresolvedLeafCount: raw.unresolved_leaf_count,
    officialCurrent: raw.official_current,
    scenarios: raw.scenarios,
    aggregates: {
      peru: peruScope,
      exteriorTotalOnly: exteriorScope,
    },
    topDepartmentsPeru: raw.top_departments_city_weighted
      .filter((row) => row.scope_label === "PERU")
      .slice(0, 18),
    topProvincesPeru: raw.top_provinces_city_weighted
      .filter((row) => row.scope_label === "PERU")
      .slice(0, 24),
    topDistrictsPeru: raw.top_leaf_city_weighted
      .filter((row) => row.scope_label === "PERU")
      .slice(0, 24),
    method: raw.method,
    privacyNote:
      "El exterior se muestra solo como agregado; no se publican paises ni ciudades del extranjero en este snapshot compacto.",
  };
}

function buildHistoricalModel() {
  const rows = HISTORICAL_JEE_ROWS.map((row) => {
    const countedObservedActas = row.observedActas - row.annulledActas;
    return {
      ...row,
      countedObservedActas,
      observedPctOfTotal: ratioPct(row.observedActas, row.totalActas),
      annulledPctOfTotal: ratioPct(row.annulledActas, row.totalActas),
      annulledPctOfObserved: ratioPct(row.annulledActas, row.observedActas),
      countedPctOfObserved: ratioPct(countedObservedActas, row.observedActas),
    };
  });

  const pooled = rows.reduce(
    (acc, row) => {
      acc.totalActas += row.totalActas;
      acc.observedActas += row.observedActas;
      acc.annulledActas += row.annulledActas;
      acc.countedObservedActas += row.countedObservedActas;
      return acc;
    },
    {
      totalActas: 0,
      observedActas: 0,
      annulledActas: 0,
      countedObservedActas: 0,
    },
  );

  pooled.observedRate = ratioPct(pooled.observedActas, pooled.totalActas);
  pooled.annulledRateOfTotal = ratioPct(pooled.annulledActas, pooled.totalActas);
  pooled.annulledRateOfObserved = ratioPct(
    pooled.annulledActas,
    pooled.observedActas,
  );
  pooled.countedRateOfObserved = ratioPct(
    pooled.countedObservedActas,
    pooled.observedActas,
  );
  pooled.betaPrior = {
    annulledAlpha: pooled.annulledActas + 1,
    annulledBeta: pooled.countedObservedActas + 1,
    countedAlpha: pooled.countedObservedActas + 1,
    countedBeta: pooled.annulledActas + 1,
  };

  return { rows, pooled };
}

function byName(rows, nameField) {
  return new Map(rows.map((row) => [normalizeName(row[nameField]), row]));
}

function buildDepartmentRows({
  audit,
  city,
  sensitivity,
  territorial,
  historical,
}) {
  const currentMap = new Map(
    territorial.departments.map((row) => [normalizeName(row.name), row]),
  );
  const cityMap = byName(
    city.top_departments_city_weighted.filter((row) => row.scope_label === "PERU"),
    "department_or_continent",
  );
  const jeeRiskMap = byName(
    sensitivity.scenarios.city_weighted.top_jee_risk_departments.filter(
      (row) => row.scope_label === "PERU",
    ),
    "department_or_continent",
  );

  const admissionRate = historical.pooled.countedRateOfObserved;
  const annulmentRate = historical.pooled.annulledRateOfObserved;

  return audit.top_departments
    .filter((row) => row.scope_label === "PERU")
    .map((auditRow) => {
      const key = normalizeName(auditRow.department_or_continent);
      const current = currentMap.get(key);
      const cityRow = cityMap.get(key);
      const jeeRisk = jeeRiskMap.get(key);

      const currentKeikoVotes = current?.votesKeiko ?? null;
      const currentSanchezVotes = current?.votesSanchez ?? null;
      const currentGap =
        currentKeikoVotes != null && currentSanchezVotes != null
          ? currentKeikoVotes - currentSanchezVotes
          : null;

      const totalEstimatedKeiko = cityRow?.keiko_votes ?? 0;
      const totalEstimatedSanchez = cityRow?.roberto_votes ?? 0;
      const totalEstimatedValid = cityRow?.estimated_valid_votes ?? 0;
      const jeeAtRiskKeiko = jeeRisk?.keiko_votes_at_risk ?? 0;
      const jeeAtRiskSanchez = jeeRisk?.roberto_votes_at_risk ?? 0;
      const jeeAtRiskValid = jeeRisk?.valid_votes_at_risk ?? 0;
      const pendingOnlyKeiko = Math.max(0, totalEstimatedKeiko - jeeAtRiskKeiko);
      const pendingOnlySanchez = Math.max(
        0,
        totalEstimatedSanchez - jeeAtRiskSanchez,
      );
      const pendingOnlyValid = Math.max(0, totalEstimatedValid - jeeAtRiskValid);
      const expectedJeeCountedKeiko = jeeAtRiskKeiko * admissionRate;
      const expectedJeeCountedSanchez = jeeAtRiskSanchez * admissionRate;
      const expectedJeeCountedValid = jeeAtRiskValid * admissionRate;
      const expectedJeeNotCountedValid = jeeAtRiskValid * annulmentRate;

      const projectedKeiko =
        currentKeikoVotes == null
          ? null
          : currentKeikoVotes + pendingOnlyKeiko + expectedJeeCountedKeiko;
      const projectedSanchez =
        currentSanchezVotes == null
          ? null
          : currentSanchezVotes + pendingOnlySanchez + expectedJeeCountedSanchez;
      const projectedGap =
        projectedKeiko != null && projectedSanchez != null
          ? projectedKeiko - projectedSanchez
          : null;

      return {
        department: auditRow.department_or_continent,
        currentLeader:
          currentGap == null ? "Sin datos" : currentGap >= 0 ? "Keiko" : "Sanchez",
        currentKeikoVotes,
        currentSanchezVotes,
        currentGapKeikoMinusSanchez: currentGap,
        actas: {
          total: auditRow.total_actas,
          counted: auditRow.contabilizadas,
          pendingOperational: auditRow.pendientes,
          sentToJee: auditRow.enviadas_jee_observadas,
          unresolvedTotal: auditRow.unresolved_total,
          unresolvedPct: auditRow.pct_unresolved,
        },
        estimates: {
          pendingOnlyValidVotes: pendingOnlyValid,
          pendingOnlyKeikoVotes: pendingOnlyKeiko,
          pendingOnlySanchezVotes: pendingOnlySanchez,
          pendingOnlyGapKeikoMinusSanchez:
            pendingOnlyKeiko - pendingOnlySanchez,
          jeeValidVotesAtRisk: jeeAtRiskValid,
          jeeKeikoVotesAtRisk: jeeAtRiskKeiko,
          jeeSanchezVotesAtRisk: jeeAtRiskSanchez,
          expectedJeeCountedValidVotes: expectedJeeCountedValid,
          expectedJeeNotCountedValidVotes: expectedJeeNotCountedValid,
          expectedJeeCountedKeikoVotes: expectedJeeCountedKeiko,
          expectedJeeCountedSanchezVotes: expectedJeeCountedSanchez,
          expectedJeeCountedGapKeikoMinusSanchez:
            expectedJeeCountedKeiko - expectedJeeCountedSanchez,
          expectedJeeAnnulledActas:
            auditRow.enviadas_jee_observadas * annulmentRate,
          expectedJeeCountedActas:
            auditRow.enviadas_jee_observadas * admissionRate,
        },
        projection: {
          keikoVotes: projectedKeiko,
          sanchezVotes: projectedSanchez,
          gapKeikoMinusSanchez: projectedGap,
          leader:
            projectedGap == null
              ? "Sin datos"
              : projectedGap >= 0
                ? "Keiko"
                : "Sanchez",
        },
      };
    })
    .sort((a, b) => {
      const aImpact = Math.abs(a.estimates.pendingOnlyGapKeikoMinusSanchez) +
        Math.abs(a.estimates.expectedJeeCountedGapKeikoMinusSanchez);
      const bImpact = Math.abs(b.estimates.pendingOnlyGapKeikoMinusSanchez) +
        Math.abs(b.estimates.expectedJeeCountedGapKeikoMinusSanchez);
      return bImpact - aImpact;
    });
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(random) {
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function gamma(random, shape) {
  if (shape < 1) {
    const u = random();
    return gamma(random, shape + 1) * u ** (1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x;
    let v;
    do {
      x = normal(random);
      v = 1 + c * x;
    } while (v <= 0);
    v = v ** 3;
    const u = random();
    if (u < 1 - 0.0331 * x ** 4) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function beta(random, alpha, betaValue) {
  const x = gamma(random, alpha);
  const y = gamma(random, betaValue);
  return x / (x + y);
}

function quantile(sorted, p) {
  if (sorted.length === 0) return null;
  const index = (sorted.length - 1) * p;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo);
}

function summarizeMargins(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const p10 = quantile(sorted, 0.1);
  const p90 = quantile(sorted, 0.9);
  const p025 = quantile(sorted, 0.025);
  const p975 = quantile(sorted, 0.975);
  const keiko = values.filter((value) => value > 0).length / values.length;
  const sanchez = values.filter((value) => value < 0).length / values.length;
  const nearTie = values.filter((value) => Math.abs(value) <= 20000).length /
    values.length;

  return {
    mean,
    median: quantile(sorted, 0.5),
    p10,
    p90,
    p025,
    p975,
    modeledMarginOfError90: (p90 - p10) / 2,
    modeledMarginOfError95: (p975 - p025) / 2,
    probabilityKeikoLeads: keiko,
    probabilitySanchezLeads: sanchez,
    probabilityWithin20000Votes: nearTie,
  };
}

function buildHistogram(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binCount = 41;
  const width = (max - min) / binCount || 1;
  const bins = Array.from({ length: binCount }, (_, index) => {
    const from = min + width * index;
    const to = from + width;
    return {
      from,
      to,
      midpoint: from + width / 2,
      count: 0,
      pct: 0,
    };
  });

  for (const value of values) {
    const index = Math.min(binCount - 1, Math.floor((value - min) / width));
    bins[index].count += 1;
  }

  return bins.map((bin) => ({
    ...bin,
    pct: bin.count / values.length,
    label: `${Math.round(bin.from / 1000)}k a ${Math.round(bin.to / 1000)}k`,
  }));
}

function sampleShare(random, share, concentration) {
  const safeShare = Math.min(0.995, Math.max(0.005, share));
  return beta(
    random,
    1 + safeShare * concentration,
    1 + (1 - safeShare) * concentration,
  );
}

function runMonteCarlo({ sensitivity, historical, scenarioKey, seed }) {
  const scenario = sensitivity.scenarios[scenarioKey];
  const random = mulberry32(seed);
  const iterations = 20000;
  const finalMargins = [];
  const peruOnlyMargins = [];
  const jeeAdmissionRates = [];

  for (let i = 0; i < iterations; i += 1) {
    const pending = scenario.components.pending_peru;
    const foreign = scenario.components.foreign_pending;
    const jee = scenario.components.jee_at_risk;
    const pendingShare = sampleShare(random, pending.keiko / pending.valid, 900);
    const foreignShare = sampleShare(random, foreign.keiko / foreign.valid, 360);
    const jeeShare = sampleShare(random, jee.keiko / jee.valid, 520);
    const annulRate = beta(
      random,
      historical.pooled.betaPrior.annulledAlpha,
      historical.pooled.betaPrior.annulledBeta,
    );
    const admissionRate = 1 - annulRate;
    const pendingMargin = pending.valid * (2 * pendingShare - 1);
    const foreignMargin = foreign.valid * (2 * foreignShare - 1);
    const jeeMargin = jee.valid * admissionRate * (2 * jeeShare - 1);
    const peruOnlyMargin =
      sensitivity.official_current.margin_keiko_minus_roberto +
      pendingMargin +
      jeeMargin;
    const finalMargin = peruOnlyMargin + foreignMargin;

    peruOnlyMargins.push(peruOnlyMargin);
    finalMargins.push(finalMargin);
    jeeAdmissionRates.push(admissionRate);
  }

  return {
    iterations,
    seed,
    scenarioKey,
    finalMarginKeikoMinusSanchez: summarizeMargins(finalMargins),
    peruOnlyMarginKeikoMinusSanchez: summarizeMargins(peruOnlyMargins),
    jeeAdmissionRate: summarizeMargins(jeeAdmissionRates),
    histogram: buildHistogram(finalMargins),
    uncertaintyModel: {
      pendingPeruShareConcentration: 900,
      foreignShareConcentration: 360,
      jeeShareConcentration: 520,
      jeeLegalResolutionPrior: "Beta(anuladas+1, contabilizadas+1)",
    },
  };
}

function mapSensitivityRows(rows) {
  return rows.map((row) => ({
    jeeAdmissionRate: row.jee_admission_rate,
    finalKeikoVotes: row.final_keiko,
    finalSanchezVotes: row.final_roberto,
    marginKeikoMinusSanchez: row.margin_keiko_minus_roberto,
    keikoPct: row.keiko_pct,
    sanchezPct: row.roberto_pct,
    jeeValidVotesCounted: row.jee_valid_votes_counted,
    jeeVotesNotCountedOrInvalidated: row.jee_votes_not_counted_or_invalidated,
  }));
}

function buildJeeModel({ audit, city, sensitivity, territorial }) {
  const historical = buildHistoricalModel();
  const admissionRate = historical.pooled.countedRateOfObserved;
  const annulmentRate = historical.pooled.annulledRateOfObserved;
  const primary = sensitivity.scenarios.city_weighted;
  const jee = primary.components.jee_at_risk;

  const monteCarlo = {
    cityWeighted: runMonteCarlo({
      sensitivity,
      historical,
      scenarioKey: "city_weighted",
      seed: 20260608,
    }),
    foreignKeikoPlus30: runMonteCarlo({
      sensitivity,
      historical,
      scenarioKey: "foreign_keiko_plus30",
      seed: 20260609,
    }),
    foreign5050: runMonteCarlo({
      sensitivity,
      historical,
      scenarioKey: "foreign_50_50",
      seed: 20260610,
    }),
  };

  return {
    status: "snapshot",
    source: {
      onpeAudit: PUBLIC_SOURCE_LABELS.jeeAudit,
      sensitivity: PUBLIC_SOURCE_LABELS.jeeSensitivity,
      cityForecast: PUBLIC_SOURCE_LABELS.cityForecast,
      territorial: territorial.source,
    },
    generatedAt: new Date().toISOString(),
    cutPeru: audit.cut_peru,
    cutUtc: audit.cut_utc,
    officialCurrent: {
      keikoVotes: sensitivity.official_current.keiko,
      sanchezVotes: sensitivity.official_current.roberto,
      marginKeikoMinusSanchez:
        sensitivity.official_current.margin_keiko_minus_roberto,
    },
    reconciliation: {
      rootTotals: audit.rootTotals,
      rootMinusLeafTotals: audit.root_minus_leaf_totals,
      note: "Los endpoints raiz y hoja de ONPE no siempre cierran al mismo segundo; la tabla por departamento usa hojas territoriales del corte auditado.",
    },
    currentTerritorialSource: {
      status: territorial.status,
      timestamp: territorial.timestamp,
      source: territorial.source,
    },
    historicalJeeResolution: historical,
    currentUnresolved: {
      peru: audit.by_scope.find((row) => row.scope_label === "PERU"),
      foreignAggregate: audit.by_scope.find(
        (row) => row.scope_label === "EXTRANJERO",
      ),
      rootTotals: audit.rootTotals,
      totals: audit.totals,
    },
    components: {
      pendingPeru: primary.components.pending_peru,
      foreignPendingAggregate: primary.components.foreign_pending,
      jeeAtRisk: primary.components.jee_at_risk,
      expectedJeeResolution: {
        admissionRate,
        annulmentRate,
        expectedCountedActas: jee.actas * admissionRate,
        expectedAnnulledActas: jee.actas * annulmentRate,
        expectedCountedValidVotes: jee.valid * admissionRate,
        expectedNotCountedValidVotes: jee.valid * annulmentRate,
        expectedCountedKeikoVotes: jee.keiko * admissionRate,
        expectedCountedSanchezVotes: jee.roberto * admissionRate,
        expectedCountedMarginKeikoMinusSanchez:
          jee.margin_keiko_minus_roberto * admissionRate,
      },
    },
    scenarios: {
      cityWeighted: {
        label: "Ciudad/distrito ponderado",
        description:
          "Usa el patron observado por distrito cuando existe y un fallback territorial para distritos con bajo conteo.",
        sensitivityByJeeAdmissionRate: mapSensitivityRows(
          sensitivity.scenarios.city_weighted.projection_by_jee_admission_rate,
        ),
        monteCarlo: monteCarlo.cityWeighted,
      },
      foreignKeikoPlus30: {
        label: "Exterior Keiko +30 pp",
        description:
          "Misma base nacional y JEE; exterior agregado forzado a 65/35 para probar una ventaja neta de 30 puntos.",
        sensitivityByJeeAdmissionRate: mapSensitivityRows(
          sensitivity.scenarios.foreign_keiko_plus30
            .projection_by_jee_admission_rate,
        ),
        monteCarlo: monteCarlo.foreignKeikoPlus30,
      },
      foreign5050: {
        label: "Exterior 50/50",
        description:
          "Escenario conservador donde el exterior agregado no aporta margen neto.",
        sensitivityByJeeAdmissionRate: mapSensitivityRows(
          sensitivity.scenarios.foreign_50_50.projection_by_jee_admission_rate,
        ),
        monteCarlo: monteCarlo.foreign5050,
      },
    },
    departmentRows: buildDepartmentRows({
      audit,
      city,
      sensitivity,
      territorial,
      historical,
    }),
    sources: SOURCES,
    methodologyNotes: METHOD_NOTES,
    privacyNote:
      "El voto extranjero se publica solo como total agregado en este modelo; no se incluyen paises ni ciudades.",
  };
}

async function main() {
  await mkdir(PUBLIC_DATA_DIR, { recursive: true });

  const [city, audit, sensitivity, territorial] = await Promise.all([
    readJson(CITY_SOURCE),
    readJson(JEE_AUDIT_SOURCE),
    readJson(JEE_SENSITIVITY_SOURCE),
    loadTerritorial(),
  ]);

  const cityCompact = cleanForPublic(compactCityForecast(city));
  const jeeModel = cleanForPublic(
    buildJeeModel({ audit, city, sensitivity, territorial }),
  );

  await writeFile(
    path.join(PUBLIC_DATA_DIR, "city-level-forecast.json"),
    `${JSON.stringify(cityCompact, null, 2)}\n`,
  );
  await writeFile(
    path.join(PUBLIC_DATA_DIR, "jee-resolution-model.json"),
    `${JSON.stringify(jeeModel, null, 2)}\n`,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        cutPeru: jeeModel.cutPeru,
        officialMargin: jeeModel.officialCurrent.marginKeikoMinusSanchez,
        departments: jeeModel.departmentRows.length,
        historicalAnnulmentRate:
          jeeModel.historicalJeeResolution.pooled.annulledRateOfObserved,
        territorialSource: jeeModel.currentTerritorialSource,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
