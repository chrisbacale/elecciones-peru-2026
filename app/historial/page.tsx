import { HistorialView } from "@/components/historial/historial-view";
import { elections } from "@/lib/data";
import { CalendarClock, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Historial comparativo | Radar Electoral Perú",
  description:
    "Tabla y gráficos de segunda vuelta 2001–2026: simulacro, boca, conteo rápido y ONPE 100%.",
};

export default function HistorialPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Historial comparativo electoral
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted sm:text-base">
              Segunda vuelta presidencial peruana: simulacro, boca de urna,
              conteo rápido y ONPE/JNE. La serie comparable arranca en 2001;
              no hubo balotaje presidencial peruano comparable en 2003.
            </p>
          </div>
          <div className="grid gap-2 text-xs text-muted sm:grid-cols-2 lg:w-[420px]">
            <div className="rounded-xl border border-card-border bg-card/70 p-3">
              <CalendarClock className="mb-2 h-4 w-4 text-poll" aria-hidden="true" />
              Corte vivo: 8 de junio de 2026, ONPE 2026 aún parcial.
            </div>
            <div className="rounded-xl border border-card-border bg-card/70 p-3">
              <ShieldCheck className="mb-2 h-4 w-4 text-onpe" aria-hidden="true" />
              Resultado legal: ONPE/JNE, no encuestadoras.
            </div>
          </div>
        </div>
        <p className="rounded-xl border border-alerta/35 bg-alerta-muted p-4 text-sm leading-relaxed text-foreground">
          Lectura correcta: una boca de urna puede orientar, un conteo rápido
          puede estimar con más precisión y una ONPE parcial contiene votos
          reales, pero solo ONPE/JNE final cierra la elección. El parcial no se
          extrapola como muestra aleatoria.
        </p>
      </header>

      <HistorialView elections={elections} />
    </div>
  );
}
