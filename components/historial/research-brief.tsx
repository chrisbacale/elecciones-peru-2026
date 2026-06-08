import { AlertTriangle, CheckCircle2, Database, FileSearch, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CandidatePair, ElectionRecord } from "@/lib/types";
import { formatPct, formatVotes } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getProviderPair,
  getSimulacroPair,
  type InstrumentProvider,
} from "./utils";

type SourceGroup = {
  title: string;
  tone: "official" | "pollster" | "media" | "method";
  items: Array<{
    label: string;
    href: string;
    note: string;
  }>;
};

const SOURCE_GROUPS: SourceGroup[] = [
  {
    title: "Resultados oficiales",
    tone: "official",
    items: [
      {
        label: "ONPE 2001",
        href: "https://www.onpe.gob.pe/elecciones/2001/EG/resultados/segunda-vuelta.pdf",
        note: "Toledo 53.1 / García 46.9; votos válidos oficiales.",
      },
      {
        label: "ONPE 2006",
        href: "https://www.web.onpe.gob.pe/modElecciones/elecciones/resultados2006/2davuelta/onpe/presidente/rep_resultados_pre.onpe",
        note: "García 52.625 / Humala 47.375 con 100% de actas computadas.",
      },
      {
        label: "ONPE 2011",
        href: "https://www.web.onpe.gob.pe/modElecciones/elecciones/elecciones2011/2davuelta/onpe/presidente/rep_resumen_pre.php",
        note: "Humala 51.449 / Fujimori 48.551 al 100%.",
      },
      {
        label: "ONPE 2016",
        href: "https://www.web.onpe.gob.pe/modElecciones/elecciones/elecciones2016/PRP2V2016/Resumen-GeneralPresidencial.html",
        note: "PPK 50.120 / Fuerza Popular 49.880 al 100%.",
      },
      {
        label: "JNE/ONPE 2021",
        href: "https://dne.jne.gob.pe/DnefDocumentos/documentos/investigacion/perfil-electoral/Perfil%20Electoral%2013%20-%20EG2021_An%C3%A1lisis%20de%20resultados_Segunda%20vuelta.pdf",
        note: "Castillo 50.126 / Fujimori 49.874 como resultado final publicado.",
      },
    ],
  },
  {
    title: "Ipsos",
    tone: "pollster",
    items: [
      {
        label: "Comparativo CR + ONPE 100%",
        href: "https://www.ipsos.com/sites/default/files/ct/news/documents/2021-07/Comparativo%20CR%2BONPE%20100%25_V6.pdf",
        note: "Serie homologable 2001, 2006, 2011, 2016 y 2021; V6 corrige el cierre posterior a V3.",
      },
      {
        label: "Ipsos 2011 ficha boca/CR",
        href: "https://www.ipsos.com/sites/default/files/publication/2011-06/ResultadosEncuestasSegundaVuelta.pdf",
        note: "Boca ±3 pp en 354 centros; conteo rápido ±1 pp en 1,376 mesas.",
      },
      {
        label: "Ipsos 2016 ficha boca/CR",
        href: "https://www.ipsos.com/sites/default/files/publication/2016-06/ConteoRapido_050616.pdf",
        note: "Boca ±3 pp en 362 centros; conteo rápido ±1 pp en 1,610 mesas.",
      },
      {
        label: "Ipsos 2021 conteo rápido",
        href: "https://www.ipsos.com/es-pe/resultados-del-conteo-rapido-al-100-6-de-junio-2021",
        note: "Conteo rápido al 100%; muestra reportada 1,675 mesas.",
      },
      {
        label: "Conteo rápido integral 2026",
        href: "https://www.ipsos.com/sites/default/files/ct/news/documents/2026-06/Informe%20Conteo%20R%C3%A1pido%20Integral%20al%20100%25_VF.pdf",
        note: "Muestra probabilística de 1,037 actas; 95% de confianza; ±1.9 pp total nacional.",
      },
      {
        label: "Boca de urna 2026",
        href: "https://www.ipsos.com/sites/default/files/ct/news/documents/2026-06/Informe%20Boca%20de%20Urna%20Presidencial_Segunda%20Vuelta_VF.pdf",
        note: "Fujimori 50.7 / Sánchez 49.3; 18,000 encuestados; el informe marca empate técnico sin ± numérico.",
      },
      {
        label: "Última encuesta publicable 2026",
        href: "https://www.ipsos.com/sites/default/files/ct/news/documents/2026-05/Ipsos%20Peru%2021%20-%20Segunda%20Vuelta%20al%2030%20de%20mayo%202026%20V4.pdf",
        note: "Simulacro previo: FP 51.4 / JPP 48.6 en votos válidos.",
      },
    ],
  },
  {
    title: "Datum 2026",
    tone: "media",
    items: [
      {
        label: "Datum simulacro mayo 2026",
        href: "https://www.datum.com.pe/new_web_files/files/pdf/567-1025%20-%20Encuesta%20EC%20MAYO%202026%20%2826%20al%2030%20mayo%29%20-%20Informe%20ENCUESTA%20Final_260531083136_260605064537.pdf",
        note: "FP 52.9 / JPP 47.1 en votos válidos; 1,501 casos; MOE +/-2.5%.",
      },
      {
        label: "Datum conteo rápido",
        href: "https://www.datum.com.pe/new_web_files/files/pdf/ELECCIONES%202026%20-%202%20Vuelta%20-%20Informe%20CONTEO%20R%C3%81PIDO_260607104858.pdf",
        note: "Sánchez 50.14 / Fujimori 49.86; margen dentro de +/-1 pp.",
      },
      {
        label: "Datum boca de urna",
        href: "https://www.datum.com.pe/new_web_files/files/pdf/ELECCIONES%202026%20-%202%20Vuelta%20-%20Informe%20BOCA%20DE%20URNA%20v1_260607063337.pdf",
        note: "Fujimori 50.53 / Sánchez 49.47; muestra reportada 52,343.",
      },
      {
        label: "Andina",
        href: "https://andina.pe/ingles/noticia-peru-2026-elections-roberto-sanchez-5014-keiko-fujimori-4986-datum-quick-count-1078466.aspx",
        note: "Agencia peruana replica el conteo rápido Datum al 100%.",
      },
    ],
  },
  {
    title: "Datum histórico no homogéneo",
    tone: "media",
    items: [
      {
        label: "Datum 2011 boca de urna",
        href: "https://andina.pe/ingles/noticia-sondeo-a-boca-urna-datum-ollanta-humala-527-y-keiko-fujimori-473-362257.aspx",
        note: "Humala 52.7 / Fujimori 47.3; sin ficha pública ubicada.",
      },
      {
        label: "Datum 2021 simulacro",
        href: "https://www.datum.com.pe/new_web_files/files/pdf/May%20IV%20Segunda%20vuelta%20Electoral_210528063152.pdf",
        note: "Castillo 50.5 / Fujimori 49.5 en votos válidos; MOE +/-2.8%.",
      },
      {
        label: "Datum 2016 simulacro",
        href: "https://tc.gob.pe/publicaciones/resumenes/2016/mayo/Resumen_27052016.pdf",
        note: "Keiko 52.9 / PPK 47.1; no es boca ni conteo rápido.",
      },
    ],
  },
  {
    title: "Método electoral",
    tone: "method",
    items: [
      {
        label: "ONPE: actas conforme se procesan",
        href: "https://www.gob.pe/institucion/onpe/noticias/1377819-resultados-de-votacion-se-publican-conforme-se-procesan-actas-electorales",
        note: "El avance parcial no es muestra aleatoria ni conteo rápido.",
      },
      {
        label: "ONPE: procesadas vs contabilizadas",
        href: "https://www.gob.pe/institucion/onpe/noticias/1382843-onpe-proceso-el-cien-por-ciento-de-actas-de-la-eleccion-presidencial",
        note: "Acta procesada no siempre está sumada al cómputo general.",
      },
      {
        label: "ACE Project",
        href: "https://aceproject.org/ace-en/topics/me/mef/mef04/med06c03/med06c03b/mob-browsing/onePag",
        note: "Diferencia conceptual entre conteo rápido y encuesta de salida.",
      },
    ],
  },
];

const TONE_CLASS: Record<SourceGroup["tone"], string> = {
  official: "border-onpe/30 bg-onpe-muted text-foreground",
  pollster: "border-poll/30 bg-encuesta-muted text-foreground",
  media: "border-alerta/30 bg-alerta-muted text-foreground",
  method: "border-sanchez/30 bg-sanchez-muted text-foreground",
};

const POLLSTERS: InstrumentProvider[] = ["ipsos", "datum"];

function formatMoe(pair: CandidatePair): string {
  if (pair.marginOfError !== undefined) {
    return `+/-${formatPct(pair.marginOfError, 1)}`;
  }
  return pair.marginOfErrorNote ?? "No publicado en fuente localizada";
}

function formatSample(pair: CandidatePair): string {
  const sample = pair.sampleSize !== undefined ? formatVotes(pair.sampleSize) : "No publicado";
  return pair.methodologyNote ? `${sample} · ${pair.methodologyNote}` : sample;
}

function formatStatReading(pair: CandidatePair): string {
  const margin = pair.marginPp ?? Math.abs(pair.a - pair.b);
  const moe = pair.marginOfError;
  if (moe === undefined) return "No calculable sin MOE";
  if (margin <= moe) return "Empate técnico";
  if (margin <= moe * 2) return "Ventaja estimada, no concluyente";
  return "Ventaja clara, no oficial";
}

function buildMoeRows(elections: ElectionRecord[]) {
  return elections.flatMap((election) =>
    POLLSTERS.flatMap((provider) => {
      const rows: Array<{
        key: string;
        year: number;
        pollster: string;
        instrument: string;
        pair: CandidatePair;
      }> = [];

      const stages: Array<[string, CandidatePair | undefined]> = [
        ["Simulacro", getSimulacroPair(election, provider)],
        ["Boca de urna", getProviderPair(election, "boca", provider)],
        ["Conteo rápido", getProviderPair(election, "cr", provider)],
      ];

      for (const [instrument, pair] of stages) {
        if (!pair) continue;
        rows.push({
          key: `${election.year}-${provider}-${instrument}`,
          year: election.year,
          pollster: provider === "ipsos" ? "Ipsos" : "Datum",
          instrument,
          pair,
        });
      }

      return rows;
    })
  );
}

export function ResearchSummary() {
  const stats = [
    { label: "Elecciones presidenciales comparables", value: "6", detail: "2001, 2006, 2011, 2016, 2021 y 2026" },
    { label: "Serie Ipsos homologada", value: "5", detail: "2001-2021 contra ONPE 100%" },
    { label: "Encuestadoras 2026", value: "2", detail: "Ipsos/Transparencia y Datum" },
    { label: "Resultado legal 2026", value: "pendiente", detail: "ONPE/JNE final aún no proclamado" },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-card-border bg-card/70 p-4 shadow-sm shadow-black/20"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {item.value}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
        </div>
      ))}
    </section>
  );
}

export function MarginOfErrorAudit({ elections }: { elections: ElectionRecord[] }) {
  const rows = buildMoeRows(elections).sort((a, b) => b.year - a.year || a.pollster.localeCompare(b.pollster));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Auditoría de margen de error
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          MOE declarado por la propia encuestadora cuando existe fuente pública.
          Si el informe no publica un ± único, se conserva la nota metodológica.
        </p>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-card-border bg-card/70 lg:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <caption className="sr-only">
            Auditoría de margen de error declarado por encuestadora,
            instrumento, muestra, confianza y fuente.
          </caption>
          <thead className="border-b border-card-border bg-accent/45 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Año</th>
              <th scope="col" className="px-4 py-3">Encuestadora</th>
              <th scope="col" className="px-4 py-3">Instrumento</th>
              <th scope="col" className="px-4 py-3">MOE declarado</th>
              <th scope="col" className="px-4 py-3">Muestra / diseño</th>
              <th scope="col" className="px-4 py-3">Confianza</th>
              <th scope="col" className="px-4 py-3">Lectura</th>
              <th scope="col" className="px-4 py-3">Fuente</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border/70">
            {rows.map((row) => (
              <tr key={row.key} className="transition-colors hover:bg-accent/30">
                <th scope="row" className="px-4 py-3 text-left font-semibold tabular-nums">{row.year}</th>
                <td className="px-4 py-3">{row.pollster}</td>
                <td className="px-4 py-3">{row.instrument}</td>
                <td className="px-4 py-3 font-mono text-poll">{formatMoe(row.pair)}</td>
                <td className="max-w-[320px] px-4 py-3 text-xs leading-relaxed text-muted">
                  {formatSample(row.pair)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {row.pair.confidence ? `${row.pair.confidence}%` : "No publicada"}
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-alerta">
                  {formatStatReading(row.pair)}
                </td>
                <td className="max-w-[260px] px-4 py-3 text-xs leading-relaxed text-muted">
                  {row.pair.source ?? "No publicada"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {rows.map((row) => (
          <div key={row.key} className="rounded-xl border border-card-border bg-card/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">
                  {row.year} · {row.pollster}
                </p>
                <h3 className="mt-1 text-sm font-semibold">{row.instrument}</h3>
              </div>
              <span className="rounded-md border border-poll/30 bg-encuesta-muted px-2 py-1 font-mono text-xs text-foreground">
                {formatMoe(row.pair)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Muestra: {formatSample(row.pair)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Confianza: {row.pair.confidence ? `${row.pair.confidence}%` : "no publicada"} · Fuente:{" "}
              {row.pair.source ?? "no publicada"}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-alerta">
              {formatStatReading(row.pair)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MethodologyBrief() {
  const rows = [
    {
      icon: FileSearch,
      title: "Boca de urna",
      body: "Pregunta a votantes al salir. Es rápida, pero mide declaraciones: puede fallar por no respuesta, voto oculto o sesgo de cobertura.",
    },
    {
      icon: Database,
      title: "Conteo rápido",
      body: "Usa actas reales de una muestra probabilística. Es como revisar tickets de cajas escogidas estadísticamente, no preguntar a clientes.",
    },
    {
      icon: AlertTriangle,
      title: "ONPE parcial",
      body: "Son votos oficiales, pero llegan por logística. Lima, extranjero o zonas cercanas pueden entrar antes; no es una muestra aleatoria.",
    },
    {
      icon: Scale,
      title: "ONPE/JNE final",
      body: "Es el cierre legal: actas contabilizadas, observaciones resueltas y proclamación. Predicción y autoridad no son lo mismo.",
    },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Regla de lectura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted">
            Jerarquía legal: JNE final, ONPE 100%, ONPE parcial, conteo rápido,
            boca de urna. Jerarquía predictiva en la noche electoral: un conteo
            rápido bien diseñado puede ser más útil que una ONPE parcial temprana
            porque el parcial oficial no llega como muestra aleatoria.
          </p>
          <div className="rounded-xl border border-card-border bg-accent/35 p-4 text-sm leading-relaxed text-foreground/85">
            Analogía: boca de urna es preguntar a personas qué compraron al salir
            del supermercado; conteo rápido es revisar tickets reales de cajas
            escogidas estadísticamente; ONPE parcial es abrir camiones conforme
            llegan al almacén; ONPE/JNE final es revisar todos los tickets y
            resolver discrepancias.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {rows.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-card-border bg-card/70 p-4">
            <div className="flex items-start gap-3">
              <span className="rounded-lg border border-card-border bg-accent/45 p-2 text-poll">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SourceAuditPanel() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Fuentes auditadas</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          La base distingue autoridad electoral, encuestadora y cobertura
          periodística. Datum se incluye cuando hay fuente pública verificable;
          no se inventa una serie histórica homogénea si no está publicada.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {SOURCE_GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                    TONE_CLASS[group.tone]
                  )}
                >
                  {group.title}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {group.items.map((item) => (
                  <li key={`${group.title}-${item.label}`} className="text-sm">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 font-semibold text-sky-200 underline decoration-sky-500/40 underline-offset-4 transition-colors hover:text-sky-100"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </a>
                    <p className="mt-1 leading-relaxed text-muted">{item.note}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
