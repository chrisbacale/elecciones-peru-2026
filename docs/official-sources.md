# Official Sources

Esta pagina define la jerarquia de fuentes primarias para Radar Electoral Peru. Su objetivo es evitar que resultados oficiales, registros, metricas derivadas y simulaciones se mezclen sin trazabilidad.

## Jerarquia

| Fuente | Uso principal | URL | Regla de uso |
| --- | --- | --- | --- |
| PCM / Gob.pe | Convocatoria legal y normas del proceso | https://www.gob.pe/institucion/pcm/normas-legales/6709184-039-2025-pcm | Citar numero de norma, fecha, URL y hash si se descarga PDF. No usar para resultados. |
| JNE | Cronograma, resoluciones, proclamaciones, JEE, candidaturas y justicia electoral | https://portal.jne.gob.pe/portal/Pagina/Ver/979/page/Elecciones-Generales-2026 | Fuente preferente para estado juridico y proclamacion final. |
| ONPE EG 2026 | Organizacion del proceso, materiales y enlace a resultados | https://eg2026.onpe.gob.pe/ | Fuente preferente para organizacion y presentacion de resultados procesados. |
| ONPE Resultados | Resultados progresivos, actas y detalle territorial segun interfaz publica | https://resultadoelectoral.onpe.gob.pe/ y https://resultadosegundavuelta.onpe.gob.pe/ | Guardar corte temporal, avance y host de origen. No equivale por si solo a proclamacion JNE. |
| RENIEC | Padron electoral, identidad y cifras agregadas | https://identidad.reniec.gob.pe/elecciones-generales-2026 | Usar solo cifras agregadas/reportes. No copiar consultas individuales ni datos personales. |
| Plataforma Electoral JNE | Expedientes, hojas de vida, planes, personeros, observadores y nulidades | https://plataformaelectoral.jne.gob.pe/ | Preferir enlaces permanentes a expedientes o PDFs cuando existan. |
| Voto Informado JNE | Oferta electoral, candidatos, hojas de vida y planes | https://votoinformado.jne.gob.pe/ | No usar como fuente de resultados. Versionar datos porque candidaturas pueden cambiar. |
| Cancilleria / Gob.pe | Voto en el exterior y logistica consular | https://www.gob.pe/tuvotocruzafronteras | Usar para logistica exterior; no reemplaza a ONPE/JNE para resultados. |
| Datos Abiertos ONPE | Datasets descargables publicados por ONPE | https://www.datosabiertos.gob.pe/group/oficina-nacional-de-procesos-electorales-onpe | Validar nombre, fecha, formato y hash antes de automatizar. |
| Infogob JNE | Historico electoral y contexto | https://infogob.jne.gob.pe/ | Usar para contexto historico cuando no exista una fuente mas directa del proceso 2026. |

## Campos minimos por fuente

Toda fuente agregada al proyecto debe conservar:

- `source_entity`: ONPE, JNE, RENIEC, PCM/Gob.pe, Cancilleria u otra entidad.
- `source_url`: URL directa.
- `retrieved_at`: fecha y hora de consulta.
- `source_type`: `official_result`, `official_registry`, `official_legal`, `derived_metric` o `simulation`.
- `document_date`: fecha del documento cuando aplique.
- `sha256`: hash de PDF, CSV, XLSX o snapshot descargado cuando aplique.

## Regla dura

ONPE, JNE y RENIEC nunca deben mezclarse semanticamente con simulaciones. Si una vista muestra ambos, los datos deben etiquetarse tanto en UI como en los archivos fuente.

## Endpoints ONPE

Los hosts de resultados ONPE son aplicaciones publicas. Las rutas bajo `/presentacion-backend/` observadas en la aplicacion deben tratarse como endpoints publicos no contractuales. Cualquier integracion debe:

- Fallar de forma explicita si ONPE cambia estructura, headers o identificadores.
- Mantener fallback a snapshot documentado.
- Mostrar al usuario cuando el estado es `live`, `snapshot` o `not_verified`.
- Evitar carga agresiva contra sistemas oficiales.
