import { AlertTriangle } from "lucide-react";

export function LimaFirstNote() {
  return (
    <aside
      className="rounded-xl border border-alert/25 bg-alert/5 p-4"
      aria-labelledby="lima-first-note"
    >
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-alert"
          aria-hidden
        />
        <div>
          <h2 id="lima-first-note" className="font-semibold text-alert">
            Lima cuenta primero
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            El escrutinio parcial de la ONPE no avanza de forma uniforme: las actas
            de <strong className="text-slate-100">Lima Metropolitana y Callao</strong>{" "}
            suelen procesarse antes que el interior. Lima favorece ampliamente a Keiko
            (Ipsos CR: 63.6% vs 36.4%), mientras el interior inclina hacia Sánchez
            (36.4% vs 63.6%).
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Por eso el parcial ONPE puede mostrar a Keiko con ventaja de{" "}
            <strong className="text-keiko">~+5 pp</strong> mientras el conteo
            rápido Ipsos (100% actas muestra) registra un{" "}
            <strong className="text-slate-200">empate técnico</strong> a favor de
            Sánchez (50.3% vs 49.7%, ±1.9). No confundir orden de escrutinio con
            resultado definitivo.
          </p>
        </div>
      </div>
    </aside>
  );
}
