# ONPE contract tests

`lib/onpe-client.contract.test.ts` documents the expected shape of the public, non-contractual ONPE `presentacion-backend` endpoints used by this project.

Run it directly with:

```bash
npm run test:onpe-contract
```

It also runs inside:

```bash
npm test
npm run verify
```

## Scope

The test suite is intentionally offline. It mocks `fetch` and does not call ONPE systems from CI.

Covered flows:

- National summary: `/resumen-general/totales` and `/eleccion-presidencial/participantes-ubicacion-geografica-nombre` with `tipoFiltro=eleccion`.
- Foreign vote summary: `tipoFiltro=ambito_geografico&idAmbitoGeografico=2`.
- Territorial summary: `tipoFiltro=ubigeo_nivel_01`, `idAmbitoGeografico=1`, and department ubigeo parameters.
- Request headers used by the ONPE client.
- Schema variants such as `totalActasContabilizadas`/`contabilizadas`, `porcentajeVotosValidos`/`porcentajeVotos`, and `totalVotosValidos`/`votos`.
- Fallback to snapshots when ONPE returns HTML, `success:false`, invalid JSON, non-200 status, empty body, or missing expected candidates.

## Why offline

These endpoints are public presentation endpoints, not a stable official API contract. CI should not create load against electoral infrastructure or fail because a public presentation host is temporarily unavailable. Live checks, if ever needed, should be manual, rate-limited, and separate from `npm run verify`.
