"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

import { type RevealGateOptions, useRevealGate } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";

export type HandwrittenArrow = "left" | "right" | "up" | "down";

// Arrow drawn pointing right; other directions rotate it
const ARROW_ROTATION: Record<HandwrittenArrow, number> = { right: 0, down: 90, left: 180, up: -90 };

/** Loose, slightly wobbly hand-drawn arrow (shaft + head as separate strokes) */
function Arrow({ direction, visible, delay }: { direction: HandwrittenArrow; visible: boolean; delay: number }) {
  const draw = (extraDelay: number, duration: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: visible ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 },
    transition: {
      pathLength: { duration, ease: "easeInOut" as const, delay: delay + extraDelay },
      opacity: { duration: 0.01, delay: delay + extraDelay },
    },
  });

  return (
    <svg
      aria-hidden
      viewBox="0 0 64 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-12 shrink-0"
      style={{ rotate: `${ARROW_ROTATION[direction]}deg` }}
    >
      <motion.path d="M3 9C12 21 30 26 57 19" {...draw(0, 0.5)} />
      <motion.path d="M47 12.5C51 15 54 17 57.5 19C53.5 21 50 23.5 47.5 27" {...draw(0.45, 0.25)} />
    </svg>
  );
}

type HandwrittenNoteProps = RevealGateOptions & {
  /** The handwritten text (any string, translatable) */
  children: React.ReactNode;
  /** Optional hand-drawn arrow after the text, pointing in this direction */
  arrow?: HandwrittenArrow;
  /** Seconds to wait once the note may appear, e.g. to let a parent fade in first */
  delay?: number;
  /** Seconds the "writing" of the text takes */
  duration?: number;
  /**
   * Rotation of the whole note in degrees. Negative rises to the top right
   * (like a quick scribble), 0 sits straight on the baseline, positive falls.
   */
  tilt?: number;
  className?: string;
};

/**
 * A handwritten note: the text is revealed left to right as if written, then
 * an optional arrow draws itself. Starts once in view (and after `after`).
 * The text stays real text, so it's translatable, selectable and indexable.
 */
export function HandwrittenNote({
  children,
  arrow,
  after,
  waitForStreams,
  delay = 0,
  duration = 0.9,
  tilt = -3,
  className,
}: HandwrittenNoteProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const gateOpen = useRevealGate(ref, { after, waitForStreams });
  const reducedMotion = useReducedMotion();
  const visible = gateOpen || reducedMotion === true;

  return (
    <span
      ref={ref}
      className={cn("inline-flex items-center gap-1 font-handwriting text-muted-foreground", className)}
      // Rotates around the start of the text, so the first letter stays in place
      style={{ rotate: `${tilt}deg`, transformOrigin: "left center" }}
    >
      <motion.span
        className="inline-block"
        initial={{ clipPath: "inset(-20% 100% -20% 0)" }}
        animate={{ clipPath: visible ? "inset(-20% 0% -20% 0)" : "inset(-20% 100% -20% 0)" }}
        transition={{ duration: reducedMotion ? 0 : duration, ease: [0.45, 0, 0.55, 1], delay }}
      >
        {children}
      </motion.span>
      {arrow && <Arrow direction={arrow} visible={visible} delay={reducedMotion ? 0 : delay + duration * 0.8} />}
    </span>
  );
}
