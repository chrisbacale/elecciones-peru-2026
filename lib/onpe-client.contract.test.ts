import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ONPE_BASES,
  fetchOnpeExterior,
  fetchOnpeResumen,
  fetchOnpeTerritorial,
  getKnownOnpeSnapshot,
  getOnpeApiMeta,
} from "./onpe-client";

const nationalActasPayload = {
  success: true,
  data: {
    porcentajeActasContabilizadas: 96.918,
    totalActasContabilizadas: 89907,
    totalActas: 92766,
    totalVotosValidos: 17924330,
    totalVotosBlancos: 123,
    totalVotosNulos: 456,
    fechaActualizacion: Date.parse("2026-06-10T06:18:00.000Z"),
    enviadasJee: 1577,
    pendientesJee: 1282,
    actasEnviadasJee: 1.7,
    actasPendientesJee: 1.382,
  },
};

const nationalVotesPayload = {
  success: true,
  data: [
    {
      nombreCandidato: "KEIKO FUJIMORI",
      totalVotosValidos: 8946667,
      porcentajeVotosValidos: 49.914,
    },
    {
      nombreCandidato: "ROBERTO SÁNCHEZ",
      totalVotosValidos: 8977663,
      porcentajeVotosValidos: 50.086,
    },
  ],
};

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function htmlResponse() {
  return new Response("<!doctype html><html><body>Error</body></html>", {
    status: 200,
    headers: { "content-type": "text/html" },
  });
}

function invalidJsonResponse() {
  return new Response("not-json", {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function emptyResponse() {
  return new Response("", {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function expectOnpeHeaders(init: RequestInit | undefined) {
  const headers = new Headers(init?.headers);

  expect(headers.get("accept")).toContain("application/json");
  expect(headers.get("origin")).toBe("https://resultadosegundavuelta.onpe.gob.pe");
  expect(headers.get("referer")).toBe(
    "https://resultadosegundavuelta.onpe.gob.pe/main/actas",
  );
  expect(headers.get("x-requested-with")).toBe("XMLHttpRequest");
  expect(headers.get("user-agent")).toContain("Mozilla/5.0");
}

function expectQuery(url: string, expected: Record<string, string>) {
  const parsed = new URL(url);

  for (const [key, value] of Object.entries(expected)) {
    expect(parsed.searchParams.get(key)).toBe(value);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ONPE presentation-backend contract", () => {
  it("documenta las rutas no contractuales que el cliente intenta leer", () => {
    const meta = getOnpeApiMeta();

    expect(meta.basesTried).toEqual(ONPE_BASES);
    expect(meta.electionIdsTried).toEqual([10, 11, 12]);
    expect(meta.snapshotSource).toBe("data/2026/flash-electoral.json");
  });

  it("normaliza una respuesta nacional ONPE válida al contrato interno", async () => {
    const requests: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        requests.push(url);
        expectOnpeHeaders(init);

        if (url.includes("/resumen-general/totales")) {
          expectQuery(url, {
            tipoFiltro: "eleccion",
            idEleccion: "10",
          });
          return jsonResponse(nationalActasPayload);
        }
        if (
          url.includes(
            "/eleccion-presidencial/participantes-ubicacion-geografica-nombre",
          )
        ) {
          expectQuery(url, {
            tipoFiltro: "eleccion",
            idEleccion: "10",
          });
          return jsonResponse(nationalVotesPayload);
        }

        throw new Error(`Unexpected ONPE test URL: ${url}`);
      }),
    );

    const result = await fetchOnpeResumen();

    expect(result.status).toBe("live");
    expect(result.source).toBe(ONPE_BASES[0]);
    expect(result.timestamp).toBe("2026-06-10T06:18:00.000Z");
    expect(result.advancePct).toBe(96.918);
    expect(result.actasProcesadas).toBe(89907);
    expect(result.actasTotal).toBe(92766);
    expect(result.actasEnviadasJee).toBe(1577);
    expect(result.actasPendientesJee).toBe(1282);
    expect(result.candidates.keiko.votes).toBe(8946667);
    expect(result.candidates.sanchez.votes).toBe(8977663);
    expect(result.marginLeader).toBe("Roberto Sánchez");
    expect(result.validVotes).toBe(17924330);
    expect(result.blankVotes).toBe(123);
    expect(result.nullVotes).toBe(456);

    expect(requests).toEqual(
      expect.arrayContaining([
        expect.stringContaining("/resumen-general/totales"),
        expect.stringContaining(
          "/eleccion-presidencial/participantes-ubicacion-geografica-nombre",
        ),
      ]),
    );
    expect(requests.every((url) => url.includes("idEleccion=10"))).toBe(true);
  });

  it.each([
    ["HTML", () => htmlResponse()],
    ["success false", () => jsonResponse({ success: false })],
    ["JSON inválido", () => invalidJsonResponse()],
    ["HTTP no-200", () => jsonResponse({ success: true }, { status: 500 })],
    ["body vacío", () => emptyResponse()],
  ])("conserva fallback explícito si ONPE devuelve %s", async (_case, responseFactory) => {
    vi.stubGlobal("fetch", vi.fn(async (_input, init?: RequestInit) => {
      expectOnpeHeaders(init);
      return responseFactory();
    }));

    const result = await fetchOnpeResumen();
    const snapshot = getKnownOnpeSnapshot();

    expect(result.status).toBe("snapshot");
    expect(result.source).toBe("data/2026/flash-electoral.json");
    expect(result.message).toContain("snapshot conocido");
    expect(result.candidates.keiko.pct).toBe(snapshot.candidates.keiko.pct);
    expect(result.candidates.sanchez.pct).toBe(snapshot.candidates.sanchez.pct);
  });

  it("no acepta participantes si falta uno de los dos candidatos esperados", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        expectOnpeHeaders(init);
        if (url.includes("/resumen-general/totales")) {
          return jsonResponse(nationalActasPayload);
        }
        return jsonResponse({
          success: true,
          data: [
            {
              nombreCandidato: "KEIKO FUJIMORI",
              totalVotosValidos: 8946667,
              porcentajeVotosValidos: 49.914,
            },
          ],
        });
      }),
    );

    const result = await fetchOnpeResumen();

    expect(result.status).toBe("snapshot");
    expect(result.source).toBe("data/2026/flash-electoral.json");
  });

  it("normaliza el contrato exterior sin confundirlo con el nacional", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        expectOnpeHeaders(init);
        expect(url).toContain("tipoFiltro=ambito_geografico");
        expect(url).toContain("idAmbitoGeografico=2");

        if (url.includes("/resumen-general/totales")) {
          return jsonResponse({
            success: true,
            data: {
              porcentajeActasContabilizadas: 51.87,
              totalActasContabilizadas: 1319,
              totalActas: 2543,
              totalVotosValidos: 162221,
              fechaActualizacion: Date.parse("2026-06-10T06:18:00.000Z"),
            },
          });
        }

        return jsonResponse({
          success: true,
          data: [
            {
              nombreCandidato: "KEIKO FUJIMORI",
              totalVotosValidos: 101070,
              porcentajeVotosValidos: 62.304,
            },
            {
              nombreCandidato: "ROBERTO SANCHEZ",
              totalVotosValidos: 61151,
              porcentajeVotosValidos: 37.696,
            },
          ],
        });
      }),
    );

    const result = await fetchOnpeExterior();

    expect(result.status).toBe("live");
    expect(result.advancePct).toBe(51.87);
    expect(result.actasContabilizadas).toBe(1319);
    expect(result.actasTotal).toBe(2543);
    expect(result.actasPendientes).toBe(1224);
    expect(result.candidates.keiko.votes).toBe(101070);
    expect(result.candidates.sanchez.votes).toBe(61151);
    expect(result.marginLeader).toBe("Keiko Fujimori");
  });

  it("normaliza contrato territorial offline sin cargar sistemas ONPE reales", async () => {
    const voteRequests: string[] = [];
    const actasRequests: string[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        expectOnpeHeaders(init);
        expect(url).toContain("tipoFiltro=ubigeo_nivel_01");
        expect(url).toContain("idAmbitoGeografico=1");
        expect(url).toContain("idEleccion=10");

        const parsed = new URL(url);
        const department = parsed.searchParams.get("ubigeoNivel1") ??
          parsed.searchParams.get("idUbigeoDepartamento");
        expect(department).toMatch(/^\d{6}$/);

        if (url.includes("/resumen-general/totales")) {
          actasRequests.push(url);
          return jsonResponse({
            success: true,
            data: {
              contabilizadas: 90,
              totalActas: 100,
              totalVotosValidos: 18000,
              fechaActualizacion: Date.parse("2026-06-10T06:18:00.000Z"),
            },
          });
        }

        voteRequests.push(url);
        return jsonResponse({
          success: true,
          data: [
            {
              nombreCandidato: "KEIKO FUJIMORI",
              votos: 9900,
              porcentajeVotos: 55,
            },
            {
              nombreCandidato: "ROBERTO SANCHEZ",
              votos: 8100,
              porcentajeVotos: 45,
            },
          ],
        });
      }),
    );

    const result = await fetchOnpeTerritorial();

    expect(result.status).toBe("live");
    expect(result.departments.length).toBeGreaterThan(20);
    expect(voteRequests.length).toBe(result.departments.length);
    expect(actasRequests.length).toBe(result.departments.length);
    expect(result.departments[0]).toMatchObject({
      keikoPct: 55,
      sanchezPct: 45,
      leader: "Keiko",
      votesKeiko: 9900,
      votesSanchez: 8100,
      validVotes: 18000,
      advancePct: 90,
      actasContabilizadas: 90,
      actasTotal: 100,
      actasPendientes: 10,
      pendingPct: 10,
      validVotesPerActa: 200,
      estimatedPendingValidVotes: 2000,
      projectedPendingKeikoVotes: 1100,
      projectedPendingSanchezVotes: 900,
      projectedPendingNetKeikoVotes: 200,
    });
  });
});
