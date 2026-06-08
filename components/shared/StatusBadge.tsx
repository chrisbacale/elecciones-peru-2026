import { Badge } from "@/components/ui/badge";
import type { OnpeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<
  OnpeStatus,
  { text: string; variant: "live" | "snapshot" | "warning" }
> = {
  live: { text: "En vivo", variant: "live" },
  intermittent: { text: "API intermitente", variant: "warning" },
  snapshot: { text: "Último snapshot", variant: "snapshot" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: OnpeStatus;
  className?: string;
}) {
  const { text, variant } = STATUS_LABELS[status];

  return (
    <Badge variant={variant} className={cn("gap-1.5", className)}>
      {status === "live" ? (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-onpe opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-onpe" />
        </span>
      ) : null}
      {text}
    </Badge>
  );
}

const SOURCE_LABELS = {
  oficial: { text: "Oficial", variant: "oficial" as const },
  encuesta: { text: "Encuesta", variant: "encuesta" as const },
  muestra: { text: "Muestra", variant: "muestra" as const },
};

export function SourceTypeBadge({
  type,
}: {
  type: "oficial" | "encuesta" | "muestra";
}) {
  const { text, variant } = SOURCE_LABELS[type];
  return <Badge variant={variant}>{text}</Badge>;
}
