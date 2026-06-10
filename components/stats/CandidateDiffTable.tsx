import { calcCandidateError, getOnpeComparisonBaseline } from "@/lib/stats";
import { formatPct } from "@/lib/format";
import type { ElectionRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

function ErrorCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted">—</span>;

  const tone =
    value <= 0.5 ? "text-onpe" : value <= 1.0 ? "text-alert" : "text-keiko";

  return (
    <span className={cn("font-mono text-sm tabular-nums", tone)}>
      {value.toFixed(2)} pp
    </span>
  );
}

export function CandidateDiffTable({
  elections,
}: {
  elections: ElectionRecord[];
}) {
  const completed = elections.filter((e) => e.instruments.onpe100 !== null);

  return (
    <div className="space-y-2">
    <p className="text-xs text-muted">
      Base ONPE: se usa el baseline redondeado de la tabla Ipsos cuando existe;
      por eso coincide con las tarjetas agregadas.
    </p>
    <div className="overflow-x-auto rounded-xl border border-card-border">
      <table className="w-full min-w-[900px] text-left text-sm">
        <caption className="sr-only">
          Diferencias por candidato entre estimaciones Ipsos y ONPE 100%.
        </caption>
        <thead className="bg-card text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-4 py-3">Año</th>
            <th className="px-4 py-3">Candidatos</th>
            <th className="px-4 py-3">ONPE 100%</th>
            <th className="px-4 py-3" colSpan={3}>
              Boca Ipsos
            </th>
            <th className="px-4 py-3" colSpan={3}>
              CR Ipsos
            </th>
          </tr>
          <tr className="border-t border-card-border text-[10px] normal-case text-muted">
            <th colSpan={3} />
            <th className="px-4 py-2">Est.</th>
            <th className="px-4 py-2">Err. A</th>
            <th className="px-4 py-2">Err. B</th>
            <th className="px-4 py-2">Est.</th>
            <th className="px-4 py-2">Err. A</th>
            <th className="px-4 py-2">Err. B</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border">
          {completed.map((election) => {
            const onpe = election.instruments.onpe100!;
            const baseline = getOnpeComparisonBaseline(onpe);
            const boca = election.instruments.bocaUrna.ipsos;
            const cr = election.instruments.conteoRapido.ipsos;

            return (
              <tr key={election.year} className="hover:bg-card/60">
                <td className="px-4 py-3 font-mono font-medium tabular-nums">
                  {election.year}
                </td>
                <td className="px-4 py-3">
                  <span className="block">{election.candidates.a}</span>
                  <span className="block text-muted">vs {election.candidates.b}</span>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {formatPct(baseline.a, 2)} / {formatPct(baseline.b, 2)}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {boca ? (
                    <>
                      {formatPct(boca.a, 1)} / {formatPct(boca.b, 1)}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <ErrorCell
                    value={boca ? calcCandidateError(boca.a, baseline.a) : null}
                  />
                </td>
                <td className="px-4 py-3">
                  <ErrorCell
                    value={boca ? calcCandidateError(boca.b, baseline.b) : null}
                  />
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {cr ? (
                    <>
                      {formatPct(cr.a, 1)} / {formatPct(cr.b, 1)}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <ErrorCell
                    value={cr ? calcCandidateError(cr.a, baseline.a) : null}
                  />
                </td>
                <td className="px-4 py-3">
                  <ErrorCell
                    value={cr ? calcCandidateError(cr.b, baseline.b) : null}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}
