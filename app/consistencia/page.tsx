import { ConsistencyCalculator } from "@/components/consistencia/ConsistencyCalculator";

export default function ConsistenciaPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">⚖️ Consistencia matemática</h1>
        <p className="mt-2 text-muted max-w-3xl">
          ¿Puede el bloque de actas pendientes acercar el resultado al conteo rápido Ipsos?
          Calculadora actualizada con cada poll ONPE (~90s).
        </p>
      </header>
      <ConsistencyCalculator />
    </div>
  );
}
