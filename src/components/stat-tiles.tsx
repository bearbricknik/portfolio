"use client";

import { type ReactNode, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

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

// Reveal choreography (seconds): the frame fades in with the row, then the
// tiles come in one by one
const TILES_DELAY = 0.15;
const TILE_STAGGER = 0.1;

/**
 * A row of key figures. Once in view (and, with `waitForStreams`, after the
 * page's streaming text) the row with its hairlines fades in, the tiles follow
 * one after another and each number rolls up from 0 to its value (NumberFlow).
 */
export function StatTiles({ items, after, waitForStreams = true, className }: StatTilesProps) {
  const ref = useRef<HTMLDListElement>(null);
  const visible = useRevealGate(ref, { after, waitForStreams });
  const reducedMotion = useReducedMotion();

  return (
    <motion.dl
      ref={ref}
      className={cn("grid border-y", className)}
      // One column per tile, however many there are
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      initial="hidden"
      animate={visible ? "shown" : "hidden"}
      // The frame (hairlines) simply fades in with the row
      variants={{ hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.5, ease: EASE } } }}
    >
      {items.map((item, index) => (
        // pt-2 / pb-3.5: NumberFlow pads its digits ~6px for the rolling mask, so
        // this evens out the visible space above the number and below the label
        <div key={index} className="flex flex-col pt-2 pb-3.5 not-first:border-l not-first:pl-4">
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
