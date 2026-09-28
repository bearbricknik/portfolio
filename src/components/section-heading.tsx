"use client";

import { type ReactNode, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

import { type RevealGateOptions, useRevealGate } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = RevealGateOptions & {
  children: ReactNode;
  /** Optional number of entries, shown muted next to the title */
  count?: number;
  /** Heading level (default h2) */
  as?: "h2" | "h3";
  id?: string;
  className?: string;
};

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Section title with an optional count and a hairline filling the rest of the
 * row. Once in view, the title fades in and the line draws itself to the right.
 */
export function SectionHeading({
  children,
  count,
  as: Tag = "h2",
  id,
  after,
  waitForStreams = true,
  className,
}: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRevealGate(ref, { after, waitForStreams });
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      id={id}
      className={cn("flex items-center gap-3", className)}
      initial="hidden"
      animate={visible ? "shown" : "hidden"}
    >
      <motion.div
        className="flex items-baseline gap-3"
        variants={{
          hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" },
          shown: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE } },
        }}
      >
        <Tag className="font-medium">{children}</Tag>
        {count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
      </motion.div>
      <motion.span
        aria-hidden
        className="h-px flex-1 origin-left bg-border"
        variants={{
          hidden: reducedMotion ? { opacity: 0 } : { scaleX: 0 },
          shown: reducedMotion
            ? { opacity: 1 }
            : { scaleX: 1, transition: { duration: 0.8, ease: EASE, delay: 0.1 } },
        }}
      />
    </motion.div>
  );
}
