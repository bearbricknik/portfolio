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
 * row. Fades in once in view (and after the page's streaming text).
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
    // Title, count and line fade in together
    <motion.div
      ref={ref}
      id={id}
      // Title and count share the baseline; the line sits in the middle of the row
      className={cn("flex items-baseline gap-2", className)}
      initial="hidden"
      animate={visible ? "shown" : "hidden"}
      variants={{
        hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" },
        shown: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE } },
      }}
    >
      <Tag className="font-medium">{children}</Tag>
      {count !== undefined && <span className="text-sm text-muted-foreground">{count}</span>}
      <span aria-hidden className="h-px flex-1 self-center bg-border" />
    </motion.div>
  );
}
