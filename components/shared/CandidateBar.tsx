import { cn } from "@/lib/utils";

type CandidateBarProps = {
  pctA: number;
  pctB: number;
  labelA?: string;
  labelB?: string;
  showLabels?: boolean;
  className?: string;
};

export function CandidateBar({
  pctA,
  pctB,
  labelA = "Keiko",
  labelB = "Sánchez",
  showLabels = true,
  className,
}: CandidateBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {showLabels ? (
        <div className="flex justify-between text-xs font-medium">
          <span className="text-keiko">
            {labelA}{" "}
            <span className="font-mono tabular-nums">{pctA.toFixed(1)}%</span>
          </span>
          <span className="text-sanchez">
            <span className="font-mono tabular-nums">{pctB.toFixed(1)}%</span>{" "}
            {labelB}
          </span>
        </div>
      ) : null}
      <div
        className="flex h-3 overflow-hidden rounded-full bg-accent"
        role="img"
        aria-label={`${labelA} ${pctA.toFixed(1)}%, ${labelB} ${pctB.toFixed(1)}%`}
      >
        <div
          className="bg-keiko transition-all duration-700 ease-out"
          style={{ width: `${pctA}%` }}
        />
        <div
          className="bg-sanchez transition-all duration-700 ease-out"
          style={{ width: `${pctB}%` }}
        />
      </div>
    </div>
  );
}
