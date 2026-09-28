"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type SkillMeterProps = {
  /** Filled bars */
  value: number;
  /** Total bars */
  max: number;
  /** Level name next to the bars, e.g. "Fortgeschritten" */
  label: string;
  className?: string;
};

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Skill level as a row of short bars plus its name. The filled bars grow in
 * one after another when the surrounding motion parent switches to "shown"
 * (e.g. a ToolGroup revealing its rows), so it needs no trigger of its own.
 */
export function SkillMeter({ value, max, label, className }: SkillMeterProps) {
  const reducedMotion = useReducedMotion();

  return (
    <span className={cn("inline-flex items-center gap-2 text-[13px] whitespace-nowrap text-muted-foreground", className)}>
      <span className="sr-only">{`${label} (${value}/${max})`}</span>
      <span aria-hidden className="inline-flex gap-[3px]">
        {Array.from({ length: max }, (_, index) => (
          <span key={index} className="relative h-1 w-3.5 overflow-hidden rounded-full bg-muted">
            {index < value && (
              <motion.span
                className="absolute inset-0 origin-left rounded-full bg-foreground"
                variants={{
                  hidden: reducedMotion ? { opacity: 0 } : { scaleX: 0 },
                  shown: reducedMotion
                    ? { opacity: 1 }
                    : { scaleX: 1, transition: { duration: 0.6, ease: EASE, delay: 0.25 + index * 0.1 } },
                }}
              />
            )}
          </span>
        ))}
      </span>
      <span aria-hidden>{label}</span>
    </span>
  );
}
