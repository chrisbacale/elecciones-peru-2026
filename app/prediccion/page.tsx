import type { Metadata } from "next";
import { PredictionClient } from "@/components/prediccion/PredictionClient";
import { getKnownOnpeSnapshot } from "@/lib/onpe-client";
import { buildPredictionSnapshot } from "@/lib/prediction";

export const metadata: Metadata = {
  title: "Predicción estadística 2026 | Radar Electoral Perú",
  description:
    "Escenarios de cierre ONPE 2026, margen de error Ipsos/Datum, voto exterior y requisitos de reversión sin proclamar ganador.",
};

export default function PrediccionPage() {
  const initialPrediction = buildPredictionSnapshot(getKnownOnpeSnapshot());
  return <PredictionClient initialPrediction={initialPrediction} />;
}
