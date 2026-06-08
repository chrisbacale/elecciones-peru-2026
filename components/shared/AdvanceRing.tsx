"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";

export function AdvanceRing({
  advancePct,
  label = "Actas contabilizadas",
}: {
  advancePct: number;
  label?: string;
}) {
  const reduceMotion = useReducedMotion();
  const size = 160;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (advancePct / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`${label}: ${advancePct.toFixed(1)} por ciento`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-accent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--onpe)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduceMotion ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduceMotion ? 0 : 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={advancePct}
          decimals={1}
          suffix="%"
          className="text-3xl font-bold text-onpe"
        />
        <span className="mt-1 max-w-[100px] text-center text-[10px] uppercase tracking-wide text-muted">
          {label}
        </span>
      </div>
    </div>
  );
}
