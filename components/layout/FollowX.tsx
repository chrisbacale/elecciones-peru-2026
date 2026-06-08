"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const X_URL = "https://x.com/CMMB1204";

function XMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground font-mono text-sm font-black text-background",
        className,
      )}
      aria-hidden="true"
    >
      X
    </span>
  );
}

export function FollowXNavLink() {
  return (
    <a
      href={X_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Seguir a CIM en X, se abre en una nueva pestaña"
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-card-border bg-card/80 px-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <XMark className="h-6 w-6 text-xs" />
      <span className="hidden xl:inline">CIM</span>
    </a>
  );
}

export function FollowXRibbon() {
  return (
    <a
      href={X_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Seguir las actualizaciones de CIM en X, se abre en una nueva pestaña"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-50 hidden h-12 w-12 max-w-[calc(100vw-2rem)] items-center justify-center gap-3 rounded-full border border-card-border bg-card/95 p-0 text-sm font-semibold text-foreground shadow-xl shadow-black/25 backdrop-blur transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex sm:h-auto sm:w-auto sm:rounded-xl sm:px-3 sm:py-2"
    >
      <XMark />
      <span className="hidden sm:block">
        CIM para mejores decisiones
      </span>
      <ExternalLink className="hidden h-4 w-4 text-muted sm:block" aria-hidden="true" />
    </a>
  );
}
