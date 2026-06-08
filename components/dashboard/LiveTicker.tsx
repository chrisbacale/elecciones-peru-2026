"use client";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatRelativeTime, formatVotes } from "@/lib/format";
import type { OnpeResumen } from "@/lib/types";

function VoteLine({ votes }: { votes: number | null }) {
  if (votes === null) {
    return <span>votos no publicados en este corte</span>;
  }

  return <span>{formatVotes(votes)} votos</span>;
}

export function LiveTicker({ data }: { data: OnpeResumen }) {
  return (
    <Card className="border-onpe/30 bg-onpe-muted">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>ONPE - Escrutinio parcial</CardTitle>
          <StatusBadge status={data.status} />
        </div>
        <CardDescription aria-live="polite">
          Actualizado {formatRelativeTime(data.timestamp)}
          {data.message ? ` · ${data.message}` : ""}
        </CardDescription>
      </CardHeader>

      <div className="space-y-6">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted">Actas contabilizadas</span>
            <span className="font-mono font-medium">
              <AnimatedNumber value={data.advancePct} decimals={1} suffix="%" />
            </span>
          </div>
          <Progress value={data.advancePct} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-card p-4">
            <p className="text-xs text-keiko font-medium">Keiko Fujimori</p>
            <p className="text-3xl font-bold font-mono text-keiko">
              <AnimatedNumber value={data.candidates.keiko.pct} decimals={2} suffix="%" />
            </p>
            <p className="text-xs text-muted mt-1">
              <VoteLine votes={data.candidates.keiko.votes} />
            </p>
          </div>
          <div className="rounded-lg bg-card p-4">
            <p className="text-xs text-sanchez font-medium">Roberto Sánchez</p>
            <p className="text-3xl font-bold font-mono text-sanchez">
              <AnimatedNumber value={data.candidates.sanchez.pct} decimals={2} suffix="%" />
            </p>
            <p className="text-xs text-muted mt-1">
              <VoteLine votes={data.candidates.sanchez.votes} />
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-card-border bg-card p-4 text-center">
          <p className="text-sm text-muted">Margen actual</p>
          <p className="text-xl font-bold font-mono">
            {data.marginLeader}{" "}
            <AnimatedNumber value={data.marginPp} decimals={2} suffix=" pp" />
          </p>
        </div>
      </div>
    </Card>
  );
}
