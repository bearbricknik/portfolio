"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { IconChevronDownSmall } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;

type CollapsibleCodeProps = {
  /** Height (px) the code is capped at; without it the code shows in full */
  maxHeight?: number;
  labels: { more: string; less: string };
  children: ReactNode;
};

/**
 * Caps a long code block at `maxHeight`. A full-width bar at the bottom
 * (grey, blurring the code behind it) opens and closes it with a smooth
 * height animation. The cap comes from the server (line count), so the
 * first render already has the right height.
 */
export function CollapsibleCode({ maxHeight, labels, children }: CollapsibleCodeProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [fullHeight, setFullHeight] = useState<number>();
  const reducedMotion = useReducedMotion();

  // The full height is only known in the browser (fonts, wrapping)
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || !maxHeight) return;
    const measure = () => setFullHeight(content.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [maxHeight]);

  if (!maxHeight) return children;

  return (
    <div className="relative">
      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={{ height: open ? (fullHeight ?? "auto") : maxHeight }}
        style={{ height: maxHeight }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: EASE }}
      >
        {/* Room at the end, so the bar never covers the last line when open */}
        <div ref={contentRef} className="pb-9">
          {children}
        </div>
      </motion.div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        data-cursor="pointer"
        className="absolute inset-x-0 bottom-0 flex h-9 items-center justify-center gap-1 border-t bg-muted/70 text-xs text-muted-foreground backdrop-blur-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        {open ? labels.less : labels.more}
        <IconChevronDownSmall
          aria-hidden
          className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")}
        />
      </button>
    </div>
  );
}
