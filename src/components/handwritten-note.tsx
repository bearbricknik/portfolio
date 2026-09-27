"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

import { type RevealGateOptions, useRevealGate } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";

export type HandwrittenArrow = "left" | "right" | "up" | "down";

// Arrow drawn pointing right; other directions rotate it
const ARROW_ROTATION: Record<HandwrittenArrow, number> = { right: 0, down: 90, left: 180, up: -90 };

/** Loose, slightly wobbly hand-drawn arrow (shaft + head as separate strokes) */
/**
 * Arrow shapes, both drawn pointing right:
 * - sweep: short, flat curve (after the text)
 * - hook: starts steeply downwards, then flattens out to the right (below the text)
 */
const ARROW_SHAPES = {
  sweep: {
    viewBox: "0 0 64 32",
    className: "h-6 w-12",
    shaft: "M3 9C12 21 30 26 57 19",
    head: "M47 12.5C51 15 54 17 57.5 19C53.5 21 50 23.5 47.5 27",
  },
  hook: {
    viewBox: "0 0 64 48",
    className: "h-12 w-16",
    shaft: "M5 3C6 20 16 36 55 37",
    head: "M46 31C50 33.5 53 35.5 56.5 37C52.5 39 49 41.5 46.5 44",
  },
} as const;

function Arrow({
  direction,
  shape,
  visible,
  delay,
  className,
}: {
  direction: HandwrittenArrow;
  shape: keyof typeof ARROW_SHAPES;
  visible: boolean;
  delay: number;
  className?: string;
}) {
  const { viewBox, className: sizeClassName, shaft, head } = ARROW_SHAPES[shape];
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
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", sizeClassName, className)}
      style={{ rotate: `${ARROW_ROTATION[direction]}deg` }}
    >
      <motion.path d={shaft} {...draw(0, 0.5)} />
      <motion.path d={head} {...draw(0.45, 0.25)} />
    </svg>
  );
}

type HandwrittenNoteProps = RevealGateOptions & {
  /** The handwritten text (any string, translatable) */
  children: React.ReactNode;
  /** Optional hand-drawn arrow, pointing in this direction */
  arrow?: HandwrittenArrow;
  /**
   * Where the arrow sits: "end" = right after the text, "below" = under the
   * text, sweeping out to the right (like a note pointing at something next to it)
   */
  arrowPosition?: "end" | "below";
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
  arrowPosition = "end",
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
  const below = arrowPosition === "below";
  // Rotates around the start of the text, so the first letter stays in place.
  // Below: only the text tilts, so the arrow keeps pointing at its target.
  const tiltStyle = { rotate: `${tilt}deg`, transformOrigin: "left center" };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex font-handwriting text-muted-foreground",
        below ? "flex-col items-start" : "items-center gap-1",
        className,
      )}
      style={below ? undefined : tiltStyle}
    >
      <motion.span
        className="inline-block"
        style={below ? tiltStyle : undefined}
        initial={{ clipPath: "inset(-20% 100% -20% 0)" }}
        animate={{ clipPath: visible ? "inset(-20% 0% -20% 0)" : "inset(-20% 100% -20% 0)" }}
        transition={{ duration: reducedMotion ? 0 : duration, ease: [0.45, 0, 0.55, 1], delay }}
      >
        {children}
      </motion.span>
      {arrow && (
        <Arrow
          direction={arrow}
          shape={below ? "hook" : "sweep"}
          visible={visible}
          delay={reducedMotion ? 0 : delay + duration * 0.8}
          // Below: starts under the end of the text and reaches out past it; the
          // tip sits ~11px above the note's bottom edge (align targets to that)
          className={below ? "self-end translate-x-2" : undefined}
        />
      )}
    </span>
  );
}
