import { AlertTriangle } from "lucide-react";
import { flashElectoral } from "@/lib/data";

export function LimaFirstNote() {
  const lima = flashElectoral.territorial.ipsos.lima_cr;
  const regiones = flashElectoral.territorial.ipsos.regiones_cr;
  const onpePartial = flashElectoral.sources.find((s) => s.id === "onpe-parcial");
  const advance = onpePartial?.data.advancePct;
  const marginPp = onpePartial?.data.marginPp;
  const leaderLabel =
    onpePartial?.data.marginLeader === "b" ? "Sánchez" : "Keiko";

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
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
            El escrutinio parcial de la ONPE no avanza de forma uniforme: las actas
            de <strong className="text-foreground">Lima Metropolitana y Callao</strong>{" "}
            suelen procesarse antes que el interior. Lima favorece ampliamente a Keiko
            (Ipsos CR: {lima?.a ?? 63.6}% vs {lima?.b ?? 36.4}%), mientras las regiones
            inclinan hacia Sánchez ({regiones?.a ?? 42.6}% vs {regiones?.b ?? 57.4}%).
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Por eso en los primeros cortes el parcial ONPE llegó a mostrar a Keiko
            con ventaja de <strong className="text-keiko">~+4 pp</strong>, mientras
            el conteo rápido Ipsos (100% actas muestra) ya registraba un{" "}
            <strong className="text-foreground">empate técnico</strong> con leve
            ventaja de Sánchez (50.3% vs 49.7%, ±1.9). Al{" "}
            {advance != null ? `${advance.toFixed(1)}%` : "96.9%"} de avance, el
            sesgo Lima-first ya se agotó y el parcial converge con el conteo rápido
            ({leaderLabel} +{marginPp != null ? marginPp.toFixed(3) : "0.173"} pp).
            No confundir orden de escrutinio con resultado definitivo.
          </p>
        </div>
      </div>
    </aside>
  );
}
