import type { Metadata } from "next";
import { PredictionClient } from "@/components/prediccion/PredictionClient";
import { fetchOnpeResumen } from "@/lib/onpe-client";
import { buildPredictionSnapshot } from "@/lib/prediction";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Predicción estadística 2026 | Radar Electoral Perú",
  description:
    "Escenarios de cierre ONPE 2026, margen de error Ipsos/Datum, voto exterior y requisitos de reversión sin proclamar ganador.",
};

export default async function PrediccionPage() {
  const initialPrediction = buildPredictionSnapshot(await fetchOnpeResumen());
  return <PredictionClient initialPrediction={initialPrediction} />;
}
