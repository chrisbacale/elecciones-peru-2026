import type { Metadata } from "next";
import { AlertTriangle, BookOpen, ExternalLink, Scale } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMetrics } from "@/lib/data";
import { formatPp } from "@/lib/format";

export const metadata: Metadata = {
  title: "Metodología | Radar Electoral Perú",
  description:
    "Diferencias entre boca de urna, conteo rápido, ONPE parcial y ONPE 100%. Fuentes auditadas, márgenes de error 2026 y disclaimer electoral.",
};

const INSTRUMENTS_2026 = [
  {
    instrument: "Ipsos conteo rápido 100%",
    source: "Ipsos / Transparencia",
    margin: "±1.9 pp (nacional), 95% confianza, 1,037 actas",
    reading: "Sánchez +0.6 pp — empate técnico; no permite proclamar ganador",
    type: "muestra" as const,
  },
  {
    instrument: "Datum conteo rápido 100%",
    source: "Datum",
    margin: "Sin ficha técnica pública equivalente en fuentes abiertas",
    reading: "Sánchez +0.28 pp — confirma dirección, margen mínimo",
    type: "muestra" as const,
  },
  {
    instrument: "Ipsos boca de urna",
    source: "Ipsos",
    margin: "18,000 encuestados, cobertura nacional",
    reading: "Keiko +1.4 pp — empate técnico; no es conteo de votos",
    type: "encuesta" as const,
  },
  {
    instrument: "Datum boca de urna",
    source: "Datum",
    margin: "±3.0 pp reportado; confianza no publicada en fuente localizada",
    reading: "Keiko +1.06 pp — empate técnico",
    type: "encuesta" as const,
  },
  {
    instrument: "ONPE parcial",
    source: "ONPE",
    margin: "Sin margen de error muestral (censo parcial de actas)",
    reading: "Sánchez +0.175 pp al 96.879% de avance (10/06 00:15) — oficial pero no final",
    type: "oficial" as const,
  },
  {
    instrument: "Ipsos simulacro previo",
    source: "Ipsos / Perú 21",
    margin: "±2.8 pp, muestra 1,204, campo 29-30 mayo 2026",
    reading: "Keiko +2.8 pp en válidos — superado por boca y conteo rápido",
    type: "encuesta" as const,
  },
  {
    instrument: "Datum simulacro previo",
    source: "Datum",
    margin: "±2.5 pp, muestra 1,501, campo 26-30 mayo 2026",
    reading: "Keiko +5.8 pp — superado por boca y conteo rápido",
    type: "encuesta" as const,
  },
  {
    instrument: "Participación (Ipsos)",
    source: "Ipsos",
    margin: "±1.8 pp",
    reading: "72.4% estimado; blanco 0.8%, nulo 5.7%",
    type: "encuesta" as const,
  },
];

const AUDITED_SOURCES = [
  {
    category: "ONPE — resultados oficiales",
    items: [
      {
        label: "Portal segunda vuelta 2026",
        url: "https://resultadosegundavuelta.onpe.gob.pe/",
        note: "Escrutinio en tiempo real",
      },
      {
        label: "Portal resultados electorales",
        url: "https://resultadoelectoral.onpe.gob.pe/",
        note: "Backend JSON para integración",
      },
      {
        label: "ONPE institucional",
        url: "https://www.onpe.gob.pe/",
        note: "Oficina Nacional de Procesos Electorales",
      },
    ],
  },
  {
    category: "JNE — autoridad electoral",
    items: [
      {
        label: "Jurado Nacional de Elecciones",
        url: "https://www.jne.gob.pe/",
        note: "Proclamación y resoluciones finales",
      },
      {
        label: "Acta de proclamación 2021 (PDF)",
        url: "https://portal.jne.gob.pe/portal_documentos/files/637a2dda-73ba-4abc-95bf-294f14d454bb.pdf",
        note: "Referencia de resultado oficial al 100%",
      },
      {
        label: "Consulta de resoluciones",
        url: "https://resoluciones.jne.gob.pe/",
        note: "Resoluciones, acuerdos y autos del JNE",
      },
    ],
  },
  {
    category: "Ipsos — encuestas y conteos rápidos",
    items: [
      {
        label: "Comparativo histórico CR + ONPE 100% (PDF)",
        url: "https://www.ipsos.com/sites/default/files/ct/news/documents/2021-06/Comparativo%20CR%2BONPE%20100%25_V3.pdf",
        note: "Serie 2001–2021: simulacro, boca, CR y ONPE",
      },
      {
        label: "Precisión electoral Ipsos Perú (PDF)",
        url: "https://www.ipsos.com/sites/default/files/ct/news/documents/2026-05/PRECISI%C3%93N%20IPSOS%20PER%C3%9A_PRESIDENCIAL_V6_0.pdf",
        note: "Diferencias máximas vs ONPE por instrumento",
      },
      {
        label: "Conteo rápido Transparencia / NDI",
        url: "https://www.ipsos.com/es-pe/conteo-rapido-integral-de-ipsos-peru-por-encargo-de-transparencia-en-colaboracion-con-el-ndi",
        note: "Metodología CR 2026",
      },
      {
        label: "Simulacro segunda vuelta mayo 2026 (PDF)",
        url: "https://www.ipsos.com/sites/default/files/ct/news/documents/2026-05/Ipsos%20Peru%2021%20-%20Segunda%20Vuelta%20al%2030%20de%20mayo%202026%20V4.pdf",
        note: "Ficha técnica: ±2.8 pp, 1,204 encuestas",
      },
      {
        label: "Última encuesta publicable mayo 2026",
        url: "https://www.ipsos.com/es-pe/ultima-encuesta-publicable-segunda-vuelta-encuesta-peru-21-ipsos-mayo-2026",
        note: "Encuesta previa al balotaje",
      },
      {
        label: "Conteo rápido 2021 al 100%",
        url: "https://www.ipsos.com/es-pe/resultados-del-conteo-rapido-al-100-6-de-junio-2021",
        note: "Referencia metodológica histórica",
      },
    ],
  },
];

const INSTRUMENT_DEFINITIONS = [
  {
    id: "boca",
    title: "Boca de urna",
    subtitle: "Encuesta de salida",
    badge: "encuesta" as const,
    description:
      "Encuesta aplicada a votantes al salir del local. Estima el electorado con muestra probabilística; no cuenta actas. Ipsos y Datum publican flashes el día de la elección.",
    keyPoints: [
      "Ipsos 2026 reporta muestra grande; no todas las fuentes publican un ± único comparable",
      "Puede sesgarse por voto tardío o composición territorial",
      "Error histórico promedio ~0.50 pp por candidato vs ONPE 100%",
      "En 2021 la boca favoreció a Keiko; el CR y el final favorecieron a Castillo",
    ],
  },
  {
    id: "cr",
    title: "Conteo rápido",
    subtitle: "Muestra de actas oficiales",
    badge: "muestra" as const,
    description:
      "Proyección sobre muestra de actas. Ipsos/Transparencia publica ficha primaria con 1,037 actas, ±1.9 pp y 95% de confianza; Datum se muestra como referencia con ficha/documentación localizada de calidad desigual.",
    keyPoints: [
      "Margen de error explícito al 95% de confianza cuando la fuente lo publica de forma primaria",
      "Error histórico promedio ~0.20 pp por candidato — más preciso que la boca",
      "No es resultado oficial; el JNE proclama solo tras el 100%",
      "En 2026 ambos CR proyectaron ligera ventaja de Sánchez",
    ],
  },
  {
    id: "parcial",
    title: "ONPE parcial",
    subtitle: "Escrutinio en curso",
    badge: "oficial" as const,
    description:
      "Censo parcial de actas procesadas. No es muestra aleatoria: sin margen de error estadístico. Su composición cambia según el orden territorial de llegada de actas.",
    keyPoints: [
      "Fuente oficial en tiempo real, pero incompleta",
      "Lima suele contarse antes que regiones rurales",
      "En 2026 el orden importó: Keiko +4.3 pp al 77%, empate al 93.9% y Sánchez +0.175 pp al 96.9%",
      "La ONPE pide esperar el 100% antes de inferir ganador",
    ],
  },
  {
    id: "onpe100",
    title: "ONPE / JNE al 100%",
    subtitle: "Resultado oficial",
    badge: "oficial" as const,
    description:
      "Cómputo definitivo de todas las actas resueltas por el JNE. Única cifra con validez legal para proclamar presidente.",
    keyPoints: [
      "Única fuente vinculante (JNE)",
      "Sin margen de error: censo completo de votos válidos",
      "2026: 100% pendiente; proclamación estimada mediados de julio",
      "Base de referencia para medir error histórico de encuestadoras",
    ],
  },
];

export default function MetodologiaPage() {
  const metrics = getErrorMetrics();

  return (
    <PageShell
      eyebrow="Transparencia metodológica"
      title="Metodología y fuentes"
      description="Diferencias entre instrumentos electorales, márgenes de error aplicables en 2026, error histórico Ipsos vs ONPE y fuentes auditadas con URL."
    >
      <div className="space-y-8">
        {/* Disclaimer */}
        <Card
          role="alert"
          className="border-alerta/40 bg-alerta-muted"
        >
          <CardContent className="flex gap-4 pt-5">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-alerta"
              aria-hidden
            />
            <div className="space-y-2 text-sm leading-relaxed">
              <p className="font-semibold text-foreground">
                Las encuestadoras no son autoridad electoral
              </p>
              <p className="text-foreground/85">
                La fuente oficial del resultado es la{" "}
                <strong>ONPE</strong> (escrutinio) y el{" "}
                <strong>JNE</strong> (proclamación). Ipsos, Datum y otras
                firmas registradas ante el JNE son encuestadoras privadas: sus
                bocas de urna, simulacros y conteos rápidos son estimaciones
                estadísticas, no actas oficiales. Este dashboard las presenta
                para comparar precisión histórica, no para anticipar un ganador
                antes del 100%.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instrument definitions */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted" aria-hidden />
            <h2 className="text-lg font-semibold">
              ¿En qué se diferencian los instrumentos?
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {INSTRUMENT_DEFINITIONS.map((def) => (
              <Card key={def.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{def.title}</CardTitle>
                    <Badge variant={def.badge}>{def.badge}</Badge>
                  </div>
                  <CardDescription className="uppercase tracking-wide">
                    {def.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted">
                    {def.description}
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted">
                    {def.keyPoints.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span className="text-muted" aria-hidden>
                          •
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why partial ONPE differs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              ¿Por qué ONPE parcial y conteo rápido pueden divergir?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted">
              El parcial de la ONPE no es muestra aleatoria: es un censo
              incompleto cuya composición cambia según qué distritos entran
              primero. En 2026, Lima —fortaleza de Fujimori— tiende a
              contabilizarse antes que el interior y la zona rural, donde Ipsos
              proyecta mayor apoyo a Sánchez (regiones ~57%, rural ~69%, sur
              ~74%). Por eso un parcial con Keiko +5 pp puede coexistir con un
              conteo rápido en empate técnico a favor de Sánchez.
            </p>
          </CardContent>
        </Card>

        {/* 2026 instruments table */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-muted" aria-hidden />
            <h2 className="text-lg font-semibold">
              Instrumentos y márgenes — Segunda vuelta 2026
            </h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-card-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-card-border bg-accent/45 text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">Instrumento</th>
                  <th className="px-4 py-3 font-medium">Fuente</th>
                  <th className="px-4 py-3 font-medium">Margen / error</th>
                  <th className="px-4 py-3 font-medium">Lectura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {INSTRUMENTS_2026.map((row) => (
                  <tr
                    key={row.instrument}
                    className="transition-colors hover:bg-accent/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-foreground">
                          {row.instrument}
                        </span>
                        <Badge variant={row.type} className="w-fit">
                          {row.type}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{row.source}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {row.margin}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.reading}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted">
            Votos válidos excluyen blanco y nulo. Porcentajes ONPE parcial del
            snapshot en{" "}
            <code className="rounded bg-accent px-1 text-foreground">
              data/2026/flash-electoral.json
            </code>
            .
          </p>
        </section>

        {/* Historical error metrics */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Error histórico Ipsos vs ONPE 100% (2001–2021)
          </h2>
          <p className="text-sm text-muted">
            Calculado sobre{" "}
            <code className="rounded bg-accent px-1 text-foreground">
              data/historical/segunda-vuelta.json
            </code>
            . Error por candidato = |estimado − ONPE|; error de margen =
            |margen estimado − margen ONPE|.
          </p>
          <div className="overflow-x-auto rounded-xl border border-card-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-card-border bg-accent/45 text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">Métrica</th>
                  <th className="px-4 py-3 font-medium">Boca de urna</th>
                  <th className="px-4 py-3 font-medium">Conteo rápido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {(
                  [
                    ["Error promedio por candidato", "candidateError", "mean"],
                    ["Error mediano por candidato", "candidateError", "median"],
                    ["Error máximo por candidato", "candidateError", "max"],
                    ["Error promedio del margen", "marginError", "mean"],
                    ["Error mediano del margen", "marginError", "median"],
                    ["Error máximo del margen", "marginError", "max"],
                  ] as const
                ).map(([label, group, stat]) => (
                  <tr
                    key={label}
                    className="transition-colors hover:bg-accent/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {label}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {formatPp(
                        metrics.bocaUrna[group][stat],
                        metrics.bocaUrna[group][stat] % 1 === 0 ? 1 : 2
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {formatPp(
                        metrics.conteoRapido[group][stat],
                        metrics.conteoRapido[group][stat] % 1 === 0 ? 1 : 2
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">
            El margen del CR Ipsos 2026 (Sánchez +0.6 pp) está dentro de la
            calibración histórica ex post del conteo rápido: error máximo
            histórico de margen {formatPp(metrics.conteoRapido.marginError.max)}.
            Esa calibración no es MOE muestral; el CR Ipsos 2026 publica MOE
            variable por candidato.
          </p>
        </section>

        {/* Audited sources */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Fuentes auditadas</h2>
          {AUDITED_SOURCES.map((group) => (
            <div key={group.category}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                {group.category}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.url}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50"
                    >
                      <ExternalLink
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted group-hover:text-encuesta"
                        aria-hidden
                      />
                      <span>
                        <span className="font-medium text-encuesta group-hover:underline">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {item.note}
                        </span>
                        <span className="mt-0.5 block break-all font-mono text-xs text-muted">
                          {item.url}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <footer className="border-t border-card-border pt-6 text-xs text-muted">
          <p>
            Datos verificados contra PDFs Ipsos, portales ONPE/JNE y cobertura
            periodística. Última revisión: junio 2026. ONPE 100% de 2026
            pendiente de proclamación.
          </p>
        </footer>
      </div>
    </PageShell>
  );
}
