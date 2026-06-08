import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-border bg-accent text-accent-foreground",
        oficial: "border-transparent bg-onpe-muted text-onpe",
        encuesta: "border-transparent bg-encuesta-muted text-encuesta",
        muestra: "border-transparent bg-sanchez-muted text-sanchez",
        live: "border-transparent bg-onpe-muted text-onpe",
        intermittent: "border-transparent bg-alerta-muted text-alerta",
        snapshot: "border-border bg-card text-muted",
        warning: "border-transparent bg-alerta-muted text-alerta",
        alert: "border-transparent bg-alerta-muted text-alerta",
        keiko: "border-transparent bg-keiko-muted text-keiko",
        sanchez: "border-transparent bg-sanchez-muted text-sanchez",
        onpe: "border-transparent bg-onpe-muted text-onpe",
        encuestas: "border-transparent bg-encuesta-muted text-encuesta",
        alerta: "border-transparent bg-alerta-muted text-alerta",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
