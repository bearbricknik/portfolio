"use client";

import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { catchError } from "next/error";
import { motion, useReducedMotion } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";

import { type RevealGateOptions, useRevealGate } from "@/components/scroll-reveal";
import { contributionsOptions } from "@/lib/github/queries";
import type { ContributionLevel } from "@/lib/github/types";
import { cn } from "@/lib/utils";

/** One shade per level, from the neutral palette, in both themes */
const LEVEL_CLASS: Record<ContributionLevel, string> = {
  0: "bg-neutral-100 dark:bg-neutral-800/70",
  1: "bg-neutral-200 dark:bg-neutral-700/80",
  2: "bg-neutral-300 dark:bg-neutral-600/90",
  3: "bg-neutral-400 dark:bg-neutral-500",
  4: "bg-neutral-600 dark:bg-neutral-300",
};
const LEVELS = [0, 1, 2, 3, 4] as const;

const EASE = [0.23, 1, 0.32, 1] as const;
// Gap ≈ a fifth of a cell; a month name needs about this much room
const GAP_RATIO = 0.2;
const MONTH_LABEL_ROOM = 30;
// Below this the squares get hard to see: the calendar keeps this size and
// scrolls sideways instead (phones)
const MIN_CELL = 8;
const SCROLL_GAP = 2;
const EDGE_FADE = "1.5rem";

type CellSize = { cell: number; gap: number; scroll: boolean };

/**
 * Sizes for a width, so the calendar ends exactly at both edges of its column:
 * the cell is a whole number of device pixels (crisp and the same for every
 * day), the largest that fits with a gap of about a fifth of it. What's left
 * of the width goes evenly into the gaps (fractions of a pixel each), and the
 * rows get the same gap, so both directions look alike. Too narrow for
 * `MIN_CELL`: fixed sizes and `scroll`.
 */
function fitCells(width: number, weeks: number): CellSize {
  const unit = 1 / Math.max(1, Math.round(window.devicePixelRatio || 1));
  let cell = 0;
  for (let size = MIN_CELL; size <= 24; size += unit) {
    const gap = Math.max(1, size * GAP_RATIO);
    if (size * weeks + gap * (weeks - 1) > width) break;
    cell = size;
  }
  if (!cell) return { cell: MIN_CELL, gap: SCROLL_GAP, scroll: true };
  return { cell, gap: (width - cell * weeks) / (weeks - 1), scroll: false };
}

/** Fades out the edges of a scroller that still have more to scroll to */
function updateEdgeFade(element: HTMLElement) {
  const end = element.scrollWidth - element.clientWidth;
  element.style.setProperty("--fade-start", element.scrollLeft > 1 ? EDGE_FADE : "0px");
  element.style.setProperty("--fade-end", element.scrollLeft < end - 1 ? EDGE_FADE : "0px");
}

type ContributionGraphProps = RevealGateOptions & { className?: string };

/**
 * A year of commits as a calendar: one square per day, weeks as columns, the
 * shade shows how much happened. Exactly as wide as its column (month names
 * thin out when they'd collide); where that would make the squares too small
 * it scrolls sideways instead, starting at the latest week, with soft edges
 * where there's more. Reads the combined, evened-out data through TanStack
 * Query (streamed from the server) and fades in once the page lets it (`after`,
 * `waitForStreams`).
 */
export function ContributionGraph(props: ContributionGraphProps) {
  // Nothing while the data streams in (server and browser agree on that), and
  // nothing at all if GitHub can't be reached
  return (
    <HideOnError>
      <Suspense fallback={null}>
        <Calendar {...props} />
      </Suspense>
    </HideOnError>
  );
}

const HideOnError = catchError(() => null);

const sameSize = (a: CellSize | null, b: CellSize) =>
  a !== null && a.cell === b.cell && a.gap === b.gap && a.scroll === b.scroll;

// Rendered only with data, so its observers have the element from the start
function Calendar({ after, waitForStreams, className }: ContributionGraphProps) {
  const { data } = useSuspenseQuery(contributionsOptions());
  const t = useTranslations("ContributionGraph");
  const format = useFormatter();
  const ref = useRef<HTMLElement>(null);
  const visible = useRevealGate(ref, { after, waitForStreams });
  const reducedMotion = useReducedMotion();

  const { days } = data;
  const weeks = Math.ceil(days.length / 7);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<CellSize | null>(null);
  const measured = size !== null;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !weeks) return;
    const measure = () => {
      const next = fitCells(element.clientWidth, weeks);
      // Same sizes (e.g. a height change): no re-render of all the days
      setSize((current) => (sameSize(current, next) ? current : next));
      if (scrollerRef.current) updateEdgeFade(scrollerRef.current);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [weeks]);

  // Scrolling: start at the latest week, like GitHub
  const scroll = size?.scroll ?? false;
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (scroll) scroller.scrollLeft = scroller.scrollWidth;
    updateEdgeFade(scroller);
  }, [scroll]);

  // Month names above the first week of each month; thinned out from the
  // latest month backwards when they'd collide
  const months = useMemo(() => {
    const labels: { week: number; date: Date }[] = [];
    let last = -1;
    for (let week = 0; week < weeks; week++) {
      const date = new Date(`${days[week * 7].date}T00:00:00`);
      if (date.getMonth() !== last) labels.push({ week, date });
      last = date.getMonth();
    }
    // The first month has no room for its name when it starts at the very end of it
    if (labels[1] && labels[1].week - labels[0].week < 3) labels.shift();
    const step = size ? size.cell + size.gap : 0;
    const every = step ? ([1, 2, 3, 4].find((n) => step * 4.35 * n >= MONTH_LABEL_ROOM) ?? 4) : 1;
    return labels.filter((_, index) => (labels.length - 1 - index) % every === 0);
  }, [days, weeks, size]);

  // The days only change with the data or once measured, not when the
  // calendar appears or resizes
  const cells = useMemo(
    () =>
      days.map((day) => (
        <span
          key={day.date}
          className={cn("block aspect-square rounded-[20%]", measured && "size-(--cell)", LEVEL_CLASS[day.level])}
        />
      )),
    [days, measured],
  );

  return (
    <motion.figure
      ref={ref}
      className={cn("m-0 flex flex-col gap-2", className)}
      initial="hidden"
      animate={visible ? "shown" : "hidden"}
      variants={{
        hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" },
        shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
      }}
      // Not interactive before it has appeared
      inert={!visible}
      style={
        size
          ? ({ "--cell": `${size.cell}px`, "--gap": `${size.gap}px` } as React.CSSProperties)
          : undefined
      }
    >
      <div
        ref={scrollerRef}
        onScroll={scroll ? (event) => updateEdgeFade(event.currentTarget) : undefined}
        className={cn(scroll && "overflow-x-auto overscroll-x-contain")}
        style={
          scroll
            ? {
                maskImage:
                  "linear-gradient(to right, transparent, black var(--fade-start, 0px), black calc(100% - var(--fade-end, 0px)), transparent)",
              }
            : undefined
        }
      >
        <div className={cn("flex flex-col gap-2", scroll && "w-max")}>
          {/* Months */}
          <div aria-hidden className="relative h-3.5 text-xs leading-none text-muted-foreground">
            {months.map(({ week, date }) => (
              <span
                key={week}
                className="absolute top-0 whitespace-nowrap"
                style={{ left: size ? week * (size.cell + size.gap) : `${(week / weeks) * 100}%` }}
              >
                {format.dateTime(date, { month: "short" }).replace(".", "")}
              </span>
            ))}
          </div>

          {/* Days: until measured (server render) the weeks share the width */}
          <div
            aria-hidden
            className={cn(
              "grid grid-flow-col",
              size
                ? cn(
                    "auto-cols-(--cell) grid-rows-[repeat(7,var(--cell))] gap-y-(--gap)",
                    // Scrolling: plain gaps; fitting: columns spread over the full width
                    scroll ? "gap-x-(--gap)" : "w-full justify-between",
                  )
                : "grid-rows-7 gap-0.5",
            )}
            style={size ? undefined : { gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
          >
            {cells}
          </div>
        </div>
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{t.rich("total", { count: data.total, strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span> })}</span>
        <span aria-hidden className="flex items-center gap-1 text-xs">
          {t("less")}
          {LEVELS.map((level) => (
            <span key={level} className={cn("size-2.5 rounded-[20%]", LEVEL_CLASS[level])} />
          ))}
          {t("more")}
        </span>
      </figcaption>
    </motion.figure>
  );
}
