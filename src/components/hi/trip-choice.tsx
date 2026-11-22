"use client";

import { useRef } from "react";
import type { StaticImageData } from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { HandwrittenNote } from "@/components/handwritten-note";
import { HI_ACCENT_RING } from "@/components/hi/accent";
import { useHiState } from "@/components/hi/hi-state";
import { Polaroid } from "@/components/polaroid";
import { useInstantReveal, useRevealGate } from "@/components/scroll-reveal";
import type { HiTrip } from "@/lib/hi";
import { cn } from "@/lib/utils";

export type TripOption = { key: HiTrip; src: StaticImageData; label: string; alt: string };

type TripChoiceProps = {
  /** Exactly two trips, left and right */
  options: [TripOption, TripOption];
  /** Shown under the photos before a choice is made */
  hint: string;
  /** Handwritten under the photos once a trip is chosen */
  picked: string;
  /** Wait for this stream (with locale) before the photos appear */
  after?: string;
};

const SPRING = { type: "spring", stiffness: 320, damping: 24 } as const;
// Casual tilt of the two cards while nothing is chosen: they lean towards each other
const TILT = [-4, 4];

/**
 * Two polaroids to choose a trip from. The chosen one straightens up and comes
 * forward, the other steps back; the choice travels along with the answer to
 * the date question.
 */
export function TripChoice({ options, hint, picked, after }: TripChoiceProps) {
  const { trip, setTrip } = useHiState();
  const reducedMotion = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRevealGate(ref, { after });
  const instant = useInstantReveal();

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center gap-3 py-8"
      initial={instant ? false : { opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={visible ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      inert={!visible}
    >
      <div role="radiogroup" className="flex items-center justify-center gap-3 sm:gap-6">
        {options.map((option, index) => {
          const selected = trip === option.key;
          const dimmed = trip !== null && !selected;

          return (
            <motion.button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              data-cursor={option.label}
              onClick={() => setTrip(option.key)}
              className={cn("relative rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50", index === 1 && "order-3")}
              initial={false}
              animate={{
                rotate: selected ? 0 : TILT[index],
                scale: selected ? 1.06 : dimmed ? 0.94 : 1,
                opacity: dimmed ? 0.55 : 1,
                filter: dimmed ? "grayscale(0.6)" : "grayscale(0)",
              }}
              whileHover={reducedMotion ? undefined : { y: -6 }}
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              transition={reducedMotion ? { duration: 0 } : SPRING}
            >
              <Polaroid
                photo={{ src: option.src, alt: option.alt, caption: option.label }}
                size="md"
                reducedMotion={reducedMotion}
                className={cn("shadow-md transition-shadow", selected && cn("shadow-xl ring-2", HI_ACCENT_RING))}
              />
            </motion.button>
          );
        })}
        <span aria-hidden className="order-2 text-2xl">
          {trip ? "😍" : "🤔"}
        </span>
      </div>

      {/* Same height either way, so nothing jumps when the note replaces the hint */}
      <div className="flex h-8 items-center">
        {trip ? (
          <HandwrittenNote key={trip} tilt={-2}>
            {picked}
          </HandwrittenNote>
        ) : (
          <span className="text-sm text-muted-foreground">{hint}</span>
        )}
      </div>
    </motion.div>
  );
}
