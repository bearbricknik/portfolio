"use client";

import { type ReactNode, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

import { type RevealGateOptions, useRevealGate } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = RevealGateOptions & {
  children: ReactNode;
  /** Optional number of entries, shown muted next to the title */
  count?: number;
  /** Heading level (default h2), or "div" when the row isn't a heading (e.g. a post's meta line) */
  as?: "h2" | "h3" | "div";
  /** Something in front of the title, e.g. a round back button */
  leading?: ReactNode;
  /** Classes for the title, e.g. to set it smaller and muted */
  titleClassName?: string;
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
  leading,
  titleClassName,
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
      className={cn("flex gap-2", leading ? "items-center" : "items-baseline", className)}
      initial="hidden"
      animate={visible ? "shown" : "hidden"}
      // Not interactive until it has appeared (e.g. links, the back button)
      inert={!visible}
      variants={{
        hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" },
        shown: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE } },
      }}
    >
      {leading}
      <Tag className={cn("font-medium", titleClassName)}>{children}</Tag>
      {count !== undefined && <span className="text-sm text-muted-foreground">{count}</span>}
      <span aria-hidden className="h-px flex-1 self-center bg-border" />
    </motion.div>
  );
}
