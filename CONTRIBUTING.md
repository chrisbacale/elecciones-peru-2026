# Contributing

Gracias por ayudar a mejorar Radar Electoral Peru. Este proyecto prioriza trazabilidad, neutralidad y claridad civica.

## Antes de contribuir

- Revisa el README y `docs/official-sources.md`.
- Abre un issue antes de cambios grandes de modelo, datos, UX o metodologia.
- No incluyas datos personales, documentos de identidad, padrones nominales, credenciales, capturas privadas ni informacion no publica.

## Tipos de contribucion

- Correcciones de fuentes oficiales o enlaces rotos.
- Mejoras de metodologia, disclaimers y reproduccion de datos.
- Tests para calculos electorales, transformaciones y fallbacks.
- Mejoras de accesibilidad, responsive UI y claridad de lectura.
- Documentacion para que otros puedan auditar snapshots y modelos.

## Reglas de datos electorales

Cada dato nuevo debe incluir, cuando aplique:

- Fuente primaria (`source_url`) y entidad responsable.
- Fecha de consulta (`retrieved_at`).
- Tipo de fuente: `official_result`, `official_registry`, `official_legal`, `derived_metric` o `simulation`.
- Corte temporal y avance de actas si es un resultado parcial.

No presentes simulaciones, escenarios o modelos como resultados oficiales.

## Verificacion local

```bash
npm ci
npm run verify
```

`npm run verify` ejecuta lint, tests y build. Si no puedes correrlo, dilo claramente en el PR.

## Pull requests

Incluye:

- Que cambiaste.
- Que fuente oficial o archivo respalda el cambio.
- Capturas si cambiaste UI.
- Resultado de `npm run verify`.
- Riesgos o limitaciones pendientes.
