"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
};

export function AnimatedNumber({
  value,
  decimals = 2,
  suffix = "",
  prefix = "",
  className,
  duration = 0.6,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const reduceMotion = useReducedMotion();
  const displayValue = reduceMotion ? value : display;

  useEffect(() => {
    if (reduceMotion) {
      prev.current = value;
      return;
    }

    const controls = animate(prev.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  return (
    <span
      className={cn("font-mono tabular-nums", className)}
      aria-atomic="true"
    >
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}
