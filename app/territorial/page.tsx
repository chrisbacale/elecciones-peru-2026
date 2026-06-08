import { TerritorialView } from "@/components/territorial/TerritorialView";
import { flashElectoral } from "@/lib/data";

export const metadata = {
  title: "Territorial | Radar Electoral Perú",
  description:
    "Splits geográficos Ipsos 2026 y mapa departamental ONPE en vivo.",
};

export default function TerritorialPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">🗺️ Análisis territorial</h1>
        <p className="mt-2 text-muted max-w-3xl">
          Splits geográficos Ipsos 2026 y mapa departamental ONPE en vivo cuando la API responde.
        </p>
      </header>
      <TerritorialView ipsos={flashElectoral.territorial.ipsos} />
    </div>
  );
}
