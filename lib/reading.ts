import type { CandidatePair } from "./types";

export type ReadingTone = "neutral" | "warning" | "info" | "success";

export type SourceReading = {
  headline: string;
  detail: string;
  tone: ReadingTone;
  declareWinner: boolean;
  winnerLabel?: string;
};

type ReadingInput = {
  type: "oficial" | "encuesta" | "muestra";
  instrument: string;
  data: CandidatePair;
  notes?: string;
  marginOfError?: number;
  historicalMaxError?: number;
  isPartial?: boolean;
};

export function getSourceReading(input: ReadingInput): SourceReading {
  const { type, instrument, data, notes, marginOfError, historicalMaxError, isPartial } =
    input;
  const margin = data.marginPp ?? Math.abs(data.a - data.b);
  const leader = data.marginLeader === "b" ? data.labelB : data.labelA;
  const declaredMoe = marginOfError ?? data.marginOfError;
  const noteText = `${notes ?? ""} ${data.marginOfErrorNote ?? ""}`;
  const noteSaysTechnicalTie = /empate t[eé]cnico/i.test(noteText);
  const historicalContext =
    historicalMaxError !== undefined
      ? ` Calibración histórica: error máximo observado ${historicalMaxError.toFixed(2)} pp; no es MOE muestral.`
      : "";

  if (type === "oficial") {
    if (isPartial) {
      const advance = data.advancePct !== undefined ? ` al ${data.advancePct.toFixed(1)}%` : "";
      return {
        headline: `${leader} adelanta en escrutinio parcial`,
        detail: `Avance parcial${advance}: censo incompleto de actas, sin MOE muestral. No proclamar ganador hasta cierre del 100%. ${notes ?? ""}`.trim(),
        tone: "info",
        declareWinner: false,
        winnerLabel: leader,
      };
    }
    return {
      headline: `${leader} resulta electo`,
      detail: notes ?? "Resultado oficial al 100%.",
      tone: "success",
      declareWinner: true,
      winnerLabel: leader,
    };
  }

  if (declaredMoe !== undefined && margin <= declaredMoe) {
    return {
      headline: "Empate técnico",
      detail: `Margen ${margin.toFixed(2)} pp dentro del MOE declarado (${declaredMoe.toFixed(1)} pp). No proclamar ganador. ${notes ?? ""}${historicalContext}`.trim(),
      tone: "warning",
      declareWinner: false,
    };
  }

  if (noteSaysTechnicalTie) {
    return {
      headline: "Empate técnico",
      detail: `La fuente lo reporta como empate técnico. Margen ${margin.toFixed(2)} pp; ${data.marginOfErrorNote ?? "MOE numérico no publicado"}. No proclamar ganador. ${notes ?? ""}${historicalContext}`.trim(),
      tone: "warning",
      declareWinner: false,
    };
  }

  if (declaredMoe !== undefined && margin <= declaredMoe * 2) {
    return {
      headline: `${leader} con ventaja estimada`,
      detail: `${instrument}: margen ${margin.toFixed(2)} pp supera el MOE individual declarado, pero sigue en zona no concluyente para proclamar. ${notes ?? ""}${historicalContext}`.trim(),
      tone: "info",
      declareWinner: false,
      winnerLabel: leader,
    };
  }

  return {
    headline: `${leader} adelanta`,
    detail: `${instrument}: ventaja de ${margin.toFixed(2)} pp. ${notes ?? ""}${historicalContext}`.trim(),
    tone: "info",
    declareWinner: false,
    winnerLabel: leader,
  };
}

export function getCrAverageReading(
  avg: { a: number; b: number; marginPp: number; leader: string },
  labelA: string,
  labelB: string,
  maxCrError: number
): SourceReading {
  const leader = avg.leader === "b" ? labelB : labelA;
  if (avg.marginPp <= maxCrError) {
    return {
      headline: "Empate técnico (promedio CR)",
      detail: `Promedio Ipsos + Datum: ${labelB} ${avg.b.toFixed(2)}% / ${labelA} ${avg.a.toFixed(2)}%. Margen ${avg.marginPp.toFixed(2)} pp dentro de la calibración histórica CR (${maxCrError.toFixed(2)} pp), que no es MOE muestral. No proclamar ganador.`,
      tone: "warning",
      declareWinner: false,
    };
  }
  return {
    headline: `${leader} adelanta en promedio CR`,
    detail: `Promedio simple Ipsos + Datum CR: ${avg.b.toFixed(2)}% / ${avg.a.toFixed(2)}%.`,
    tone: "info",
    declareWinner: false,
    winnerLabel: leader,
  };
}
