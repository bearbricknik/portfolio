"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IconCheckmark1Small, IconSquareBehindSquare1 } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

// How long "copied" stays before switching back (ms)
const COPIED_FOR = 1500;
const EASE = [0.23, 1, 0.32, 1] as const;
// Horizontal padding of the button (px), part of the animated width
const PADDING_X = 6;

type CopyButtonProps = {
  /** What ends up in the clipboard */
  value: string;
  labels: { copy: string; copied: string };
  className?: string;
};

/**
 * Small "copy" button: copies `value`, then shows "copied" with a check for a
 * moment (the labels cross-fade with a short blur while the button glides to
 * the new label's width), then switches back.
 */
export function CopyButton({ value, labels, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const reducedMotion = useReducedMotion();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // No clipboard access (e.g. an insecure context): nothing to confirm
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), COPIED_FOR);
  };

  // Both states sit on top of each other (one grid cell, right-aligned); the
  // button's width glides to the shown label's width, clipping the other one
  const states = [
    { key: "copy", shown: !copied, icon: IconSquareBehindSquare1, label: labels.copy },
    { key: "copied", shown: copied, icon: IconCheckmark1Small, label: labels.copied },
  ] as const;
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [widths, setWidths] = useState<Record<string, number>>({});

  useLayoutEffect(() => {
    const measure = () =>
      setWidths(Object.fromEntries(Object.entries(labelRefs.current).map(([key, el]) => [key, el?.offsetWidth ?? 0])));
    measure();
    const observer = new ResizeObserver(measure);
    Object.values(labelRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const width = widths[copied ? "copied" : "copy"];

  // The first measurement applies right away (the button starts at its label's
  // width); every later change glides
  const widthValue = useMotionValue<number | "auto">("auto");
  const sized = useRef(false);
  useEffect(() => {
    if (!width) return;
    const target = width + PADDING_X * 2;
    if (!sized.current || reducedMotion) {
      sized.current = true;
      widthValue.set(target);
      return;
    }
    const controls = animate(widthValue, target, { duration: 0.3, ease: EASE });
    return () => controls.stop();
  }, [width, reducedMotion, widthValue]);

  return (
    <motion.button
      type="button"
      onClick={copy}
      aria-label={labels.copy}
      data-cursor="pointer"
      className={cn(
        "relative grid justify-end overflow-hidden rounded-md py-1 text-xs leading-none text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      // Until measured (server render) the button simply fits its content
      style={{ width: widthValue, paddingInline: PADDING_X }}
    >
      {states.map(({ key, shown, icon: Icon, label }) => (
        <motion.span
          key={key}
          ref={(el) => {
            labelRefs.current[key] = el;
          }}
          aria-hidden
          className="col-start-1 row-start-1 inline-flex w-max items-center gap-1 justify-self-end whitespace-nowrap"
          initial={false}
          animate={
            shown
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: key === "copied" ? 4 : -4, filter: "blur(2px)" }
          }
          transition={{ duration: 0.25, ease: EASE }}
        >
          <Icon className={cn("size-3.5", key === "copied" && "text-emerald-500")} />
          {label}
        </motion.span>
      ))}
      {/* Announces the result to screen readers */}
      <span className="sr-only" aria-live="polite">
        {copied ? labels.copied : ""}
      </span>
    </motion.button>
  );
}
