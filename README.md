# Radar Electoral Perú

Dashboard interactivo para seguir y analizar la segunda vuelta presidencial peruana. Combina el estado en vivo del escrutinio ONPE, flashes de encuestadoras (Ipsos, Datum) y una auditoría histórica del margen de error de cada instrumento electoral desde 2001.

## ¿Qué hace?

- **Última hora 2026**: compara ONPE parcial, boca de urna y conteo rápido en una sola vista.
- **Historial 2001–2021**: serie curada de simulacro, boca de urna, conteo rápido y ONPE al 100% para cada segunda vuelta.
- **Estadística de error**: mide cuánto se desvió Ipsos del resultado oficial y si el margen actual cae dentro del rango histórico.
- **Metodología transparente**: explica diferencias entre instrumentos, disclaimers y fuentes con URL en [`/metodologia`](http://localhost:3000/metodologia).

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:3000)
npm run dev

# Build de producción
npm run build

# Servir build
npm run start
```

## Arquitectura

```
elecciones-peru-2026/
├── app/
│   ├── page.tsx              # Dashboard principal
│   ├── layout.tsx            # Layout raíz (Geist, metadata)
│   ├── globals.css           # Tokens Tailwind
│   └── metodologia/
│       └── page.tsx          # Metodología, márgenes y fuentes
├── data/
│   ├── historical/
│   │   └── segunda-vuelta.json   # Serie 2001–2026 curada
│   └── 2026/
│       └── flash-electoral.json  # Snapshot flashes 2026
├── lib/
│   ├── data.ts               # Carga de datasets
│   ├── onpe-client.ts        # Cliente API ONPE con fallback
│   ├── stats.ts              # Cálculo de errores históricos
│   ├── types.ts              # Tipos TypeScript
│   └── format.ts             # Formateo de %, pp, votos
└── package.json
```

### Flujo de datos

1. **Datos estáticos** (`data/`): resultados históricos auditados contra PDFs Ipsos y actas JNE/ONPE. El snapshot 2026 se actualiza manualmente cuando cambia el escrutinio.
2. **API ONPE en vivo** (`lib/onpe-client.ts`): intenta leer el backend JSON de `resultadosegundavuelta.onpe.gob.pe` y `resultadoelectoral.onpe.gob.pe`. Si falla, devuelve el último snapshot conocido.
3. **Capa analítica** (`lib/stats.ts`): agrega errores por candidato y por margen; calcula requisitos de voto pendiente y rangos históricos.

## Fuentes de datos

| Fuente | Tipo | Uso en el proyecto |
|--------|------|-------------------|
| [ONPE](https://resultadosegundavuelta.onpe.gob.pe/) | Oficial | Escrutinio parcial y al 100% |
| [JNE](https://www.jne.gob.pe/) | Oficial | Proclamación y resoluciones finales |
| [Ipsos comparativo CR+ONPE](https://www.ipsos.com/sites/default/files/ct/news/documents/2021-06/Comparativo%20CR%2BONPE%20100%25_V3.pdf) | Encuestadora | Serie histórica 2001–2021 |
| [Ipsos precisión electoral](https://www.ipsos.com/sites/default/files/ct/news/documents/2026-05/PRECISI%C3%93N%20IPSOS%20PER%C3%9A_PRESIDENCIAL_V6_0.pdf) | Encuestadora | Validación de diferencias máximas |
| Datum / prensa | Encuestadora | Flashes 2026 (boca y CR) |

**Importante:** Ipsos y Datum son encuestadoras privadas registradas ante el JNE, no autoridades electorales. Solo ONPE/JNE emiten resultados oficiales.

## Limitaciones de la API ONPE

El cliente en `lib/onpe-client.ts` consume endpoints no documentados públicamente del backend de presentación:

```
/presentacion-backend/resumen-general/totales
/presentacion-backend/eleccion-presidencial/participantes-ubicacion-geografica-nombre
```

Problemas conocidos:

- **Intermitencia**: el backend puede devolver HTML de error o `success: false` en horas pico del escrutinio.
- **Sin documentación oficial**: los `idEleccion` (10, 11, 12) se prueban por ensayo; deben verificarse en cada proceso.
- **CORS / rate limiting**: las peticiones se hacen desde el servidor Next.js; no hay garantía de disponibilidad 24/7.
- **Parcial ≠ muestra**: el avance territorial no es aleatorio; Lima suele adelantarse respecto al interior.
- **Fallback a snapshot**: si la API falla, se muestran datos de `flash-electoral.json` con estado `snapshot`.

Estrategia de resiliencia implementada:

1. Probar múltiples bases URL y `idEleccion`.
2. Validar que la respuesta contenga candidatos esperados (Keiko / Sánchez).
3. Detectar respuestas HTML (página de error) y descartarlas.
4. Retornar último snapshot con mensaje explícito al usuario.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Gráficos | Recharts 3 |
| Estado remoto | TanStack React Query 5 |
| Animación | Framer Motion 12 |
| Iconos | Lucide React |
| Fuentes | Geist (Google Fonts) |

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con hot reload |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor sobre `.next` |
| `npm run lint` | ESLint (config Next.js) |
| `npm run verify` | Gate completo antes de publicar: lint + tests + build |

## Actualización y despliegue

Repositorio privado en GitHub y despliegue público en Vercel son capas separadas:

1. Actualizar datos o UI en el código local.
2. Ejecutar `npm run verify`.
3. Confirmar cambios con Git y subirlos al repo privado.
4. Desplegar a producción con `vercel --prod`.

Cuando se actualice el snapshot electoral de 2026, el archivo principal es
`data/2026/flash-electoral.json`. Las rutas API intentan leer ONPE en vivo y
caen a ese snapshot si el backend público está intermitente.

## Licencia y uso

Proyecto privado (`"private": true`). Los datos electorales oficiales son de dominio público (ONPE/JNE). Los informes Ipsos/Datum están sujetos a sus respectivas licencias de difusión.
