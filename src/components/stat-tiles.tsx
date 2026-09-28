"use client";

import { type ReactNode, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { AnimatedNumber } from "@/components/animated-number";
import { type RevealGateOptions, useRevealGate } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";

export type StatTile = {
  value: number;
  label: ReactNode;
};

type StatTilesProps = RevealGateOptions & {
  /** Any number of tiles, laid out in one row with hairlines in between */
  items: StatTile[];
  className?: string;
};

const EASE = [0.23, 1, 0.32, 1] as const;

// Reveal choreography (seconds): the top and bottom rules draw first, then the
// dividers grow down between the tiles, then the tiles come in one by one
const RULE_DURATION = 0.7;
const DIVIDER_DELAY = 0.25;
const TILES_DELAY = 0.35;
const TILE_STAGGER = 0.1;

/** A hairline that draws itself along its axis once shown */
function Rule({ axis, delay, className }: { axis: "x" | "y"; delay: number; className: string }) {
  const reducedMotion = useReducedMotion();
  const transition = { duration: RULE_DURATION, ease: EASE, delay };
  const variants: Variants = reducedMotion
    ? { hidden: { opacity: 0 }, shown: { opacity: 1 } }
    : axis === "x"
      ? { hidden: { scaleX: 0 }, shown: { scaleX: 1, transition } }
      : { hidden: { scaleY: 0 }, shown: { scaleY: 1, transition } };

  return (
    <motion.span
      aria-hidden
      className={cn("pointer-events-none absolute bg-border", axis === "x" ? "origin-left" : "origin-top", className)}
      variants={variants}
    />
  );
}

/**
 * A row of key figures. Once in view (and, with `waitForStreams`, after the
 * page's streaming text) the frame draws itself, the tiles fade in one after
 * another and each number rolls up from 0 to its value (NumberFlow).
 */
export function StatTiles({ items, after, waitForStreams = true, className }: StatTilesProps) {
  const ref = useRef<HTMLDListElement>(null);
  const visible = useRevealGate(ref, { after, waitForStreams });
  const reducedMotion = useReducedMotion();

  return (
    <motion.dl
      ref={ref}
      className={cn("relative grid", className)}
      // One column per tile, however many there are
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      initial="hidden"
      animate={visible ? "shown" : "hidden"}
    >
      <Rule axis="x" delay={0} className="inset-x-0 top-0 h-px" />
      <Rule axis="x" delay={0.08} className="inset-x-0 bottom-0 h-px" />

      {items.map((item, index) => (
        // pt-2 / pb-3.5: NumberFlow pads its digits ~6px for the rolling mask, so
        // this evens out the visible space above the number and below the label
        <div key={index} className="relative flex flex-col pt-2 pb-3.5 not-first:pl-4">
          {index > 0 && <Rule axis="y" delay={DIVIDER_DELAY + index * 0.06} className="inset-y-0 left-0 w-px" />}
          <motion.div
            className="flex flex-col"
            variants={{
              hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(4px)" },
              shown: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 0.6, ease: EASE, delay: reducedMotion ? 0 : TILES_DELAY + index * TILE_STAGGER },
              },
            }}
          >
            {/* Label first in the markup (dt before dd), value first on screen */}
            <dt className="order-last text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-2xl leading-tight font-medium tracking-tight tabular-nums">
              {/* Rolls up from 0 once the tiles are revealed */}
              <AnimatedNumber value={visible ? item.value : 0} />
            </dd>
          </motion.div>
        </div>
      ))}
    </motion.dl>
  );
}
