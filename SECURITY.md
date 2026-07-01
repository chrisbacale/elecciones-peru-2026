# Security Policy

## Alcance

Este repositorio contiene una aplicacion publica de analisis electoral, datasets derivados y clientes para fuentes publicas. Reporta vulnerabilidades que puedan afectar integridad de datos, disponibilidad, exposicion de secretos, manipulacion de resultados mostrados o abuso de endpoints.

## Reporte responsable

Abre un issue solo para problemas no sensibles. Para vulnerabilidades explotables o datos sensibles, contacta al mantenedor por GitHub y evita publicar detalles tecnicos hasta que exista una correccion.

No incluyas:

- Credenciales, tokens o llaves privadas.
- DNI, padrones nominales o datos personales.
- Capturas con informacion privada.
- PoC que ataquen sistemas de ONPE, JNE, RENIEC, Vercel u otros terceros.

## Fuera de alcance

- Escaneo, probing o carga contra sistemas oficiales que no controlamos.
- Vulnerabilidades en servicios de terceros sin autorizacion.
- Desacuerdos politicos o interpretativos sin un bug tecnico reproducible.

## Cadencia esperada

- Confirmacion inicial: 72 horas.
- Triage: 7 dias.
- Correccion o mitigacion: segun severidad y disponibilidad de una reproduccion clara.

## Dependencias

El proyecto usa `npm audit` como senal de mantenimiento, pero revisa severidad, explotabilidad real y disponibilidad de fixes antes de aplicar cambios mayores.
