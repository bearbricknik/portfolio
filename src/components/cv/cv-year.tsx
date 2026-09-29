"use client";

import { type ReactNode, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

import { useRevealGate } from "@/components/scroll-reveal";

const EASE = [0.23, 1, 0.32, 1] as const;

type CvYearProps = {
  year: number;
  /** End of a time span, e.g. 2021 or "heute": shown below "2017 –" */
  until?: number | string;
  children: ReactNode;
};

/**
 * One row of the CV register: the year (or the span, end below the start) on
 * the left, sticking while its entries scroll by, the entries on the right. Years are separated by a
 * hairline and fade in once in view (after the page's streaming text).
 */
export function CvYear({ year, until, children }: CvYearProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRevealGate(ref, { waitForStreams: true });
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      // Year column: 48px + 12px gap on phones (fits "2026 –"), 56px + 16px from sm
      className="grid grid-cols-[3rem_1fr] gap-x-3 border-t pt-4 pb-1 first:border-t-0 first:pt-2 sm:grid-cols-[3.5rem_1fr] sm:gap-x-4"
      initial="hidden"
      animate={visible ? "shown" : "hidden"}
      variants={{
        hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" },
        shown: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE } },
      }}
    >
      {/* pt-0.5: on the first line of the entry next to it. top-22: sticks below
          the 5rem blurred top edge of the scroll area (only while it's stuck) */}
      <span className="sticky top-22 flex flex-col self-start pt-0.5 whitespace-nowrap text-sm leading-6 text-muted-foreground">
        {/* A span reads "2017 –" with its end on the next line, same size and color */}
        <span>
          {year}
          {until !== undefined && " –"}
        </span>
        {/* leading-4: sits right under the first line (that one keeps the 24px line
            the entry's title lines up with) */}
        {until !== undefined && <span className="leading-4">{until}</span>}
      </span>
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
    </motion.div>
  );
}
